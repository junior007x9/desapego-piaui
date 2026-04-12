import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import admin from 'firebase-admin';

// Inicializa a Resend
const resend = new Resend(process.env.RESEND_API_KEY || 'SUA_CHAVE_RESEND');

// 🚀 Trava de Segurança: Só inicializa se a chave existir (evita erro no Build da Vercel)
if (!admin.apps.length && process.env.FIREBASE_PROJECT_ID) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // O replace garante que as quebras de linha da chave funcionem no servidor
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { remetenteId, destinatarioId, mensagem, tituloAnuncio, chatId } = body;

    if (!destinatarioId) {
      return NextResponse.json({ error: 'Falta o ID do destinatário' }, { status: 400 });
    }

    // Como bloqueamos a inicialização no build, precisamos garantir que ela existe aqui na vida real
    if (!admin.apps.length) {
       return NextResponse.json({ error: 'Servidor Firebase não inicializado. Verifique as chaves na Vercel.' }, { status: 500 });
    }

    // 1. Vai no Banco de Dados buscar os dados do Vendedor (Destinatário)
    const db = admin.firestore();
    const userDoc = await db.collection('users').doc(destinatarioId).get();
    const userData = userDoc.data();

    if (!userData) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const promises = [];

    // 2. DISPARA A NOTIFICAÇÃO PUSH (Para o Celular!) 🚀
    if (userData.fcmToken) {
      const pushMessage = {
        notification: {
          title: `Nova mensagem: ${tituloAnuncio}`,
          body: mensagem.length > 50 ? mensagem.substring(0, 50) + '...' : mensagem,
        },
        data: {
          chatId: chatId,
          click_action: `https://desapegopiaui.com.br/chat?id=${chatId}`
        },
        token: userData.fcmToken,
      };

      const pushPromise = admin.messaging().send(pushMessage)
        .then(response => console.log('✅ Push enviado com sucesso:', response))
        .catch(error => console.error('❌ Erro no Push:', error));
        
      promises.push(pushPromise);
    }

    // 3. DISPARA O E-MAIL (Fallback) 📧
    if (userData.email) {
      const emailPromise = resend.emails.send({
        from: 'Desapego Piauí <contato@desapegopiaui.com.br>', 
        to: [userData.email], // Usa o e-mail real do vendedor!
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
      promises.push(emailPromise);
    }

    // Aguarda os dois envios terminarem
    await Promise.all(promises);

    return NextResponse.json({ success: true, message: 'Notificações disparadas' });
  } catch (error) {
    console.error('Erro na API de notificação:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}