import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { token } = await request.json();
    
    // SUA CHAVE SECRETA (Protegida no servidor)
    const secretKey = "6LdqR3osAAAAADjjtREIijRit9EJOz597qp_pZXd"; 

    // Pergunta pro Google se o token é válido
    const res = await fetch(`https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`, {
      method: 'POST',
    });
    
    const googleData = await res.json();

    // O Google dá uma "nota" (score) de 0.0 (Robô) a 1.0 (Humano). Se for maior que 0.5, está aprovado!
    if (googleData.success && googleData.score > 0.5) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ success: false, error: 'Comportamento de robô detectado' }, { status: 403 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Erro no servidor ao validar reCAPTCHA' }, { status: 500 });
  }
}