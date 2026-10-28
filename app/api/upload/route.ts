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
    const maxRequests = 15; 

    if (rateLimit.has(ip)) {
      const userRecord = rateLimit.get(ip);
      if (now - userRecord.startTime < limitWindow) {
        if (userRecord.count >= maxRequests) {
          return NextResponse.json({ success: false, error: 'Muitas requisições. Aguarde um instante.' }, { status: 429 });
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

    // Lê a foto, corrige a rotação (se tirada com telemóvel deitado) e ajusta o tamanho
    const fotoCorrigidaBuffer = await sharp(buffer)
      .rotate() 
      .resize({ 
        width: LARGURA_FINAL - (MARGEM * 2), 
        height: ALTURA_FINAL - (MARGEM * 2), 
        fit: 'inside', 
        withoutEnlargement: true 
      })
      .toBuffer();

    // Aplica o fundo roxo padrão
    const caminhoFundo = path.join(process.cwd(), 'public', 'fundo-padrao.jpg');
    let finalBuffer;

    if (fs.existsSync(caminhoFundo)) {
      finalBuffer = await sharp(caminhoFundo)
        .resize(LARGURA_FINAL, ALTURA_FINAL, { fit: 'cover' })
        .composite([{ input: fotoCorrigidaBuffer, gravity: 'center' }])
        .webp({ quality: 80 })
        .toBuffer();
    } else {
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

    // Converte a imagem comprimida para Base64 para enviar ao ImgBB
    const base64Image = finalBuffer.toString('base64');

    // 4. ENVIO PARA O IMGBB 100% GRATUITO
    const imgbbFormData = new FormData();
    imgbbFormData.append('image', base64Image);

    // 👇 A SUA NOVA CHAVE DO IMGBB APLICADA AQUI 👇
    const apiKey = "b230defa681a676056fcc144d5a81459"; 
    
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: 'POST',
      body: imgbbFormData,
    });
    
    const data = await response.json();
    
    if (data && data.success) {
      return NextResponse.json({ success: true, url: data.data.url });
    } else {
       return NextResponse.json({ success: false, error: data?.error?.message || "Falha ao hospedar imagem." }, { status: 400 });
    }
    
  } catch (error: any) {
    console.error("Erro fatal no processamento da imagem:", error);
    return NextResponse.json({ success: false, error: error.message || 'Erro interno no servidor ao processar imagem' }, { status: 500 });
  }
}