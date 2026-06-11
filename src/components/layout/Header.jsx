import React from 'react';
import { Sparkles, Settings } from 'lucide-react';
import { loginWithGoogle, logoutUser } from '../../services/dbClient';
import { toast } from 'react-hot-toast';

export default function Header({ lang, setLang, setShowSettings, t, user, authLoading }) {
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
        {/* Selector de Idioma */}
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button 
            onClick={() => setLang('es')} 
            className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${lang === 'es' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}
          >
            ES
          </button>
          <button 
            onClick={() => setLang('en')} 
            className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${lang === 'en' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}
          >
            EN
          </button>
        </div>

        {/* Login en google */}
        {!authLoading && (
          <div>
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-slate-600 hidden sm:block">
                  {user.displayName || user.email}
                </span>
                <button 
                  onClick={() => {
                    logoutUser();
                    toast.success("Sesión cerrada");
                  }} 
                  className="text-sm font-bold text-red-600 hover:bg-red-50 px-4 py-2 rounded-xl transition-all"
                >
                  Cerrar Sesión
                </button>
              </div>
            ) : (
              <button 
                onClick={async () => {
                  try {
                    await loginWithGoogle();
                    toast.success("Bienvenido");
                  } catch (e) {
                    toast.error("Error al iniciar sesión");
                  }
                }} 
                className="text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-xl transition-all shadow-sm"
              >
                Iniciar sesión con Google
              </button>
            )}
          </div>
        )}
        
        {/* Botón de Ajustes */}
        <button 
          onClick={() => setShowSettings(true)} 
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <Settings className="w-5 h-5"/>
        </button>
      </div>
    </header>
  );
}