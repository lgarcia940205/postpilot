import React from 'react';
import { Loader2, CheckCircle2, Copy, Image as ImageIcon, Download } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function OutputCanvas({
  t,
  draft,
  setDraft,
  loadingDraft,
  formatType,
  copied,
  copyToClipboard,
  generateSocialImage,
  loadingImage,
  generatedImage,
  imageError
}) {

  const handleDownload = async () => {
    if (!generatedImage) return;
    try {
      // 1. Descargamos el binario de la imagen saltándonos la caché del navegador
      const response = await fetch(generatedImage, { mode: 'cors' });
      const blob = await response.blob();
      
      // 2. Creamos una URL local temporal que apunta a ese binario en memoria
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ilustracion_${Date.now()}.jpg`; // Asignamos nombre determinista
      
      // 3. Simulamos clic y limpieza
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url); // Liberar memoria
    } catch (error) {
      console.error("Error descargando la imagen:", error);
      // Opcional: Si tienes acceso a toast.error prop, úsalo aquí
      alert("No se pudo iniciar la descarga. Verifica tu conexión.");
    }
  };

  const handleCopy = async () => {
    // Si no hay texto generado, abortamos silenciosamente
    if (!generatedDraft) return; 
    
    try {
      await navigator.clipboard.writeText(generatedDraft);
      toast.success("¡Texto copiado al portapapeles!");
    } catch (err) {
      console.error("Error al copiar:", err);
      toast.error("Tu navegador bloqueó el acceso al portapapeles.");
    }
  };

  return (
    <div className="lg:col-span-7 flex flex-col gap-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 h-[500px] flex flex-col relative overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
           <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
             <div className={`w-2.5 h-2.5 rounded-full ${loadingDraft ? 'bg-amber-400 animate-pulse' : draft ? 'bg-green-500' : 'bg-slate-300'}`}></div>
             {t.resultTitle}
           </h2>
           {draft && !loadingDraft && (
             <button onClick={handleCopy} className="text-sm font-bold bg-slate-800 text-white hover:bg-slate-700 px-4 py-2 rounded-xl transition-all flex items-center gap-2 shadow-sm">
               {copied ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />} {copied ? t.btnCopied : t.btnCopy}
             </button>
           )}
        </div>

        <div className="flex-1 p-6 relative flex flex-col">
          {loadingDraft ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm z-10">
               <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4"></div>
               <p className="text-base font-semibold text-slate-600">{t.loadingThinking}</p>
            </div>
          ) : (
            <textarea 
              className={`w-full flex-1 bg-transparent border-none resize-none focus:ring-0 leading-relaxed text-base custom-scrollbar ${formatType === 'video' ? 'font-mono text-slate-600 text-sm' : 'font-sans text-slate-700'}`} 
              value={draft} 
              onChange={(e) => setDraft(e.target.value)} 
              readOnly={!draft}
            />
          )}
        </div>
      </div>

      {draft && !loadingDraft && formatType === 'text' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col sm:flex-row gap-6 items-center">
          <div className="w-full sm:w-1/3 flex flex-col gap-3">
            <p className="text-sm font-semibold text-slate-700">Complemento Visual</p>
            <p className="text-xs text-slate-500">Un post con imagen recibe 3x más interacciones.</p>
            <button onClick={generateSocialImage} disabled={loadingImage} className="w-full text-blue-700 bg-blue-50 hover:bg-blue-100 disabled:bg-slate-100 border border-blue-200 disabled:border-slate-200 disabled:text-slate-400 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors mt-2">
              {loadingImage ? <Loader2 className="w-5 h-5 animate-spin"/> : <ImageIcon className="w-5 h-5"/>} 
              {loadingImage ? t.loadingImage : t.btnImage}
            </button>
            {imageError && <p className="text-xs text-red-500 font-medium">{imageError}</p>}
          </div>

          <div className="w-full sm:w-2/3">
            <div className="w-full aspect-video bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden relative group">
              {loadingImage ? (
                <div className="text-blue-500 flex flex-col items-center gap-2">
                  <ImageIcon className="w-8 h-8 animate-pulse" />
                  <span className="text-xs font-semibold uppercase tracking-wider">{t.loadingImage}</span>
                </div>
              ) : generatedImage ? (
                <>
                  <img src={generatedImage} alt="Generado por IA" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                    <button onClick={handleDownload} className="bg-white text-slate-900 font-bold px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 hover:bg-slate-100 hover:scale-105 transition-all">
                      <Download className="w-4 h-4"/> Descargar
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-slate-400 flex flex-col items-center gap-2">
                  <ImageIcon className="w-8 h-8 opacity-50" />
                  <span className="text-xs">Sin imagen generada</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}