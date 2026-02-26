import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';

export async function POST(request: Request) {
  try {
    // 1. LER O TOKEN AQUI DENTRO (Garante que lê na hora na Vercel)
    const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || ''; 

    if (!MP_ACCESS_TOKEN) {
      console.error("ERRO: Token do Mercado Pago não encontrado!");
      return NextResponse.json({ error: 'Token não configurado' }, { status: 400 });
    }

    // 2. CONFIGURAR O CLIENTE AQUI DENTRO
    const client = new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN, options: { timeout: 10000 } });

    const body = await request.json();
    const { amount, description, payerEmail, adId } = body;

    const payment = new Payment(client);

    const result = await payment.create({
      body: {
        transaction_amount: Number(amount),
        description: description,
        payment_method_id: 'pix',
        payer: {
          email: payerEmail || 'comprador@desapegopiaui.com.br',
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