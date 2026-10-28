import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export async function POST(request: Request) {
  console.log("🔔 [WEBHOOK] O Mercado Pago bateu na porta do site!");

  try {
    const url = new URL(request.url);
    
    let id = url.searchParams.get('data.id') || url.searchParams.get('id');
    let topic = url.searchParams.get('topic') || url.searchParams.get('type');

    try {
      const body = await request.json();
      if (body?.data?.id) id = body.data.id;
      if (body?.type) topic = body.type;
      if (body?.action?.includes('payment')) topic = 'payment';
    } catch (e) {
      console.log("⚠️ [WEBHOOK] Aviso: Não foi possível ler o JSON.");
    }

    console.log(`📌 [WEBHOOK] Tópico: ${topic} | ID do Pagamento: ${id}`);

    if (topic === 'payment' && id) {
      console.log(`🔍 [WEBHOOK] Consultando pagamento ${id} direto no servidor do Mercado Pago...`);

      const token = process.env.MP_ACCESS_TOKEN;
      if (!token) {
        console.error("❌ [WEBHOOK ERRO FATAL] A chave MP_ACCESS_TOKEN não foi encontrada nas variáveis de ambiente!");
        return NextResponse.json({ success: true }, { status: 200 });
      }

      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (mpResponse.ok) {
        const paymentData = await mpResponse.json();
        console.log(`✅ [WEBHOOK] O banco informou que o status deste PIX é: ${paymentData.status}`);

        if (paymentData.status === 'approved') {
          const adId = paymentData.external_reference;
          console.log(`🎯 [WEBHOOK] Este PIX pertence ao Anúncio ID: ${adId}`);

          if (adId) {
            const adRef = doc(db, 'anuncios', adId);
            const adSnap = await getDoc(adRef);

            if (adSnap.exists()) {
              console.log(`📦 [WEBHOOK] Anúncio encontrado no Firebase! Tentando mudar para ATIVO...`);
              
              try {
                const planoId = Number(adSnap.data().planoId) || 0;
                const dias = planoId === 0 ? 7 : 20; 
                const dataExp = new Date();
                dataExp.setDate(dataExp.getDate() + dias);

                await updateDoc(adRef, {
                  status: 'ativo',
                  pagoEm: new Date().toISOString(),
                  expiraEm: dataExp.toISOString()
                });
                
                console.log(`🚀 [SUCESSO ABSOLUTO] Anúncio ${adId} ativado e publicado com sucesso!`);
              } catch (updateError) {
                console.error("❌ [ERRO DE PERMISSÃO FIREBASE] O Firebase bloqueou o Webhook! Verifique as regras de segurança do Firestore:", updateError);
              }

            } else {
              console.log(`❌ [WEBHOOK ERRO] O Anúncio ${adId} não existe no banco de dados.`);
            }
          }
        }
      } else {
         console.error("❌ [WEBHOOK ERRO MP] Falha na autenticação ao tentar consultar o Mercado Pago.");
      }
    } else {
       console.log("ℹ️ [WEBHOOK] Ignorado: Não é um evento de pagamento.");
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error("❌ [WEBHOOK ERRO GERAL]:", error);
    return NextResponse.json({ success: true, error: "Handled" }, { status: 200 });
  }
}