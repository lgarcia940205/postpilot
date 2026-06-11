import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, where, setDoc, getDoc } from "firebase/firestore";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "firebase/auth";

let db = null;
let auth = null;
let isConfigured = false;

try {
  const configEnv = import.meta.env.VITE_FIREBASE_CONFIG;
  if (configEnv) {
    const firebaseConfig = JSON.parse(configEnv);
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app); // Inicializamos el módulo de autenticación
    isConfigured = true;
    console.log("Servicios de Persistencia y Autenticación inicializados.");
  }
} catch (error) {
  console.error("Fallo crítico en la inicialización de Firebase:", error);
}

// ==========================================
// SECCIÓN: AUTENTICACIÓN
// ==========================================

export const loginWithGoogle = async () => {
  if (!isConfigured || !auth) return null;
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    
    // Al iniciar sesión, disparamos la sincronización del perfil/configuraciones
    await syncUserProfile(user);
    
    return user;
  } catch (error) {
    console.error("Error en login con Google:", error);
    throw error;
  }
};

export const logoutUser = async () => {
  if (!isConfigured || !auth) return;
  await signOut(auth);
};

export const subscribeToAuthChanges = (callback) => {
  if (!isConfigured || !auth) return () => {};
  return onAuthStateChanged(auth, callback);
};

// ==========================================
// SECCIÓN: CONFIGURACIONES DE USUARIO (PERFIL)
// ==========================================

const syncUserProfile = async (user) => {
  if (!db) return;
  const userDocRef = doc(db, "users", user.uid); // La llave del documento es el UID exacto
  
  try {
    const docSnap = await getDoc(userDocRef);
    if (!docSnap.exists()) {
      // Si el usuario es nuevo, creamos sus configuraciones base por defecto
      await setDoc(userDocRef, {
        displayName: user.displayName,
        email: user.email,
        defaultLanguage: "ES",
        theme: "light",
        updatedAt: Date.now()
      });
      console.log("Perfil de usuario inicializado en Firestore.");
    }
  } catch (error) {
    console.error("Error al sincronizar el perfil del usuario:", error);
  }
};

// ==========================================
// SECCIÓN: HISTORIAL (CON CONTROL DE USUARIO)
// ==========================================

export const fetchHistory = async (userId) => {
  if (!isConfigured || !db || !userId) return [];
  try {
    // FILTRADO DEFENSIVO: Añadimos un WHERE para traer solo los posts del usuario activo
    const q = query(
      collection(db, "posts"), 
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error al descargar historial:", error);
    throw new Error("No se pudo sincronizar el historial remoto.");
  }
};

export const saveToHistory = async (topic, type, platform, userId) => {
  if (!isConfigured || !db || !userId) return null;
  try {
    const docRef = await addDoc(collection(db, "posts"), {
      topic: topic || "Sin título",
      type: type || "text",
      platform: platform || "General",
      userId, // Guardamos la firma del creador
      createdAt: Date.now()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error al escribir en Firestore:", error);
    throw new Error("Fallo al persistir el registro en la nube.");
  }
};

export const deleteFromHistory = async (docId) => {
  if (!isConfigured || !db) return;
  try {
    const docRef = doc(db, "posts", docId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error al suprimir documento:", error);
    throw new Error("No se pudo completar la remoción.");
  }
};