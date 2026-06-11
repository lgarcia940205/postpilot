import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Copy, Loader2, Send, FileText, 
  History, Trash2, Image as ImageIcon, Settings, User, Key, 
  Save, X, CheckCircle2, TrendingUp, Download, 
  Video, Clapperboard, MonitorPlay
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, onSnapshot, serverTimestamp, deleteDoc, doc, setDoc, getDoc } from 'firebase/firestore';
import { Toaster, toast } from 'react-hot-toast';
import Header from './components/layout/Header';
import ActionPanel from './components/editor/ActionPanel';
import HistorySidebar from './components/editor/HistorySidebar';
import OutputCanvas from './components/editor/OutputCanvas';
import { fetchHistory, saveToHistory, deleteFromHistory, loginWithGoogle, logoutUser, subscribeToAuthChanges } from './services/dbClient';

// --- CONFIGURACIÓN ---
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || ""; 

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
  const [authLoading, setAuthLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState("");
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
    const loadInitialData = async () => {
      try {
        const data = await fetchHistory();
        setHistory(data);
      } catch (err) {
        toast.error("Error de sincronización con la base de datos.");
      }
    };
    loadInitialData();
  }, []);

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
    // Suscripción al estado de autenticación
    const unsubscribe = subscribeToAuthChanges(async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // Si hay usuario, descargamos SU historial específico
        try {
          const data = await fetchHistory(currentUser.uid);
          setHistory(data);
        } catch (err) {
          toast.error("Error de sincronización con la base de datos.");
        }
      } else {
        // Si se desconecta, limpiamos la memoria volátil por seguridad
        setHistory([]);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe(); // Limpieza del listener al desmontar
  }, []);

  const saveProfileSettings = async () => {
    if (!user || !db) { setShowSettings(false); return; }
    setSavingProfile(true);
    try {
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'settings'), userProfile);
      setTimeout(() => { setSavingProfile(false); setShowSettings(false); }, 500);
    } catch (err) { setSavingProfile(false); }
  };

  const handleDelete = async (id) => {
    try {
      await deleteFromHistory(id);
      setHistory(prev => prev.filter(item => item.id !== id));
      toast.success("Registro eliminado permanentemente.");
    } catch (err) {
      toast.error("No se pudo eliminar el registro de la nube.");
    }
  };

  const deleteFromHistory = async (docId) => {
    if (!user || !db) return;
    try { await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'topics_history', docId)); } catch (err) {}
  };

  const generateTrendingIdea = async (activeTag) => {
    // Defensa estructural: Prevenir peticiones en blanco
    if (!activeTag) return;
    
    setLoadingSuggestion(true);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

      // Prompt quirúrgico anclado al nicho seleccionado
      const prompt = `Actúa como un analista de marketing de contenidos experto en el nicho de: "${activeTag}".
      Usa la herramienta de búsqueda en internet para encontrar una tendencia actual, una noticia de última hora o un tema altamente viral estrictamente dentro de este nicho.
      Tu salida debe ser ÚNICAMENTE un título atractivo (máximo 8 palabras) que sirva como idea central para un post. 
      No uses comillas, no des explicaciones, no incluyas preámbulos, solo devuelve el texto del título.`;

      // Estructura estricta para REST API con la herramienta de búsqueda de Google
      const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        tools: [{ googleSearch: {} }]
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      // Intercepción de errores de la API HTTP
      if (data.error) {
         throw new Error(data.error.message || "Error desconocido de la API");
      }

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.replace(/["']/g, '');

      if (text) {
        setCustomIdea(text.trim());
        toast.success(`Tendencia obtenida para: ${activeTag}`);
      } else {
        throw new Error("El modelo devolvió una cadena vacía.");
      }

    } catch (err) { 
      console.error("Excepción en trending search:", err);
      
      // Manejo defensivo de limitadores de red
      if (err.message.includes("experiencing high demand")) {
         toast.error("Los servidores están saturados. Intenta en unos minutos.");
      } else if (err.message.includes("Quota exceeded") || err.message.includes("rate limit")) {
         toast.error("Demasiadas peticiones (HTTP 429). Espera 60 segundos.");
      } else {
         toast.error("Error al buscar tendencias. Verifica tu conexión.");
      }
    } finally { 
      setLoadingSuggestion(false); 
    }
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
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey || activeKey}`;
      const payload = {
        contents: [{ parts: [{ text: "Genera el contenido solicitado." }] }],
        systemInstruction: { parts: [{ text: systemInstruction }] }
      };

      const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await response.json();
      
      // Interceptamos errores de la API antes de intentar leer el texto
      if (data.error) {
        throw new Error(data.error.message || "Error desconocido de la API");
      }

      const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!textOutput) {
        throw new Error("Respuesta vacía del modelo.");
      }
      
      setDraft(textOutput);


      if (user) {
        try {
          const newId = await saveToHistory(idea, formatType, platform, user.uid);
          if (newId) {
            setHistory(prev => [{ id: newId, topic: idea, type: formatType, platform }, ...prev]);
          }
        } catch (dbErr) {
          console.warn("Los datos no se sincronizaron:", dbErr);
        }
      }

   } catch (err) { 
       console.error("Error en inferencia LLM:", err);
       setDraft(""); 
       
       if (err.message.includes("experiencing high demand")) {
         toast.error("Los servidores de IA están temporalmente saturados. Intenta más tarde.");
       } else if (err.message.includes("API key not valid")) {
         toast.error("La llave de acceso (API Key) es inválida o ha expirado.");
       } else if (err.message.includes("Quota exceeded") || err.message.includes("rate limit")) {
         toast.error("Límite de peticiones gratuitas alcanzado (HTTP 429). Espera 60 segundos.");
       } else {
         toast.error("No se pudo generar el contenido. Revisa tu consola para más detalles.");
       }
    } finally { 
      setLoadingDraft(false); 
    }
  };

  const generateSocialImage = async () => {
    if (!draft || !customIdea) return;
    setLoadingImage(true);
    setImageError("");
    setGeneratedImage(null);
    
    // Generamos una semilla única basada en la idea del usuario para que la imagen sea coherente por tema
    const seedText = encodeURIComponent(customIdea.substring(0, 15).replace(/\s+/g, ''));
    
    // Utilizamos Picsum, un servicio de placeholders estable a nivel industrial, 
    // simulando la respuesta de un LLM visual para mantener intacta la demostración de UI.
    const imageUrl = `https://picsum.photos/seed/${seedText}/800/450`;

    // Técnica de precarga asíncrona
    const img = new Image();
    img.src = imageUrl;

    img.onload = () => {
      setGeneratedImage(imageUrl);
      setLoadingImage(false);
      toast.success("Recurso visual de demostración cargado.");
    };

    img.onerror = (e) => {
      console.error("Fallo de red en Picsum:", e);
      setImageError("El servidor de placeholders está inalcanzable.");
      toast.error("Fallo de red al intentar descargar la imagen.");
      setLoadingImage(false); 
    };
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
        
        <Header lang={lang} setLang={setLang} setShowSettings={setShowSettings} t={t} user={user} authLoading={authLoading}/>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <div className="lg:col-span-5 flex flex-col gap-6">
            <ActionPanel 
              t={t}
              formatType={formatType}
              setFormatType={setFormatType}
              platform={platform}
              setPlatform={setPlatform}
              platformOptions={platformOptions}
              customIdea={customIdea}
              setCustomIdea={setCustomIdea}
              generateTrendingIdea={generateTrendingIdea}
              loadingSuggestion={loadingSuggestion}
              loadingDraft={loadingDraft}
              generateDraft={generateDraft}
              selectedTag={selectedTag}
              setSelectedTag={setSelectedTag}
            />
            <HistorySidebar 
              t={t}
              history={history}
              setCustomIdea={setCustomIdea}
              setFormatType={setFormatType}
              setPlatform={setPlatform}
              deleteFromHistory={handleDelete}
            />
          </div>

          <OutputCanvas 
            t={t}
            draft={draft}
            setDraft={setDraft}
            loadingDraft={loadingDraft}
            formatType={formatType}
            copied={copied}
            copyToClipboard={copyToClipboard}
            generateSocialImage={generateSocialImage}
            loadingImage={loadingImage}
            generatedImage={generatedImage}
            imageError={imageError}
          />
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }
      `}} />

      <Toaster 
        position="bottom-right"
        toastOptions={{
          duration: 5000,
          style: {
            background: '#1e293b',
            color: '#fff',
            borderRadius: '12px',
            fontWeight: '600'
          },
          error: {
            style: { background: '#ef4444' }
          }
        }}
      />
    </div>
  );
}