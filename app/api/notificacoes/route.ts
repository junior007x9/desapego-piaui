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
    
    // Define os textos da notificação para manter um padrão
    const tituloNotificacao = `Nova mensagem: ${tituloAnuncio}`;
    const corpoNotificacao = mensagem.length > 50 ? mensagem.substring(0, 50) + '...' : mensagem;

    // 2. DISPARA A NOTIFICAÇÃO PUSH (Para o Celular tocar e exibir!) 🚀
    if (userData.fcmToken) {
      const pushMessage: admin.messaging.Message = {
        notification: {
          title: tituloNotificacao,
          body: corpoNotificacao,
        },
        // 👇 ESTE É O BLOCO NOVO QUE FAZ O CELULAR TOCAR E MOSTRAR O SEU ÍCONE
        android: {
          notification: {
            sound: 'default',
            icon: 'ic_notification_icon',
          }
        },
        data: {
          chatId: String(chatId), // Garantindo que seja string (exigência do FCM)
          click_action: `https://desapegopiaui.com.br/chat?id=${chatId}`
        },
        token: userData.fcmToken,
      };

      const pushPromise = admin.messaging().send(pushMessage)
        .then(response => console.log('✅ Push enviado com sucesso:', response))
        .catch(error => console.error('❌ Erro no Push:', error));
        
      promises.push(pushPromise);
    }

    // 3. SALVA NO BANCO DE DADOS (Para aparecer quando o usuário clicar no Sino! 🔔)
    // Criamos uma subcoleção 'notificacoes' dentro do usuário logado
    const notificacaoRef = db.collection('users').doc(destinatarioId).collection('notificacoes').doc();
    const salvarNotificacaoPromise = notificacaoRef.set({
      id: notificacaoRef.id,
      titulo: tituloNotificacao,
      mensagem: corpoNotificacao,
      lida: false,
      tipo: 'chat',
      link: `/chat?id=${chatId}`,
      remetenteId: remetenteId || null,
      dataCriacao: admin.firestore.FieldValue.serverTimestamp(),
    }).then(() => console.log('✅ Notificação salva no banco para o Sino.'));
    
    promises.push(salvarNotificacaoPromise);

    // 4. DISPARA O E-MAIL (Fallback) 📧
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
      }).catch(error => console.error('❌ Erro no Email:', error));
      
      promises.push(emailPromise);
    }

    // Aguarda todos os envios (Push, Banco de Dados e Email) terminarem
    await Promise.all(promises);

    return NextResponse.json({ success: true, message: 'Notificações disparadas e salvas com sucesso' });
  } catch (error) {
    console.error('Erro na API de notificação:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}