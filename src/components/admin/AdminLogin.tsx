'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useApp } from '@/lib/store/AppContext';
import { UserRole } from '@/lib/types';
import {
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  ShieldCheck,
  AlertCircle,
  User,
  Phone,
  Crown,
  Lock,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export function AdminLogin() {
  const { login, signup, resetPassword, users, storeSettings, setActiveView } = useApp();

  // Mode: LOGIN, SIGNUP, atau FORGOT_PASSWORD
  const [authMode, setAuthMode] = useState<'LOGIN' | 'SIGNUP' | 'FORGOT_PASSWORD'>('LOGIN');

  // Login Form States
  const [identifier, setIdentifier] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(false);

  // Signup Form States
  const [signupName, setSignupName] = useState<string>('');
  const [signupEmail, setSignupEmail] = useState<string>('');
  const [signupUsername, setSignupUsername] = useState<string>('');
  const [signupPassword, setSignupPassword] = useState<string>('');
  const [signupRole, setSignupRole] = useState<UserRole>('OWNER');
  const [signupPhone, setSignupPhone] = useState<string>('');
  const [showSignupPassword, setShowSignupPassword] = useState<boolean>(false);

  // Forgot Password & OTP States
  const [resetEmail, setResetEmail] = useState<string>('');
  const [resetOtp, setResetOtp] = useState<string>('');
  const [generatedOtp, setGeneratedOtp] = useState<string>('');
  const [isOtpSent, setIsOtpSent] = useState<boolean>(false);
  const [newPassword, setNewPassword] = useState<string>('');
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [otpNotice, setOtpNotice] = useState<string | null>(null);

  // Status & Feedback
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    setTimeout(() => {
      const res = login(identifier, password, rememberMe);
      setIsLoading(false);
      if (!res.success) {
        setErrorMessage(res.message || 'ID Pengguna / Email atau Kata Sandi salah');
      }
    }, 350);
  };

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    setTimeout(() => {
      const res = signup({
        name: signupName,
        email: signupEmail,
        username: signupUsername,
        password: signupPassword,
        role: signupRole,
        phone: signupPhone,
      });
      setIsLoading(false);

      if (!res.success) {
        setErrorMessage(res.message || 'Pendaftaran gagal');
      } else {
        setSuccessMessage('Pendaftaran berhasil! Mengalihkan ke dashboard...');
      }
    }, 400);
  };

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    const cleanMail = resetEmail.trim().toLowerCase();
    if (!cleanMail) {
      setErrorMessage('Harap masukkan email atau username terdaftar');
      return;
    }
    const found = users.find(
      (u) => (u.email && u.email.toLowerCase() === cleanMail) || u.username.toLowerCase() === cleanMail
    );
    if (!found) {
      setErrorMessage('Akun dengan email / username tersebut tidak ditemukan di perangkat ini.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const code = String(Math.floor(100000 + Math.random() * 900000));
      setGeneratedOtp(code);
      setIsOtpSent(true);
      setIsLoading(false);
      setOtpNotice(`Kode OTP Verifikasi dikirim ke ${found.email || found.username}: ${code}`);
    }, 500);
  };

  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (resetOtp.trim() !== generatedOtp.trim()) {
      setErrorMessage('Kode OTP verifikasi salah');
      return;
    }

    if (newPassword.length < 4) {
      setErrorMessage('Kata sandi baru minimal 4 karakter');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const res = resetPassword(resetEmail, newPassword);
      setIsLoading(false);
      if (res.success) {
        setSuccessMessage('Kata sandi berhasil diperbarui! Silakan masuk dengan kata sandi baru.');
        setAuthMode('LOGIN');
        setPassword('');
        setIsOtpSent(false);
        setResetOtp('');
        setOtpNotice(null);
      } else {
        setErrorMessage(res.message || 'Gagal memperbarui kata sandi');
      }
    }, 400);
  };

  return (
    <div className="min-h-screen bg-tofu-silkblaze flex items-center justify-center p-3 sm:p-6 lg:p-10 relative overflow-hidden selection:bg-spicy-light selection:text-spicy-ember">
      {/* Decorative Organic Ambient Glow Orbs in Background */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-matcha-leaf/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-spicy-ember/10 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-64 h-64 rounded-full bg-yolk-blaze/10 blur-2xl pointer-events-none" />

      {/* Main Two-Column Card Container */}
      <div className="w-full max-w-4xl bg-white rounded-3xl sm:rounded-[32px] shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12 border border-stone-200/80 relative z-10 animate-fadeIn my-4">
        
        {/* ================= LEFT COLUMN: FORM ================= */}
        <div className="md:col-span-7 p-5 sm:p-8 lg:p-10 flex flex-col justify-between">
          <div>
            {/* Header & Mode Switch Tabs */}
            <div className="text-center mb-6">
              <span className="text-[10px] font-black uppercase tracking-wider text-spicy-ember bg-spicy-light px-3 py-1 rounded-full inline-block">
                Portal Resmi Bubur Khalid
              </span>

              {/* Mode Toggle Pills (Masuk vs Daftar) */}
              <div className="mt-4 p-1 bg-stone-100 rounded-2xl flex items-center gap-1 max-w-xs mx-auto border border-stone-200">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('LOGIN');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className={`flex-1 py-2 text-xs font-black rounded-xl transition flex items-center justify-center space-x-1.5 ${
                    authMode === 'LOGIN'
                      ? 'bg-matcha-leaf text-white shadow-sm'
                      : 'text-stone-500 hover:text-matcha-leaf'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>MASUK</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('SIGNUP');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className={`flex-1 py-2 text-xs font-black rounded-xl transition flex items-center justify-center space-x-1.5 ${
                    authMode === 'SIGNUP'
                      ? 'bg-spicy-ember text-white shadow-sm'
                      : 'text-stone-500 hover:text-spicy-ember'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>DAFTAR BARU</span>
                </button>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-matcha-leaf mt-3 tracking-tight">
                {authMode === 'LOGIN' ? 'Masuk ke Portal Operasional' : 'Daftar Akun Baru (Owner / Staf)'}
              </h2>
              <p className="text-xs text-stone-500 font-medium mt-1">
                {authMode === 'LOGIN'
                  ? 'Gunakan email pribadi atau username yang telah Anda daftarkan'
                  : 'Daftar dengan email pribadi Anda untuk mendapatkan akses dashboard'}
              </p>
            </div>

            {/* Notification / Warning if system has no users yet */}
            {users.length === 0 && authMode === 'LOGIN' && (
              <div className="mb-5 p-3.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl text-xs flex items-start space-x-2.5">
                <Sparkles className="w-4 h-4 text-yolk-blaze flex-shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong className="block font-bold">Data Pengguna Masih Kosong:</strong>
                  Semua dummy user telah dibersihkan. Silakan klik tombol{' '}
                  <button
                    type="button"
                    onClick={() => setAuthMode('SIGNUP')}
                    className="font-black text-spicy-ember underline underline-offset-2 hover:text-spicy-hover"
                  >
                    DAFTAR BARU
                  </button>{' '}
                  di atas untuk membuat akun pertama Anda sebagai <strong>Owner</strong>.
                </div>
              </div>
            )}

            {/* Error Notification */}
            {errorMessage && (
              <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-center space-x-2.5 text-xs font-semibold animate-shake">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Success Notification */}
            {successMessage && (
              <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center space-x-2.5 text-xs font-semibold animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* ================= MODE 1: LOGIN ================= */}
            {authMode === 'LOGIN' && (
              <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                {/* Field: User ID / Email */}
                <div>
                  <label className="block text-xs font-bold text-matcha-leaf mb-1">
                    Email Pribadi atau Username
                  </label>
                  <div className="relative flex items-center bg-stone-50 border border-stone-200 rounded-2xl focus-within:border-matcha-leaf focus-within:bg-white focus-within:ring-2 focus-within:ring-matcha-leaf/10 transition shadow-2xs">
                    <div className="pl-4 pr-3 py-3 text-stone-400 border-r border-stone-200/80 flex items-center justify-center">
                      <Mail className="w-4 h-4 text-matcha-leaf" />
                    </div>
                    <input
                      type="text"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="Contoh: fauzi@gmail.com atau fauzi"
                      className="w-full bg-transparent py-3 px-3.5 text-xs sm:text-sm font-semibold text-stone-800 placeholder:text-stone-400 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Field: Password */}
                <div>
                  <label className="block text-xs font-bold text-matcha-leaf mb-1">
                    Kata Sandi
                  </label>
                  <div className="relative flex items-center bg-stone-50 border border-stone-200 rounded-2xl focus-within:border-matcha-leaf focus-within:bg-white focus-within:ring-2 focus-within:ring-matcha-leaf/10 transition shadow-2xs">
                    <div className="pl-4 pr-3 py-3 text-stone-400 border-r border-stone-200/80 flex items-center justify-center">
                      <KeyRound className="w-4 h-4 text-spicy-ember" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan kata sandi akun Anda"
                      className="w-full bg-transparent py-3 px-3.5 text-xs sm:text-sm font-semibold text-stone-800 placeholder:text-stone-400 focus:outline-none"
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

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center space-x-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-stone-300 text-matcha-leaf focus:ring-matcha-leaf cursor-pointer accent-matcha-leaf"
                    />
                    <span className="font-semibold text-stone-600">Ingat sesi di browser ini</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('FORGOT_PASSWORD');
                      setErrorMessage(null);
                      setSuccessMessage(null);
                      setResetEmail(identifier);
                    }}
                    className="font-bold text-spicy-ember hover:underline cursor-pointer"
                  >
                    Lupa Sandi?
                  </button>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-3 bg-matcha-leaf hover:bg-matcha-surface text-tofu-silkblaze font-black text-sm py-3.5 rounded-2xl shadow-lg transition flex items-center justify-center space-x-2 active:scale-[0.98] disabled:opacity-75 disabled:cursor-not-allowed"
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
            )}

            {/* ================= MODE 2: SIGNUP ================= */}
            {authMode === 'SIGNUP' && (
              <form onSubmit={handleSignupSubmit} className="space-y-3">
                {/* Field: Full Name */}
                <div>
                  <label className="block text-xs font-bold text-matcha-leaf mb-1">
                    Nama Lengkap
                  </label>
                  <div className="relative flex items-center bg-stone-50 border border-stone-200 rounded-2xl focus-within:border-spicy-ember focus-within:bg-white focus-within:ring-2 focus-within:ring-spicy-ember/10 transition shadow-2xs">
                    <div className="pl-4 pr-3 py-2.5 text-stone-400 border-r border-stone-200/80 flex items-center justify-center">
                      <User className="w-4 h-4 text-matcha-leaf" />
                    </div>
                    <input
                      type="text"
                      required
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      placeholder="Contoh: Khalid Fauzi"
                      className="w-full bg-transparent py-2.5 px-3 text-xs sm:text-sm font-semibold text-stone-800 placeholder:text-stone-400 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Field: Email Pribadi */}
                <div>
                  <label className="block text-xs font-bold text-matcha-leaf mb-1">
                    Email Pribadi (Untuk Login & Keamanan)
                  </label>
                  <div className="relative flex items-center bg-stone-50 border border-stone-200 rounded-2xl focus-within:border-spicy-ember focus-within:bg-white focus-within:ring-2 focus-within:ring-spicy-ember/10 transition shadow-2xs">
                    <div className="pl-4 pr-3 py-2.5 text-stone-400 border-r border-stone-200/80 flex items-center justify-center">
                      <Mail className="w-4 h-4 text-spicy-ember" />
                    </div>
                    <input
                      type="email"
                      required
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      placeholder="Contoh: emailanda@gmail.com"
                      className="w-full bg-transparent py-2.5 px-3 text-xs sm:text-sm font-semibold text-stone-800 placeholder:text-stone-400 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Row: Username & Role */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-matcha-leaf mb-1">
                      Username Unik
                    </label>
                    <div className="relative flex items-center bg-stone-50 border border-stone-200 rounded-2xl focus-within:border-spicy-ember focus-within:bg-white transition">
                      <input
                        type="text"
                        required
                        value={signupUsername}
                        onChange={(e) => setSignupUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                        placeholder="Contoh: fauzi_owner"
                        className="w-full bg-transparent py-2.5 px-3.5 text-xs sm:text-sm font-semibold text-stone-800 placeholder:text-stone-400 focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-matcha-leaf mb-1">
                      Peran / Hak Akses
                    </label>
                    <div className="relative flex items-center bg-stone-50 border border-stone-200 rounded-2xl focus-within:border-spicy-ember focus-within:bg-white transition">
                      <select
                        value={signupRole}
                        onChange={(e) => setSignupRole(e.target.value as UserRole)}
                        className="w-full bg-transparent py-2.5 px-3 text-xs font-bold text-stone-800 focus:outline-none cursor-pointer"
                      >
                        <option value="OWNER">👑 Owner (Akses Penuh Finansial)</option>
                        <option value="ADMIN">🛡️ Admin (Operasional & Menu)</option>
                        <option value="CASHIER">🏪 Kasir (POS Kasir Tablet)</option>
                        <option value="KITCHEN_STAFF">🍳 Dapur (Kitchen Display)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Field: Password */}
                <div>
                  <label className="block text-xs font-bold text-matcha-leaf mb-1">
                    Kata Sandi Akun
                  </label>
                  <div className="relative flex items-center bg-stone-50 border border-stone-200 rounded-2xl focus-within:border-spicy-ember focus-within:bg-white focus-within:ring-2 focus-within:ring-spicy-ember/10 transition shadow-2xs">
                    <div className="pl-4 pr-3 py-2.5 text-stone-400 border-r border-stone-200/80 flex items-center justify-center">
                      <KeyRound className="w-4 h-4 text-yolk-blaze" />
                    </div>
                    <input
                      type={showSignupPassword ? 'text' : 'password'}
                      required
                      minLength={4}
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="Minimal 4 karakter"
                      className="w-full bg-transparent py-2.5 px-3 text-xs sm:text-sm font-semibold text-stone-800 placeholder:text-stone-400 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupPassword(!showSignupPassword)}
                      className="pr-4 pl-2 text-stone-400 hover:text-spicy-ember transition"
                      title={showSignupPassword ? 'Sembunyikan' : 'Tampilkan'}
                    >
                      {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Field: WhatsApp / Phone (Optional) */}
                <div>
                  <label className="block text-xs font-bold text-matcha-leaf mb-1">
                    Nomor WhatsApp / HP (Opsional)
                  </label>
                  <div className="relative flex items-center bg-stone-50 border border-stone-200 rounded-2xl focus-within:border-spicy-ember focus-within:bg-white transition">
                    <div className="pl-4 pr-3 py-2 text-stone-400 border-r border-stone-200/80 flex items-center justify-center">
                      <Phone className="w-3.5 h-3.5 text-matcha-leaf" />
                    </div>
                    <input
                      type="tel"
                      value={signupPhone}
                      onChange={(e) => setSignupPhone(e.target.value)}
                      placeholder="0812xxxxxxx"
                      className="w-full bg-transparent py-2 px-3 text-xs font-semibold text-stone-800 placeholder:text-stone-400 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-3 bg-spicy-ember hover:bg-spicy-hover text-white font-black text-sm py-3.5 rounded-2xl shadow-lg transition flex items-center justify-center space-x-2 active:scale-[0.98] disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 text-yolk-blaze" />
                      <span>DAFTAR & MASUK KE DASHBOARD</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* ================= MODE 3: FORGOT PASSWORD (OTP VERIFICATION) ================= */}
            {authMode === 'FORGOT_PASSWORD' && (
              <div className="space-y-4">
                {/* OTP Dispatched Info Banner */}
                {otpNotice && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-start space-x-2.5 animate-fadeIn">
                    <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-bold">Simulasi Email Terkirim:</strong>
                      <span>{otpNotice}</span>
                    </div>
                  </div>
                )}

                {!isOtpSent ? (
                  /* Step 1: Input Email & Request OTP */
                  <form onSubmit={handleSendOtp} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-bold text-matcha-leaf mb-1">
                        Masukkan Email atau Username Akun Anda
                      </label>
                      <div className="relative flex items-center bg-stone-50 border border-stone-200 rounded-2xl focus-within:border-spicy-ember focus-within:bg-white transition shadow-2xs">
                        <div className="pl-4 pr-3 py-3 text-stone-400 border-r border-stone-200/80 flex items-center justify-center">
                          <Mail className="w-4 h-4 text-spicy-ember" />
                        </div>
                        <input
                          type="text"
                          required
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          placeholder="Contoh: ami_khalid atau email@anda.com"
                          className="w-full bg-transparent py-3 px-3.5 text-xs sm:text-sm font-semibold text-stone-800 placeholder:text-stone-400 focus:outline-none"
                        />
                      </div>
                      <p className="text-[11px] text-stone-500 mt-1">
                        Sistem akan mengirimkan 6-digit kode OTP verifikasi untuk mengatur ulang kata sandi Anda.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-spicy-ember hover:bg-spicy-hover text-white font-black text-sm py-3.5 rounded-2xl shadow-lg transition flex items-center justify-center space-x-2 active:scale-[0.98] disabled:opacity-75"
                    >
                      {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <KeyRound className="w-4 h-4 text-yolk-blaze" />
                          <span>KIRIM KODE OTP KE EMAIL</span>
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  /* Step 2: Input OTP & New Password */
                  <form onSubmit={handleResetPasswordSubmit} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-bold text-matcha-leaf mb-1">
                        Masukkan 6-Digit Kode OTP
                      </label>
                      <div className="relative flex items-center bg-stone-50 border border-stone-200 rounded-2xl focus-within:border-spicy-ember focus-within:bg-white transition shadow-2xs">
                        <input
                          type="text"
                          required
                          maxLength={6}
                          value={resetOtp}
                          onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, ''))}
                          placeholder="6 digit angka OTP"
                          className="w-full bg-transparent py-3 px-4 text-base font-black text-center text-matcha-leaf tracking-widest placeholder:text-stone-400 focus:outline-none font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-matcha-leaf mb-1">
                        Kata Sandi Baru
                      </label>
                      <div className="relative flex items-center bg-stone-50 border border-stone-200 rounded-2xl focus-within:border-spicy-ember focus-within:bg-white transition shadow-2xs">
                        <div className="pl-4 pr-3 py-3 text-stone-400 border-r border-stone-200/80 flex items-center justify-center">
                          <Lock className="w-4 h-4 text-spicy-ember" />
                        </div>
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          required
                          minLength={4}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Minimal 4 karakter"
                          className="w-full bg-transparent py-3 px-3.5 text-xs sm:text-sm font-semibold text-stone-800 placeholder:text-stone-400 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="pr-4 pl-2 text-stone-400 hover:text-spicy-ember transition"
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-matcha-leaf hover:bg-matcha-surface text-white font-black text-sm py-3.5 rounded-2xl shadow-lg transition flex items-center justify-center space-x-2 active:scale-[0.98] disabled:opacity-75"
                    >
                      {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-yolk-blaze" />
                          <span>SIMPAN & RESET KATA SANDI</span>
                        </>
                      )}
                    </button>
                  </form>
                )}

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('LOGIN');
                      setErrorMessage(null);
                      setSuccessMessage(null);
                      setIsOtpSent(false);
                      setOtpNotice(null);
                    }}
                    className="text-xs font-bold text-stone-500 hover:text-matcha-leaf transition inline-flex items-center space-x-1"
                  >
                    <span>← Kembali ke Halaman Masuk</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer Navigation */}
          <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between text-xs">
            <span className="text-stone-400 font-medium">Bubur Khalid © 2026</span>
            <button
              type="button"
              onClick={() => setActiveView('customer')}
              className="text-xs font-bold text-stone-600 hover:text-spicy-ember transition inline-flex items-center space-x-1"
            >
              <span>Lihat Tampilan Web Pelanggan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ================= RIGHT COLUMN: BRAND BANNER ================= */}
        <div className="md:col-span-5 bg-gradient-to-br from-matcha-leaf via-[#02311c] to-[#011c10] text-tofu-silkblaze p-6 sm:p-8 lg:p-10 flex flex-col justify-between relative overflow-hidden">
          {/* Decorative Waves Overlay */}
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
            <div className="w-20 h-20 rounded-full bg-white p-1.5 shadow-2xl border-4 border-white/20 mx-auto relative overflow-hidden">
              <Image
                src={storeSettings.storeLogo || '/images/logo/bubur-khalid-logo.png'}
                alt="Logo Bubur Khalid"
                fill
                className="object-cover p-1"
                priority
              />
            </div>
            <h3 className="text-base font-black text-white mt-2.5 tracking-wide">
              {storeSettings.storeName}
            </h3>
            <span className="text-[10px] text-noodle-cream/90 font-medium tracking-wider uppercase">
              Asli Minang • Sejak 2026
            </span>
          </div>

          {/* Middle: Info & Mode Switch Suggestion */}
          <div className="relative z-10 text-center my-6 space-y-3">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase leading-tight">
              {authMode === 'LOGIN' ? 'SELAMAT DATANG!' : 'GABUNG TIM KAMI!'}
            </h1>
            <p className="text-xs text-noodle-cream/90 font-normal leading-relaxed">
              {authMode === 'LOGIN'
                ? 'Portal Terpadu Bubur Khalid: POS Kasir Touchscreen, Kitchen Display Antrean FIFO, Manajemen Menu, dan Finansial.'
                : 'Buat akun dengan email pribadi untuk mengelola restoran, pantau keuangan, dan kelola operasional kasir serta dapur.'}
            </p>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setAuthMode(authMode === 'LOGIN' ? 'SIGNUP' : 'LOGIN');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs font-black transition border border-white/20 active:scale-95"
              >
                {authMode === 'LOGIN' ? (
                  <>
                    <span>Belum punya akun? Buat Baru</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                ) : (
                  <>
                    <span>Sudah punya akun? Masuk Disini</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Bottom Security Highlights */}
          <div className="relative z-10 space-y-2 bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/15 text-[11px]">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-yolk-blaze flex-shrink-0" />
              <span>Multi-level Role (Owner, Admin, Kasir, Dapur)</span>
            </div>
            <div className="flex items-center space-x-2">
              <Lock className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Penyimpanan Aman & Audit Log Operasional</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
