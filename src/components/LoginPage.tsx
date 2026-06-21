import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';
import { User } from '../types';

interface LoginPageProps {
  users: User[];
  onLogin: (user: User) => void;
}

export default function LoginPage({ users, onLogin }: LoginPageProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      const user = users.find(u => u.email === email.trim().toLowerCase());
      if (!user) {
        setError('Nenhuma conta encontrada com este e-mail.');
        setLoading(false);
        return;
      }
      if (user.passwordHash && user.passwordHash !== password) {
        setError('Senha incorreta.');
        setLoading(false);
        return;
      }
      onLogin(user);
      setLoading(false);
    }, 600);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: document.documentElement.getAttribute('data-color') === 'cyan'
          ? 'radial-gradient(ellipse at 50% 0%, #083344 0%, #0c0a09 60%)'
          : 'radial-gradient(ellipse at 50% 0%, #1c0303 0%, #0c0a09 60%)'
      }}
    >
      {/* Subtle grid pattern */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[400px] relative z-10"
      >
        {/* Logo Area */}
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 accent-bg rounded-xl items-center justify-center mb-4 shadow-lg">
            <span className="text-white font-black text-xl italic tracking-tight">M</span>
          </div>
          <h1 className="text-2xl font-display font-black text-white tracking-tight">
            Mach Control
          </h1>
          <p className="text-sm text-stone-400 mt-1 font-sans">
            Sistema de Gestão de Projetos
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-stone-900/80 backdrop-blur-xl border border-stone-800 rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center gap-2 mb-6">
            <Lock className="w-4 h-4 accent-text" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Acessar
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="mach-label">E-mail</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="mach-input"
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <label className="mach-label">Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mach-input pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mach-button-primary w-full py-3 text-sm font-bold tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Entrar
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-stone-800">
            <p className="text-xs text-stone-500 text-center">
              Novo por aqui?{' '}
              <button
                onClick={() => navigate('/setup')}
                className="accent-text font-bold hover:underline cursor-pointer"
              >
                Criar conta e configurar equipe
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-stone-600 mt-6 font-mono uppercase tracking-wider">
          Mach Control • Gestão F1 in Schools
        </p>
      </motion.div>
    </div>
  );
}
