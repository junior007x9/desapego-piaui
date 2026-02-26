import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';

// Pega o token do ficheiro .env.local
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || ''; 

// Configura o Mercado Pago
const client = new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN, options: { timeout: 10000 } });

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, description, payerEmail, adId } = body;

    if (!MP_ACCESS_TOKEN) {
      console.error("ERRO: Token do Mercado Pago não encontrado!");
      return NextResponse.json({ error: 'Token não configurado' }, { status: 400 });
    }

    const payment = new Payment(client);

    const result = await payment.create({
      body: {
        transaction_amount: Number(amount),
        description: description,
        payment_method_id: 'pix',
        payer: {
          email: payerEmail || 'comprador@desapegopiaui.com.br',
          // O Mercado Pago muitas vezes exige first_name e last_name para PIX
          first_name: 'Comprador',
          last_name: 'Desapego'
        },
        external_reference: adId,
      },
    });

    return NextResponse.json({
      qr_code: result.point_of_interaction?.transaction_data?.qr_code,
      qr_code_base64: result.point_of_interaction?.transaction_data?.qr_code_base64,
      id: result.id
    });

  } catch (error: any) {
    console.error("❌ ERRO COMPLETO DA API MERCADO PAGO:", error);
    return NextResponse.json({ error: 'Erro ao gerar PIX no servidor' }, { status: 500 });
  }
}