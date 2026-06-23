import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import admin from 'firebase-admin';

if (!admin.apps.length && process.env.FIREBASE_PROJECT_ID) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const DIAS_POR_PLANO: Record<number, number> = { 0: 7, 1: 20, 2: 20, 3: 20 };

export async function POST(request: Request) {
  try {
    const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || '';
    const body = await request.json();
    const paymentId = body?.data?.id || body?.id;

    if (!paymentId) return NextResponse.json({ error: 'Faltam dados' }, { status: 400 });

    if (MP_ACCESS_TOKEN) {
      const client = new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN });
      const payment = new Payment(client);
      const paymentInfo = await payment.get({ id: Number(paymentId) });

      if (paymentInfo.status === 'approved') {
        try {
          const adId = paymentInfo.external_reference || paymentInfo.metadata?.ad_id;
          const planoIdPix = paymentInfo.metadata?.plano_id;

          if (adId && admin.apps.length) {
            const db = admin.firestore();
            const adRef = db.collection('anuncios').doc(String(adId));
            const adSnap = await adRef.get();

            if (adSnap.exists) {
              const adData = adSnap.data();
              if (adData?.ultimoPagamentoId !== String(paymentId)) {
                
                const planoIdFinal = planoIdPix !== undefined ? Number(planoIdPix) : (Number(adData?.planoId) || 0);
                const diasReais = DIAS_POR_PLANO[planoIdFinal] || 20;
                
                const dataExp = new Date();
                dataExp.setDate(dataExp.getDate() + diasReais);

                await adRef.update({
                  status: 'ativo',
                  planoId: planoIdFinal, 
                  expiraEm: dataExp.toISOString(),
                  pagoEm: new Date().toISOString(),
                  criadoEm: admin.firestore.FieldValue.serverTimestamp(), // 🚀 JOGA O ANÚNCIO PRO TOPO DA TELA INICIAL
                  ultimoPagamentoId: String(paymentId) 
                });
              } 
            }
          }
        } catch (fbError) { console.error("Erro Firebase Webhook:", fbError); }
      }
    }
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}