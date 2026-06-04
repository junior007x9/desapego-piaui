'use client'
import { useEffect } from 'react'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import toast from 'react-hot-toast'

export default function DailyCheckin() {
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userRef = doc(db, 'usuarios', user.uid);
          const snap = await getDoc(userRef);

          if (snap.exists()) {
            const data = snap.data();
            
            // Impede que quebre se a carteira do usuário ainda não tiver sido criada
            if (data.moedas === undefined) return; 

            const hoje = new Date();
            const ontem = new Date();
            ontem.setDate(ontem.getDate() - 1); // Calcula exatamente qual foi o dia de ontem
            
            const dataHojeStr = hoje.toDateString();
            const dataOntemStr = ontem.toDateString();

            let dataUltimoCheckinStr = '';

            // Verifica qual foi o último dia que o sistema registrou o bônus
            if (data.ultimoCheckin) {
              const dataUltimo = data.ultimoCheckin.seconds
                ? new Date(data.ultimoCheckin.seconds * 1000)
                : new Date(data.ultimoCheckin);
              dataUltimoCheckinStr = dataUltimo.toDateString();
            }

            // Se a data de hoje for diferente do último checkin, ele ganha o bônus!
            if (dataUltimoCheckinStr !== dataHojeStr) {
              let novaOfensiva = data.diasSeguidos || 1;

              // Se o último checkin foi exatamente ontem, aumenta o foguinho da ofensiva 🔥
              if (dataUltimoCheckinStr === dataOntemStr) {
                novaOfensiva += 1;
              } else if (dataUltimoCheckinStr !== '') {
                // Se não logou ontem, a corrente quebrou. Volta pra 1.
                novaOfensiva = 1;
              }

              // Atualiza a carteira do usuário no Firestore silenciosamente
              await updateDoc(userRef, {
                moedas: (data.moedas || 0) + 5,
                diasSeguidos: novaOfensiva,
                ultimoCheckin: serverTimestamp()
              });

              // Dispara uma notificação vibrante na tela do usuário!
              setTimeout(() => {
                toast.success(`🔥 Check-in Diário!\nVocê ganhou +5 Moedas VIP.\nOfensiva: ${novaOfensiva} dias seguidos.`, {
                  duration: 6000,
                  icon: '🎁',
                  style: {
                     border: '1px solid #F59E0B', // Borda dourada
                     background: '#FEF3C7', // Fundo amarelo clarinho
                     color: '#92400E', // Texto forte
                     padding: '16px',
                  }
                });
              }, 2500); // 2.5 segundos de atraso para ele ver logo depois que a tela inicial carregar
            }
          }
        } catch (error) {
          console.error("Erro no checkin diário", error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  return null; // O componente não renderiza NADA na tela, é só lógica visual via Toast.
}