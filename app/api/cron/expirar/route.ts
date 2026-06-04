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
    let rebaixados = 0; // Nova contagem para os VIPs que voltaram ao plano Básico
    const promessas: Promise<void>[] = [];

    snap.forEach((documento) => {
      const data = documento.data();
      
      if (data.expiraEm) {
        const dataExpiracao = new Date(data.expiraEm);
        
        // A data de validade do plano atual passou!
        if (dataExpiracao < agora) {
          const planoAtual = data.planoId;

          // REGRA 1: Se já era o plano Básico (99) ou o Presente VIP (0), acabou o tempo de vida total. Tira do ar.
          if (planoAtual === 99 || planoAtual === 0) {
            promessas.push(updateDoc(doc(db, 'anuncios', documento.id), { status: 'expirado' }));
            expirados++;
          } 
          // REGRA 2: Se for um plano Pago (Sobe pro Topo, Turbo ou Ouro), o VIP acaba, mas o anúncio NÃO SOME!
          // Ele é "rebaixado" para o Básico e ganha sobrevida até completar 30 dias de site.
          else {
            const dataCriacao = data.criadoEm?.seconds ? new Date(data.criadoEm.seconds * 1000) : new Date();
            
            // Calcula qual seria a data máxima de vida desse anúncio (30 dias desde que foi postado)
            const limiteFinal = new Date(dataCriacao);
            limiteFinal.setDate(limiteFinal.getDate() + 30);

            // Se por acaso já passou de 30 dias desde a criação, expira de vez
            if (limiteFinal < agora) {
               promessas.push(updateDoc(doc(db, 'anuncios', documento.id), { status: 'expirado' }));
               expirados++;
            } else {
               // Rebaixa para básico e ajusta a data de expiração para o tempo que resta dos 30 dias
               promessas.push(updateDoc(doc(db, 'anuncios', documento.id), { 
                  planoId: 99, 
                  expiraEm: limiteFinal.toISOString() 
               }));
               rebaixados++;
            }
          }
        }
      }
    });

    // Grava todas as alterações no Firebase de uma só vez (muito mais rápido)
    await Promise.all(promessas);

    return NextResponse.json({ 
      success: true, 
      message: `Manutenção diária concluída! ${expirados} anúncios saíram do ar e ${rebaixados} anúncios VIPs perderam o destaque e voltaram ao plano básico.` 
    });

  } catch (error) {
    console.error("Erro ao executar a limpeza automática:", error);
    return NextResponse.json({ success: false, error: 'Erro interno no servidor' }, { status: 500 });
  }
}