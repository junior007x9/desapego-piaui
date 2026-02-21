'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { db } from '@/lib/firebase'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { Copy, CheckCircle, Loader2, ArrowLeft } from 'lucide-react'

// Recriamos a lista de planos igual à da página de Anunciar
const PLANOS = [
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

  // 1. Carregar dados do anúncio e do plano
  useEffect(() => {
    async function loadData() {
      if (!params.id) return;

      try {
        // Pega o anúncio do Firebase
        const adDocRef = doc(db, 'anuncios', params.id as string);
        const adSnapshot = await getDoc(adDocRef);

        if (!adSnapshot.exists()) {
          alert("Anúncio não encontrado!")
          router.push('/')
          return
        }

        // CORREÇÃO AQUI: Adicionado ": any" para o TypeScript não reclamar no Build da Vercel
        const anuncio: any = { id: adSnapshot.id, ...adSnapshot.data() };
        setAd(anuncio)

        // Encontra o plano escolhido no array local
        const planoEscolhido = PLANOS.find(p => p.id === anuncio.planoId) || PLANOS[1];
        setPlano(planoEscolhido)

        // Tenta pegar o email do vendedor na coleção 'users' para enviar para o Mercado Pago
        let emailComprador = 'email@teste.com';
        if (anuncio.vendedorId) {
            const userDoc = await getDoc(doc(db, 'users', anuncio.vendedorId));
            if (userDoc.exists()) {
                emailComprador = (userDoc.data() as any).email || 'email@teste.com';
            }
        }

        // Gera o PIX
        gerarPix(anuncio, planoEscolhido, emailComprador)

      } catch (error) {
        console.error("Erro ao carregar os dados:", error);
        setLoading(false);
      }
    }

    loadData()
  }, [params.id, router])

  // 2. Chamar a nossa API para gerar o PIX
  const gerarPix = async (anuncio: any, planoDb: any, email: string) => {
    try {
      const response = await fetch('/api/pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: planoDb.valor,
          description: `Pagamento Anúncio: ${anuncio.titulo} (${planoDb.nome})`,
          payerEmail: email,
          adId: anuncio.id
        })
      })

      if (response.ok) {
        const data = await response.json()
        setPaymentData(data)
      } else {
        throw new Error("Falha na API");
      }
    } catch (error) {
      console.error(error)
      // DICA PARA DESENVOLVIMENTO: 
      // Se a sua API do Mercado Pago (/api/pix) ainda não estiver a funcionar, 
      // isto gera um PIX falso (Mock) para não bloquear os seus testes no Firebase!
      setPaymentData({
        qr_code: "00020126580014br.gov.bcb.pix0136mock-pix-key-1234-5678-abcd520400005303986540510.005802BR5915Desapego Piaui6008Teresina62070503***6304ABCD",
        qr_code_base64: "https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg" 
      })
    } finally {
      setLoading(false)
    }
  }

  // Função para copiar o código PIX
  const copyToClipboard = () => {
    if (paymentData?.qr_code) {
      navigator.clipboard.writeText(paymentData.qr_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Simulação de "Já paguei" (Em produção real, deverá usar Webhooks do Mercado Pago)
  const checkPayment = async () => {
    setLoading(true)
    try {
      // Calcula a data de expiração com base nos dias do plano
      const dias = plano?.dias || 30
      const dataExp = new Date()
      dataExp.setDate(dataExp.getDate() + dias)

      // Atualiza o status do anúncio no Firestore para 'ativo'
      await updateDoc(doc(db, 'anuncios', ad.id), { 
        status: 'ativo', 
        expiraEm: dataExp.toISOString() 
      })

      alert("Pagamento confirmado! O seu anúncio já está no ar.")
      router.push('/meus-anuncios') 
    } catch (error) {
      console.error("Erro ao confirmar pagamento:", error);
      alert("Erro ao confirmar o pagamento.");
      setLoading(false);
    }
  }

  if (loading && !paymentData) {
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
          <p className="opacity-90 relative z-10">Falta pouco para o seu anúncio ir ao ar!</p>
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

          {/* QR CODE - Imagem */}
          <div className="flex justify-center my-6">
            <div className="border-4 border-gray-50 p-3 rounded-2xl shadow-sm">
              {paymentData?.qr_code_base64?.startsWith('http') ? (
                 <img src={paymentData.qr_code_base64} alt="QR Code" className="w-48 h-48 object-cover rounded-xl" />
              ) : (
                 <img src={`data:image/png;base64,${paymentData?.qr_code_base64}`} alt="QR Code" className="w-48 h-48 rounded-xl" />
              )}
            </div>
          </div>

          {/* Copia e Cola */}
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

          <div className="bg-yellow-50 border border-yellow-100 text-yellow-800 text-sm p-4 rounded-xl flex items-start gap-3">
            <span className="text-xl">⏳</span>
            <p>Após o pagamento, o seu anúncio será ativado automaticamente em alguns instantes.</p>
          </div>

          <button 
            onClick={checkPayment}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl shadow-md transition text-lg"
          >
            Já realizei o pagamento
          </button>
          
          <button onClick={() => router.back()} className="w-full text-gray-500 font-medium text-sm hover:text-purple-600 transition flex items-center justify-center gap-1 mt-4">
             <ArrowLeft size={16} /> Voltar para o anúncio
          </button>
        </div>
      </div>
    </div>
  )
}