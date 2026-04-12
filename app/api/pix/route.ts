import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, description, payerEmail, adId } = body;

    // Conecta com a API do Mercado Pago
    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`, // Token de Produção
        'Content-Type': 'application/json',
        'X-Idempotency-Key': `${adId}-${Date.now()}` // Evita pagamentos duplicados
      },
      body: JSON.stringify({
        transaction_amount: amount,
        description: description,
        payment_method_id: 'pix',
        payer: {
          email: payerEmail
        }
      })
    });

    const data = await response.json();

    if (data.status === 'pending') {
      return NextResponse.json({
        id: data.id,
        qr_code: data.point_of_interaction.transaction_data.qr_code,
        qr_code_base64: data.point_of_interaction.transaction_data.qr_code_base64,
      });
    }

    return NextResponse.json({ error: 'Erro ao gerar PIX' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}