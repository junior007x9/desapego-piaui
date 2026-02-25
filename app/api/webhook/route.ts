import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || '';

// Mapeamento simples de dias para cada Plano (ID: dias)
const DIAS_POR_PLANO: Record<number, number> = {
  1: 1,
  2: 7,
  3: 15,
  4: 30
};

export async function POST(request: Request) {
  try {
    // O Mercado Pago envia os dados do pagamento no corpo da requisição
    const body = await request.json();

    // Extraímos o ID do pagamento (pode vir no body.data.id ou body.id dependendo do evento)
    const paymentId = body?.data?.id || body?.id;

    if (!paymentId) {
      return NextResponse.json({ error: 'Nenhum ID de pagamento recebido' }, { status: 400 });
    }

    if (MP_ACCESS_TOKEN) {
      const client = new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN });
      const payment = new Payment(client);

      // Vamos buscar os detalhes oficiais do pagamento ao Mercado Pago por segurança
      const paymentInfo = await payment.get({ id: paymentId });

      // Se o status for 'approved' (aprovado/pago)
      if (paymentInfo.status === 'approved') {
        // Lembra-se do 'external_reference'? É o ID do nosso Anúncio!
        const adId = paymentInfo.external_reference;

        if (adId) {
          const adRef = doc(db, 'anuncios', adId);
          const adSnap = await getDoc(adRef);

          if (adSnap.exists()) {
            const adData = adSnap.data();
            
            // Só atualiza se ainda estiver pendente (evita processar duas vezes)
            if (adData.status === 'pendente') {
              const planoId = adData.planoId || 2;
              const dias = DIAS_POR_PLANO[planoId] || 30;
              
              const dataExp = new Date();
              dataExp.setDate(dataExp.getDate() + dias);

              // Atualiza o Firebase automaticamente!
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

    // Temos de devolver um Status 200 OK para o Mercado Pago saber que recebemos o aviso
    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error("❌ Erro no Webhook:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}