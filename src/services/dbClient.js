import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, query, orderBy } from "firebase/firestore";

let db = null;
let isConfigured = false;

// Inicialización defensiva de la base de datos
try {
  const configEnv = import.meta.env.VITE_FIREBASE_CONFIG;
  if (configEnv) {
    const firebaseConfig = JSON.parse(configEnv);
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    isConfigured = true;
    console.log("Capa de persistencia con Firestore inicializada correctamente.");
  } else {
    console.warn("VITE_FIREBASE_CONFIG no encontrada. Operando en modo memoria local.");
  }
} catch (error) {
  console.error("Fallo crítico al inicializar el proveedor de persistencia:", error);
}

/**
 * Recupera el historial completo desde Firestore ordenando por marca de tiempo descendente.
 */
export const fetchHistory = async () => {
  if (!isConfigured || !db) return [];
  try {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error al descargar historial desde Firestore:", error);
    throw new Error("No se pudo sincronizar el historial remoto.");
  }
};

/**
 * Guarda un registro de post estructurado en la colección remota.
 */
export const saveToHistory = async (topic, type, platform) => {
  if (!isConfigured || !db) return null;
  
  try {
    // Sanitización estricta: Transformamos posibles 'undefined' en strings válidos
    const safeTopic = topic || "Sin título";
    const safeType = type || "text";
    const safePlatform = platform || "General";

    const docRef = await addDoc(collection(db, "posts"), {
      topic: safeTopic,
      type: safeType,
      platform: safePlatform,
      createdAt: Date.now()
    });
    
    return docRef.id;
  } catch (error) {
    console.error("Error al escribir en Firestore:", error);
    // Lanzamos el error para que el catch en App.jsx lo maneje si es necesario
    throw new Error("Fallo al persistir el registro en la nube.");
  }
};
/**
 * Remueve un documento específico basado en su ID único de documento.
 */
export const deleteFromHistory = async (docId) => {
  if (!isConfigured || !db) return;
  try {
    const docRef = doc(db, "posts", docId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error al suprimir documento en Firestore:", error);
    throw new Error("No se pudo completar la remoción del registro.");
  }
};