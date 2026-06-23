import { NextResponse } from 'next/server';
import admin from 'firebase-admin';

// O BACKEND DECIDE OS DIAS E SOBE PRO TOPO!
const DIAS_POR_PLANO: Record<number, number> = { 0: 7, 1: 20, 2: 20, 3: 20 };

if (!admin.apps.length && process.env.FIREBASE_PROJECT_ID) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const paymentId = searchParams.get('id');
  const anuncioId = searchParams.get('anuncioId');

  if (!paymentId || !anuncioId) {
    return NextResponse.json({ error: 'Faltam parâmetros' }, { status: 400 });
  }

  if (!admin.apps.length) {
     return NextResponse.json({ error: 'Servidor Firebase não inicializado.' }, { status: 500 });
  }

  try {
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}` }
    });
    const data = await response.json();

    if (data.status === 'approved') {
      const db = admin.firestore();
      const adRef = db.collection('anuncios').doc(anuncioId);
      const adDoc = await adRef.get();

      if (adDoc.exists) {
        const adData = adDoc.data();
        if (adData?.ultimoPagamentoId !== paymentId) {
          
          const planoIdDoPix = data.metadata?.plano_id;
          const planoFinal = planoIdDoPix !== undefined ? Number(planoIdDoPix) : (Number(adData?.planoId) || 0);
          const diasReais = DIAS_POR_PLANO[planoFinal] || 20;

          const dataExp = new Date();
          dataExp.setDate(dataExp.getDate() + diasReais); 

          await adRef.update({
            status: 'ativo',
            planoId: planoFinal, 
            expiraEm: dataExp.toISOString(),
            pagoEm: new Date().toISOString(),
            criadoEm: admin.firestore.FieldValue.serverTimestamp(), // 🚀 JOGA O ANÚNCIO PRO TOPO DA TELA INICIAL
            ultimoPagamentoId: paymentId
          });
        }
      }
    }
    return NextResponse.json({ status: data.status });
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}