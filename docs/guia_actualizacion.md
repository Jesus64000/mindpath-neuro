🚀 Guía de Actualización de Mindpath Neuro (Versión 1.40 - Enterprise)
¡Hola! Ya está lista la nueva súper-actualización del sistema. Esta versión transforma el panel en una herramienta de grado corporativo e incluye: Motor Avanzado de Agendamiento, Gestión de Vacaciones, Recuperación de Contraseñas por Correo, Cifrado de Seguridad Militar (AES-256), y Tablas Ultra-rápidas con Paginación.

Para instalar estas mejoras sin perder la información de tus pacientes o citas actuales, por favor sigue estos 5 pasos exactos:

📦 PASO 1: Descargar el nuevo código
Abre tu terminal (o consola de comandos) en la carpeta principal del proyecto.

Si el servidor está encendido, apágalo presionando Ctrl + C.

Escribe el siguiente comando y presiona Enter para traer la última versión:

Bash
git pull origin main
🛠️ PASO 2: Instalar las nuevas herramientas
Como agregamos nuevas funciones críticas (motor de correos y calendarios), el sistema necesita descargar esas librerías.

Entra a la carpeta del backend y actualiza:

Bash
cd backend
npm install
Vuelve atrás, entra a la carpeta del frontend y actualiza:

Bash
cd ../frontend
npm install
🔐 PASO 3: Configurar la Llave de Seguridad (¡CRÍTICO!)
Hemos blindado el sistema. Para que los correos y contraseñas estén a salvo, necesitas agregar una llave maestra a tu servidor.

En la carpeta backend, abre el archivo llamado .env (si no lo ves, asegúrate de mostrar los archivos ocultos).

Agrega esta línea exacta al final del archivo y guárdalo:

Fragmento de código
ENCRYPTION_KEY="MindpathSecr3tK3y!2026@NeuroApp$"
🗄️ PASO 4: Parchar la Base de Datos (Sin perder datos)
Te he enviado un archivo llamado actualizacion_v1_40.sql. Este archivo inyectará las nuevas funciones (como el soporte para correos y DNI) sin borrar a tus pacientes.

Abre XAMPP/WAMP y asegúrate de que MySQL esté encendido.

Entra a phpMyAdmin (http://localhost/phpmyadmin) y haz clic en tu base de datos mindpath_db en el panel izquierdo.

Ve a la pestaña Importar en el menú superior.

Haz clic en "Seleccionar archivo", busca el archivo actualizacion_v1_40.sql y presiona el botón Importar (o Continuar) al final de la página.

Nota: Si te sale un error de "Duplicate column", ignóralo; significa que esa parte ya estaba actualizada.

🚀 PASO 5: Encender los motores y Configurar Correo
Vuelve a tu terminal y enciende el sistema como lo haces normalmente:

Bash

# En una terminal para el backend

cd backend
npm run dev

# En otra terminal para el frontend

cd frontend
npm run dev
¡Toque Final! Entra al Panel de Administración en tu navegador, ve a la pestaña Personalización, y en la nueva sección de "Configuración de Servidor de Correo" ingresa tu correo de soporte y tu Contraseña de Aplicación de Gmail. ¡Guarda los cambios y el sistema estará 100% operativo! ✨
