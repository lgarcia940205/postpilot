import React, { useState } from 'react';
import { X, Save, Globe, UserCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { updateUserPreferences } from '../../services/dbClient';
import { translations } from '../../locales/translations';

export default function SettingsModal({ t, user, userPreferences, onClose, onPreferencesUpdated }) {
  const [language, setLanguage] = useState(userPreferences?.defaultLanguage || 'ES');
  const [persona, setPersona] = useState(userPreferences?.customPersona || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!user) {
      toast.error(t.settingsAuthError);
      return;
    }

    setIsSaving(true);
    const payload = { 
      defaultLanguage: language,
      customPersona: persona.trim()
    };

    try {
      await updateUserPreferences(user.uid, payload);
      
      // FIX: Obtenemos la traducción correcta en tiempo real basada en la nueva selección
      const newLangKey = language.toLowerCase();
      const currentDict = translations[newLangKey] || translations['es'];
      
      toast.success(currentDict.settingsSaveSuccess); // Dispara el toast correcto
      
      if (onPreferencesUpdated) onPreferencesUpdated(payload); 
      onClose();
    } catch (error) {
      toast.error(t.settingsSaveError);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800">{t.settingsTitle}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-1.5 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-6 overflow-y-auto max-h-[70vh]">
          <div className="flex flex-col gap-3">
            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-500"/>
              {t.settingsLanguage}
            </label>
            <div className="flex gap-2">
              <button 
                onClick={() => setLanguage('ES')}
                className={`flex-1 py-2 rounded-xl font-bold border transition-all ${language === 'ES' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
              >
                {t.settingsLangES}
              </button>
              <button 
                onClick={() => setLanguage('EN')}
                className={`flex-1 py-2 rounded-xl font-bold border transition-all ${language === 'EN' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
              >
                {t.settingsLangEN}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-amber-500"/>
              {t.settingsPersonality}
            </label>
            <textarea 
              value={persona}
              onChange={(e) => setPersona(e.target.value)}
              placeholder={t.settingsPersonaPlaceholder}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-700 min-h-[120px] resize-y custom-scrollbar scrollbar-thin scrollbar-thumb-slate-300"
            />
            <p className="text-xs text-slate-500">
              {t.settingsPersonaHint}
            </p>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors">
            {t.btnCancel}
          </button>
          <button 
            onClick={handleSave} disabled={isSaving}
            className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:text-slate-500 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-sm flex items-center gap-2 transition-colors"
          >
            {isSaving ? <span className="animate-pulse">{t.btnSaving}</span> : <><Save className="w-4 h-4"/> {t.btnSave}</>}
          </button>
        </div>
      </div>
    </div>
  );
}