import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Heart, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { UserRole } from '../types';
import { validateLogin } from '../utils/communicationLogic';

interface LoginViewProps {
  onLoginSuccess: (role: UserRole) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('Ayah');
  const [password, setPassword] = useState('112233');
  const [error, setError] = useState('');

  const isAbdullah = selectedRole === 'Abdullah';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateLogin(selectedRole, password)) {
      setError('كلمة المرور غير صحيحة. كلمة المرور المشتركة هي 112233');
      return;
    }
    setError('');
    onLoginSuccess(selectedRole);
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen w-full bg-[#0B0F19] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0B0F19] to-[#070A12] text-slate-100 flex flex-col justify-between px-4 py-8 md:px-12"
    >
      {/* Top Bar */}
      <header className="max-w-6xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-1.5 sm:gap-4 border-b border-slate-800/80 pb-4 text-center sm:text-right">
        <div className="flex items-center gap-2.5">
          <Heart className="w-5 h-5 text-pink-500 fill-pink-500 shrink-0" />
          <span className="font-display text-base sm:text-lg font-bold text-white sm:whitespace-nowrap sm:shrink-0">
            ميثاق المودة — عبدالله وآية
          </span>
        </div>
        <span className="text-xs text-slate-400 sm:whitespace-nowrap sm:shrink-0">
          مساحة خاصة لتوثيق التواصل اليومي وبناء الألفة
        </span>
      </header>

      {/* Main Login Card */}
      <main className="max-w-xl w-full mx-auto my-auto py-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className={`bg-white border-2 rounded-3xl p-6 md:p-8 shadow-2xl shadow-black/40 transition-colors text-slate-900 ${
            isAbdullah ? 'border-blue-500/40' : 'border-pink-500/40'
          }`}
        >
          <div className="text-center mb-8">
            <h1 className="font-display text-2xl md:text-3xl font-extrabold text-slate-900 mb-2">
              تسجيل الدخول إلى مساحتكما
            </h1>
            <p className="text-sm text-slate-600">
              اختر هويتك لتخصيص ألوان الواجهة ومتابعة سجل التواصل اليومي المشترك
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Selector */}
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-3">
                ١. اختر الحساب الشخصي:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Abdullah Card (Blue) */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole('Abdullah');
                    setError('');
                  }}
                  aria-label="اختيار حساب الزوج عبدالله"
                  className={`flex flex-col items-start p-4 rounded-2xl border-2 text-right transition-all cursor-pointer ${
                    isAbdullah
                      ? 'border-blue-600 bg-blue-50/90 ring-2 ring-blue-500/20'
                      : 'border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/40'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-2.5">
                    <span className="w-10 h-10 rounded-full bg-blue-600 text-white font-display font-bold flex items-center justify-center text-base shadow-md shadow-blue-600/25">
                      ع
                    </span>
                    {isAbdullah && (
                      <CheckCircle2 className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                  <span className="font-display font-bold text-base text-slate-900">
                    عبدالله (Abdullah)
                  </span>
                  <span className="text-xs font-semibold text-blue-600 mt-1">
                    الزوج · الثيم الأزرق الملكي 💙
                  </span>
                </button>

                {/* Ayah Card (Pink) */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole('Ayah');
                    setError('');
                  }}
                  aria-label="اختيار حساب الزوجة آية"
                  className={`flex flex-col items-start p-4 rounded-2xl border-2 text-right transition-all cursor-pointer ${
                    !isAbdullah
                      ? 'border-pink-500 bg-pink-50/90 ring-2 ring-pink-500/20'
                      : 'border-slate-200 bg-slate-50 hover:border-pink-300 hover:bg-pink-50/40'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-2.5">
                    <span className="w-10 h-10 rounded-full bg-pink-500 text-white font-display font-bold flex items-center justify-center text-base shadow-md shadow-pink-500/25">
                      آ
                    </span>
                    {!isAbdullah && (
                      <CheckCircle2 className="w-5 h-5 text-pink-600" />
                    )}
                  </div>
                  <span className="font-display font-bold text-base text-slate-900">
                    آية (Ayah)
                  </span>
                  <span className="text-xs font-semibold text-pink-600 mt-1">
                    الزوجة · الثيم الوردي المضيء 🩷
                  </span>
                </button>
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label
                htmlFor="couple-password"
                className="block text-sm font-bold text-slate-800 mb-2"
              >
                ٢. كلمة المرور المشتركة:
              </label>
              <div className="relative">
                <input
                  id="couple-password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="أدخل كلمة المرور المشتركة (112233)"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 font-mono text-base focus:outline-none focus:border-slate-500 focus:bg-white transition-colors"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              </div>
              <p className="text-xs text-slate-500 mt-1.5">
                كلمة المرور المبدئية الموحدة للزوجين:{' '}
                <span className="font-mono font-bold text-slate-800 tabular-nums">
                  112233
                </span>
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className={`w-full py-3.5 px-6 rounded-xl font-display font-bold text-white text-base transition-all cursor-pointer shadow-lg ${
                isAbdullah
                  ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/25'
                  : 'bg-pink-500 hover:bg-pink-400 shadow-pink-500/25'
              }`}
            >
              {isAbdullah
                ? 'دخول باسم عبدالله 💙'
                : 'دخول باسم الملكة آية 🩷'}
            </button>
          </form>
        </motion.div>
      </main>

      <footer className="max-w-6xl w-full mx-auto text-center text-xs text-slate-500 pt-4 border-t border-slate-800/80">
        ميثاق المودة الزوجية · تواصل واعي، مصادقة متبادلة، ومودة تدوم
      </footer>
    </div>
  );
};
