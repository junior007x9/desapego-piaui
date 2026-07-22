import { NextResponse } from 'next/server';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

// Sistema simples de Rate Limit (Limitação de requisições por IP)
const rateLimit = new Map();

export async function POST(request: Request) {
  try {
    // 1. PROTEÇÃO CONTRA SPAM (RATE LIMIT)
    const ip = request.headers.get('x-forwarded-for') || 'ip-desconhecido';
    const now = Date.now();
    const limitWindow = 60000; // Tempo: 1 minuto
    const maxRequests = 15; // Aumentei de 10 para 15 (alguns usuários sobem 10 fotos no anúncio de uma vez)

    if (rateLimit.has(ip)) {
      const userRecord = rateLimit.get(ip);
      if (now - userRecord.startTime < limitWindow) {
        if (userRecord.count >= maxRequests) {
          return NextResponse.json({ success: false, error: 'Muitas requisições. Aguarde um instante antes de enviar mais fotos.' }, { status: 429 });
        }
        userRecord.count++;
      } else {
        rateLimit.set(ip, { count: 1, startTime: now });
      }
    } else {
      rateLimit.set(ip, { count: 1, startTime: now });
    }

    // 2. EXTRAÇÃO DA IMAGEM
    const formData = await request.formData();
    const file = formData.get('image') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'Nenhuma imagem enviada no formulário.' }, { status: 400 });
    }

    // 3. COMPRESSÃO E CORREÇÃO MÁGICA COM SHARP
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const LARGURA_FINAL = 1080;
    const ALTURA_FINAL = 1080; 
    const MARGEM = 60; 

    // 3.1 - Lê a foto do usuário, CORRIGE A ORIENTAÇÃO (foto deitada) e redimensiona
    const fotoCorrigidaBuffer = await sharp(buffer)
      .rotate() // Resolve as fotos deitadas lendo o EXIF
      .resize({ 
        width: LARGURA_FINAL - (MARGEM * 2), 
        height: ALTURA_FINAL - (MARGEM * 2), 
        fit: 'inside', 
        withoutEnlargement: true 
      })
      .toBuffer();

    // 3.2 - Define o fundo roxo padrão
    const caminhoFundo = path.join(process.cwd(), 'public', 'fundo-padrao.jpg');
    let finalBuffer;

    if (fs.existsSync(caminhoFundo)) {
      finalBuffer = await sharp(caminhoFundo)
        .resize(LARGURA_FINAL, ALTURA_FINAL, { fit: 'cover' })
        .composite([{ input: fotoCorrigidaBuffer, gravity: 'center' }])
        .webp({ quality: 80 })
        .toBuffer();
    } else {
      console.warn("⚠️ Imagem 'fundo-padrao.jpg' não encontrada na pasta public. Usando fundo roxo sólido padrão.");
      finalBuffer = await sharp({
        create: {
          width: LARGURA_FINAL,
          height: ALTURA_FINAL,
          channels: 4,
          background: { r: 91, g: 33, b: 182, alpha: 1 } 
        }
      })
        .composite([{ input: fotoCorrigidaBuffer, gravity: 'center' }])
        .webp({ quality: 80 })
        .toBuffer();
    }

    const base64Image = finalBuffer.toString('base64');

    // 4. ENVIO PARA O IMGBB
    const imgbbFormData = new FormData();
    imgbbFormData.append('image', base64Image);

    // Damos prioridade para a chave no .env, se não houver, usamos a sua chave salva
    const apiKey = process.env.IMGBB_API_KEY || "db69b335530d34d718f02776197a7d91";
    
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: 'POST',
      body: imgbbFormData,
    });
    
    const data = await response.json();
    
    // Tratando a resposta do ImgBB
    if (data && data.success) {
      // Retornamos um JSON simples com a URL para facilitar o Frontend
      return NextResponse.json({ success: true, url: data.data.url });
    } else {
       return NextResponse.json({ success: false, error: data?.error?.message || "Falha ao hospedar imagem." }, { status: 400 });
    }
    
  } catch (error: any) {
    console.error("Erro fatal no processamento da imagem:", error);
    // Devolve o erro certinho para não aparecer [object Object] no Frontend
    return NextResponse.json({ success: false, error: error.message || 'Erro interno no servidor ao processar imagem' }, { status: 500 });
  }
}