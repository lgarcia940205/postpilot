import React from 'react';
import { FileText, Clapperboard, Loader2, Zap, TrendingUp, Send } from 'lucide-react';
import { NICHE_TAGS } from '../../config/niches';

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
  generateDraft,
  selectedTag,
  setSelectedTag
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

      <div className="flex flex-col gap-3">
        <label className="text-sm font-bold text-slate-700">{t.customIdeaLabel}</label>
        
        <div className="flex flex-wrap gap-2 mb-1">
          {NICHE_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                selectedTag === tag 
                ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-300 hover:bg-blue-50'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder={t.customIdeaPlaceholder}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-700"
            value={customIdea}
            onChange={(e) => setCustomIdea(e.target.value)}
          />
          <button 
            onClick={() => generateTrendingIdea(selectedTag)} 
            disabled={loadingSuggestion || !selectedTag} 
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 border border-transparent text-white p-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center min-w-[44px]"
            title="Sugerir tendencia basada en el tag"
          >
            {loadingSuggestion ? <Loader2 className="w-5 h-5 animate-spin"/> : <Zap className="w-5 h-5 text-amber-400"/>}
          </button>
        </div>
        {!selectedTag && (
          <p className="text-[10px] text-amber-600 font-medium">
            * Selecciona una categoría arriba para buscar una tendencia.
          </p>
        )}
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