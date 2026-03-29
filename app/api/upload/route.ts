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

    // 4. CORREÇÃO E COMPRESSÃO MÁGICA COM SHARP
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const LARGURA_FINAL = 1080;
    const ALTURA_FINAL = 1080; // Deixando quadrado para vitrine de anúncios ficar perfeita
    const MARGEM = 60; // Margem para a foto não colar nas bordas do fundo roxo

    // 4.1 - Lê a foto do usuário, CORRIGE A ORIENTAÇÃO (foto deitada) e redimensiona
    const fotoCorrigidaBuffer = await sharp(buffer)
      .rotate() // ISSO AQUI RESOLVE AS FOTOS DEITADAS LENDO O EXIF DA CÂMERA
      .resize({ 
        width: LARGURA_FINAL - (MARGEM * 2), 
        height: ALTURA_FINAL - (MARGEM * 2), 
        fit: 'inside', 
        withoutEnlargement: true 
      })
      .toBuffer();

    // 4.2 - Define o fundo roxo padrão
    const caminhoFundo = path.join(process.cwd(), 'public', 'fundo-padrao.jpg');
    let finalBuffer;

    // Verifica se a imagem de fundo existe, se não existir cria um fundo de cor sólida roxa como fallback de segurança
    if (fs.existsSync(caminhoFundo)) {
      // Usa a sua imagem de fundo
      finalBuffer = await sharp(caminhoFundo)
        .resize(LARGURA_FINAL, ALTURA_FINAL, { fit: 'cover' })
        .composite([
          { input: fotoCorrigidaBuffer, gravity: 'center' } // Centraliza a foto corrigida no fundo roxo
        ])
        .webp({ quality: 80 })
        .toBuffer();
    } else {
      console.warn("⚠️ Imagem 'fundo-padrao.jpg' não encontrada na pasta public. Usando fundo roxo sólido padrão.");
      // Cria um fundo roxo sólido padrão caso você esqueça de colocar a imagem na pasta public
      finalBuffer = await sharp({
        create: {
          width: LARGURA_FINAL,
          height: ALTURA_FINAL,
          channels: 4,
          background: { r: 91, g: 33, b: 182, alpha: 1 } // Tom de roxo parecido com a sua logo
        }
      })
        .composite([
          { input: fotoCorrigidaBuffer, gravity: 'center' }
        ])
        .webp({ quality: 80 })
        .toBuffer();
    }

    // O ImgBB aceita arquivos em Base64
    const base64Image = finalBuffer.toString('base64');

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