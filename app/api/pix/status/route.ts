import { NextResponse } from 'next/server';
import admin from 'firebase-admin';

// Inicializa o Firebase Admin caso não esteja rodando
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
  const dias = parseInt(searchParams.get('dias') || '30'); // Tempo do plano

  if (!paymentId || !anuncioId) {
    return NextResponse.json({ error: 'Faltam parâmetros' }, { status: 400 });
  }

  if (!admin.apps.length) {
     return NextResponse.json({ error: 'Servidor Firebase não inicializado.' }, { status: 500 });
  }

  try {
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`
      }
    });

    const data = await response.json();

    // Se o mercado pago diz que está pago
    if (data.status === 'approved') {
      const db = admin.firestore();
      const adRef = db.collection('anuncios').doc(anuncioId);
      const adDoc = await adRef.get();

      if (adDoc.exists) {
        const adData = adDoc.data();
        
        // A INTELIGÊNCIA: Verifica se ESTE PIX exato já liberou o anúncio antes
        if (adData?.ultimoPagamentoId !== paymentId) {
          const dataExp = new Date();
          dataExp.setDate(dataExp.getDate() + dias); // Renova a validade

          await adRef.update({
            status: 'ativo',
            expiraEm: dataExp.toISOString(),
            pagoEm: new Date().toISOString(),
            ultimoPagamentoId: paymentId // Salva o ID desse PIX para não repetir
          });
          console.log(`✅ Anúncio ${anuncioId} ativado/renovado pelo front-end!`);
        }
      }
    }

    return NextResponse.json({ status: data.status });
  } catch (error) {
    console.error('Erro na API de status do PIX:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}