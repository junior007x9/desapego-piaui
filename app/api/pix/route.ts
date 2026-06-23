import { NextResponse } from 'next/server';

const TAXA_MP_PIX = 0.0099; // Exemplo de taxa do Mercado Pago para PIX (0.99%)

function calcularValorComTaxa(valorDesejado: number): number {
  const valorComRepasse = valorDesejado / (1 - TAXA_MP_PIX);
  return Number(valorComRepasse.toFixed(2)); 
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, description, payerEmail, adId, planoId } = body;

    if (!amount || !payerEmail || !adId || !planoId) {
      return NextResponse.json({ error: 'Dados incompletos para gerar o PIX' }, { status: 400 });
    }

    const valorParaCobrarCliente = calcularValorComTaxa(Number(amount));

    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`, 
        'Content-Type': 'application/json',
        'X-Idempotency-Key': `${adId}-${Date.now()}` 
      },
      body: JSON.stringify({
        transaction_amount: valorParaCobrarCliente,
        description: description || `Plano Desapego Piauí - Anúncio ${adId}`,
        payment_method_id: 'pix',
        external_reference: String(adId), // Essencial para o Webhook achar o anúncio
        metadata: {
            ad_id: String(adId),
            plano_id: Number(planoId) // Salva o plano para a renovação automática
        },
        payer: {
          email: payerEmail
        }
      })
    });

    const data = await response.json();

    if (data.status === 'pending') {
      return NextResponse.json({
        id: data.id,
        qr_code: data.point_of_interaction?.transaction_data?.qr_code,
        qr_code_base64: data.point_of_interaction?.transaction_data?.qr_code_base64,
        valor_cobrado: valorParaCobrarCliente, 
      });
    }

    return NextResponse.json({ error: 'Erro ao gerar PIX', details: data }, { status: 400 });
  } catch (error) {
    console.error('Erro na geração do PIX:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}