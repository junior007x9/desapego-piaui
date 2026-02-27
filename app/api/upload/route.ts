import { NextResponse } from 'next/server';

// Sistema simples de Rate Limit (Limitação de requisições por IP)
const rateLimit = new Map();

export async function POST(request: Request) {
  try {
    // 1. PROTEÇÃO CONTRA SPAM (RATE LIMIT)
    // Pega o IP do usuário para rastrear tentativas
    const ip = request.headers.get('x-forwarded-for') || 'ip-desconhecido';
    const now = Date.now();
    const limitWindow = 60000; // Tempo: 1 minuto
    const maxRequests = 10; // Máximo de fotos por minuto permitido

    if (rateLimit.has(ip)) {
      const userRecord = rateLimit.get(ip);
      if (now - userRecord.startTime < limitWindow) {
        if (userRecord.count >= maxRequests) {
          return NextResponse.json({ error: 'Muitas requisições. Tente novamente em 1 minuto.' }, { status: 429 });
        }
        userRecord.count++;
      } else {
        rateLimit.set(ip, { count: 1, startTime: now });
      }
    } else {
      rateLimit.set(ip, { count: 1, startTime: now });
    }

    // 2. PROTEÇÃO DE AUTENTICAÇÃO (SÓ LOGADOS)
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Acesso negado. Apenas utilizadores logados podem enviar fotos.' }, { status: 401 });
    }

    // 3. COMUNICAÇÃO SEGURA COM O IMGBB
    const formData = await request.formData();
    const apiKey = process.env.IMGBB_API_KEY || "db69b335530d34d718f02776197a7d91";
    
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: 'POST',
      body: formData,
    });
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Erro no servidor ao processar imagem' }, { status: 500 });
  }
}