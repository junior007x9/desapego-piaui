import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// Inicializa o Resend com a sua chave secreta
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { emailDestino, mensagemOriginal, resposta } = body;

    if (!emailDestino || !mensagemOriginal || !resposta) {
      return NextResponse.json({ error: 'Faltam dados para enviar o e-mail' }, { status: 400 });
    }

    const { data, error } = await resend.emails.send({
      // 🚀 AQUI ESTÁ A CORREÇÃO:
      // Troque 'contato@desapegopiaui.com.br' pelo e-mail exato que você configurou no Resend.
      // Atenção: Isso só vai funcionar APÓS você verificar o domínio no Passo 1.
      from: 'Equipe Desapego Piauí <contato@desapegopiaui.com.br>', 
      to: [emailDestino],
      subject: 'Resposta ao seu Feedback - Desapego Piauí',
      html: `
        <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 10px;">
          <h2 style="color: #4c1d95; margin-bottom: 20px;">Olá! Temos uma resposta para você.</h2>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.5;">
            Muito obrigado por entrar em contato com a equipe do <strong>Desapego Piauí</strong>. Lemos a sua mensagem com atenção.
          </p>

          <div style="background-color: #f9fafb; padding: 15px; border-left: 4px solid #7c3aed; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;"><strong>Você escreveu:</strong></p>
            <p style="margin: 5px 0 0 0; color: #4b5563; font-style: italic;">"${mensagemOriginal}"</p>
          </div>

          <h3 style="color: #111827; margin-top: 20px;">Nossa Resposta:</h3>
          <p style="color: #1f2937; font-size: 16px; line-height: 1.5; white-space: pre-wrap;">
            ${resposta}
          </p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
          
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            Este é um e-mail automático. Se precisar de mais ajuda, acesse o nosso site.<br>
            © ${new Date().getFullYear()} Desapego Piauí
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('Erro detalhado do Resend:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Erro interno ao enviar e-mail:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}