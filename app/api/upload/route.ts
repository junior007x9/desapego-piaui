import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    
    // A chave agora fica escondida no servidor e NUNCA vai para o navegador do cliente!
    // No Vercel, você vai cadastrar essa chave nas configurações de Environment Variables.
    // Para testar agora, você pode colar ela aqui diretamente APENAS se for uma chave de teste.
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