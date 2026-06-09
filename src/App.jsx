import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Copy, Loader2, Send, Linkedin, Twitter, FileText, 
  History, Trash2, Image as ImageIcon, Settings, User, Key, 
  Save, X, CheckCircle2, TrendingUp, Download, Facebook, 
  Video, Clapperboard, MonitorPlay
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, onSnapshot, serverTimestamp, deleteDoc, doc, setDoc, getDoc } from 'firebase/firestore';

// --- CONFIGURACIÓN ---
const apiKey = ""; 

let app, auth, db, appId;
try {
  const firebaseConfig = typeof __firebase_config !== 'undefined' && __firebase_config ? JSON.parse(__firebase_config) : null;
  appId = typeof __app_id !== 'undefined' && __app_id ? __app_id : 'default-app-id';
  if (firebaseConfig) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  }
} catch (e) {
  console.warn("Firebase fallback activado. Ejecutando en entorno local sin persistencia remota.");
}

const translations = {
  es: {
    appTitle: "Asistente Creador",
    appSubtitle: "Tu compañero para crear publicaciones y videos geniales.",
    formatLabel: "¿Qué deseas crear hoy?",
    btnTextFormat: "Texto / Artículo",
    btnVideoFormat: "Guion de Video",
    inputPlaceholder: "¿De qué quieres hablar hoy? (Ej. Consejos para programar mejor)",
    btnTrending: "Buscar Tendencia de tu Nicho",
    btnGenerateText: "Generar Contenido",
    platformLabel: "¿Dónde vas a publicar?",
    historyLabel: "Tus Temas Anteriores",
    emptyHistory: "Aún no tienes temas guardados.",
    resultTitle: "Tu Contenido Listo",
    btnCopy: "Copiar Texto",
    btnCopied: "¡Copiado!",
    btnImage: "Crear Imagen Acompañante",
    loadingImage: "Renderizando imagen...",
    settingsTitle: "Ajustes Avanzados",
    settingsPersonality: "Tu Personalidad (Cómo quieres sonar)",
    settingsKeys: "Conexiones de IA Pro (Opcional)",
    btnSave: "Guardar Ajustes",
    toastError: "Excepción en tiempo de ejecución. Verifica la conexión a la API.",
    loadingThinking: "Procesando inferencia LLM...",
    loadingTrending: "Ejecutando Grounding Search en tiempo real..."
  },
  en: {
    appTitle: "Creator Assistant",
    appSubtitle: "Your companion for creating awesome posts and videos.",
    formatLabel: "What do you want to create today?",
    btnTextFormat: "Text / Article",
    btnVideoFormat: "Video Script",
    inputPlaceholder: "What do you want to talk about today? (e.g., Tips for better coding)",
    btnTrending: "Find Trend in Your Niche",
    btnGenerateText: "Generate Content",
    platformLabel: "Where are you posting?",
    historyLabel: "Your Past Topics",
    emptyHistory: "You have no saved topics yet.",
    resultTitle: "Your Ready Content",
    btnCopy: "Copy Text",
    btnCopied: "Copied!",
    btnImage: "Create Companion Image",
    loadingImage: "Rendering image...",
    settingsTitle: "Advanced Settings",
    settingsPersonality: "Your Personality (How you want to sound)",
    settingsKeys: "Pro AI Connections (Optional)",
    btnSave: "Save Settings",
    toastError: "Runtime exception. Check API connection.",
    loadingThinking: "Processing LLM inference...",
    loadingTrending: "Executing real-time Grounding Search..."
  }
};

