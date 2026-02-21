import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { supabase } from '@/lib/supabase'; // Reutilizando sua conexão (apenas se precisar validar algo)

// Substitua pelo seu ACCESS TOKEN de produção ou teste do Mercado Pago
// Pegue em: https://www.mercadopago.com.br/developers/panel
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || ''; 

const client = new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN });

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, description, payerEmail, adId } = body;

    // Se não tiver token configurado, vamos retornar um erro amigável ou dados de teste
    if (!MP_ACCESS_TOKEN) {
      console.warn("ATENÇÃO: Token do Mercado Pago não configurado no .env.local");
      // Retornando dados FALSOS apenas para você ver o layout funcionando sem travar
      return NextResponse.json({
        qr_code: "00020126360014BR.GOV.BCB.PIX0114+558699999999520400005303986540510.005802BR5913DesapegoPiaui6008Teresina62070503***63041234",
        qr_code_base64: "https://upload.wikimedia.org/wikipedia/commons/2/2f/Rickrolling_QR_code.png", // Imagem de teste
        ticket_url: "https://www.mercadopago.com.br",
        id: "123456789"
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
    console.error(error);
    return NextResponse.json({ error: 'Erro ao gerar PIX' }, { status: 500 });
  }
}