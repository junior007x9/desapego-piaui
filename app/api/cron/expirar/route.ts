import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, doc, updateDoc } from 'firebase/firestore';

// Esta rota será executada automaticamente todos os dias pela plataforma Vercel
export async function GET(request: Request) {
  // Segurança rigorosa: impede que hackers acionem esta rota. Apenas a Vercel o pode fazer.
  const authHeader = request.headers.get('Authorization');
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Acesso não autorizado', { status: 401 });
  }

  try {
    const agora = new Date();
    // Vai buscar apenas os anúncios que ainda estão marcados como 'ativo' na base de dados
    const q = query(collection(db, 'anuncios'), where('status', '==', 'ativo'));
    const snap = await getDocs(q);

    let expirados = 0;
    const promessas: Promise<void>[] = [];

    snap.forEach((documento) => {
      const data = documento.data();
      if (data.expiraEm) {
        const dataExpiracao = new Date(data.expiraEm);
        // Se a data de validade já passou, prepara a alteração para 'expirado'
        if (dataExpiracao < agora) {
          promessas.push(updateDoc(doc(db, 'anuncios', documento.id), { status: 'expirado' }));
          expirados++;
        }
      }
    });

    // Grava todas as alterações no Firebase de uma só vez (muito mais rápido)
    await Promise.all(promessas);

    return NextResponse.json({ 
      success: true, 
      message: `Manutenção diária concluída! ${expirados} anúncios foram expirados com sucesso.` 
    });

  } catch (error) {
    console.error("Erro ao executar a limpeza automática:", error);
    return NextResponse.json({ success: false, error: 'Erro interno no servidor' }, { status: 500 });
  }
}