export default function App() {
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]);
  
  const [lang, setLang] = useState('es');
  const t = translations[lang]; 
  
  const [customIdea, setCustomIdea] = useState("");
  const [draft, setDraft] = useState("");
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const [generatedImage, setGeneratedImage] = useState(null); 
  const [loadingImage, setLoadingImage] = useState(false);
  const [imageError, setImageError] = useState("");
  
  const [formatType, setFormatType] = useState('text'); 
  const [platform, setPlatform] = useState('LinkedIn');
  
  const platformOptions = {
    text: ['LinkedIn', 'Twitter', 'Facebook', 'Blog'],
    video: ['TikTok/Reels', 'YouTube']
  };
  
  const [showSettings, setShowSettings] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gemini'); 
  const [userProfile, setUserProfile] = useState({
    systemPrompt: "Eres un asistente amigable. Escribe de forma clara, usa párrafos cortos y termina con una pregunta para la audiencia.",
    keys: { openai: "", gemini: "", deepseek: "" }
  });
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (!auth) return;
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) await signInWithCustomToken(auth, __initial_auth_token);
        else await signInAnonymously(auth);
      } catch (err) { console.error("Error en autenticación Firebase"); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !db) return;
    const unsubHistory = onSnapshot(query(collection(db, 'artifacts', appId, 'users', user.uid, 'topics_history')), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setHistory(data.slice(0, 5)); 
    });

    const loadProfile = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'settings'));
        if (docSnap.exists()) setUserProfile(docSnap.data());
      } catch(e) { console.error("Error cargando perfil"); }
    };
    loadProfile();

    return () => unsubHistory();
  }, [user]);

  const saveProfileSettings = async () => {
    if (!user || !db) { setShowSettings(false); return; }
    setSavingProfile(true);
    try {
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'settings'), userProfile);
      setTimeout(() => { setSavingProfile(false); setShowSettings(false); }, 500);
    } catch (err) { setSavingProfile(false); }
  };

  const saveToHistory = async (topic) => {
    if (!user || !db || !topic.trim()) return;
    try { await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'topics_history'), { topic, createdAt: serverTimestamp(), platform, type: formatType }); } catch (err) {}
  };

  const deleteFromHistory = async (docId) => {
    if (!user || !db) return;
    try { await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'topics_history', docId)); } catch (err) {}
  };

  const generateTrendingIdea = async () => {
    setLoadingSuggestion(true);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
    
    let nicheContext = "tecnología, innovación o creadores de contenido"; 
    if (history.length > 0) {
      const pastTopics = history.slice(0, 3).map(h => h.topic).join(" | ");
      nicheContext = `el nicho específico relacionado con estos temas que el usuario suele tratar: [${pastTopics}]`;
    }

    const payload = {
      contents: [{ 
        parts: [{ 
          text: `Busca en internet noticias de las últimas 24 horas sobre ${nicheContext}. Basado EXCLUSIVAMENTE en una noticia real y actual de ese nicho específico, sugiere 1 título atractivo para crear contenido en redes sociales. Idioma: ${lang === 'es' ? 'Español' : 'Inglés'}. Máximo 10 palabras. SOLO DEVUELVE EL TÍTULO.` 
        }] 
      }],
      tools: [{ google_search: {} }] 
    };

    try {
      const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.replace(/["']/g, '');
      if (text) setCustomIdea(text.trim());
    } catch (err) { console.error("Excepción en trending search"); } finally { setLoadingSuggestion(false); }
  };

  const generateDraft = async (idea) => {
    setLoadingDraft(true); setDraft(""); setGeneratedImage(null); setImageError("");
    
    const activeKey = userProfile.keys[selectedModel] || apiKey; 
    
    let formatInstructions = "";
    if (formatType === 'video') {
      formatInstructions = `
        FORMATO REQUERIDO: Escribe un GUION DE VIDEO (Libreto). 
        Estructura en dos partes: [VISUAL / PANTALLA] y [AUDIO / NARRADOR].
        Incluye un "Gancho" en los primeros 3 segundos.
      `;
    } else {
      formatInstructions = "FORMATO REQUERIDO: Escribe una publicación de texto estructurada con viñetas y un cierre atractivo.";
    }

    const systemInstruction = `
      REGLAS DE PERSONALIDAD: ${userProfile.systemPrompt}
      ${formatInstructions}
      TAREA: Crea contenido sobre: "${idea}". 
      PLATAFORMA OBJETIVO: ${platform}. 
      IDIOMA: ${lang === 'es' ? 'Español' : 'Inglés'}.
    `;

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey || activeKey}`;
      const payload = {
        contents: [{ parts: [{ text: "Genera el contenido solicitado." }] }],
        systemInstruction: { parts: [{ text: systemInstruction }] }
      };

      const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await response.json();
      
      setDraft(data.candidates?.[0]?.content?.parts?.[0]?.text || "Fallo en inferencia.");
      saveToHistory(idea);

    } catch (err) { setDraft(t.toastError); } finally { setLoadingDraft(false); }
  };

  const generateSocialImage = async () => {
    if (!draft || !customIdea) return;
    setLoadingImage(true);
    setImageError("");
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${apiKey}`;
    const promptParams = `A clean, modern, friendly vector flat illustration representing the concept of: "${customIdea.substring(0, 50)}". Bright, optimistic colors, corporate memphis style, suitable for a professional blog or social media post. No text, no letters in the image. High quality.`;
    
    try {
      const response = await fetch(url, { 
        method: 'POST', headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ instances: { prompt: promptParams }, parameters: { sampleCount: 1 } }) 
      });
      const data = await response.json();
      if (data.predictions && data.predictions[0] && data.predictions[0].bytesBase64Encoded) {
        setGeneratedImage(`data:image/png;base64,${data.predictions[0].bytesBase64Encoded}`);
      } else throw new Error("Datos de imagen inválidos");
    } catch (err) { setImageError("Fallo al contactar modelo de imagen."); } finally { setLoadingImage(false); }
  };

  const copyToClipboard = () => {
    if(navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(draft);
    } else {
        let textArea = document.createElement("textarea");
        textArea.value = draft; document.body.appendChild(textArea); textArea.select();
        document.execCommand('copy'); textArea.remove();
    }
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-4 lg:p-8">
      
      {showSettings && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-slate-800 font-bold flex items-center gap-2 text-lg"><Settings className="w-5 h-5 text-blue-500" /> {t.settingsTitle}</h2>
              <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-slate-700 bg-white p-2 rounded-full shadow-sm"><X className="w-5 h-5"/></button>
            </div>
            
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="space-y-3">
                <label className="font-semibold text-slate-700 flex items-center gap-2"><User className="w-4 h-4 text-slate-400"/> {t.settingsPersonality}</label>
                <textarea 
                  value={userProfile.systemPrompt} onChange={(e) => setUserProfile({...userProfile, systemPrompt: e.target.value})}
                  className="w-full h-24 bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-700 focus:border-blue-500 outline-none resize-none"
                />
              </div>
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <label className="font-semibold text-slate-700 flex items-center gap-2"><Key className="w-4 h-4 text-slate-400"/> {t.settingsKeys}</label>
                <div className="grid gap-3">
                  {['openai', 'gemini', 'deepseek'].map(k => (
                    <div key={k} className="flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                      <span className="w-24 text-xs font-bold text-slate-500 uppercase tracking-widest pl-3 bg-slate-100 h-full flex items-center">{k}</span>
                      <input type="password" value={userProfile.keys[k]} onChange={(e) => setUserProfile({...userProfile, keys: {...userProfile.keys, [k]: e.target.value}})} className="flex-1 bg-transparent outline-none text-slate-700 p-2.5" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button onClick={saveProfileSettings} disabled={savingProfile} className="bg-blue-600 text-white font-semibold px-6 py-2.5 rounded-xl">
                {t.btnSave}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[1200px] mx-auto space-y-6">
        
        <header className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 lg:p-5 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-2xl"><Sparkles className="w-7 h-7 text-blue-600" /></div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">{t.appTitle}</h1>
              <p className="text-slate-500 text-sm hidden sm:block">{t.appSubtitle}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button onClick={() => setLang('es')} className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${lang === 'es' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}>ES</button>
              <button onClick={() => setLang('en')} className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${lang === 'en' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}>EN</button>
            </div>
            <button onClick={() => setShowSettings(true)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"><Settings className="w-5 h-5"/></button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <div className="lg:col-span-5 flex flex-col gap-6">
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

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex-1">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">{t.historyLabel}</h3>
              <div className="space-y-2">
                {history.length === 0 ? (
                  <p className="text-sm text-slate-500 italic text-center py-4">{t.emptyHistory}</p>
                ) : (
                  history.map((item) => (
                    <div key={item.id} className="group bg-slate-50 border border-slate-100 p-3 rounded-xl flex justify-between items-center cursor-pointer hover:bg-blue-50 hover:border-blue-100 transition-colors" onClick={() => { setCustomIdea(item.topic); setFormatType(item.type || 'text'); setPlatform(item.platform); }}>
                      <div>
                        <p className="text-sm text-slate-700 font-medium truncate w-[200px] sm:w-[250px]">{item.topic}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{item.type === 'video' ? 'Video' : 'Texto'} • {item.platform}</p>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); deleteFromHistory(item.id); }} className="text-slate-400 hover:text-red-500 p-2 bg-white rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-4 h-4"/></button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 h-[500px] flex flex-col relative overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                 <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                   <div className={`w-2.5 h-2.5 rounded-full ${loadingDraft ? 'bg-amber-400 animate-pulse' : draft ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                   {t.resultTitle}
                 </h2>
                 {draft && !loadingDraft && (
                   <button onClick={copyToClipboard} className="text-sm font-bold bg-slate-800 text-white hover:bg-slate-700 px-4 py-2 rounded-xl transition-all flex items-center gap-2 shadow-sm">
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
                          <a href={generatedImage} download="social_image.png" className="bg-white text-slate-900 font-bold px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 hover:bg-slate-100 hover:scale-105 transition-all">
                            <Download className="w-4 h-4"/> Descargar
                          </a>
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

        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }
      `}} />
    </div>
  );
}
