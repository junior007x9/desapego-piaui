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
}import { NextResponse } from 'next/server';
import sharp from 'sharp';

// Sistema simples de Rate Limit (Limitação de requisições por IP)
const rateLimit = new Map();

export async function POST(request: Request) {
  try {
    // 1. PROTEÇÃO CONTRA SPAM (RATE LIMIT)
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

    // 3. EXTRAÇÃO DA IMAGEM
    const formData = await request.formData();
    const file = formData.get('image') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Nenhuma imagem enviada.' }, { status: 400 });
    }

    // 4. COMPRESSÃO MÁGICA COM SHARP
    // Transforma o arquivo em Buffer para o Sharp conseguir ler
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Redimensiona para max 1200px (não perde qualidade na tela) e converte para WebP (muito mais leve que JPG/PNG)
    const compressedBuffer = await sharp(buffer)
      .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 }) 
      .toBuffer();

    // O ImgBB aceita arquivos em Base64, o que facilita muito o envio seguro pelo servidor
    const base64Image = compressedBuffer.toString('base64');

    // 5. ENVIO SEGURO PARA O IMGBB
    const imgbbFormData = new FormData();
    imgbbFormData.append('image', base64Image);

    const apiKey = process.env.IMGBB_API_KEY || "db69b335530d34d718f02776197a7d91";
    
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: 'POST',
      body: imgbbFormData,
    });
    
    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error("Erro no processamento da imagem:", error);
    return NextResponse.json({ error: 'Erro no servidor ao processar imagem' }, { status: 500 });
  }
}