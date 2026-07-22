import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    
    // 1. Tenta pegar os IDs pela URL (Padrão IPN)
    let id = url.searchParams.get('data.id') || url.searchParams.get('id');
    let topic = url.searchParams.get('topic') || url.searchParams.get('type');

    // 2. Tenta pegar os IDs pelo Corpo da Requisição (Padrão Webhook JSON)
    try {
      const body = await request.json();
      if (body) {
        if (body.data && body.data.id) id = body.data.id;
        if (body.type) topic = body.type;
        // Se a ação for de criação ou atualização de pagamento, forçamos o topic
        if (body.action === 'payment.updated' || body.action === 'payment.created') {
            topic = 'payment'; 
        }
      }
    } catch (e) {
      // Ignora erro silenciosamente se não houver JSON no body
    }

    // 3. Processa o pagamento se encontrou a notificação
    if (topic === 'payment' && id) {
      
      // Busca a confirmação segura direto nos servidores do Mercado Pago
      // 🚀 CORREÇÃO: Utilizando a mesma variável de ambiente do app/api/pix/route.ts
      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
        headers: {
          Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` 
        }
      });
      
      if (mpResponse.ok) {
        const paymentData = await mpResponse.json();

        // Se o PIX foi pago e APROVADO
        if (paymentData.status === 'approved') {
          const adId = paymentData.external_reference; // Esta é a ID do anúncio

          if (adId) {
            const adRef = doc(db, 'anuncios', adId);
            const adSnap = await getDoc(adRef);

            if (adSnap.exists()) {
              const adInfo = adSnap.data();
              
              // Só atualiza se o anúncio ainda não estiver ativo (evita gastar leitura do banco à toa)
              if (adInfo.status !== 'ativo') {
                  const planoId = Number(adInfo.planoId) || 0;
                  const dias = planoId === 0 ? 7 : 20; // 7 dias grátis, 20 dias pros planos pagos
                  
                  const dataExp = new Date();
                  dataExp.setDate(dataExp.getDate() + dias);

                  // 🚀 APROVAÇÃO E LIBERAÇÃO AUTOMÁTICA DIRETO NO FIREBASE
                  await updateDoc(adRef, {
                    status: 'ativo',
                    pagoEm: new Date().toISOString(),
                    expiraEm: dataExp.toISOString()
                  });

                  console.log(`✅ Sucesso: Pagamento PIX aprovado e Anúncio ${adId} ativado!`);
              }
            }
          }
        }
      } else {
         console.error("⚠️ Falha ao consultar o pagamento no Mercado Pago");
      }
    }

    // 4. SEMPRE devolve sucesso para o Mercado Pago, senão ele acha que nosso site caiu e suspende o webhook
    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error("Erro no Webhook de Aprovação Automática:", error);
    // Mesmo com erro interno, devolvemos 200 pro MP parar de enviar a mesma notificação repetidamente
    return NextResponse.json({ success: true, error: "Handled Error" }, { status: 200 });
  }
}