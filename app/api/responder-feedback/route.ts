import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_Qro52Lm2_3P1YqJwtiztV8XMYVw25Vi4D');

export async function POST(request: Request) {
  try {
    const { emailDestino, mensagemOriginal, resposta } = await request.json();

    if (!emailDestino) {
      return NextResponse.json({ error: 'E-mail de destino obrigatório' }, { status: 400 });
    }

    // 🚀 ENVIO SEGURO:
    // "from" usa o onboarding@resend.dev que o Resend permite gratuitamente
    // "reply_to" faz com que qualquer resposta do cliente caia no seu Hotmail!
    const { data, error } = await resend.emails.send({
      from: 'Desapego Piauí <onboarding@resend.dev>', 
      to: [emailDestino],
      reply_to: 'santos.junior12@hotmail.com',
      subject: 'Resposta ao seu Feedback - Equipe Desapego Piauí',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 16px; background-color: #ffffff;">
          
          <h2 style="color: #4c1d95; margin-bottom: 24px; font-size: 24px;">Olá! Lemos o seu feedback.</h2>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
            A nossa equipa analisou o que nos enviou e tem uma resposta para si:
          </p>

          <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
            <p style="color: #166534; margin: 0; font-size: 16px; line-height: 1.5;">${resposta}</p>
          </div>

          <div style="margin-bottom: 24px;">
            <p style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">O QUE VOCÊ NOS ESCREVEU:</p>
            <div style="background-color: #f3f4f6; padding: 12px; border-radius: 8px; font-style: italic;">
              <p style="color: #6b7280; margin: 0; font-size: 14px;">"${mensagemOriginal}"</p>
            </div>
          </div>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
            Equipe de Suporte - Desapego Piauí<br>
            Se desejar, pode responder diretamente a este e-mail.
          </p>
        </div>
      `
    });

    if (error) {
       console.error("Erro do Resend:", error);
       return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao enviar resposta do feedback:', error);
    return NextResponse.json({ error: 'Erro interno ao enviar e-mail' }, { status: 500 });
  }
}