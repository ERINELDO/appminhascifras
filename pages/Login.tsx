import React, { useState } from 'react';
import { Lock, Mail, UserPlus, ArrowLeft, Loader2, CheckCircle2, ShieldAlert, Eye, EyeOff, User, Phone, CreditCard } from 'lucide-react';
import { supabase } from '../lib/supabase';

type AuthStep = 'login' | 'register' | 'forgot';

interface LoginProps {
  onLogin?: (isAdmin: boolean) => void;
  logoUrl?: string;
}

export const Login: React.FC<LoginProps> = ({ onLogin, logoUrl }) => {
  const [step, setStep] = useState<AuthStep>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [cpf, setCpf] = useState(''); 
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const maskWhatsApp = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  };

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email || !password) {
      setError("Preencha todos os campos.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin, is_blocked, ativo')
        .eq('id', data.user.id)
        .single();

      if (profileError) throw new Error("Falha ao validar conta.");

      if (profile.is_blocked === true || profile.ativo === false) {
        await supabase.auth.signOut();
        setError("Usuário está bloqueado, favor entre em contato com o Suporte");
        setIsLoading(false);
        return;
      }

      if (onLogin) onLogin(!!profile?.is_admin);
    } catch (err: any) {
      console.error("Erro de login:", err);
      setError(err.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });

      if (resetError) throw resetError;

      setSuccess("Link enviado! Verifique seu e-mail.");
      setTimeout(() => setStep('login'), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!name || !email || !password || !whatsapp || !cpf) {
      setError("Preencha todos os campos obrigatórios.");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não conferem.");
      return;
    }

    const cleanCpf = cpf.replace(/\D/g, '');
    if (cleanCpf.length < 11) {
      setError("CPF inválido. Insira os 11 dígitos.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            whatsapp: whatsapp,
            cpf_cnpj: cleanCpf 
          }
        }
      });

      if (signUpError) throw signUpError;

      setSuccess("Conta criada! Verifique seu e-mail para confirmar.");
      setTimeout(() => setStep('login'), 4000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-[#0a0e1a] via-[#0f1623] to-[#1a2332] relative overflow-hidden">
      {/* Background decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-600/5 rounded-full blur-3xl"></div>
      </div>

      {/* Container principal */}
      <div className="w-full max-w-md relative z-10">
        {/* Card principal */}
        <div className="bg-[#1a2332]/80 backdrop-blur-xl rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-8 lg:p-10 border border-white/10 shadow-2xl">
          
          {/* Logo */}
          <div className="flex justify-center mb-8 sm:mb-10">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-600/20 blur-2xl rounded-full"></div>
              <img 
                src={logoUrl || "https://assets.zyrosite.com/hm2grEdqKPVfr2SF/logo-meu-gestor-nQzVNZHWJRGH0cP7.png"} 
                alt="Meu Gestor" 
                className="h-24 sm:h-28 lg:h-32 w-auto object-contain relative z-10 drop-shadow-2xl"
              />
            </div>
          </div>

          {/* Mensagens de erro/sucesso */}
          {error && (
            <div className="mb-5 sm:mb-6 p-3.5 sm:p-4 bg-red-500/10 backdrop-blur-sm border border-red-500/30 rounded-xl sm:rounded-2xl flex items-start gap-2.5 sm:gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-red-400 text-xs sm:text-sm font-medium leading-relaxed">{error}</p>
            </div>
          )}
          
          {success && (
            <div className="mb-5 sm:mb-6 p-3.5 sm:p-4 bg-emerald-500/10 backdrop-blur-sm border border-emerald-500/30 rounded-xl sm:rounded-2xl flex items-center gap-2.5 sm:gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 shrink-0" />
              <p className="text-emerald-400 text-xs sm:text-sm font-medium">{success}</p>
            </div>
          )}

          {/* Formulário de Login */}
          {step === 'login' && (
            <div className="space-y-4 sm:space-y-5">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-transparent rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity blur-xl"></div>
                <Mail className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 sm:w-5 sm:h-5 z-10 group-focus-within:text-blue-400 transition-colors" />
                <input 
                  type="email"
                  required
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  className="relative w-full pl-11 sm:pl-12 pr-3.5 sm:pr-4 py-3.5 sm:py-4 bg-[#0f1623]/50 border border-slate-700/50 rounded-xl sm:rounded-2xl outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all text-white text-sm sm:text-base placeholder:text-slate-500"
                  placeholder="E-mail" 
                />
              </div>

              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-transparent rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity blur-xl"></div>
                <Lock className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 sm:w-5 sm:h-5 z-10 group-focus-within:text-blue-400 transition-colors" />
                <input 
                  type={showPassword ? "text" : "password"}
                  required
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  className="relative w-full pl-11 sm:pl-12 pr-11 sm:pr-12 py-3.5 sm:py-4 bg-[#0f1623]/50 border border-slate-700/50 rounded-xl sm:rounded-2xl outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all text-white text-sm sm:text-base placeholder:text-slate-500"
                  placeholder="Senha" 
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 sm:right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors z-10"
                >
                  {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                </button>
              </div>

              <div className="flex justify-end">
                <button 
                  type="button"
                  onClick={() => setStep('forgot')} 
                  className="text-xs sm:text-sm text-slate-400 hover:text-blue-400 transition-colors font-medium"
                >
                  Esqueci minha senha
                </button>
              </div>

              <button 
                onClick={handleLogin}
                disabled={isLoading} 
                className="w-full py-3.5 sm:py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl sm:rounded-2xl font-bold uppercase text-xs sm:text-sm tracking-wider transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-blue-900/30 hover:shadow-xl hover:shadow-blue-900/40 hover:scale-[1.02] active:scale-[0.98]"
              >
                {isLoading ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : 'ENTRAR NO SISTEMA'}
              </button>

              <div className="relative my-6 sm:my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-700/50"></div>
                </div>
                <div className="relative flex justify-center text-xs sm:text-sm">
                  <span className="px-3 sm:px-4 bg-[#1a2332] text-slate-400 font-medium">ou</span>
                </div>
              </div>

              <button 
                type="button"
                onClick={() => setStep('register')} 
                className="w-full py-3.5 sm:py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl sm:rounded-2xl font-bold uppercase text-xs sm:text-sm tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 hover:shadow-xl hover:shadow-emerald-900/40 hover:scale-[1.02] active:scale-[0.98]"
              >
                <UserPlus className="w-4 h-4 sm:w-5 sm:h-5"/> CRIAR NOVA CONTA
              </button>
            </div>
          )}

          {/* Formulário de Recuperação de Senha */}
          {step === 'forgot' && (
            <div className="space-y-4 sm:space-y-5">
              <div className="p-3.5 sm:p-4 bg-blue-500/10 backdrop-blur-sm border border-blue-500/30 rounded-xl sm:rounded-2xl">
                <p className="text-xs sm:text-sm text-blue-400 font-medium text-center leading-relaxed">
                  Informe seu e-mail para receber as instruções de recuperação.
                </p>
              </div>
              
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-transparent rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity blur-xl"></div>
                <Mail className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 sm:w-5 sm:h-5 z-10 group-focus-within:text-blue-400 transition-colors" />
                <input 
                  type="email"
                  required
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  className="relative w-full pl-11 sm:pl-12 pr-3.5 sm:pr-4 py-3.5 sm:py-4 bg-[#0f1623]/50 border border-slate-700/50 rounded-xl sm:rounded-2xl outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all text-white text-sm sm:text-base placeholder:text-slate-500"
                  placeholder="E-mail para recuperação" 
                />
              </div>
              
              <button 
                onClick={handleResetPassword}
                disabled={isLoading} 
                className="w-full py-3.5 sm:py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl sm:rounded-2xl font-bold uppercase text-xs sm:text-sm tracking-wider transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-blue-900/30 hover:shadow-xl hover:shadow-blue-900/40 hover:scale-[1.02] active:scale-[0.98]"
              >
                {isLoading ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : 'ENVIAR LINK'}
              </button>
              
              <button 
                type="button"
                onClick={() => setStep('login')} 
                className="w-full py-2 text-slate-400 hover:text-white text-xs sm:text-sm font-semibold uppercase flex items-center justify-center gap-2 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4"/> VOLTAR
              </button>
            </div>
          )}

          {/* Formulário de Registro */}
          {step === 'register' && (
            <div className="space-y-3.5 sm:space-y-4">
              <div className="relative group">
                <User className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 sm:w-5 sm:h-5 z-10 group-focus-within:text-blue-400 transition-colors" />
                <input 
                  required
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  className="relative w-full pl-11 sm:pl-12 pr-3.5 sm:pr-4 py-3.5 sm:py-4 bg-[#0f1623]/50 border border-slate-700/50 rounded-xl sm:rounded-2xl outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all text-white text-sm sm:text-base placeholder:text-slate-500"
                  placeholder="Nome Completo" 
                />
              </div>
              
              <div className="relative group">
                <Mail className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 sm:w-5 sm:h-5 z-10 group-focus-within:text-blue-400 transition-colors" />
                <input 
                  type="email"
                  required
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  className="relative w-full pl-11 sm:pl-12 pr-3.5 sm:pr-4 py-3.5 sm:py-4 bg-[#0f1623]/50 border border-slate-700/50 rounded-xl sm:rounded-2xl outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all text-white text-sm sm:text-base placeholder:text-slate-500"
                  placeholder="E-mail" 
                />
              </div>

              <div className="relative group">
                <Phone className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 sm:w-5 sm:h-5 z-10 group-focus-within:text-blue-400 transition-colors" />
                <input 
                  required
                  value={whatsapp} 
                  onChange={e => setWhatsapp(maskWhatsApp(e.target.value))} 
                  className="relative w-full pl-11 sm:pl-12 pr-3.5 sm:pr-4 py-3.5 sm:py-4 bg-[#0f1623]/50 border border-slate-700/50 rounded-xl sm:rounded-2xl outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all text-white text-sm sm:text-base placeholder:text-slate-500"
                  placeholder="WhatsApp (00) 00000-0000" 
                />
              </div>

              <div className="relative group">
                <CreditCard className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 sm:w-5 sm:h-5 z-10 group-focus-within:text-blue-400 transition-colors" />
                <input 
                  required
                  type="text"
                  value={cpf} 
                  onChange={e => setCpf(e.target.value.replace(/\D/g, ''))} 
                  maxLength={11}
                  className="relative w-full pl-11 sm:pl-12 pr-3.5 sm:pr-4 py-3.5 sm:py-4 bg-[#0f1623]/50 border border-slate-700/50 rounded-xl sm:rounded-2xl outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all text-white font-mono text-sm sm:text-base placeholder:text-slate-500"
                  placeholder="CPF (Somente números)" 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                <div className="relative group">
                  <Lock className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5 sm:w-4 sm:h-4 z-10 group-focus-within:text-blue-400 transition-colors" />
                  <input 
                    type={showPassword ? "text" : "password"}
                    required
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    className="relative w-full pl-9 sm:pl-10 pr-2.5 sm:pr-3 py-3.5 sm:py-4 bg-[#0f1623]/50 border border-slate-700/50 rounded-xl sm:rounded-2xl text-xs sm:text-sm outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all text-white placeholder:text-slate-500"
                    placeholder="Senha" 
                  />
                </div>
                <div className="relative group">
                  <Lock className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5 sm:w-4 sm:h-4 z-10 group-focus-within:text-blue-400 transition-colors" />
                  <input 
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword} 
                    onChange={e => setConfirmPassword(e.target.value)} 
                    className="relative w-full pl-9 sm:pl-10 pr-2.5 sm:pr-3 py-3.5 sm:py-4 bg-[#0f1623]/50 border border-slate-700/50 rounded-xl sm:rounded-2xl text-xs sm:text-sm outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all text-white placeholder:text-slate-500"
                    placeholder="Confirmar" 
                  />
                </div>
              </div>

              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-xs sm:text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 font-medium"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                {showPassword ? 'Ocultar senhas' : 'Mostrar senhas'}
              </button>

              <button 
                onClick={handleRegister}
                disabled={isLoading} 
                className="w-full py-3.5 sm:py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl sm:rounded-2xl font-bold uppercase text-xs sm:text-sm tracking-wider transition-all disabled:opacity-50 shadow-lg shadow-blue-900/30 hover:shadow-xl hover:shadow-blue-900/40 hover:scale-[1.02] active:scale-[0.98]"
              >
                {isLoading ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin mx-auto" /> : 'CRIAR CONTA'}
              </button>
              
              <button 
                type="button"
                onClick={() => setStep('login')} 
                className="w-full py-2 text-slate-400 hover:text-white text-xs sm:text-sm font-semibold uppercase flex items-center justify-center gap-2 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4"/> JÁ TENHO CONTA
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 sm:mt-8 text-center">
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            © 2024 Meu Gestor. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}