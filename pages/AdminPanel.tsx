
import React, { useState, useEffect, useMemo } from 'react';
import { User } from '../types';
import { 
  Users, Search, ShieldCheck, 
  UserX, UserPlus, X, Save, 
  CheckCircle2, Pencil, AlertTriangle,
  Ban, ShieldAlert, CheckCircle, Loader2, Lock, Unlock,
  Mail, Phone, CreditCard
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AdminPanelProps {
  users: User[];
  onUpdateUsers: (users: User[]) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ users, onUpdateUsers }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error' | 'warning'} | null>(null);
  const [currentAdminId, setCurrentAdminId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: '',
    cpfCnpj: '',
    password: '',
    isAdmin: false
  });

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setCurrentAdminId(session?.user?.id || null);
    };
    fetchSession();
  }, []);

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

  const handleToggleAtivo = async (user: User) => {
    if (user.id === currentAdminId) {
       setNotification({ message: 'Você não pode bloquear sua própria conta admin.', type: 'warning' });
       setTimeout(() => setNotification(null), 3000);
       return;
    }
    try {
      // CORREÇÃO: Sincronização explícita de campos de bloqueio no banco e no estado
      const isCurrentlyBlocked = user.isBlocked === true || user.ativo === false;
      const newIsBlocked = !isCurrentlyBlocked;
      const newAtivo = isCurrentlyBlocked;
      
      const { error } = await supabase.from('profiles').update({ 
        ativo: newAtivo,
        is_blocked: newIsBlocked
      }).eq('id', user.id);
      
      if (error) throw error;
      
      onUpdateUsers(users.map(u => u.id === user.id ? { ...u, ativo: newAtivo, isBlocked: newIsBlocked } : u));
      setNotification({ 
        message: `Usuário ${newAtivo ? 'Desbloqueado' : 'Bloqueado'} com sucesso!`, 
        type: 'success' 
      });
    } catch (err) {
      setNotification({ message: 'Erro ao alterar status de bloqueio.', type: 'error' });
    }
    setTimeout(() => setNotification(null), 3000);
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === currentAdminId) {
       alert("Você não pode excluir sua própria conta enquanto estiver logado.");
       return;
    }
    if (!window.confirm('CUIDADO: Isso removerá permanentemente o usuário e todos os seus dados. Continuar?')) return;
    setIsLoading(true);
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', userId);
      if (error) throw error;
      onUpdateUsers(users.filter(u => u.id !== userId));
      setNotification({ message: 'Usuário removido.', type: 'success' });
    } catch (err) {
      setNotification({ message: 'Erro ao excluir usuário.', type: 'error' });
    } finally {
      setIsLoading(false);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleSubmitUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (editingUser) {
        const payload: any = { 
          name: formData.name, 
          email: formData.email, 
          whatsapp: formData.whatsapp,
          cpf_cnpj: formData.cpfCnpj,
          is_admin: formData.isAdmin 
        };
        if (formData.password) {
          payload.password_hash = await hashPassword(formData.password);
        }
        const { error } = await supabase.from('profiles').update(payload).eq('id', editingUser.id);
        if (error) throw error;
        
        onUpdateUsers(users.map(u => u.id === editingUser.id ? { ...u, ...formData } : u));
        setNotification({ message: 'Perfil atualizado!', type: 'success' });
        setIsModalOpen(false);
      } else {
        if (!formData.password) {
          setNotification({ message: 'Senha obrigatória para novos usuários.', type: 'warning' });
          setIsLoading(false);
          return;
        }

        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.name,
              whatsapp: formData.whatsapp,
              cpf_cnpj: formData.cpfCnpj
            }
          }
        });

        if (signUpError) throw signUpError;

        if (signUpData.user) {
          await supabase.from('profiles').update({
            is_admin: formData.isAdmin,
            whatsapp: formData.whatsapp,
            cpf_cnpj: formData.cpfCnpj,
            name: formData.name,
            ativo: true,
            is_blocked: false
          }).eq('id', signUpData.user.id);
          
          setNotification({ message: 'Usuário cadastrado!', type: 'success' });
          setIsModalOpen(false);
          onUpdateUsers([{
            id: signUpData.user.id,
            name: formData.name,
            email: formData.email,
            isAdmin: formData.isAdmin,
            avatar: 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
            ativo: true,
            isBlocked: false
          }, ...users]);
        }
      }
    } catch (err: any) {
      setNotification({ message: err.message || 'Erro ao processar.', type: 'error' });
    } finally {
      setIsLoading(false);
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const filteredUsers = users.filter(user => 
    (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (user.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in relative">
      {notification && (
        <div className="fixed bottom-8 right-8 z-[200]">
          <div className={`px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border ${notification.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
            <span className="text-sm font-bold">{notification.message}</span>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ShieldCheck className="text-indigo-600" /> Painel de Controle Admin
          </h2>
          <p className="text-slate-500 text-sm">Gestão total de acessos e permissões</p>
        </div>
        <div className="flex gap-3">
           <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
             <input type="text" placeholder="Filtrar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm" />
           </div>
           <button onClick={() => { setEditingUser(null); setFormData({name:'', email:'', whatsapp:'', cpfCnpj:'', password:'', isAdmin:false}); setIsModalOpen(true); }} className="bg-indigo-600 text-white px-5 py-2 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all flex items-center gap-2">
             <UserPlus size={18} /> Novo Usuário
           </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase font-black">
                <th className="p-4">Identificação</th>
                <th className="p-4">CPF / CNPJ</th>
                <th className="p-4 text-center">Nível</th>
                <th className="p-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((user) => (
                <tr key={user.id} className={`${user.ativo === false || user.isBlocked ? 'bg-red-50/50' : ''}`}>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img src={user.avatar} className="w-10 h-10 rounded-full border border-slate-200" alt="" />
                      <div>
                        <p className="text-sm font-bold text-slate-800">{user.name}</p>
                        <p className="text-[10px] text-slate-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-sm font-mono text-slate-600">{user.cpfCnpj || '—'}</td>
                  <td className="p-4 text-center">
                    {user.isAdmin ? (
                      <span className="bg-slate-900 text-white px-2 py-0.5 rounded text-[9px] font-black uppercase">Admin</span>
                    ) : (
                      <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-[9px] font-black uppercase">Cliente</span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                       <button onClick={() => handleToggleAtivo(user)} className={`p-2 rounded-lg ${user.ativo === false || user.isBlocked ? 'text-red-600 bg-red-100' : 'text-slate-400 hover:text-emerald-600'}`} title="Bloquear/Desbloquear">
                         {user.ativo === false || user.isBlocked ? <Lock size={18} /> : <Unlock size={18} />}
                       </button>
                       <button onClick={() => { setEditingUser(user); setFormData({name: user.name, email:user.email, whatsapp:user.whatsapp||'', cpfCnpj:user.cpfCnpj||'', password:'', isAdmin:!!user.isAdmin}); setIsModalOpen(true); }} className="p-2 text-slate-400 hover:text-indigo-600"><Pencil size={18}/></button>
                       <button onClick={() => handleDeleteUser(user.id)} className="p-2 text-slate-400 hover:text-red-600"><UserX size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">{editingUser ? 'Editar Perfil' : 'Novo Cadastro'}</h3>
              <button onClick={() => setIsModalOpen(false)}><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmitUser} className="p-8 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400">Nome</label>
                  <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400">E-mail</label>
                  <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400">CPF/CNPJ</label>
                  <input value={formData.cpfCnpj} onChange={e => setFormData({...formData, cpfCnpj: maskCpfCnpj(e.target.value)})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400">WhatsApp</label>
                  <input value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400">{editingUser ? 'Nova Senha (Opcional)' : 'Senha'}</label>
                <input type="password" required={!editingUser} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
              </div>
              <div className="p-4 bg-slate-900 rounded-2xl flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase">Acesso Administrador</span>
                <input type="checkbox" className="w-5 h-5 accent-indigo-500" checked={formData.isAdmin} onChange={e => setFormData({...formData, isAdmin: e.target.checked})} />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                 <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 text-slate-400 font-bold uppercase text-[10px]">Cancelar</button>
                 <button type="submit" disabled={isLoading} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase flex items-center gap-2">
                    {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Salvar
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
