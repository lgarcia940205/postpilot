import React from 'react';
import { FileText, Clapperboard, Loader2, TrendingUp, Send } from 'lucide-react';

export default function ActionPanel({
  t,
  formatType,
  setFormatType,
  platform,
  setPlatform,
  platformOptions,
  customIdea,
  setCustomIdea,
  generateTrendingIdea,
  loadingSuggestion,
  loadingDraft,
  generateDraft
}) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col gap-5">
      
      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-600">{t.formatLabel}</label>
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button onClick={() => { setFormatType('text'); setPlatform('LinkedIn'); }} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${formatType === 'text' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <FileText className="w-4 h-4" /> {t.btnTextFormat}
          </button>
          <button onClick={() => { setFormatType('video'); setPlatform('TikTok/Reels'); }} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${formatType === 'video' ? 'bg-white text-pink-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <Clapperboard className="w-4 h-4" /> {t.btnVideoFormat}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <textarea 
          value={customIdea} onChange={(e) => setCustomIdea(e.target.value)} 
          placeholder={t.inputPlaceholder} 
          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none h-28 resize-none text-slate-700"
        />
        <button onClick={generateTrendingIdea} disabled={loadingSuggestion || loadingDraft} className="self-end text-sm text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1.5 transition-colors bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg">
          {loadingSuggestion ? <Loader2 className="w-4 h-4 animate-spin"/> : <TrendingUp className="w-4 h-4"/>} 
          {loadingSuggestion ? t.loadingTrending : t.btnTrending}
        </button>
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-600">{t.platformLabel}</label>
        <div className="flex flex-wrap gap-2">
          {platformOptions[formatType].map(p => (
             <button key={p} onClick={() => setPlatform(p)} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border-2 flex-grow sm:flex-grow-0 ${platform === p ? (formatType === 'video' ? 'bg-pink-50 border-pink-200 text-pink-700' : 'bg-blue-50 border-blue-200 text-blue-700') : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'}`}>
               {p}
             </button>
          ))}
        </div>
      </div>

      <button onClick={() => customIdea && generateDraft(customIdea)} disabled={!customIdea || loadingDraft} className="w-full bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 disabled:text-slate-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors text-lg mt-2 shadow-sm">
        {loadingDraft ? <Loader2 className="w-6 h-6 animate-spin"/> : <Send className="w-6 h-6"/>} 
        {t.btnGenerateText}
      </button>
    </div>
  );
}