import React from 'react';
import { Sparkles, Settings } from 'lucide-react';
import { loginWithGoogle, logoutUser } from '../../services/dbClient';
import { toast } from 'react-hot-toast';

export default function Header({ setShowSettings, t, user, authLoading }) {
  return (
    <header className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 lg:p-5 rounded-2xl shadow-sm border border-slate-100">
      <div className="flex items-center gap-4">
        <div className="bg-blue-100 p-3 rounded-2xl">
          <Sparkles className="w-7 h-7 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">{t.appTitle}</h1>
          <p className="text-slate-500 text-sm hidden sm:block">{t.appSubtitle}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        {/* Auth Section limpia */}
        {!authLoading && (
          <div>
            {user ? (
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end hidden sm:flex">
                  <span className="text-sm font-bold text-slate-800">
                    {user.displayName || user.email}
                  </span>
                  <span className="text-[10px] text-slate-500">{user.email}</span>
                </div>
                <button 
                  onClick={() => {
                    logoutUser();
                    toast.success(t.toastLogout); 
                  }} 
                  className="text-sm font-bold text-red-600 hover:bg-red-50 px-4 py-2 rounded-xl transition-all border border-transparent hover:border-red-100"
                >
                  {t.btnLogout}
                </button>
              </div>
            ) : (
              <button 
                onClick={async () => {
                  try {
                    await loginWithGoogle();
                    toast.success(t.toastLoginSuccess);
                  } catch (e) {
                    toast.error(t.toastLoginError);
                  }
                }} 
                className="text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 px-6 py-2.5 rounded-xl transition-all shadow-md active:scale-95"
              >
                {t.btnGoogleLogin}
              </button>
            )}
          </div>
        )}
        
        {/* Botón de Ajustes */}
        {user && (
          <button 
            onClick={() => setShowSettings(true)} 
            className="p-2.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-slate-100"
            title={t.settingsTitle}
          >
            <Settings className="w-5 h-5"/>
          </button>
        )}
      </div>
    </header>
  );
}