import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// Inicializa o Resend com a chave do .env.local
const resend = new Resend(process.env.RESEND_API_KEY || 'chave_nao_configurada');

export async function POST(request: Request) {
  // 🛡️ O SEGURANÇA DA PORTA: Só deixa passar quem tiver a senha secreta
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.NEXT_PUBLIC_API_SECRET_KEY}`) {
    console.warn("⚠️ Tentativa de envio de e-mail bloqueada por falta de autorização.");
    return NextResponse.json({ error: 'Acesso Negado. Senha incorreta.' }, { status: 401 });
  }

  try {
    const { tipo, email, nome, produto } = await request.json();

    let assunto = '';
    let htmlContent = '';

    if (tipo === 'anuncio_aprovado') {
      assunto = `🎉 Seu anúncio está no ar: ${produto}`;
      htmlContent = `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2>Olá, ${nome}!</h2>
          <p>Ótimas notícias! O seu anúncio <strong>${produto}</strong> foi aprovado e já está disponível para milhares de compradores no Desapego Piauí.</p>
          <a href="https://desapegopiaui.com.br/meus-anuncios" style="background-color: #4c1d95; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">Ver meu anúncio</a>
        </div>
      `;
    } else if (tipo === 'plano_expirando') {
      assunto = `⚠️ Seu destaque para ${produto} expira amanhã!`;
      htmlContent = `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2>Olá, ${nome}!</h2>
          <p>O plano VIP do seu anúncio <strong>${produto}</strong> vai expirar em 24 horas.</p>
          <p>Não perca as suas posições no topo das buscas. Renove agora para continuar vendendo rápido!</p>
        </div>
      `;
    }

    const data = await resend.emails.send({
      from: 'Desapego Piauí <contato@desapegopiaui.com.br>', // Quando verificar seu domínio no Resend, coloque ele aqui
      to: [email],
      subject: assunto,
      html: htmlContent,
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Erro no envio do email:", error);
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}