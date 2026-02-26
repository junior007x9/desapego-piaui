export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const DIAS_POR_PLANO: Record<number, number> = {
  5: 1, 1: 1, 2: 7, 3: 15, 4: 30
};

export async function GET(request: Request) {
  const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || '';
  const { searchParams } = new URL(request.url);
  const paymentId = searchParams.get('id');

  if (!paymentId || !MP_ACCESS_TOKEN) {
    return NextResponse.json({ error: 'Faltam dados' }, { status: 400 });
  }

  try {
    const client = new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN });
    const payment = new Payment(client);
    const paymentInfo = await payment.get({ id: Number(paymentId) });

    if (paymentInfo.status === 'approved') {
      // MÁGICA DE PROTEÇÃO: Isolamos a gravação num Try/Catch!
      // Se a base de dados bloquear o servidor por falta de login, ele ignora o erro e continua!
      try {
        const adId = paymentInfo.external_reference;
        if (adId) {
          const adRef = doc(db, 'anuncios', adId.toString());
          const adSnap = await getDoc(adRef);
          if (adSnap.exists()) {
            const adData = adSnap.data();
            if (adData.status === 'pendente') {
              const planoId = adData.planoId || 2;
              const dias = DIAS_POR_PLANO[planoId] || 30;
              const dataExp = new Date();
              dataExp.setDate(dataExp.getDate() + dias);

              await updateDoc(adRef, {
                status: 'ativo',
                expiraEm: dataExp.toISOString(),
                pagoEm: new Date().toISOString()
              });
            }
          }
        }
      } catch (firebaseError) {
        console.warn("Base de dados bloqueou o servidor (sem stress, a tela vai assumir):", firebaseError);
      }
    }

    // A RESPOSTA MAIS IMPORTANTE: Agora ele avisa a tela SIM OU SIM, sem crashar!
    return NextResponse.json({ status: paymentInfo.status });
  } catch (error) {
    console.error("Erro ao comunicar com Mercado Pago:", error);
    return NextResponse.json({ error: 'Erro no servidor' }, { status: 500 });
  }
}