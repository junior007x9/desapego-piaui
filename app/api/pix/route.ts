import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';

// Substitua pelo seu ACCESS TOKEN de produção ou teste do Mercado Pago
// Pegue em: https://www.mercadopago.com.br/developers/panel
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || ''; 

// Configuramos o client passando o token
const client = new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN, options: { timeout: 5000 } });

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, description, payerEmail, adId } = body;

    // Se não tiver token configurado, vamos retornar um erro amigável ou dados de teste
    if (!MP_ACCESS_TOKEN) {
      console.warn("ATENÇÃO: Token do Mercado Pago não configurado no .env.local. Retornando PIX de Teste.");
      // Retornando dados FALSOS apenas para você ver o layout funcionando sem travar
      return NextResponse.json({
        qr_code: "00020126580014br.gov.bcb.pix0136mock-pix-key-1234-5678-abcd520400005303986540510.005802BR5915Desapego Piaui6008Teresina62070503***6304ABCD",
        qr_code_base64: "https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg", // Imagem mockada
        ticket_url: "https://www.mercadopago.com.br",
        id: "mock_" + Date.now()
      });
    }

    const payment = new Payment(client);

    const result = await payment.create({
      body: {
        transaction_amount: Number(amount),
        description: description,
        payment_method_id: 'pix',
        payer: {
          email: payerEmail,
        },
        external_reference: adId, // Importante: Guarda o ID do anúncio no pagamento
      },
    });

    return NextResponse.json({
      qr_code: result.point_of_interaction?.transaction_data?.qr_code,
      qr_code_base64: result.point_of_interaction?.transaction_data?.qr_code_base64,
      ticket_url: result.point_of_interaction?.transaction_data?.ticket_url,
      id: result.id
    });

  } catch (error: any) {
    console.error("Erro na API de PIX:", error);
    return NextResponse.json({ error: 'Erro ao gerar PIX no servidor' }, { status: 500 });
  }
}