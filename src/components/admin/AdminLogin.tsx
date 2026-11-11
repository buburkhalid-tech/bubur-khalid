'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useApp } from '@/lib/store/AppContext';
import {
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  LogIn,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Store,
  UserCheck,
  Lock,
} from 'lucide-react';

export function AdminLogin() {
  const { login, storeSettings, setActiveView } = useApp();

  const [identifier, setIdentifier] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showDemoHelp, setShowDemoHelp] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    setTimeout(() => {
      const res = login(identifier, password);
      setIsLoading(false);
      if (!res.success) {
        setErrorMessage(res.message || 'ID Pengguna atau Kata Sandi salah');
      }
    }, 350);
  };

  const handleQuickLogin = (quickId: string, quickPass: string) => {
    setIdentifier(quickId);
    setPassword(quickPass);
    setErrorMessage(null);
    setIsLoading(true);
    setTimeout(() => {
      login(quickId, quickPass);
      setIsLoading(false);
    }, 250);
  };

  return (
    <div className="min-h-screen bg-tofu-silkblaze flex items-center justify-center p-4 sm:p-6 lg:p-10 relative overflow-hidden selection:bg-spicy-light selection:text-spicy-ember">
      
      {/* Decorative Organic Ambient Glow Orbs in Background */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-matcha-leaf/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-spicy-ember/10 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-64 h-64 rounded-full bg-yolk-blaze/10 blur-2xl pointer-events-none" />

      {/* Main Two-Column Card Container (Inspired by Reference Design) */}
      <div className="w-full max-w-4xl bg-white rounded-[32px] shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12 border border-stone-200/80 relative z-10 animate-fadeIn">
        
        {/* ================= LEFT COLUMN: LOGIN FORM ================= */}
        <div className="md:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-between">
          
          <div>
            {/* Header / Brand */}
            <div className="text-center mb-8">
              <span className="text-[10px] font-black uppercase tracking-wider text-spicy-ember bg-spicy-light px-3 py-1 rounded-full inline-block">
                Portal Karyawan & Owner
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-matcha-leaf mt-2 tracking-tight">
                Masuk Admin Portal
              </h2>
              {/* Stylish accent underline */}
              <div className="h-1.5 w-16 bg-spicy-ember rounded-full mx-auto my-2.5" />
              <p className="text-xs sm:text-sm text-stone-500 font-medium">
                Silakan masukkan ID/Email dan kata sandi operasional Anda
              </p>
            </div>

            {/* Error Notification */}
            {errorMessage && (
              <div className="mb-6 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-center space-x-2.5 text-xs font-semibold animate-shake">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Field 1: User ID / Email */}
              <div>
                <label className="block text-xs font-bold text-matcha-leaf mb-1.5">
                  ID Pengguna atau Email
                </label>
                <div className="relative flex items-center bg-stone-50 border border-stone-200 rounded-2xl focus-within:border-matcha-leaf focus-within:bg-white focus-within:ring-2 focus-within:ring-matcha-leaf/10 transition shadow-2xs">
                  <div className="pl-4 pr-3 py-3.5 text-stone-400 border-r border-stone-200/80 flex items-center justify-center">
                    <Mail className="w-4 h-4 text-matcha-leaf" />
                  </div>
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Contoh: ahmad_admin atau admin"
                    className="w-full bg-transparent py-3.5 px-4 text-xs sm:text-sm font-semibold text-stone-800 placeholder:text-stone-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Field 2: Password / PIN */}
              <div>
                <label className="block text-xs font-bold text-matcha-leaf mb-1.5">
                  Kata Sandi atau PIN
                </label>
                <div className="relative flex items-center bg-stone-50 border border-stone-200 rounded-2xl focus-within:border-matcha-leaf focus-within:bg-white focus-within:ring-2 focus-within:ring-matcha-leaf/10 transition shadow-2xs">
                  <div className="pl-4 pr-3 py-3.5 text-stone-400 border-r border-stone-200/80 flex items-center justify-center">
                    <KeyRound className="w-4 h-4 text-spicy-ember" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Contoh: admin123 atau 112233"
                    className="w-full bg-transparent py-3.5 px-4 text-xs sm:text-sm font-semibold text-stone-800 placeholder:text-stone-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="pr-4 pl-2 text-stone-400 hover:text-matcha-leaf transition"
                    title={showPassword ? 'Sembunyikan' : 'Tampilkan'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Extra Row: Remember Me & Quick Help */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center space-x-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-stone-300 text-matcha-leaf focus:ring-matcha-leaf cursor-pointer accent-matcha-leaf"
                  />
                  <span className="font-semibold text-stone-600">Ingat saya</span>
                </label>

                <button
                  type="button"
                  onClick={() => setShowDemoHelp(!showDemoHelp)}
                  className="font-bold text-spicy-ember hover:text-spicy-hover transition underline decoration-dotted"
                >
                  {showDemoHelp ? 'Tutup Bantuan' : 'Bantuan Akun?'}
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-4 bg-matcha-leaf hover:bg-matcha-surface text-tofu-silkblaze font-black text-sm py-4 rounded-2xl shadow-lg transition flex items-center justify-center space-x-2 active:scale-[0.98] disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-4 h-4 text-yolk-blaze" />
                    <span>MASUK KE DASHBOARD</span>
                  </>
                )}
              </button>

            </form>
          </div>

          {/* Quick Demo Credentials Shortcut Pills */}
          <div className="mt-8 pt-6 border-t border-stone-100 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-stone-500 uppercase tracking-wider flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5 text-yolk-blaze" />
                <span>Masuk Cepat 1-Klik (Uji Coba):</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('ahmad_admin', 'admin123')}
                className="p-2.5 bg-stone-50 hover:bg-noodle-cream/60 border border-stone-200 rounded-xl text-left transition group"
              >
                <div className="text-[10px] font-black text-matcha-leaf flex items-center justify-between">
                  <span>🛡️ ADMIN</span>
                  <ArrowRight className="w-3 h-3 text-stone-400 group-hover:text-matcha-leaf transition transform group-hover:translate-x-0.5" />
                </div>
                <div className="text-[9px] text-stone-500 font-mono mt-0.5">admin / admin123</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('khalid_owner', '123456')}
                className="p-2.5 bg-stone-50 hover:bg-amber-50 border border-stone-200 rounded-xl text-left transition group"
              >
                <div className="text-[10px] font-black text-yolk-blaze flex items-center justify-between">
                  <span>👑 OWNER</span>
                  <ArrowRight className="w-3 h-3 text-stone-400 group-hover:text-yolk-blaze transition transform group-hover:translate-x-0.5" />
                </div>
                <div className="text-[9px] text-stone-500 font-mono mt-0.5">owner / 123456</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('siska_kasir', 'kasir123')}
                className="p-2.5 bg-stone-50 hover:bg-spicy-light/60 border border-stone-200 rounded-xl text-left transition group"
              >
                <div className="text-[10px] font-black text-spicy-ember flex items-center justify-between">
                  <span>🏪 KASIR</span>
                  <ArrowRight className="w-3 h-3 text-stone-400 group-hover:text-spicy-ember transition transform group-hover:translate-x-0.5" />
                </div>
                <div className="text-[9px] text-stone-500 font-mono mt-0.5">kasir / kasir123</div>
              </button>
            </div>

            {/* Back to Customer Web Link */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setActiveView('customer')}
                className="text-xs font-bold text-stone-500 hover:text-spicy-ember transition inline-flex items-center space-x-1"
              >
                <span>Lihat Tampilan Web Pelanggan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>

        {/* ================= RIGHT COLUMN: BRAND BANNER ================= */}
        <div className="md:col-span-5 bg-gradient-to-br from-matcha-leaf via-[#02311c] to-[#011c10] text-tofu-silkblaze p-8 sm:p-10 lg:p-12 flex flex-col justify-between relative overflow-hidden">
          
          {/* Decorative Waves Overlay (Inspired by Reference Graphic Design) */}
          <div className="absolute inset-0 pointer-events-none opacity-20">
            <svg className="w-full h-full object-cover" viewBox="0 0 500 500" preserveAspectRatio="none">
              <path d="M0,100 C150,200 350,0 500,100 L500,0 L0,0 Z" fill="#F9A11B" />
              <path d="M0,250 C200,150 300,350 500,250 L500,500 L0,500 Z" fill="#EE3F24" />
            </svg>
          </div>

          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-yolk-blaze/20 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-spicy-ember/20 blur-2xl pointer-events-none" />

          {/* Top Logo Badge */}
          <div className="relative z-10 text-center">
            <div className="w-24 h-24 rounded-full bg-white p-2 shadow-2xl border-4 border-white/20 mx-auto relative overflow-hidden">
              <Image
                src={storeSettings.storeLogo || '/images/logo/bubur-khalid-logo.png'}
                alt="Logo Bubur Khalid"
                fill
                className="object-cover p-1"
                priority
              />
            </div>
            <h3 className="text-base font-black text-white mt-3 tracking-wide">
              {storeSettings.storeName}
            </h3>
            <span className="text-[11px] text-noodle-cream/90 font-medium tracking-wider uppercase">
              Asli Minang • Sejak 2026
            </span>
          </div>

          {/* Middle: Welcome Message */}
          <div className="relative z-10 text-center my-8 space-y-3">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase leading-tight">
              WELCOME!
            </h1>
            <p className="text-xs sm:text-sm text-noodle-cream/90 font-normal leading-relaxed">
              Portal Operasional Terpadu: POS Kasir Touchscreen, Kitchen Display Antrean FIFO, Manajemen Menu, dan Finansial.
            </p>
          </div>

          {/* Bottom Security Highlights */}
          <div className="relative z-10 space-y-2 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 text-[11px]">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-yolk-blaze flex-shrink-0" />
              <span>Multi-level Role Access (Admin, Kasir, Owner)</span>
            </div>
            <div className="flex items-center space-x-2">
              <Lock className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Proteksi Finansial & Audit Log Real-Time</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
