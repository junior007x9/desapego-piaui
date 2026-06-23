import { NextResponse } from 'next/server';
import admin from 'firebase-admin';

// O BACKEND DECIDE OS DIAS (Inteligência e Segurança Máxima)
const DIAS_POR_PLANO: Record<number, number> = {
  0: 7,   // Grátis = 7 dias
  1: 20,  // Sobe pro Topo = 20 dias
  2: 20,  // Destaque Turbo = 20 dias
  3: 20   // Ouro Urgente = 20 dias
};

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
      headers: {
        'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`
      }
    });

    const data = await response.json();

    if (data.status === 'approved') {
      const db = admin.firestore();
      const adRef = db.collection('anuncios').doc(anuncioId);
      const adDoc = await adRef.get();

      if (adDoc.exists) {
        const adData = adDoc.data();
        
        // Verifica se ESSE PIX já foi processado antes
        if (adData?.ultimoPagamentoId !== paymentId) {
          
          // Descobre qual é o plano baseado nos metadados que enviamos ao gerar o PIX
          const planoIdDoPix = data.metadata?.plano_id;
          
          // ✅ CORREÇÃO AQUI: adData?.planoId evita o erro no build do Vercel
          const planoFinal = planoIdDoPix !== undefined ? Number(planoIdDoPix) : (Number(adData?.planoId) || 0);
          
          // Aplica a regra de segurança de dias
          const diasReais = DIAS_POR_PLANO[planoFinal] || 20;

          const dataExp = new Date();
          dataExp.setDate(dataExp.getDate() + diasReais); 

          await adRef.update({
            status: 'ativo',
            planoId: planoFinal, // Garante que o anúncio subiu de plano se for uma renovação/upgrade
            expiraEm: dataExp.toISOString(),
            pagoEm: new Date().toISOString(),
            ultimoPagamentoId: paymentId // Trava para não processar duas vezes
          });
          console.log(`✅ Anúncio ${anuncioId} ativado/renovado pelo front-end para o plano ${planoFinal} por ${diasReais} dias!`);
        }
      }
    }

    return NextResponse.json({ status: data.status });
  } catch (error) {
    console.error('Erro na API de status do PIX:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}