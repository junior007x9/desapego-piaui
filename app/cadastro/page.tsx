'use client'
import { useState } from 'react'
import { auth, db } from '@/lib/firebase'
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Mail, Lock, User, Phone, CheckCircle, Shield, Eye, AlertCircle, MessageSquare } from 'lucide-react'
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from 'react-google-recaptcha-v3'

// 1. BLACKLIST: BLOQUEIO DE E-MAILS DESCARTÁVEIS
const DOMINIOS_PROIBIDOS = [
  '10minutemail.com', 'yopmail.com', 'mailinator.com', 'tempmail.com', 
  'guerrillamail.com', 'throwawaymail.com', 'dropmail.me', 'temp-mail.org'
]

// 2. FUNÇÕES MATEMÁTICAS PARA VALIDAR CPF E CNPJ
const validarCPF = (cpf: string) => {
  cpf = cpf.replace(/[^\d]+/g, '');
  if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false;
  let soma = 0, resto;
  for (let i = 1; i <= 9; i++) soma = soma + parseInt(cpf.substring(i - 1, i)) * (11 - i);
  resto = (soma * 10) % 11;
  if ((resto === 10) || (resto === 11)) resto = 0;
  if (resto !== parseInt(cpf.substring(9, 10))) return false;
  soma = 0;
  for (let i = 1; i <= 10; i++) soma = soma + parseInt(cpf.substring(i - 1, i)) * (12 - i);
  resto = (soma * 10) % 11;
  if ((resto === 10) || (resto === 11)) resto = 0;
  return resto === parseInt(cpf.substring(10, 11));
};

const validarCNPJ = (cnpj: string) => {
  cnpj = cnpj.replace(/[^\d]+/g, '');
  if (cnpj.length !== 14 || !!cnpj.match(/(\d)\1{13}/)) return false;
  let tamanho = cnpj.length - 2;
  let numeros = cnpj.substring(0, tamanho);
  const digitos = cnpj.substring(tamanho);
  let soma = 0, pos = tamanho - 7;
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  let resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
  if (resultado !== parseInt(digitos.charAt(0))) return false;
  tamanho = tamanho + 1;
  numeros = cnpj.substring(0, tamanho);
  soma = 0; pos = tamanho - 7;
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
  return resultado === parseInt(digitos.charAt(1));
};

