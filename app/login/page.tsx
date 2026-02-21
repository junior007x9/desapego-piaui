"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase"; 
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword 
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState(""); // Apenas para registo
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setLoading(true);

    try {
      if (isLogin) {
        // Fazer Login
        await signInWithEmailAndPassword(auth, email, password);
        router.push("/"); // Redireciona para a página principal após o login
      } else {
        // Fazer Registo
        if (!nome.trim()) {
          setErro("Por favor, introduza o seu nome.");
          setLoading(false);
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Guardar os dados adicionais do utilizador no Firestore
        await setDoc(doc(db, "users", user.uid), {
          nome: nome,
          email: email,
          criadoEm: new Date().toISOString(),
        });

        router.push("/");
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Erro de autenticação:", error);
      // Personalizar mensagens de erro comuns do Firebase
      if (error.code === 'auth/email-already-in-use') {
        setErro("Este email já está registado.");
      } else if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        setErro("Email ou palavra-passe incorretos.");
      } else if (error.code === 'auth/weak-password') {
        setErro("A palavra-passe deve ter pelo menos 6 caracteres.");
      } else {
        setErro("Ocorreu um erro. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {isLogin ? "Entre na sua conta" : "Crie uma nova conta"}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {isLogin ? "Ou " : "Já tem conta? "}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setErro("");
            }}
            className="font-medium text-purple-600 hover:text-purple-500 transition-colors"
          >
            {isLogin ? "registe-se agora" : "faça login aqui"}
          </button>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleAuth}>
            
            {/* Campo Nome (Apenas visível no Registo) */}
            {!isLogin && (
              <div>
                <label htmlFor="nome" className="block text-sm font-medium text-gray-700">
                  Nome Completo
                </label>
                <div className="mt-1">
                  <input
                    id="nome"
                    name="nome"
                    type="text"
                    required={!isLogin}
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                    placeholder="João Silva"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Endereço de Email
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                  placeholder="exemplo@email.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Palavra-passe
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
            </div>

            {erro && (
              <div className="text-red-500 text-sm bg-red-50 p-3 rounded-md border border-red-200">
                {erro}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 transition-colors"
              >
                {loading ? "A processar..." : (isLogin ? "Entrar" : "Registar")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}