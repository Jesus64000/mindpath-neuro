import { useState } from 'react';
import { Mail, Video, ShieldCheck, Save, RefreshCw, Lock, CheckCircle, Clock } from 'lucide-react';

const IntegrationsTab = ({ 
    theme, 
    setTheme, 
    onSave, 
    saving, 
    onSendTestEmail, 
    sendingTestEmail 
}) => {
    const [testEmailInput, setTestEmailInput] = useState('');

    return (
        <div className="space-y-8 animate-fadeIn">
            <div>
                <h2 className="font-bold text-xl text-gray-900 dark:text-white flex items-center gap-2">
                    🔌 Integraciones & Llaves API (Servicios Externos)
                </h2>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                    Gestiona de forma centralizada las credenciales de correo SMTP y videoconferencias ZEGOCLOUD. Las llaves guardadas aquí tienen prioridad dinámica sobre el servidor.
                </p>
            </div>

            {/* BANNER DE SEGURIDAD MILITAR */}
            <div className="bg-gradient-to-r from-purple-900/90 via-indigo-900/90 to-slate-900 p-6 rounded-3xl text-white shadow-xl border border-purple-500/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                <div className="flex items-start gap-4 relative z-10">
                    <div className="p-3 bg-purple-500/20 rounded-2xl border border-purple-400/30 text-purple-300 shrink-0">
                        <ShieldCheck size={28} />
                    </div>
                    <div className="space-y-1.5">
                        <h3 className="font-black text-base tracking-wide flex items-center gap-2">
                            🔒 Arquitectura de Seguridad y Privacidad Garantizada
                        </h3>
                        <p className="text-xs text-purple-100/80 leading-relaxed max-w-3xl">
                            • <strong>Protección por Rol:</strong> Esta sección solo es accesible para Super Administradores (<span className="text-purple-300 font-mono">admin</span>). Supervisores, doctores y pacientes tienen bloqueado el acceso a nivel de backend.<br />
                            • <strong>Cifrado AES-256-CBC:</strong> Las credenciales sensibles (Contraseñas de Aplicación y Server Secrets) se cifran simétricamente en la base de datos.<br />
                            • <strong>Enmascaramiento en Consola:</strong> Al cargar la interfaz, los secretos se ofuscan automáticamente (<span className="font-mono text-purple-300">••••••••</span>) para evitar la extracción mediante inspección del navegador.
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); onSave(); }} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* 1. SERVIDOR DE CORREO (SMTP) */}
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-gray-100 dark:border-slate-700/60 shadow-sm flex flex-col justify-between border-l-4 border-l-mindpath-primary">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 bg-mindpath-primary/10 rounded-2xl text-mindpath-primary">
                                    <Mail size={22} />
                                </div>
                                <div>
                                    <h3 className="font-black text-base text-gray-900 dark:text-white">Servidor de Correo (SMTP)</h3>
                                    <p className="text-xs text-gray-400 font-medium">Verificación, Notificaciones y Recuperación</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                                        Email del Sistema (Gmail / Workspace)
                                    </label>
                                    <input 
                                        type="email"
                                        value={theme.smtp_email || ''} 
                                        onChange={e => setTheme(p => ({ ...p, smtp_email: e.target.value }))}
                                        placeholder="ejemplo@gmail.com"
                                        className="w-full p-3.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-mindpath-primary outline-none" 
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider flex items-center justify-between">
                                        <span>Contraseña de Aplicación de Google</span>
                                        <Lock size={12} className="text-purple-400" />
                                    </label>
                                    <input 
                                        type="password"
                                        value={theme.smtp_password || ''} 
                                        onChange={e => setTheme(p => ({ ...p, smtp_password: e.target.value }))}
                                        placeholder="•••• •••• •••• ••••"
                                        className="w-full p-3.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-mindpath-primary outline-none font-mono" 
                                    />
                                    <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-2 leading-relaxed">
                                        Usa una <strong>Contraseña de Aplicación</strong> de 16 caracteres generada desde tu cuenta de Google.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Probar conexión de correo */}
                        <div className="mt-6 pt-4 border-t border-gray-100 dark:border-slate-700/60 space-y-2">
                            <label className="block text-xs font-bold text-gray-600 dark:text-slate-400 uppercase">🧪 Probar Envío de Correo Real</label>
                            <div className="flex gap-2">
                                <input 
                                    type="email"
                                    value={testEmailInput}
                                    onChange={e => setTestEmailInput(e.target.value)}
                                    placeholder="Correo destinatario para la prueba..."
                                    className="flex-1 p-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-mindpath-primary"
                                />
                                <button
                                    type="button"
                                    disabled={sendingTestEmail}
                                    onClick={() => onSendTestEmail && onSendTestEmail(testEmailInput)}
                                    className="px-4 py-2.5 bg-mindpath-primary hover:bg-mindpath-primaryHover text-white text-xs font-bold rounded-xl transition-all shrink-0 flex items-center gap-1.5 shadow-md disabled:opacity-50"
                                >
                                    {sendingTestEmail ? <RefreshCw size={14} className="animate-spin" /> : <Mail size={14} />}
                                    {sendingTestEmail ? 'Enviando...' : 'Enviar Prueba'}
                                </button>
                            </div>
                        </div>

                        {/* Recordatorio de Cita */}
                        <div className="mt-6 pt-6 border-t border-gray-100 dark:border-slate-700/60">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 bg-mindpath-primary/10 rounded-2xl text-mindpath-primary">
                                    <Clock size={22} />
                                </div>
                                <div>
                                    <h3 className="font-black text-base text-gray-900 dark:text-white">Recordatorio de Citas</h3>
                                    <p className="text-xs text-gray-400 font-medium">Antelación para el correo de recordatorio</p>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                                    Antelación de Notificación
                                </label>
                                <select 
                                    value={theme.appointment_reminder_offset_minutes ?? 90} 
                                    onChange={e => setTheme(p => ({ ...p, appointment_reminder_offset_minutes: Number(e.target.value) }))}
                                    className="w-full p-3.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-mindpath-primary outline-none"
                                >
                                    <option value={90}>1 hora y 30 minutos (90 minutos)</option>
                                    <option value={60}>1 hora (60 minutos)</option>
                                    <option value={30}>30 minutos (30 minutos)</option>
                                    <option value={3}>3 minutos (3 minutos)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* 2. VIDEOLLAMADAS WEBRTC (ZEGOCLOUD) */}
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-gray-100 dark:border-slate-700/60 shadow-sm flex flex-col justify-between border-l-4 border-l-blue-500">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 bg-blue-500/10 rounded-2xl text-blue-500">
                                    <Video size={22} />
                                </div>
                                <div>
                                    <h3 className="font-black text-base text-gray-900 dark:text-white">Videollamadas Telemedicina (ZEGOCLOUD)</h3>
                                    <p className="text-xs text-gray-400 font-medium">Salas Virtuales de Consulta Doctor - Paciente</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                                        App ID (Numérico)
                                    </label>
                                    <input 
                                        type="text"
                                        value={theme.zego_app_id || ''} 
                                        onChange={e => setTheme(p => ({ ...p, zego_app_id: e.target.value }))}
                                        placeholder="Ej: 123456789"
                                        className="w-full p-3.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-mono" 
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider flex items-center justify-between">
                                        <span>Server Secret (Clave Secreta)</span>
                                        <Lock size={12} className="text-blue-400" />
                                    </label>
                                    <input 
                                        type="password"
                                        value={theme.zego_server_secret || ''} 
                                        onChange={e => setTheme(p => ({ ...p, zego_server_secret: e.target.value }))}
                                        placeholder="•••• •••• •••• ••••"
                                        className="w-full p-3.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-mono" 
                                    />
                                    <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-2 leading-relaxed">
                                        Obtén el <strong>AppID</strong> y <strong>ServerSecret</strong> desde la consola de proyectos de <a href="https://console.zegocloud.com/" target="_blank" rel="noreferrer" className="text-blue-500 underline font-bold">ZEGOCLOUD Console</a>.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-gray-100 dark:border-slate-700/60 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                            <CheckCircle size={14} className="text-green-500 shrink-0" />
                            <span>Las salas virtuales actualizarán sus credenciales dinámicamente al guardar.</span>
                        </div>
                    </div>

                </div>

                {/* BOTÓN GUARDAR */}
                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-8 py-4 bg-mindpath-primary hover:bg-mindpath-primaryHover text-white font-black rounded-2xl shadow-xl hover:shadow-none transition-all flex items-center gap-2 text-xs uppercase tracking-wider disabled:opacity-50"
                    >
                        {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                        {saving ? 'Guardando...' : 'Guardar Llaves API e Integraciones'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default IntegrationsTab;
