import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || '';

// ADICIONADO: '5' (Plano Teste) -> 1 Dia
const DIAS_POR_PLANO: Record<number, number> = {
  5: 1, 
  1: 1,
  2: 7,
  3: 15,
  4: 30
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const paymentId = body?.data?.id || body?.id;

    if (!paymentId) {
      return NextResponse.json({ error: 'Nenhum ID de pagamento recebido' }, { status: 400 });
    }

    if (MP_ACCESS_TOKEN) {
      const client = new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN });
      const payment = new Payment(client);

      const paymentInfo = await payment.get({ id: paymentId });

      if (paymentInfo.status === 'approved') {
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

              console.log(`✅ Sucesso: Anúncio ${adId} ativado via Webhook!`);
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error("❌ Erro no Webhook:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}