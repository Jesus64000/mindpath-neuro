# Guía de Despliegue (Mindpath Neuro)

Esta guía explica cómo empaquetar y subir **Mindpath Neuro** a un entorno de producción (Nube o Servidor VPS Dedicado).

El software está dividido en dos grandes bloques tecnológicos que deben hostearse por separado (o en el mismo VPS usando puertos distintos).

## 1. Despliegue del Frontend (React + Vite)

El frontend requiere convertirse de archivos JSX interactivos a HTML/JS/CSS puros que cualquier navegador pueda entender sin Node.js instalado.

### Pasos

1. Abre tu terminal en la carpeta `/frontend`.
2. Renombra el `.env.development` a `.env.production` (o simplemente cambia la variable). El backend ya no debe apuntar a localhost en esta versión:
   ```env
   VITE_API_URL=https://nube-mindpath.com/api
   ```
3. Ejecuta el compilador en su versión optimizada:
   ```bash
   npm run build
   ```
4. Se generará una carpeta mágica llamada `/dist`.
5. Todo el contenido de `/dist` lo puedes arrastrar y soltar a plataformas gratuitas o de pago estáticas (Ej: Vercel, Netlify, Github Pages, o la carpeta pública de tu servidor Apache/Nginx).

## 2. Despliegue del Backend (Node.js REST API)

El backend es el motor que mantiene viva la app. Requiere un VPS o host de Serverless (Ej: Render, Heroku o AWS EC2). No puede hostearse en Netlify/Vercel (como el Frontend) porque necesita acceso a escritura del disco duro para fotos y un _watch_ persistente.

### Pasos

1. Ve a la carpeta `/backend`.
2. Sube la carpeta a tu VPS.
3. Configura el archivo `.env` de producción. En especial, asegurate que `NODE_ENV=production` y de escribir contraseñas fuertes para la base de datos externa en la nube:
   ```env
   NODE_ENV=production
   PORT=80
   DB_HOST=192.168.x.x
   DB_PASSWORD=********
   ```
4. Instala solo dependencias de producción: `npm install --omit=dev`.
5. Ejecuta:
   ```bash
   node server.js
   # O mejor aún, usa un gestor de procesos como PM2 para que no se apague:
   # pm2 start server.js --name "MindpathBackend"
   ```

## 3. Despliegue de la Base de Datos (MySQL)

Usa los mismos scripts que empleaste localmente (`docs/sql_*`). Importalos a tu motor remoto de bases de datos de Amazon RDS o MySQL local en Cpanel/Hostgator.

¡Listo! Tú proyecto ya está global y vivo.
