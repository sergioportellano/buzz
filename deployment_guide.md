# Deployment Guide for Buzz (MVP)

Para subir el juego a internet, necesitamos dos partes: el **Cliente** (lo que ve el usuario) y el **Servidor** (la lógica y WebSockets).

## 1. Requisitos
*   **Cuenta en GitHub/GitLab:** Para alojar el código.
*   **Servicio de Hosting Frontend:** Recomendado **Vercel** o **Netlify** (Gratis y muy rápidos).
*   **Servicio de Hosting Backend:** Recomendado **Railway** o **Render** (Soportan Node.js + WebSockets persistentes).

---

## 2. Preparación del Código
Antes de subir, asegúrate de que el Cliente sepa a dónde conectarse.

### Variables de Entorno
En `apps/client`, el código usa hardcoded `http://localhost:3000`. Debemos cambiarlo para usar variables de entorno.

1.  En `apps/client/src/store/userStore.ts`:
    ```typescript
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    ```
2.  En `apps/server`, definir el puerto mediante `process.env.PORT`.

---

## 3. Guía Paso a Paso

### Paso A: Subir a GitHub
1.  Crea un repositorio en GitHub.
2.  Sube todo el monorepo.

### Paso B: Desplegar Backend (Railway)
1.  Entra a [Railway.app](https://railway.app) y crea un "New Project" desde GitHub.
2.  Selecciona tu repo.
3.  **Configuración:**
    *   **Root Directory:** `apps/server` (o configura el comando de build desde la raíz para que haga build de shared + server).
    *   **Build Command:** `npm install && npm run build` (Asegúrate de que instala dependencias del monorepo).
    *   **Start Command:** `npm start` (que ejecute `node dist/index.js`).
    *   *Nota:* Railway detectará el puerto automáticamente.
4.  Una vez desplegado, Railway te dará una URL (ej: `buzz-server-production.up.railway.app`). **Cópiala**.

### Paso C: Desplegar Frontend (Vercel)
1.  Entra a [Vercel.com](https://vercel.com) y crea un "New Project".
2.  Selecciona tu repo.
3.  **Project Settings:**
    *   **Root Directory:** `apps/client`.
    *   **Framework Preset:** Vite.
4.  **Environment Variables:**
    *   Añade `VITE_API_URL` = `https://buzz-server-production.up.railway.app` (La URL de tu backend sin la barra final).
5.  Dale a **Deploy**.

---

## 4. Notas Importantes (HTTPS)
*   Al desplegar en Vercel/Railway, todo funcionará bajo **HTTPS**.
*   Los navegadores requieren HTTPS para usar la **Web Audio API** y el micro, así que esto es obligatorio.
*   WebSockets funcionará automáticamente sobre `wss://`.

## 5. Docker (Alternativa VPS)
Si prefieres un VPS propio (DigitalOcean), la mejor opción es usar Docker Compose para levantar ambos servicios o contenerizarlos.
