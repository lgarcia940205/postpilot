# 🚀 PostPilot

**Tu copiloto de IA para la orquestación y creación de contenido en redes sociales.**

PostPilot no compite con la inteligencia de ChatGPT; actúa como una **capa de flujo de trabajo (Workflow Layer)**. Transforma el proceso manual y tedioso de generar prompts, adaptar formatos y buscar tendencias en una experiencia fluida de 2 clics. Diseñado para creadores, desarrolladores y profesionales que buscan construir autoridad en internet sin perder su voz auténtica.

---

## ✨ Características Principales (Features)

- 🧠 **Arquitectura BYOK (Bring Your Own Key):** Sistema multi-modelo que permite a los usuarios conectar sus propias llaves de Gemini, OpenAI o DeepSeek de forma segura. Escalabilidad infinita con cero costos de tokens para el host.
- 🎭 **System Prompting Inyectable (Identidad Base):** Configura tu tono, estilo y reglas de formato una sola vez. La plataforma lo inyectará dinámicamente en todas tus interacciones para que la IA no suene como un robot.
- 📈 **Tendencias Contextuales (Context-Aware RAG):** Usando el historial de tus publicaciones, el motor busca noticias de las últimas 24 horas *específicas de tu nicho* para sugerirte de qué hablar hoy.
- 🎬 **Multi-Formato Inteligente:** Genera posts estructurados para LinkedIn/Twitter o Libretos de Video de doble columna (Audio/Visual) adaptados para TikTok o YouTube Shorts.
- 🎨 **Generación de Activos Visuales:** Integración con el modelo Imagen de Google para crear ilustraciones corporativas flat-design que acompañen tus posts de texto.
- 🌍 **Soporte i18n (Internacionalización):** Interfaz totalmente accesible con soporte nativo para Español e Inglés, fácilmente escalable a más idiomas.
- 💾 **Memoria Histórica (Firebase):** Base de datos no relacional que guarda tus temas anteriores para evitar repeticiones y dar contexto continuo a la IA.

---

## 🛠️ Stack Tecnológico

- **Frontend:** React.js, Tailwind CSS (para un diseño limpio y accesible), Lucide Icons.
- **Backend / BaaS:** Firebase (Authentication, Firestore para almacenamiento en la nube).
- **IA & APIs:** Google Generative AI (Gemini 2.5, Imagen 4), Integración base para OpenAI/DeepSeek.

---

## 🚀 Instalación y Uso Local

Si deseas correr PostPilot en tu entorno local, sigue estos pasos:

1. **Clona el repositorio:**
   Usa el comando git clone
   git clone https://github.com/lgarcia940205/postpilot.git

3. **Instala las dependencias:**
   npm install

4. **Configura las variables de entorno:**
   Crea un archivo .env en la raíz del proyecto basándote en el archivo de ejemplo (asegúrate de no subir nunca tu .env a GitHub).

   VITE_GEMINI_API_KEY=tu_llave_de_google_ai_studio_aqui
   VITE_FIREBASE_CONFIG={tu_configuracion_de_firebase_aqui}

5. **Inicia el servidor de desarrollo:**
   npm run dev

---

## 🛣️ Roadmap (Próximas Mejoras)

PostPilot es un proyecto en evolución continua. Estas son las características planeadas para el futuro cercano:

- [ ] **Autopublicación con OAuth 2.0:** Integración directa con las APIs de LinkedIn y X para publicar desde la app.
- [ ] **Gestor de Hilos (Threads):** Renderizado de UI específico para dividir contenido largo en hilos de Twitter.
- [ ] **Migración de Estado a Zustand:** Refactorización del estado global para mejorar el rendimiento.
- [ ] **Paginación en Firestore:** Optimización de lectura de historial con limit() y carga perezosa.

---

## 🤝 Contribuciones

¡Las contribuciones son bienvenidas! Si tienes ideas para mejorar PostPilot, siéntete libre de hacer un fork del repositorio y enviar un Pull Request.

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.


