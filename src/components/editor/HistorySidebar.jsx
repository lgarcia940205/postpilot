import React from 'react';
import { Trash2 } from 'lucide-react';

export default function HistorySidebar({ 
  t, 
  history, 
  setCustomIdea, 
  setFormatType, 
  setPlatform, 
  deleteFromHistory 
}) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex-1">
      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">{t.historyLabel}</h3>
      <div className="space-y-2">
        {history.length === 0 ? (
          <p className="text-sm text-slate-500 italic text-center py-4">{t.emptyHistory}</p>
        ) : (
          history.map((item) => (
            <div 
              key={item.id} 
              className="group bg-slate-50 border border-slate-100 p-3 rounded-xl flex justify-between items-center cursor-pointer hover:bg-blue-50 hover:border-blue-100 transition-colors" 
              onClick={() => { 
                setCustomIdea(item.topic); 
                setFormatType(item.type || 'text'); 
                setPlatform(item.platform); 
              }}
            >
              <div>
                <p className="text-sm text-slate-700 font-medium truncate w-[200px] sm:w-[250px]">{item.topic}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                  {item.type === 'video' ? t.badgeVideo : t.badgeText} • {item.platform}
                </p>
              </div>
              <button 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  deleteFromHistory(item.id); 
                }} 
                className="text-slate-400 hover:text-red-500 p-2 bg-white rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 className="w-4 h-4"/>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}