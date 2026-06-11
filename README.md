# 🚀 PostPilot

**Tu copiloto de IA para la orquestación y creación de contenido en redes sociales.**

PostPilot no compite con la inteligencia de ChatGPT; actúa como una **capa de flujo de trabajo (Workflow Layer)**. Transforma el proceso manual y tedioso de generar prompts, adaptar formatos y buscar tendencias en una experiencia fluida de 2 clics. Diseñado para creadores, desarrolladores y profesionales que buscan construir autoridad en internet sin perder su voz auténtica.

---

## ✨ Características Principales (Features)

- 🎭 **System Prompting Inyectable (Identidad Base):** Configura tu tono, estilo y reglas de formato una sola vez. La plataforma lo inyectará dinámicamente en todas tus interacciones para que la IA no suene como un robot.
- 📈 **Tendencias Contextuales (Context-Aware RAG):** Usando el historial de tus publicaciones, el motor busca noticias de las últimas 24 horas *específicas de tu nicho* para sugerirte de qué hablar hoy.
- 🎬 **Multi-Formato Inteligente:** Genera posts estructurados para LinkedIn/Twitter o Libretos de Video de doble columna (Audio/Visual) adaptados para TikTok o YouTube Shorts.
- 🎨 **Simulación de Activos Visuales:** Integración asíncrona con APIs de placeholders deterministas (Picsum) para simular el flujo de generación visual en la UI, manteniendo el MVP ágil y con cero costos de inferencia gráfica.
- 🌍 **Soporte i18n (Internacionalización):** Interfaz totalmente accesible con soporte nativo para Español e Inglés, fácilmente escalable a más idiomas, gestionada mediante estado derivado y caché sincrónico sin librerías de terceros.
- 💾 **Memoria Histórica (Firebase):** Base de datos no relacional que guarda tus temas anteriores para evitar repeticiones, aislada estrictamente por UID mediante índices compuestos.

---

## 🛠️ Stack Tecnológico

* **Frontend:** React 18 + Vite
* **Estilos:** Tailwind CSS
* **Iconografía:** Lucide React
* **Notificaciones:** React Hot Toast (Manejo defensivo de UI)
* **Persistencia de Datos:** Google Cloud Firestore (Firebase)
* **Inteligencia Artificial:** API REST de Google Gemini 2.5 Flash
* **Recursos Visuales:** Picsum Photos API (Generación de placeholders deterministas)

---

## 🚀 Instalación y Uso Local

Si deseas correr PostPilot en tu entorno local, sigue estos pasos:

1. **Clona el repositorio:**
```bash
   git clone [https://github.com/lgarcia940205/postpilot.git](https://github.com/lgarcia940205/postpilot.git)
Instala las dependencias:

```bash
   npm install
Configura las variables de entorno:
Para ejecutar este proyecto en local, debes crear un archivo .env en la raíz con la siguiente estructura estricta:

Fragmento de código
# API Key de AI Studio para inferencia de texto
VITE_GEMINI_API_KEY=tu_api_key_aqui

# Objeto JSON estricto de configuración de Firebase (DEBE ir en una sola línea, sin comillas simples envolventes ni punto y coma al final)
VITE_FIREBASE_CONFIG={"apiKey":"...","authDomain":"...","projectId":"...","storageBucket":"...","messagingSenderId":"...","appId":"..."}
Inicia el servidor de desarrollo:

```bash
   npm run dev

---

## 🛣️ Roadmap (Próximas Mejoras)

PostPilot es un proyecto en evolución continua. Estas son las características planeadas para el futuro cercano:

- [ ] **Autopublicación con OAuth 2.0:** Integración directa con las APIs de LinkedIn y X para publicar desde la app.
- [ ] **Gestor de Hilos (Threads):** Renderizado de UI específico para dividir contenido largo en hilos de Twitter.
- [ ] **Migración de Estado a Zustand:** Refactorización del estado global para mejorar el rendimiento.
- [ ] **Paginación en Firestore:** Optimización de lectura de historial con limit() y carga perezosa.

---

## 🧠 Arquitectura de Prompts y Datos

* **Tags de Nicho:** Para evitar la "contaminación de contexto" (*Prompt Pollution*), la aplicación no envía el historial completo a la IA. Utiliza un sistema determinista de Tags seleccionables (ej. "Desarrollo Backend") que se inyectan como parámetros aislados en la herramienta de búsqueda (`googleSearch`) para generar tendencias altamente precisas y reducir el consumo de tokens.
* **Manejo de Tasa de Peticiones (Rate Limiting):** El cliente incluye intercepción de errores HTTP 429 para manejar elegantemente los límites del *Free Tier* de Google mediante notificaciones asíncronas, protegiendo la UI de colapsos.

---

## 🛠️ Decisiones de Ingeniería y Optimización

### 1. Persistencia Parcial y Parcheo Defensivo
Para la actualización de preferencias de usuario (idioma y contexto de personalidad), se implementó una mutación de red tipo `PATCH` utilizando la directiva `{ merge: true }` de Firestore. Esto evita la sobreescritura accidental de metadatos críticos del perfil de autenticación (`email`, `createdAt`) durante las actualizaciones visuales de la interfaz.

### 2. Optimización del Árbol de Renderizado (i18n)
Se evitó el uso de librerías externas de internacionalización pesadas para mantener el bundle size optimizado. Las traducciones se gestionan mediante un diccionario estático desacoplado del core del cliente, inyectando propiedades de forma unidireccional y calculando las variantes del texto mediante lógica derivada, reduciendo los ciclos de re-renderizado innecesarios en componentes hijos como `ActionPanel` y `OutputCanvas`.

### 3. Mitigación de Errores Asíncronos de Red
La integración con la API REST de Gemini-2.5-Flash cuenta con un bloque interceptor de excepciones que traduce los códigos de estado HTTP (como el error 429 de superación de cuotas o caídas de red) en respuestas comprensibles para el usuario a través de componentes de notificación asíncronos (`react-hot-toast`), garantizando que la aplicación no falle en silencio ante caídas del servidor de IA.

## 🤝 Contribuciones
Este proyecto fue desarrollado como un caso de estudio técnico y arquitectónico. Para mantener la integridad y trazabilidad de la autoría original frente a evaluaciones técnicas, actualmente no se aceptan Pull Requests.
Sin embargo, eres completamente libre de hacer un fork del repositorio, clonarlo y experimentar con el código para tus propios proyectos bajo los términos de la Licencia MIT.

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.
