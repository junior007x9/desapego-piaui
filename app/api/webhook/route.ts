import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    // O Mercado Pago envia os IDs via Query Params dependendo de como você configurou o webhook no painel deles
    const topic = url.searchParams.get('topic') || url.searchParams.get('type');
    const id = url.searchParams.get('data.id') || url.searchParams.get('id');

    // Se for um aviso de atualização de pagamento, nós checamos o status lá no banco do Mercado Pago
    if (topic === 'payment' && id) {
      
      // 1. Busca os detalhes do pagamento seguro direto na API do Mercado Pago
      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
        headers: {
          Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}` // Certifique-se que o token está no .env
        }
      });
      
      const paymentData = await mpResponse.json();

      // 2. Se o pagamento foi APROVADO
      if (paymentData.status === 'approved') {
        const adId = paymentData.external_reference; // O ID do anúncio que nós enviamos na hora de criar o QR Code

        if (adId) {
          const adRef = doc(db, 'anuncios', adId);
          const adSnap = await getDoc(adRef);

          if (adSnap.exists()) {
            const adInfo = adSnap.data();
            const planoId = Number(adInfo.planoId) || 0;
            
            // Calcula os dias de validade baseado no plano comprado
            // Se for grátis (0) = 7 dias, se for pago = 20 dias (ajuste se sua regra for diferente)
            const dias = planoId === 0 ? 7 : 20; 
            const dataExp = new Date();
            dataExp.setDate(dataExp.getDate() + dias);

            // 🚀 APROVAÇÃO AUTOMÁTICA DIRETO NO FIREBASE
            await updateDoc(adRef, {
              status: 'ativo',
              pagoEm: new Date().toISOString(), // Grava a data do pagamento (Essa data que gera sua receita no Painel)
              expiraEm: dataExp.toISOString()
            });

            console.log(`✅ Pagamento Confirmado! Anúncio ${adId} ativado automaticamente.`);
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro no Webhook de Aprovação Automática:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}