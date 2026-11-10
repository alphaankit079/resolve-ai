import React, { useState } from 'react';
import api from '../api';
import { Zap, Sun, Moon, AlertCircle, Check, ShieldCheck, Cpu, Activity, Lock, Eye, EyeOff, Sparkles } from 'lucide-react';

export default function AuthPage({ darkMode, setDarkMode, onLoginSuccess }) {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '', role: 'Customer', company: '' });
  const [authError, setAuthError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setLoading(true);
    try {
      const endpoint = isLoginMode ? '/auth/login' : '/auth/register';
      const res = await api.post(endpoint, authForm);
      onLoginSuccess(res.data.token, res.data.user);
    } catch (err) {
      setAuthError(err.response?.data?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCreds = (roleType) => {
    setIsLoginMode(true);
    if (roleType === 'Admin') {
      setAuthForm({ ...authForm, email: 'admin@resolveai.com', password: 'password123' });
    } else {
      setAuthForm({ ...authForm, email: 'customer@resolveai.com', password: 'password123' });
    }
  };

  return (
    <div className={`${darkMode ? 'bg-[#0B0D13] text-slate-100' : 'bg-[#F8FAFC] text-slate-900'} min-h-screen flex items-center justify-center p-4 font-sans transition-colors relative overflow-hidden`}>
      
      {/* CSS Keyframes for Floating Packets & Border-Walking Robot */}
      <style>{`
        @keyframes floatOrb1 {
          0%, 100% { transform: translateY(0px) translateX(0px) scale(1); }
          50% { transform: translateY(-40px) translateX(30px) scale(1.1); }
        }
        @keyframes floatOrb2 {
          0%, 100% { transform: translateY(0px) translateX(0px) scale(1); }
          50% { transform: translateY(50px) translateX(-40px) scale(1.15); }
        }

        @keyframes flowBottomToTop {
          0% { transform: translateY(105vh); opacity: 0; }
          10% { opacity: 0.8; }
          90% { opacity: 0.8; }
          100% { transform: translateY(-15vh); opacity: 0; }
        }

        @keyframes flowTopToBottom {
          0% { transform: translateY(-15vh); opacity: 0; }
          10% { opacity: 0.8; }
          90% { opacity: 0.8; }
          100% { transform: translateY(105vh); opacity: 0; }
        }

        @keyframes borderWalk {
          0% { top: -20px; left: -20px; }
          25% { top: -20px; left: calc(100% - 20px); }
          50% { top: calc(100% - 20px); left: calc(100% - 20px); }
          75% { top: calc(100% - 20px); left: -20px; }
          100% { top: -20px; left: -20px; }
        }
        @keyframes scanLight {
          0%, 100% { opacity: 0.3; transform: scaleX(0.8); }
          50% { opacity: 1; transform: scaleX(1.2); }
        }
        @keyframes legLeft {
          0%, 100% { transform: rotate(-30deg); }
          50% { transform: rotate(30deg); }
        }
        @keyframes legRight {
          0%, 100% { transform: rotate(30deg); }
          50% { transform: rotate(-30deg); }
        }

        .animate-orb-1 { animation: floatOrb1 12s ease-in-out infinite; }
        .animate-orb-2 { animation: floatOrb2 15s ease-in-out infinite; }
        
        .flow-up-1 { animation: flowBottomToTop 16s linear infinite -2s; }
        .flow-up-2 { animation: flowBottomToTop 19s linear infinite -7s; }
        .flow-up-3 { animation: flowBottomToTop 15s linear infinite -4s; }
        .flow-up-4 { animation: flowBottomToTop 18s linear infinite -10s; }
        .flow-up-5 { animation: flowBottomToTop 17s linear infinite -1s; }

        .flow-down-1 { animation: flowTopToBottom 17s linear infinite -5s; }
        .flow-down-2 { animation: flowTopToBottom 15s linear infinite -2s; }
        .flow-down-3 { animation: flowTopToBottom 18s linear infinite -9s; }
        .flow-down-4 { animation: flowTopToBottom 16s linear infinite -12s; }
        .flow-down-5 { animation: flowTopToBottom 20s linear infinite -6s; }

        .bot-walker {
          position: absolute;
          animation: borderWalk 16s linear infinite;
        }
        .animate-scan { animation: scanLight 1.5s ease-in-out infinite; }
        .animate-leg-left { animation: legLeft 0.25s ease-in-out infinite alternate; }
        .animate-leg-right { animation: legRight 0.25s ease-in-out infinite alternate; }
      `}</style>

      {/* BACKGROUND FLOATING PACKETS */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-10 left-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-[110px] animate-orb-1"></div>
        <div className="absolute bottom-10 right-10 w-120 h-120 bg-violet-500/10 rounded-full blur-[130px] animate-orb-2"></div>

        <div className="absolute bottom-0 left-[8%] px-3 py-1.5 rounded-lg bg-[#12151E]/90 border border-indigo-500/25 backdrop-blur-md text-[10px] font-mono text-indigo-300 flow-up-1">
          ⚡ 📦 DATA_PACKET #8824
        </div>
        <div className="absolute bottom-0 left-[26%] px-3 py-1.5 rounded-lg bg-[#12151E]/90 border border-violet-500/25 backdrop-blur-md text-[10px] font-mono text-violet-300 flow-up-2">
          🤖 AI_TRIAGE_SYNC
        </div>
        <div className="absolute bottom-0 left-[44%] px-3 py-1.5 rounded-lg bg-[#12151E]/90 border border-emerald-500/25 backdrop-blur-md text-[10px] font-mono text-emerald-300 flow-up-3">
          📊 METRICS_OK
        </div>
        <div className="absolute bottom-0 left-[62%] px-3 py-1.5 rounded-lg bg-[#12151E]/90 border border-indigo-500/25 backdrop-blur-md text-[10px] font-mono text-indigo-200 flow-up-4">
          ⚙️ WORKFLOW_AUTO
        </div>
        <div className="absolute bottom-0 left-[80%] px-3 py-1.5 rounded-lg bg-[#12151E]/90 border border-sky-500/25 backdrop-blur-md text-[10px] font-mono text-sky-300 flow-up-5">
          🚀 NODE_ACTIVE
        </div>

        <div className="absolute top-0 left-[16%] px-3 py-1.5 rounded-lg bg-[#12151E]/90 border border-indigo-500/25 backdrop-blur-md text-[10px] font-mono text-indigo-300 flow-down-1">
          🔒 JWT_TOKEN_SECURE
        </div>
        <div className="absolute top-0 left-[34%] px-3 py-1.5 rounded-lg bg-[#12151E]/90 border border-violet-500/25 backdrop-blur-md text-[10px] font-mono text-violet-300 flow-down-2">
          🌐 SOCKET_IO_LIVE
        </div>
        <div className="absolute top-0 left-[52%] px-3 py-1.5 rounded-lg bg-[#12151E]/90 border border-amber-500/25 backdrop-blur-md text-[10px] font-mono text-amber-300 flow-down-3">
          ⚡ SLA_TRACKER
        </div>
        <div className="absolute top-0 left-[70%] px-3 py-1.5 rounded-lg bg-[#12151E]/90 border border-indigo-500/25 backdrop-blur-md text-[10px] font-mono text-indigo-200 flow-down-4">
          🛡️ AUTH_SESSION
        </div>
        <div className="absolute top-0 left-[88%] px-3 py-1.5 rounded-lg bg-[#12151E]/90 border border-violet-500/25 backdrop-blur-md text-[10px] font-mono text-violet-200 flow-down-5">
          🔍 AI_ANALYTICS
        </div>
      </div>

      {/* Theme Toggle Button */}
      <div className="fixed top-6 right-6 z-30">
        <button 
          onClick={() => setDarkMode(!darkMode)} 
          className={`px-3.5 py-2 rounded-lg border text-xs font-semibold flex items-center gap-2 cursor-pointer backdrop-blur-xl transition-all ${darkMode ? 'bg-[#12151E] border-white/10 text-amber-400 hover:border-indigo-500/40' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />} {darkMode ? 'Light' : 'Dark'}
        </button>
      </div>

      {/* MAIN CONTAINER WRAPPER */}
      <div className="relative w-full max-w-5xl z-20">
        
        {/* 🤖 SCI-FI AI ROBOT ON BORDER */}
        <div className="bot-walker z-30 flex flex-col items-center pointer-events-none filter drop-shadow-[0_0_10px_#6366f1]">
          <div className="w-0.5 h-3 bg-indigo-400 relative">
            <div className="absolute -top-1.5 -left-1 w-2.5 h-2.5 bg-indigo-300 rounded-full shadow-[0_0_8px_#818cf8] animate-ping"></div>
          </div>
          <div className="w-7 h-5 bg-[#0B0D13] border border-indigo-400 rounded-md relative flex items-center justify-center shadow-md">
            <div className="w-5 h-1.5 bg-indigo-400 rounded-sm animate-scan shadow-[0_0_6px_#818cf8]"></div>
          </div>
          <div className="w-1.5 h-1 bg-slate-700"></div>
          <div className="w-8 h-6 bg-linear-to-b from-indigo-500 to-violet-700 rounded-md relative flex flex-col items-center justify-center shadow-lg border border-indigo-400/50">
            <div className="w-2.5 h-2.5 bg-white rounded-full shadow-[0_0_8px_#ffffff] animate-pulse flex items-center justify-center">
              <div className="w-1 h-1 bg-indigo-500 rounded-full"></div>
            </div>
          </div>
          <div className="flex gap-1.5 -mt-0.5">
            <div className="w-1.5 h-4 bg-indigo-400 rounded-b-sm animate-leg-left origin-top shadow-sm"></div>
            <div className="w-1.5 h-4 bg-indigo-400 rounded-b-sm animate-leg-right origin-top shadow-sm"></div>
          </div>
        </div>

        <div className={`w-full grid grid-cols-1 lg:grid-cols-12 rounded-2xl border ${darkMode ? 'border-indigo-500/30 bg-[#12151E]/95' : 'border-slate-200 bg-white'} shadow-2xl overflow-hidden backdrop-blur-2xl transition-all duration-300 relative`}>
          
          {/* Left Showcase Panel */}
          <div className={`lg:col-span-5 p-10 flex flex-col justify-between relative overflow-hidden ${darkMode ? 'bg-[#0B0D13]/90 border-r border-white/[0.07]' : 'bg-slate-900 text-white'}`}>
            <div className="absolute inset-0 bg-linear-to-b from-indigo-500/5 via-transparent to-violet-500/10 pointer-events-none"></div>
            
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-[11px] font-semibold mb-6">
                <Cpu className="w-3.5 h-3.5" /> AI-Powered Ticketing Core
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight text-white">
                Resolve<span className="text-indigo-400">AI</span>
              </h2>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Enterprise-grade AI-powered ticketing platform designed for instant triage, real-time collaboration, and flawless customer support.
              </p>
            </div>

            <div className="relative z-10 space-y-3 my-8">
              <div className="p-3.5 rounded-xl border border-white/[0.07] bg-[#12151E]/90 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-100">Automated Sentiment & Priority Triage</p>
                  <p className="text-[10px] text-slate-400">Instant sentiment calculation</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-white/[0.07] bg-[#12151E]/90 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-violet-500/15 border border-violet-500/30 text-violet-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-100">Real-time Multi-agent Workspace & Notes</p>
                  <p className="text-[10px] text-slate-400">Live collaboration</p>
                </div>
              </div>
            </div>

            <div className="relative z-10 bg-indigo-500/10 border border-indigo-500/25 p-3.5 rounded-xl mb-2">
              <p className="text-[11px] font-semibold text-indigo-300 mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Quick Testing Fillers:
              </p>
              <div className="flex gap-2">
                <button type="button" onClick={() => fillDemoCreds('Admin')} className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 cursor-pointer transition">
                  Fill Admin
                </button>
                <button type="button" onClick={() => fillDemoCreds('Customer')} className="px-3 py-1.5 rounded-lg bg-[#12151E] border border-white/10 text-xs font-semibold text-slate-200 hover:bg-white/10 cursor-pointer transition">
                  Fill Customer
                </button>
              </div>
            </div>

            <div className="relative z-10 text-[11px] text-slate-400 flex items-center justify-between border-t border-white/[0.07] pt-4">
              <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-emerald-400" /> Secure Cloud Infrastructure</span>
              <span className="text-emerald-400 font-mono font-bold">256-bit SSL</span>
            </div>
          </div>

          {/* Right Form Panel */}
          <div className={`lg:col-span-7 p-10 flex flex-col justify-center ${darkMode ? 'bg-[#12151E]' : 'bg-white'}`}>
            <div className="max-w-md w-full mx-auto">
              
              <div className="mb-6">
                <h3 className="text-2xl font-bold tracking-tight">{isLoginMode ? 'Welcome back 👋' : 'Create an account 🚀'}</h3>
                <p className="text-xs text-slate-400 mt-1">{isLoginMode ? 'Please enter your credentials to access your workspace' : 'Get started with your enterprise support dashboard'}</p>
              </div>

              {/* Mode Switcher */}
              <div className={`grid grid-cols-2 p-1 rounded-xl mb-6 border ${darkMode ? 'bg-[#0B0D13] border-white/[0.07]' : 'bg-slate-100 border-slate-200'}`}>
                <button 
                  type="button" 
                  onClick={() => { setIsLoginMode(true); setAuthError(''); }} 
                  className={`py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${isLoginMode ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Sign In
                </button>
                <button 
                  type="button" 
                  onClick={() => { setIsLoginMode(false); setAuthError(''); }} 
                  className={`py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${!isLoginMode ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Create Account
                </button>
              </div>

              {authError && (
                <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" /> <span>{authError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLoginMode && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-slate-400 block mb-1">Full Name *</label>
                      <input required value={authForm.name} onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })} className={`w-full border rounded-lg px-3.5 py-2.5 text-xs focus:outline-none transition ${darkMode ? 'bg-[#0B0D13] border-white/10 text-white focus:border-indigo-500' : 'bg-slate-50 border-slate-300'}`} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-400 block mb-1">Company / Org</label>
                      <input value={authForm.company} onChange={(e) => setAuthForm({ ...authForm, company: e.target.value })} className={`w-full border rounded-lg px-3.5 py-2.5 text-xs focus:outline-none transition ${darkMode ? 'bg-[#0B0D13] border-white/10 text-white focus:border-indigo-500' : 'bg-slate-50 border-slate-300'}`} />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1">Work Email Address *</label>
                  <input required type="email" value={authForm.email} onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} className={`w-full border rounded-lg px-3.5 py-2.5 text-xs focus:outline-none transition ${darkMode ? 'bg-[#0B0D13] border-white/10 text-white focus:border-indigo-500' : 'bg-slate-50 border-slate-300'}`} />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1">Password *</label>
                  <div className="relative">
                    <input required type={showPassword ? 'text' : 'password'} value={authForm.password} onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} className={`w-full border rounded-lg px-3.5 py-2.5 pr-10 text-xs focus:outline-none transition ${darkMode ? 'bg-[#0B0D13] border-white/10 text-white focus:border-indigo-500' : 'bg-slate-50 border-slate-300'}`} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 cursor-pointer">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {!isLoginMode && (
                  <div>
                    <label className="text-xs font-medium text-slate-400 block mb-1.5">Account Role *</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { role: 'Customer', desc: 'Client' },
                        { role: 'Agent', desc: 'Support' },
                        { role: 'Admin', desc: 'Admin' }
                      ].map((item) => (
                        <button 
                          type="button" 
                          key={item.role} 
                          onClick={() => setAuthForm({ ...authForm, role: item.role })} 
                          className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${authForm.role === item.role ? 'border-indigo-500 bg-indigo-500/15' : darkMode ? 'border-white/10 bg-[#0B0D13]' : 'border-slate-200 bg-slate-50'}`}
                        >
                          <div className="text-xs font-bold flex justify-between">
                            <span>{item.role}</span>
                            {authForm.role === item.role && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">{item.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all cursor-pointer shadow-lg shadow-indigo-500/20 mt-2"
                >
                  {loading ? 'Please wait...' : isLoginMode ? 'Sign In to Workspace →' : `Create ${authForm.role} Account →`}
                </button>
              </form>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}