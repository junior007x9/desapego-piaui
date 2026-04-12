import { NextResponse } from 'next/server';
import admin from 'firebase-admin';

// 🚀 Trava de Segurança: Só inicializa se a chave existir (evita erro no Build da Vercel)
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
  const dias = parseInt(searchParams.get('dias') || '1');

  if (!paymentId || !anuncioId) {
    return NextResponse.json({ error: 'Faltam parâmetros' }, { status: 400 });
  }

  // Como bloqueamos a inicialização no build, precisamos garantir que ela existe aqui na vida real
  if (!admin.apps.length) {
     return NextResponse.json({ error: 'Servidor Firebase não inicializado. Verifique as chaves na Vercel.' }, { status: 500 });
  }

  try {
    // 1. Pergunta diretamente ao Mercado Pago se este PIX foi pago
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`
      }
    });

    const data = await response.json();

    // 2. Se o Mercado Pago disser que foi Aprovado
    if (data.status === 'approved') {
      
      const db = admin.firestore();
      const adRef = db.collection('anuncios').doc(anuncioId);
      const adDoc = await adRef.get();

      // 3. O SERVIDOR ativa o anúncio de forma segura!
      if (adDoc.exists && adDoc.data()?.status !== 'ativo') {
        const dataExp = new Date();
        dataExp.setDate(dataExp.getDate() + dias);

        await adRef.update({
          status: 'ativo',
          expiraEm: dataExp.toISOString(),
          pagoEm: new Date().toISOString()
        });
        console.log(`✅ Anúncio ${anuncioId} ativado pelo servidor!`);
      }
    }

    return NextResponse.json({ status: data.status });
  } catch (error) {
    console.error('Erro na API de status do PIX:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}