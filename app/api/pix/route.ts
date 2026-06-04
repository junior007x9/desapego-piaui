import { NextResponse } from 'next/server';

// Defina a taxa do PIX no Mercado Pago (Geralmente é 0.99%, ou seja, 0.0099)
const TAXA_MP_PIX = 0.0099; 

// Função para calcular o valor com o repasse da taxa
function calcularValorComTaxa(valorDesejado: number): number {
  const valorComRepasse = valorDesejado / (1 - TAXA_MP_PIX);
  return Number(valorComRepasse.toFixed(2)); 
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, description, payerEmail, adId } = body;

    // Calcula o valor final com a taxa embutida para que você receba o valor integral
    const valorParaCobrarCliente = calcularValorComTaxa(Number(amount));

    // Conecta com a API do Mercado Pago
    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`, // Token de Produção
        'Content-Type': 'application/json',
        'X-Idempotency-Key': `${adId}-${Date.now()}` // Evita pagamentos duplicados
      },
      body: JSON.stringify({
        transaction_amount: valorParaCobrarCliente, // Enviando o valor com a taxa aplicada
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
        valor_cobrado: valorParaCobrarCliente, // Opcional: enviando o valor final de volta para o front-end
      });
    }

    return NextResponse.json({ error: 'Erro ao gerar PIX' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}