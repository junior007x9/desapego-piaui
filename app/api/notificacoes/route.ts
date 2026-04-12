import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// Adicione a sua chave da Resend (Crie uma conta gratuita em resend.com)
// Coloque esta chave no seu ficheiro .env como RESEND_API_KEY=re_...
const resend = new Resend(process.env.RESEND_API_KEY || 're_Qro52Lm2_3P1YqJwtiztV8XMYVw25Vi4D');

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { destinatarioId, mensagem, tituloAnuncio, chatId } = body;

    if (!destinatarioId) {
      return NextResponse.json({ error: 'Falta o ID do destinatário' }, { status: 400 });
    }

    // AQUI VOCÊ BUSCARIA O E-MAIL DO DESTINATÁRIO NO FIREBASE ADMIN (OPCIONAL)
    // Como estamos na API, por enquanto vamos enviar um e-mail de teste ou para um e-mail genérico
    // Para funcionar a 100%, você precisará configurar o Firebase Admin SDK depois.

    await resend.emails.send({
      from: 'Desapego Piauí <contato@desapegopiaui.com.br>', // Altere se o seu domínio na Resend for diferente
      to: ['seu_email_de_teste@gmail.com'], // Substitua pela lógica de ir buscar o e-mail real do usuário
      subject: `Nova mensagem sobre: ${tituloAnuncio}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #4c1d95;">Você tem uma nova mensagem!</h2>
          <p>Alguém enviou uma mensagem sobre o seu anúncio: <strong>${tituloAnuncio}</strong>.</p>
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; font-style: italic; margin: 20px 0;">
            "${mensagem}"
          </div>
          <a href="https://desapegopiaui.com.br/chat?id=${chatId}" style="display: inline-block; background-color: #4c1d95; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 5px; font-weight: bold;">
            Responder Agora
          </a>
        </div>
      `
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao enviar notificação:', error);
    return NextResponse.json({ error: 'Erro ao enviar' }, { status: 500 });
  }
}