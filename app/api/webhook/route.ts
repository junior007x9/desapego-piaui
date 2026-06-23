import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import admin from 'firebase-admin';

// Inicializa o Firebase Admin se ainda não estiver inicializado
if (!admin.apps.length && process.env.FIREBASE_PROJECT_ID) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

// Tabela de dias caso precise de fallback
const DIAS_POR_PLANO: Record<number, number> = {
  5: 1, 1: 1, 2: 7, 3: 15, 4: 30
};

export async function POST(request: Request) {
  try {
    const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || '';
    const body = await request.json();
    
    // O Mercado Pago envia o ID do pagamento de formas diferentes dependendo do evento
    const paymentId = body?.data?.id || body?.id;

    if (!paymentId) return NextResponse.json({ error: 'Faltam dados' }, { status: 400 });

    if (MP_ACCESS_TOKEN) {
      const client = new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN });
      const payment = new Payment(client);
      const paymentInfo = await payment.get({ id: Number(paymentId) });

      if (paymentInfo.status === 'approved') {
        try {
          // Pega as variáveis secretas que salvamos na hora de gerar o PIX
          const adId = paymentInfo.external_reference || paymentInfo.metadata?.ad_id;
          const planoIdPix = paymentInfo.metadata?.plano_id;

          if (adId && admin.apps.length) {
            const db = admin.firestore();
            const adRef = db.collection('anuncios').doc(String(adId));
            const adSnap = await adRef.get();

            if (adSnap.exists) {
              const adData = adSnap.data();
              
              // Verifica a mesma trava de segurança anti-duplicação
              if (adData?.ultimoPagamentoId !== String(paymentId)) {
                
                // Prioriza o plano do PIX (útil se for upgrade/troca de plano)
                const planoIdFinal = planoIdPix !== undefined ? Number(planoIdPix) : (adData?.planoId || 2);
                const dias = DIAS_POR_PLANO[planoIdFinal] || 30;
                
                const dataExp = new Date();
                dataExp.setDate(dataExp.getDate() + dias);

                await adRef.update({
                  status: 'ativo',
                  planoId: planoIdFinal, 
                  expiraEm: dataExp.toISOString(),
                  pagoEm: new Date().toISOString(),
                  ultimoPagamentoId: String(paymentId) 
                });
                console.log(`✅ Sucesso Webhook: Anúncio ${adId} ativado/renovado em background!`);
              } else {
                console.log(`⚠️ Webhook ignorado: Pagamento ${paymentId} já processado via front-end para o anúncio ${adId}.`);
              }
            }
          }
        } catch (fbError) {
          console.error("Erro Firebase Webhook:", fbError);
        }
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("❌ Erro Webhook:", error);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}