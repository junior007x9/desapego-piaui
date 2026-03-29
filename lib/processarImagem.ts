import sharp from 'sharp';
import path from 'path';

// Defina o tamanho padrão que você quer para a imagem final (o tamanho do seu fundo)
// Vamos usar um tamanho comum para posts (ex: 1080x1350 para retrato ou 1080x1080 para quadrado)
const LARGURA_FINAL = 1080;
const ALTURA_FINAL = 1350; 

export async function processarFotoComFundo(fotoUsuarioBuffer: Buffer): Promise<Buffer> {
  try {
    // 1. Caminho para a imagem de fundo roxo que você salvou na pasta public
    const caminhoFundo = path.join(process.cwd(), 'public', 'fundo-padrao.jpg');

    // 2. Carrega a foto do usuário e corrige a orientação EXIF automaticamente
    // O .rotate() sem argumentos lê os metadados da câmera e gira a foto se necessário.
    const fotoCorrigida = sharp(fotoUsuarioBuffer).rotate();

    // 3. Redimensiona a foto do usuário para caber DENTRO do fundo, mantendo a proporção.
    // Vamos deixar uma pequena margem (ex: 50px) para não encostar na borda.
    const margem = 100;
    const fotoRedimensionada = await fotoCorrigida
      .resize({
        width: LARGURA_FINAL - margem * 2,
        height: ALTURA_FINAL - margem * 2,
        fit: 'inside', // Garante que a foto caiba inteira dentro dessas dimensões
        withoutEnlargement: true // Não aumenta fotos pequenas para não perder qualidade
      })
      .toBuffer();

    // 4. Composição: coloca a foto do usuário SOBRE o fundo roxo, centralizada.
    const imagemFinal = await sharp(caminhoFundo)
      // Se o fundo tiver tamanho diferente, podemos redimensioná-lo primeiro
      .resize(LARGURA_FINAL, ALTURA_FINAL, { fit: 'cover' }) 
      .composite([{ 
        input: fotoRedimensionada, 
        gravity: 'center' // Centraliza a foto do usuário no fundo
      }])
      .jpeg({ quality: 80 }) // Salva como JPEG com boa qualidade e compressão
      .toBuffer();

    return imagemFinal;

  } catch (error) {
    console.error('❌ Erro ao processar imagem:', error);
    throw new Error('Falha no processamento da imagem');
  }
}