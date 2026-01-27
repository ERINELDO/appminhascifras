
import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';
import { X, Save, Lock, User as UserIcon, Mail, Camera, Phone, ShieldCheck, CreditCard } from 'lucide-react';

interface ProfileModalProps {
  user: User;
  onClose: () => void;
  onSave: (updatedUser: User) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ user, onClose, onSave }) => {
  const [formData, setFormData] = useState<User>(user);
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFormData(user);
  }, [user]);

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const maskCpfCnpj = (v: string) => {
    v = v.replace(/\D/g, "");
    if (v.length <= 11) {
      v = v.replace(/(\d{3})(\d)/, "$1.$2");
      v = v.replace(/(\d{3})(\d)/, "$1.$2");
      v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    } else {
      v = v.replace(/^(\d{2})(\d)/, "$1.$2");
      v = v.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
      v = v.replace(/\.(\d{3})(\d)/, ".$1/$2");
      v = v.replace(/(\d{4})(\d)/, "$1-$2");
    }
    return v;
  };

  const hashPassword = async (pwd: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(pwd);
    const hash = await window.crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const updatedUser: User = { ...formData };
    if (newPassword && showPasswordInput) {
      updatedUser.password_hash = await hashPassword(newPassword);
    }
    onSave(updatedUser);
    onClose();
  };

  const displayLicenseName = user.activeLicense?.name || user.licenseType || 'Gratuito';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-xl font-bold text-slate-800">Alterar Dados do Perfil</h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-200 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="flex flex-col items-center mb-6 relative">
              <div 
                className="relative group cursor-pointer" 
                onClick={handleFileClick}
                title="Clique para carregar uma nova foto"
              >
                <div className="relative">
                  <img 
                    src={formData.avatar} 
                    alt={formData.name} 
                    className="w-24 h-24 rounded-full border-4 border-emerald-100 object-cover shadow-sm transition-all group-hover:brightness-75"
                  />
                  <div className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-md flex items-center gap-1 border border-white uppercase tracking-tighter">
                    <ShieldCheck size={10} /> {displayLicenseName}
                  </div>
                </div>
                
                <div className="absolute inset-0 bg-black/20 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="text-white" size={24} />
                </div>
                
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>
              
              <div className="mt-4 text-center">
                <h4 className="text-lg font-black text-slate-800 uppercase italic tracking-tight">{formData.name}</h4>
                <p className="text-[10px] text-slate-400 mt-1 font-black uppercase tracking-[0.2em]">Clique na imagem para alterar</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Nome Completo</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input 
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">E-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input 
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">WhatsApp</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input 
                      type="text"
                      placeholder="(00) 00000-0000"
                      value={formData.whatsapp || ''}
                      onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">CPF ou CNPJ (Obrigatório para Assinaturas)</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input 
                    type="text"
                    required
                    placeholder="000.000.000-00"
                    value={formData.cpfCnpj || ''}
                    onChange={(e) => setFormData({...formData, cpfCnpj: maskCpfCnpj(e.target.value)})}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Segurança (Senha)</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input 
                      type="password"
                      disabled={!showPasswordInput}
                      value={showPasswordInput ? newPassword : '••••••••'}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder={showPasswordInput ? "Digite a nova senha" : ""}
                      className={`w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 outline-none transition-all ${showPasswordInput ? 'focus:ring-2 focus:ring-emerald-500 bg-white border-emerald-300' : 'bg-slate-100 text-slate-500'}`}
                    />
                  </div>
                  <button 
                    type="button"
                    onClick={() => {
                      setShowPasswordInput(!showPasswordInput);
                      if(showPasswordInput) setNewPassword('');
                    }}
                    className={`px-4 rounded-lg font-bold text-xs border transition-all uppercase tracking-tight ${showPasswordInput ? 'bg-slate-200 text-slate-600 border-slate-300' : 'bg-white text-emerald-600 border-emerald-200 hover:bg-emerald-50 shadow-sm'}`}
                  >
                    {showPasswordInput ? 'Cancelar' : 'Alterar Senha'}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <button 
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-lg border border-slate-300 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                className="px-6 py-2.5 rounded-lg bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 shadow-lg shadow-emerald-500/25 transition-all flex items-center gap-2"
              >
                <Save size={18} /> Salvar Alterações
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};
