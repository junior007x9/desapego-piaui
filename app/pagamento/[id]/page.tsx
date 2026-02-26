'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { db } from '@/lib/firebase'
import { doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore'
import { Copy, CheckCircle, Loader2, ArrowLeft, AlertTriangle } from 'lucide-react'

const PLANOS = [
  { id: 5, nome: 'Teste', dias: 1, valor: 1, fotos: 3, desc: 'Apenas para testar o sistema' },
  { id: 1, nome: 'Diário', dias: 1, valor: 10, fotos: 3, desc: 'Rápido e barato' },
  { id: 2, nome: 'Semanal', dias: 7, valor: 60, fotos: 5, desc: 'Ideal para maioria' },
  { id: 3, nome: 'Quinzenal', dias: 15, valor: 160, fotos: 10, desc: 'Mais visibilidade' },
  { id: 4, nome: 'Mensal', dias: 30, valor: 300, fotos: 20, desc: 'Venda profissional' }
];

export default function PagamentoPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [ad, setAd] = useState<any>(null)
  const [plano, setPlano] = useState<any>(null)
  const [paymentData, setPaymentData] = useState<any>(null)
  const [copied, setCopied] = useState(false)
  const [pagamentoAprovado, setPagamentoAprovado] = useState(false)
  const [erroPagamento, setErroPagamento] = useState(false)

  useEffect(() => {
    async function loadData() {
      if (!params.id) return;
      try {
        const adDocRef = doc(db, 'anuncios', params.id as string);
        const adSnapshot = await getDoc(adDocRef);

        if (!adSnapshot.exists()) {
          alert("Anúncio não encontrado!")
          router.push('/')
          return
        }

        const anuncio: any = { id: adSnapshot.id, ...adSnapshot.data() };
        setAd(anuncio)

        const planoEscolhido = PLANOS.find(p => p.id === anuncio.planoId) || PLANOS[1];
        setPlano(planoEscolhido)

        let emailComprador = 'comprador@desapegopiaui.com.br';
        if (anuncio.vendedorId) {
            const userDoc = await getDoc(doc(db, 'users', anuncio.vendedorId));
            if (userDoc.exists()) {
                emailComprador = (userDoc.data() as any).email || emailComprador;
            }
        }

        await gerarPix(anuncio, planoEscolhido, emailComprador)
      } catch (error) {
        console.error(error);
        setLoading(false);
        setErroPagamento(true);
      }
    }
    loadData()
  }, [params.id, router])

  // A MÁGICA ATUALIZADA (Garantia Dupla)
  useEffect(() => {
    if (!paymentData?.id || pagamentoAprovado) return;

    const interval = setInterval(async () => {
      try {
        // O Date.now() impede que o navegador grave o resultado antigo
        const res = await fetch(`/api/pix/status?id=${paymentData.id}&t=${Date.now()}`);
        const data = await res.json();
        
        if (data.status === 'approved') {
          setPagamentoAprovado(true);
          clearInterval(interval);

          // GARANTIA EXTRA: Atualiza o Firebase pelo lado do cliente!
          try {
            const adRef = doc(db, 'anuncios', params.id as string);
            const dias = plano?.dias || 30;
            const dataExp = new Date();
            dataExp.setDate(dataExp.getDate() + dias);
            
            await updateDoc(adRef, {
              status: 'ativo',
              expiraEm: dataExp.toISOString(),
              pagoEm: new Date().toISOString()
            });
          } catch(e) { console.error("Erro backup client-side:", e) }

          // REDIRECIONA PARA O ANÚNCIO
          setTimeout(() => {
            router.push(`/anuncio/${params.id}`);
          }, 3000); 
        }
      } catch (error) {
        console.error("Erro ao verificar pagamento:", error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [paymentData?.id, pagamentoAprovado, params.id, router, plano?.dias]);

  async function gerarPix(anuncio: any, planoDb: any, email: string) {
    try {
      const response = await fetch('/api/pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: planoDb.valor,
          description: `DesapegoPI: ${anuncio.titulo} (${planoDb.nome})`,
          payerEmail: email,
          adId: anuncio.id
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.error) throw new Error(data.error)
        setPaymentData(data)
      } else {
        throw new Error("Falha na API");
      }
    } catch (error) {
      console.error(error)
      setErroPagamento(true) 
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    if (paymentData?.qr_code) {
      navigator.clipboard.writeText(paymentData.qr_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (pagamentoAprovado) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-green-50 px-4 text-center">
        <CheckCircle className="text-green-500 mb-4" size={80} />
        <h1 className="text-3xl font-black text-green-700 mb-2">Pagamento Aprovado!</h1>
        <p className="text-green-600 font-medium">O seu anúncio já está online. Redirecionando para ver o resultado...</p>
      </div>
    )
  }

  if (loading && !paymentData && !erroPagamento) {
    return (
      <div className="min-h-screen flex items-center justify-center text-purple-600 bg-gray-50">
        <Loader2 className="animate-spin" size={48}/>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 min-h-screen py-10 px-4">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-purple-600 p-6 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <h1 className="text-2xl font-bold mb-2 relative z-10">Pagamento via PIX</h1>
          <p className="opacity-90 relative z-10">Escaneie o QR Code ou use o Pix Copia e Cola.</p>
        </div>

        <div className="p-8 space-y-6">
          <div className="text-center">
            <p className="text-gray-500 mb-1 font-medium">Valor a pagar</p>
            <p className="text-4xl font-extrabold text-green-600">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(plano?.valor || 0)}
            </p>
            <p className="text-sm text-purple-600 font-bold mt-2 bg-purple-50 inline-block px-3 py-1 rounded-full">
              Plano {plano?.nome}
            </p>
          </div>

          {erroPagamento ? (
            <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl text-center flex flex-col items-center">
               <AlertTriangle size={40} className="mb-3 text-red-500" />
               <h3 className="font-bold text-lg">Erro ao gerar PIX</h3>
               <p className="text-sm mt-2">Verifique se o seu Token do Mercado Pago está correto.</p>
            </div>
          ) : (
            <>
              <div className="flex justify-center my-6">
                <div className="border-4 border-gray-50 p-3 rounded-2xl shadow-sm">
                  {paymentData?.qr_code_base64?.startsWith('http') ? (
                    <img src={paymentData.qr_code_base64} alt="QR Code" className="w-48 h-48 object-cover rounded-xl" />
                  ) : (
                    <img src={`data:image/png;base64,${paymentData?.qr_code_base64}`} alt="QR Code" className="w-48 h-48 rounded-xl" />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Pix Copia e Cola</label>
                <div className="flex gap-2">
                  <input 
                    readOnly 
                    value={paymentData?.qr_code || ''} 
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm text-gray-500 truncate focus:outline-none"
                  />
                  <button 
                    onClick={copyToClipboard}
                    className="bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-xl transition shadow-sm"
                  >
                    {copied ? <CheckCircle size={20} /> : <Copy size={20} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 text-sm text-purple-700 bg-purple-50 border border-purple-100 font-bold p-4 rounded-xl">
                <Loader2 className="animate-spin text-purple-600" size={20} />
                Aguardando a confirmação do pagamento...
              </div>
            </>
          )}
          
          <button onClick={() => router.back()} className="w-full text-gray-500 font-medium text-sm hover:text-purple-600 transition flex items-center justify-center gap-1 mt-4">
             <ArrowLeft size={16} /> Voltar
          </button>
        </div>
      </div>
    </div>
  )
}