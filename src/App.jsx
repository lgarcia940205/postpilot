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
import { fetchHistory, saveToHistory, deleteFromHistory, loginWithGoogle, logoutUser, subscribeToAuthChanges, getUserPreferences } from './services/dbClient';
import SettingsModal from './components/layout/SettingsModal';
import { translations } from './locales/translations';

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

export default function App() {
  const [authLoading, setAuthLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState("");
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]);
  
  const [userPreferences, setUserPreferences] = useState({
    defaultLanguage: localStorage.getItem('postpilot_lang') || 'ES',
    customPersona: ''
  });
  const activeLang = userPreferences.defaultLanguage.toLowerCase();
  const t = translations[activeLang] || translations['es'];
  
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
  
  const [selectedModel, setSelectedModel] = useState('gemini'); 
  const [userProfile, setUserProfile] = useState({
    systemPrompt: "Eres un asistente amigable. Escribe de forma clara, usa párrafos cortos y termina con una pregunta para la audiencia.",
    keys: { openai: "", gemini: "", deepseek: "" }
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const data = await fetchHistory();
        setHistory(data);
      } catch (err) {
        toast.error(t.dbSyncError);
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
          const prefs = await getUserPreferences(currentUser.uid); 
          if (prefs) { 
            setUserPreferences(prefs); 
            localStorage.setItem('postpilot_lang', prefs.defaultLanguage);
          }
        } catch (err) {
          toast.error(t.dbSyncError);
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
      toast.success(t.deleteSuccess);
    } catch (err) {
      toast.error(t.deleteError);
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
        toast.success(t.trendSuccess + activeTag);
      } else {
        throw new Error("El modelo devolvió una cadena vacía.");
      }

    } catch (err) { 
      console.error("Excepción en trending search:", err);
      
      // Manejo defensivo de limitadores de red
      if (err.message.includes("experiencing high demand")) {
         toast.error(t.serverOverload);
      } else if (err.message.includes("Quota exceeded") || err.message.includes("rate limit")) {
         toast.error(t.apiErrorQuota);
      } else {
         toast.error(t.apiErrorNetwork);
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
        Incluye "Ganchos" visuales y timestamps
      `;
    } else {
      formatInstructions = "FORMATO REQUERIDO: Escribe una publicación de texto estructurada con viñetas y un cierre atractivo, usa un tono profesional y emojis relevantes.";
    }

    const systemInstruction = `
      REGLAS DE PERSONALIDAD: ${userPreferences.customPersona || 'Eres un asistente experto en marketing.'}
      ${formatInstructions}
      TAREA: Crea contenido sobre: "${idea}". 
      PLATAFORMA OBJETIVO: ${platform}. 
      IDIOMA: ${userPreferences.defaultLanguage}.
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
         toast.error(t.serverOverload);
       } else if (err.message.includes("API key not valid")) {
         toast.error(t.apiErrorAuth);
       } else if (err.message.includes("Quota exceeded") || err.message.includes("rate limit")) {
         toast.error(t.apiErrorQuota);
       } else {
         toast.error(t.apiErrorNetwork);
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
      toast.success(t.imageSuccess);
    };

    img.onerror = (e) => {
      console.error("Fallo de red en Picsum:", e);
      setImageError(t.imageErrorServer);
      toast.error(t.imageError);
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
        <SettingsModal
          t={t} 
          user={user} 
          userPreferences={userPreferences}
          onClose={() => setShowSettings(false)}
          onPreferencesUpdated={(newPrefs) => {
            setUserPreferences(prev => ({...prev, ...newPrefs}));
            // FIX: Actualizamos el caché inmediatamente al guardar
            if (newPrefs.defaultLanguage) {
              localStorage.setItem('postpilot_lang', newPrefs.defaultLanguage);
            }
          }}
        />
      )}

      <div className="max-w-[1200px] mx-auto space-y-6">
        
        <Header setShowSettings={setShowSettings} t={t} user={user} authLoading={authLoading}/>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <div className="lg:col-span-5 flex flex-col gap-6 order-last lg:order-none">
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