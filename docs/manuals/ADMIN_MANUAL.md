# Manual Operativo: Administradores y Supervisores

Bienvenido al panel restrictivo de **Mindpath Neuro**. Esta guía está dirigida al personal de soporte hospitalario y directores de la clínica.

_(A estos módulos **solo** se puede ingresar si el rol de cuenta es `admin` o `supervisor`)_

## 1. Ingresando al Panel Master

Al iniciar sesión con tus credenciales de administrador, serás dirigido directamente a `/admin`. No verás las pestañas visuales del paciente.

El panel principal es un Centro de Estadística donde puedes visualizar:

- Número de Consultas Realizadas en el Mes.
- Altas Nuevas de Pacientes.
- Actividad de Conexión de Médicos.

_(Los widgets de métricas se alimentan directamente de las sumas totales en Node.js)_.

## 2. Validación de Nuevos Doctores (Módulo Pendientes)

Como medida de mitigación de spam y fraude médico, todos los doctores que se registren aparecen desactivados en el directorio por defecto.

1. Ve a la sección **Solicitudes Médicas / Pendientes**.
2. Verás una lista en formato tabla de los especialistas esperando revisión.
3. Evalúa tu cédula o licencia médica subida (o provista).
4. Utiliza los botones de **Aprobar** o **Denegar**. Al denegar, el sistema retendrá el registro de este médico pero no lo mostrará al ojo del público sin importar sus turnos de agenda.

## 3. Suspensión de Cuentas (`is_active`)

En caso de presentarse disputas en la página (violación de T&C), el Administrador puede buscar al usuario en concreto y marcarlo como bloqueado en la base de datos (despojándolo del derecho a iniciar sesión) usando los interruptores rápidos de la tabla "Usuarios del Sistema".
