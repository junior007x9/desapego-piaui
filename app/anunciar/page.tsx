"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db, storage } from '@/lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Upload, X, DollarSign, Camera, CheckCircle2 } from 'lucide-react';

// Planos definidos no seu sistema
const PLANOS = [
  { id: 1, nome: 'Diário', dias: 1, valor: 10, fotos: 3, desc: 'Rápido e barato' },
  { id: 2, nome: 'Semanal', dias: 7, valor: 60, fotos: 5, desc: 'Ideal para maioria' },
  { id: 3, nome: 'Quinzenal', dias: 15, valor: 160, fotos: 10, desc: 'Mais visibilidade' },
  { id: 4, nome: 'Mensal', dias: 30, valor: 300, fotos: 20, desc: 'Venda profissional' }
];

export default function Anunciar() {
  const router = useRouter();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Dados do Formulário
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [preco, setPreco] = useState('');
  const [categoria, setCategoria] = useState('Outros');
  const [planoSelecionado, setPlanoSelecionado] = useState(PLANOS[1]); // Começa no Semanal
  
  // Fotos
  const [arquivosFotos, setArquivosFotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  // 1. Verificar se está logado
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        alert("Você precisa estar logado para anunciar!");
        router.push('/login');
      } else {
        setUser(currentUser);
      }
    });

    return () => unsubscribe();
  }, [router]);

  // 2. Lidar com a seleção de fotos
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const novosArquivos = Array.from(e.target.files);
      
      // Valida limite do plano
      if (arquivosFotos.length + novosArquivos.length > planoSelecionado.fotos) {
        alert(`O plano ${planoSelecionado.nome} permite apenas ${planoSelecionado.fotos} fotos.`);
        return;
      }

      setArquivosFotos([...arquivosFotos, ...novosArquivos]);

      // Gera previews para mostrar na tela
      const novosPreviews = novosArquivos.map(file => URL.createObjectURL(file));
      setPreviews([...previews, ...novosPreviews]);
    }
  };

  const removePhoto = (index: number) => {
    const novasFotos = [...arquivosFotos];
    novasFotos.splice(index, 1);
    setArquivosFotos(novasFotos);

    const novosPreviews = [...previews];
    novosPreviews.splice(index, 1);
    setPreviews(novosPreviews);
  };

  // 3. Enviar Anúncio (Salvar no Firebase)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!user) throw new Error("Usuário não autenticado");

      // A. Upload das Fotos para o Firebase Storage
      const urlsFotos: string[] = [];
      
      for (const arquivo of arquivosFotos) {
        // Cria um caminho único para a imagem: anuncios/ID_DO_USER/NOME_DA_FOTO
        const caminhoFoto = `anuncios/${user.uid}/${Date.now()}-${arquivo.name}`;
        const storageRef = ref(storage, caminhoFoto);
        
        // Faz o upload
        await uploadBytes(storageRef, arquivo);
        
        // Pega a URL pública
        const publicUrl = await getDownloadURL(storageRef);
        urlsFotos.push(publicUrl);
      }

      // Converte o preço de string ("10,00" ou "10.00") para número
      let precoNumerico = 0;
      if (preco) {
        precoNumerico = parseFloat(preco.replace(',', '.'));
      }

      // B. Salvar dados na coleção 'anuncios' no Firestore
      const docRef = await addDoc(collection(db, 'anuncios'), {
        vendedorId: user.uid,
        titulo: titulo,
        descricao: descricao,
        preco: precoNumerico,
        categoria: categoria,
        planoId: planoSelecionado.id,
        status: 'pagamento_pendente', // Fica pendente até pagar
        fotos: urlsFotos, // Array com todas as fotos
        imagemUrl: urlsFotos.length > 0 ? urlsFotos[0] : "", // Foto de capa para a Home
        criadoEm: serverTimestamp() // Data e hora oficial do servidor do Google
      });

      // C. Sucesso! Redirecionar para Pagamento
      alert("Anúncio criado com sucesso! Vamos para o pagamento.");
      router.push(`/pagamento/${docRef.id}`); 

    } catch (error: any) {
      console.error(error);
      alert('Erro ao criar anúncio: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Impede renderização da página se não houver usuário (evita piscar a tela)
  if (!user) return null;

  return (
    <div className="bg-gray-50 min-h-screen py-10">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-bold text-purple-600 mb-8 text-center">Criar Novo Anúncio</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* --- COLUNA ESQUERDA: FORMULÁRIO --- */}
          <div className="lg:col-span-2 space-y-6">
            <form id="adForm" onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
              
              {/* Título */}
              <div>
                <label className="block text-gray-700 font-bold mb-2">O que você está vendendo?</label>
                <input 
                  type="text" 
                  placeholder="Ex: iPhone 11 64gb Impecável"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  value={titulo}
                  onChange={e => setTitulo(e.target.value)}
                  required
                />
              </div>

              {/* Preço e Categoria */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-bold mb-2">Preço (R$)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-gray-500">R$</span>
                    <input 
                      type="number" 
                      step="0.01"
                      placeholder="0,00"
                      className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                      value={preco}
                      onChange={e => setPreco(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-2">Categoria</label>
                  <select 
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-white"
                    value={categoria}
                    onChange={e => setCategoria(e.target.value)}
                  >
                    <option>Imóveis</option>
                    <option>Veículos</option>
                    <option>Eletrônicos</option>
                    <option>Para Casa</option>
                    <option>Moda e Beleza</option>
                    <option>Outros</option>
                  </select>
                </div>
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-gray-700 font-bold mb-2">Descrição Detalhada</label>
                <textarea 
                  rows={5}
                  placeholder="Conte os detalhes: tempo de uso, estado de conservação, acessórios..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  value={descricao}
                  onChange={e => setDescricao(e.target.value)}
                  required
                ></textarea>
              </div>

              {/* Upload de Fotos */}
              <div>
                <label className="block text-gray-700 font-bold mb-2">
                  Fotos do Produto <span className="text-sm font-normal text-gray-500">(Máx {planoSelecionado.fotos})</span>
                </label>
                
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 mt-2">
                  {/* Botão de Adicionar */}
                  <label className="cursor-pointer flex flex-col items-center justify-center h-24 border-2 border-dashed border-purple-300 rounded-lg hover:bg-purple-50 transition bg-gray-50">
                    <Camera className="text-purple-500 mb-1" />
                    <span className="text-xs text-purple-600 font-bold">Adicionar</span>
                    <input 
                      type="file" 
                      multiple 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleFileChange}
                    />
                  </label>

                  {/* Previews */}
                  {previews.map((src, index) => (
                    <div key={index} className="relative h-24 rounded-lg overflow-hidden group shadow-sm border border-gray-200">
                      <img src={src} alt="Preview" className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </form>
          </div>

          {/* --- COLUNA DIREITA: ESCOLHA DO PLANO --- */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <CheckCircle2 className="text-green-500" /> Escolha seu Plano
              </h3>
              
              <div className="space-y-3">
                {PLANOS.map((plano) => (
                  <div 
                    key={plano.id}
                    onClick={() => setPlanoSelecionado(plano)}
                    className={`cursor-pointer border-2 rounded-lg p-4 transition-all relative ${
                      planoSelecionado.id === plano.id 
                        ? 'border-purple-500 bg-purple-50' 
                        : 'border-gray-100 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-gray-700">{plano.nome}</span>
                      <span className="text-purple-600 font-bold">R$ {plano.valor},00</span>
                    </div>
                    <div className="text-xs text-gray-500 flex justify-between">
                      <span>{plano.dias} dias online</span>
                      <span>Até {plano.fotos} fotos</span>
                    </div>
                    
                    {planoSelecionado.id === plano.id && (
                      <div className="absolute -top-2 -right-2 bg-purple-600 text-white rounded-full p-1">
                        <CheckCircle2 size={16} />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6 border-t pt-4">
                 <div className="flex justify-between items-center mb-4">
                    <span className="text-gray-600">Total a pagar:</span>
                    <span className="text-2xl font-bold text-green-600">R$ {planoSelecionado.valor},00</span>
                 </div>
                 
                 <button 
                    type="submit" 
                    form="adForm"
                    disabled={loading}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg shadow-md transition flex justify-center items-center gap-2 disabled:opacity-50"
                 >
                    {loading ? 'Processando...' : 'Finalizar e Pagar PIX'}
                 </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}