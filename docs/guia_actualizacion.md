# 🚀 Guía de Actualización de Mindpath Neuro (Versión 1.38)

¡Hola! Ya está lista la nueva versión del sistema. Esta actualización incluye el Motor Avanzado de Agendamiento, gestión de vacaciones para doctores, gráficos de estadísticas mejorados y nuevas tipografías.

Para instalar estas mejoras sin perder la información de tus pacientes o citas actuales, por favor sigue estos 4 pasos exactos:

---

### 📦 PASO 1: Descargar el nuevo código

1. Abre tu terminal (o consola de comandos) en la carpeta principal del proyecto.
2. Si el servidor está encendido, apágalo presionando **Ctrl + C**.
3. Escribe el siguiente comando y presiona Enter para traer la última versión:

```bash
git pull origin main
```

---

### 🛠️ PASO 2: Instalar las nuevas herramientas
Como agregamos nuevas funciones (calendarios visuales y tareas automáticas), el sistema necesita descargar esas librerías.

1. Entra a la carpeta del **backend** y actualiza:
   ```bash
   cd backend
   npm install
   ```
2. Vuelve atrás, entra a la carpeta del **frontend** y actualiza:
   ```bash
   cd ../frontend
   npm install
   ```

---

### 🗄️ PASO 3: Parchar la Base de Datos (Seguro y sin perder datos)
Te he enviado un archivo llamado `pendiente.sql`. Este archivo inyectará las nuevas columnas necesarias sin borrar a tus pacientes actuales.

1. Abre XAMPP/WAMP y asegúrate de que MySQL esté encendido.
2. Entra a **phpMyAdmin** (`http://localhost/phpmyadmin`) y haz clic en tu base de datos `mindpath_db` en el panel izquierdo.
3. Ve a la pestaña **Importar** en el menú superior.
4. Haz clic en "Seleccionar archivo", busca el archivo `docs/pendiente.sql` y presiona el botón **Importar** (o Continuar) al final de la página.

> **Nota:** Si te sale un error de *"Duplicate column"*, ignóralo; significa que esa parte ya estaba actualizada.

---

### 🚀 PASO 4: Encender los motores

1. Vuelve a tu terminal y enciende el sistema como lo haces normalmente:
   ```bash
   # En una terminal para el backend
   cd backend
   npm run dev

   # En otra terminal para el frontend
   cd frontend
   npm run dev
   ```

¡Listo! Al recargar la página en tu navegador ya tendrás acceso a todas las nuevas herramientas. ✨