function CadastroForm() {
  const router = useRouter()
  const { executeRecaptcha } = useGoogleReCaptcha()
  const [loading, setLoading] = useState(false)
  
  // ETAPA DO FORMULÁRIO (1 = Dados, 2 = OTP)
  const [etapa, setEtapa] = useState<'dados' | 'otp'>('dados')
  const [codigoOTP, setCodigoOTP] = useState('')

  // Dados
  const [apelido, setApelido] = useState('')
  const [telefone, setTelefone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nomeCompleto, setNomeCompleto] = useState('')
  const [tipoConta, setTipoConta] = useState('Fisica') 
  const [documento, setDocumento] = useState('')
  const [genero, setGenero] = useState('')
  const [cep, setCep] = useState('')
  const [rua, setRua] = useState('')
  const [numero, setNumero] = useState('')
  const [bairro, setBairro] = useState('')
  const [cidade, setCidade] = useState('')
  const [estado, setEstado] = useState('')

  // 3. VALIDAÇÕES EM TEMPO REAL
  const dominioEmail = email.includes('@') ? email.split('@')[1].toLowerCase() : '';
  const isEmailDescartavel = DOMINIOS_PROIBIDOS.includes(dominioEmail);
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && !isEmailDescartavel;
  
  const isCpfCnpjValid = tipoConta === 'Fisica' ? validarCPF(documento) : validarCNPJ(documento);
  const docLenght = documento.replace(/\D/g, '').length;
  const isDocError = (tipoConta === 'Fisica' && docLenght === 11 && !isCpfCnpjValid) || (tipoConta === 'Juridica' && docLenght === 14 && !isCpfCnpjValid);

  // Botão só acende se TODOS os campos estiverem preenchidos e válidos
  const isFormValid = 
    nomeCompleto.trim().length > 2 && apelido.trim().length > 2 &&
    isEmailValid && password.length >= 6 && telefone.replace(/\D/g, '').length >= 10 &&
    isCpfCnpjValid && genero !== '' && cep.replace(/\D/g, '').length === 8 &&
    rua.trim() !== '' && numero.trim() !== '' && bairro.trim() !== '' && cidade !== '' && estado !== '';

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let valor = e.target.value.replace(/\D/g, '')
    if (valor.length <= 11) {
      valor = valor.replace(/^(\d{2})(\d)/g, '($1) $2')
      valor = valor.replace(/(\d)(\d{4})$/, '$1-$2')
      setTelefone(valor)
    }
  }

  const handleDocumentoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let valor = e.target.value.replace(/\D/g, '')
    if (tipoConta === 'Fisica') {
      if (valor.length <= 11) {
        valor = valor.replace(/(\d{3})(\d)/, '$1.$2')
        valor = valor.replace(/(\d{3})(\d)/, '$1.$2')
        valor = valor.replace(/(\d{3})(\d{1,2})$/, '$1-$2')
        setDocumento(valor)
      }
    } else {
      if (valor.length <= 14) {
        valor = valor.replace(/^(\d{2})(\d)/, '$1.$2')
        valor = valor.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        valor = valor.replace(/\.(\d{3})(\d)/, '.$1/$2')
        valor = valor.replace(/(\d{4})(\d)/, '$1-$2')
        setDocumento(valor)
      }
    }
  }

  const buscarCep = async (cepBuscado: string) => {
    const cepLimpo = cepBuscado.replace(/\D/g, '')
    if (cepLimpo.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
        const data = await res.json()
        if (!data.erro) {
          setRua(data.logradouro)
          setBairro(data.bairro)
          setCidade(data.localidade)
          setEstado(data.uf)
        } else {
          alert("CEP não encontrado.");
          setRua(''); setBairro(''); setCidade(''); setEstado('');
        }
      } catch (error) {
        console.error("Erro ao buscar CEP", error)
      }
    }
  }

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let valor = e.target.value.replace(/\D/g, '')
    if (valor.length <= 8) {
      valor = valor.replace(/^(\d{5})(\d)/, '$1-$2')
      setCep(valor)
      if (valor.length === 8) buscarCep(valor)
    }
  }

  // 4. PASSO 1: AVANÇAR PARA OTP
  const handleAvancarOTP = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isFormValid) {
      alert("Por favor, preencha todos os campos corretamente com dados reais.");
      return;
    }

    if (!executeRecaptcha) {
        alert("Aguarde a verificação de segurança...");
        return;
    }

    setLoading(true)

    try {
      const recaptchaToken = await executeRecaptcha('signup')
      if (!recaptchaToken) throw new Error("Erro reCAPTCHA")

      const verifyRes = await fetch('/api/recaptcha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: recaptchaToken })
      });

      if (!verifyRes.ok) {
        alert("Acesso bloqueado por suspeita de robô/spam.");
        setLoading(false);
        return;
      }

      // AQUI ENTRARIA A API DE WHATSAPP PAGA (Ex: Twilio)
      // fetch('/api/enviar-whatsapp', { method: 'POST', body: JSON.stringify({ telefone }) })
      
      // Como não tem API, mudamos a tela para o utilizador digitar o código (Simulação: 123456)
      setEtapa('otp');
      alert(`SIMULAÇÃO: Um código de 6 dígitos seria enviado para o WhatsApp ${telefone}. Para testes, digite: 123456`);
      
    } catch (error) {
      console.error(error)
      alert("Erro ao validar segurança.")
    } finally {
      setLoading(false)
    }
  }

  // 5. PASSO 2: VERIFICAR OTP E CRIAR CONTA DE VERDADE
  const handleFinalizarCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validação fictícia para a interface funcionar
    if (codigoOTP !== '123456') {
      alert("Código OTP incorreto. (Dica: digite 123456 para testar)");
      setLoading(false);
      return;
    }

    try {
      // Cria a conta
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
      const telLimpo = telefone.replace(/\D/g, '')

      // Dispara o E-mail oficial de Verificação do Google
      await sendEmailVerification(user);

      await setDoc(doc(db, 'users', user.uid), {
        nome: apelido, 
        email: email,
        telefone: telLimpo,
        cidade: cidade, 
        estado: estado,
        favoritos: [],
        criadoEm: serverTimestamp()
      })

      await setDoc(doc(db, 'users', user.uid, 'privado', 'dados'), {
        nomeCompleto,
        tipoConta,
        documento: documento.replace(/\D/g, ''),
        genero,
        endereco: { cep: cep.replace(/\D/g, ''), rua, numero, bairro, cidade, estado }
      })

      alert("Conta verificada e criada com sucesso! 📧 Enviamos um e-mail de confirmação para a sua caixa de entrada.");
      router.push('/meus-anuncios')
      
    } catch (error: any) {
      console.error(error)
      if (error.code === 'auth/email-already-in-use') {
        alert("Este email já está em uso.")
        setEtapa('dados')
      } else {
        alert("Erro ao criar conta.")
      }
    } finally {
      setLoading(false)
    }
  }

  // RENDERIZA A TELA DE OTP SE ESTIVER NA ETAPA 2
  if (etapa === 'otp') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-10 px-6 shadow-xl sm:rounded-[2rem] border border-gray-100 text-center">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <MessageSquare size={36} />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">Verifique seu WhatsApp</h2>
            <p className="text-gray-500 mb-8 font-medium">
              Enviamos um código de 6 dígitos para o número <br/><strong className="text-gray-900">{telefone}</strong>
            </p>

            <form onSubmit={handleFinalizarCadastro}>
              <input 
                type="text" 
                maxLength={6}
                value={codigoOTP}
                onChange={e => setCodigoOTP(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full text-center text-3xl tracking-[0.5em] font-black px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none transition mb-6"
              />
              
              <button 
                type="submit" 
                disabled={loading || codigoOTP.length !== 6} 
                className="w-full flex justify-center py-4 rounded-xl shadow-lg text-lg font-bold text-white transition-all transform hover:-translate-y-0.5 bg-primary hover:bg-primary-dark disabled:bg-gray-300 disabled:transform-none"
              >
                {loading ? <Loader2 className="animate-spin" size={24} /> : "Confirmar e Criar Conta"}
              </button>
            </form>
            
            <button onClick={() => setEtapa('dados')} className="mt-6 text-sm font-bold text-gray-500 hover:text-primary transition">
              Voltar e editar número
            </button>
          </div>
        </div>
      </div>
    );
  }

  // RENDERIZA O FORMULÁRIO NORMAL (ETAPA 1)
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        <h2 className="mt-6 text-center text-3xl font-black text-primary tracking-tight">Crie sua conta</h2>
        <p className="mt-2 text-center text-sm text-gray-600 font-medium">Venda rápido, compre seguro.</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="bg-white py-8 px-4 shadow-sm sm:rounded-[2rem] sm:px-10 border border-gray-100">
          
          <div className="bg-blue-50 text-blue-800 p-4 rounded-xl flex gap-3 text-sm mb-8 border border-blue-100">
             <Shield className="shrink-0 mt-0.5 text-blue-500" size={20} />
             <p><strong>Segurança LGPD:</strong> Seus dados pessoais como CPF, nome completo e endereço exato são estritamente confidenciais e nunca serão exibidos publicamente.</p>
          </div>

          <form onSubmit={handleAvancarOTP} className="space-y-8">
            
            {/* SESSÃO 1: DADOS PESSOAIS */}
            <div>
              <h3 className="text-lg font-black text-gray-900 border-b border-gray-100 pb-2 mb-4">Dados Pessoais (Privado)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Nome Completo</label>
                  <input required type="text" value={nomeCompleto} onChange={e => setNomeCompleto(e.target.value)} className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-primary outline-none transition" placeholder="Nome igual ao documento" />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Tipo de Conta</label>
                  <select value={tipoConta} onChange={e => {setTipoConta(e.target.value); setDocumento('');}} className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-primary outline-none transition cursor-pointer">
                    <option value="Fisica">Pessoa Física (CPF)</option>
                    <option value="Juridica">Pessoa Jurídica (CNPJ)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">{tipoConta === 'Fisica' ? 'CPF' : 'CNPJ'}</label>
                  <input required type="text" value={documento} onChange={handleDocumentoChange} className={`w-full px-4 py-3 border rounded-xl focus:ring-2 outline-none transition ${isDocError ? 'border-red-500 bg-red-50 focus:ring-red-200' : 'border-gray-200 bg-gray-50 focus:ring-primary'}`} placeholder={tipoConta === 'Fisica' ? '000.000.000-00' : '00.000.000/0000-00'} />
                  {isDocError && <p className="text-red-500 text-xs font-bold mt-1 flex items-center gap-1"><AlertCircle size={12}/> Documento inválido.</p>}
                  {isCpfCnpjValid && documento.length > 0 && <p className="text-green-600 text-xs font-bold mt-1 flex items-center gap-1"><CheckCircle size={12}/> Válido.</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Gênero</label>
                  <select required value={genero} onChange={e => setGenero(e.target.value)} className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-primary outline-none transition cursor-pointer">
                    <option value="">Selecione...</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Feminino">Feminino</option>
                    <option value="Outro">Outro</option>
                    <option value="Prefiro não dizer">Prefiro não dizer</option>
                  </select>
                </div>
              </div>
            </div>

            {/* SESSÃO 2: ENDEREÇO */}
            <div>
              <h3 className="text-lg font-black text-gray-900 border-b border-gray-100 pb-2 mb-4">Seu Endereço (Privado)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">CEP</label>
                  <input required type="text" value={cep} onChange={handleCepChange} className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-primary outline-none transition" placeholder="00000-000" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Rua / Logradouro</label>
                  <input required type="text" value={rua} onChange={e => setRua(e.target.value)} className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-primary outline-none transition" placeholder="Sua rua" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Número</label>
                  <input required type="text" value={numero} onChange={e => setNumero(e.target.value)} className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-primary outline-none transition" placeholder="Ex: 123" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Bairro</label>
                  <input required type="text" value={bairro} onChange={e => setBairro(e.target.value)} className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-primary outline-none transition" placeholder="Seu bairro" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Cidade - UF</label>
                  <input readOnly required type="text" value={cidade ? `${cidade} - ${estado}` : ''} className="w-full px-4 py-3 border border-gray-200 bg-gray-100 text-gray-500 rounded-xl outline-none cursor-not-allowed" placeholder="Preenchido pelo CEP" />
                </div>
              </div>
            </div>

            {/* SESSÃO 3: PERFIL PÚBLICO */}
            <div className="bg-primary/5 p-4 md:p-6 rounded-2xl border border-primary/10">
              <h3 className="text-lg font-black text-primary border-b border-primary/10 pb-2 mb-4 flex items-center gap-2"><Eye size={20}/> Perfil Público (Visível para todos)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Como quer ser chamado?</label>
                  <input required type="text" value={apelido} onChange={e => setApelido(e.target.value)} className="w-full px-4 py-3 border border-gray-200 bg-white rounded-xl focus:ring-2 focus:ring-primary outline-none transition" placeholder="Nome ou nome da loja" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">WhatsApp para vendas</label>
                  <input required type="text" value={telefone} onChange={handleTelefoneChange} className="w-full px-4 py-3 border border-gray-200 bg-white rounded-xl focus:ring-2 focus:ring-primary outline-none transition" placeholder="(86) 99999-9999" />
                </div>
              </div>
            </div>

            {/* SESSÃO 4: ACESSO */}
            <div>
              <h3 className="text-lg font-black text-gray-900 border-b border-gray-100 pb-2 mb-4">Dados de Acesso</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">E-mail</label>
                  <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className={`w-full px-4 py-3 border rounded-xl focus:ring-2 outline-none transition ${isEmailDescartavel ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-gray-50'}`} placeholder="seu@email.com" />
                  {isEmailDescartavel && <p className="text-red-500 text-xs font-bold mt-1">E-mails temporários não são permitidos.</p>}
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Senha</label>
                  <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-primary outline-none transition" placeholder="Mínimo de 6 caracteres" minLength={6} />
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading || !isFormValid} 
              className={`w-full flex justify-center py-4 px-4 rounded-xl shadow-lg text-lg font-bold text-white transition-all transform hover:-translate-y-0.5 mt-8 
                ${isFormValid ? 'bg-primary hover:bg-primary-dark cursor-pointer' : 'bg-gray-300 cursor-not-allowed'}`}
            >
              {loading ? <Loader2 className="animate-spin" size={24} /> : "Finalizar Cadastro"}
            </button>
            {!isFormValid && (
              <p className="text-center text-sm text-red-500 font-bold mt-2">
                Preencha todos os campos corretamente para habilitar o botão.
              </p>
            )}
          </form>

          <div className="mt-8 text-center text-sm text-gray-600 border-t border-gray-100 pt-6">
            Já tem uma conta? <Link href="/login" className="font-black text-accent hover:text-accent-dark transition">Faça Login</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CadastroPage() {
  return (
    <GoogleReCaptchaProvider reCaptchaKey="6LdqR3osAAAAAPGrmZb8Nf0NtwEXmwa7EnCMhVLY">
      <CadastroForm />
    </GoogleReCaptchaProvider>
  )
}