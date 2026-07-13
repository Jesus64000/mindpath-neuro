import { useState, useEffect } from 'react';
import { Mail, Clock, Send, ShieldAlert, Sparkles, CheckCircle2, User, RefreshCw, ChevronRight, XCircle } from 'lucide-react';
import api from '../../api/axiosConfig';

const EmailTester = () => {
    const [email, setEmail] = useState('correoejemplo@hotmail.com');
    const [name, setName] = useState('Paciente de Pruebas');
    const [minutesRemaining, setMinutesRemaining] = useState(30);
    const [rejectionReason, setRejectionReason] = useState('No se adjuntaron credenciales médicas vigentes.');
    const [sendDelay, setSendDelay] = useState(0); // in minutes: 0 = immediate, 1..5
    const [scheduledEmails, setScheduledEmails] = useState({}); // { [type]: secondsRemaining }
    
    const [loading, setLoading] = useState(null); // Type of loading email
    const [status, setStatus] = useState(null); // { success, message }

    // Procesar cuenta regresiva para correos programados
    useEffect(() => {
        const activeKeys = Object.keys(scheduledEmails);
        if (activeKeys.length === 0) return;

        const interval = setInterval(() => {
            setScheduledEmails(prev => {
                const next = { ...prev };
                for (const key of Object.keys(next)) {
                    if (next[key] <= 1) {
                        delete next[key];
                        triggerActualSend(key);
                    } else {
                        next[key] -= 1;
                    }
                }
                return next;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [scheduledEmails, email, name, minutesRemaining, rejectionReason]);

    const triggerActualSend = async (type) => {
        setLoading(type);
        setStatus(null);
        try {
            const payload = {
                email,
                type,
                name,
                minutes_remaining: minutesRemaining,
                reason: rejectionReason
            };
            const res = await api.post('/test-email/send', payload);
            setStatus({ success: true, message: res.data.message || 'Correo de prueba enviado con éxito.' });
        } catch (error) {
            console.error(error);
            setStatus({ 
                success: false, 
                message: error.response?.data?.message || 'Error al enviar el correo de prueba.' 
            });
        } finally {
            setLoading(null);
        }
    };

    const handleSendTestEmail = async (type) => {
        // Cancelar si ya está programado
        if (scheduledEmails[type] !== undefined) {
            setScheduledEmails(prev => {
                const next = { ...prev };
                delete next[type];
                return next;
            });
            setStatus({ success: true, message: 'Envío programado cancelado con éxito.' });
            return;
        }

        if (sendDelay === 0) {
            triggerActualSend(type);
        } else {
            setScheduledEmails(prev => ({
                ...prev,
                [type]: sendDelay * 60
            }));
            setStatus({ success: true, message: `El envío se ha programado para dentro de ${sendDelay} minuto(s).` });
        }
    };

    const emailTypes = [
        {
            category: '📅 Flujo de Citas Médicas',
            description: 'Envía correos dinámicos con branding adaptativo, montos y contadores de tiempo.',
            items: [
                { id: 'confirmation', label: 'Confirmación de Cita', icon: CheckCircle2, color: 'from-emerald-500 to-teal-600' },
                { id: 'reminder', label: 'Recordatorio de Cita', icon: Clock, color: 'from-amber-500 to-orange-600' }
            ]
        },
        {
            category: '🔐 Autenticación y Cuentas',
            description: 'Correos de verificación, restablecimiento de contraseña y bienvenida inicial.',
            items: [
                { id: 'verification', label: 'Verificación de Cuenta', icon: Mail, color: 'from-blue-500 to-indigo-600' },
                { id: 'reset_password', label: 'Restablecer Contraseña', icon: ShieldAlert, color: 'from-purple-500 to-pink-600' },
                { id: 'welcome', label: 'Correo de Bienvenida', icon: Sparkles, color: 'from-cyan-500 to-blue-600' }
            ]
        },
        {
            category: '🩺 Solicitud de Médicos (Onboarding)',
            description: 'Notificaciones sobre el estatus de la validación del perfil médico.',
            items: [
                { id: 'approval', label: 'Aprobación de Registro', icon: User, color: 'from-green-500 to-emerald-600' },
                { id: 'rejection', label: 'Rechazo de Registro', icon: User, color: 'from-rose-500 to-red-600', hasInput: true }
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex items-center justify-center p-6 md:p-12 font-sans relative overflow-hidden">
            {/* Fondo decorativo */}
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
            <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-blue-950/10 rounded-full blur-3xl -z-10"></div>

            <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10">
                
                {/* CONFIGURACIÓN LATERAL */}
                <div className="lg:col-span-5 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-[2rem] p-6 md:p-8 shadow-2xl flex flex-col gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-purple-500/15 border border-purple-500/30 rounded-full text-purple-400 text-xs font-black uppercase tracking-wider mb-4">
                            <Sparkles size={14} className="animate-spin" /> Modo Desarrollador
                        </div>
                        <h1 className="text-3xl font-black text-white tracking-tight leading-none">Email Tester</h1>
                        <p className="text-slate-400 text-xs mt-2 font-medium">Prueba y visualiza las notificaciones de correo del sistema al instante.</p>
                    </div>

                    <hr className="border-slate-800" />

                    <div className="space-y-4">
                        {/* INPUT EMAIL */}
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Correo de Destino</label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input 
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="ejemplo@correo.com"
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-950/50 border border-slate-800 focus:border-purple-500 rounded-2xl text-sm font-semibold text-white focus:outline-none focus:ring-1 focus:ring-purple-500/30 transition-all placeholder-slate-600"
                                />
                            </div>
                        </div>

                        {/* INPUT NOMBRE */}
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nombre del Destinatario</label>
                            <div className="relative">
                                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input 
                                    type="text"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="Nombre del usuario"
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-950/50 border border-slate-800 focus:border-purple-500 rounded-2xl text-sm font-semibold text-white focus:outline-none focus:ring-1 focus:ring-purple-500/30 transition-all"
                                />
                            </div>
                        </div>

                        {/* SLIDER TIEMPO RESTANTE (MINUTOS) */}
                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Antelación de Cita</label>
                                <span className="text-xs font-black text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-lg border border-purple-500/20">{minutesRemaining} min</span>
                            </div>
                            <input 
                                type="range"
                                min="1"
                                max="120"
                                value={minutesRemaining}
                                onChange={e => setMinutesRemaining(Number(e.target.value))}
                                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                            />
                            <div className="flex gap-2 mt-1">
                                {[3, 30, 60, 90].map(mins => (
                                    <button 
                                        key={mins}
                                        onClick={() => setMinutesRemaining(mins)}
                                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-black border uppercase transition-all ${minutesRemaining === mins ? 'bg-purple-500/20 border-purple-500 text-purple-300' : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 text-slate-400'}`}
                                    >
                                        {mins === 90 ? '1.5 hrs' : mins === 60 ? '1 hr' : `${mins}m`}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* RETRASO DE ENVÍO */}
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Retraso de Envío</label>
                            <select 
                                value={sendDelay}
                                onChange={e => setSendDelay(Number(e.target.value))}
                                className="w-full p-3.5 bg-slate-950/50 border border-slate-800 focus:border-purple-500 rounded-2xl text-sm font-semibold text-white focus:outline-none focus:ring-1 focus:ring-purple-500/30 transition-all cursor-pointer"
                            >
                                <option value={0}>🚀 Enviar Inmediatamente</option>
                                <option value={1}>⏱️ Retrasar 1 minuto</option>
                                <option value={2}>⏱️ Retrasar 2 minutos</option>
                                <option value={3}>⏱️ Retrasar 3 minutos</option>
                                <option value={4}>⏱️ Retrasar 4 minutos</option>
                                <option value={5}>⏱️ Retrasar 5 minutos</option>
                            </select>
                        </div>

                        {/* MOTIVO DE RECHAZO */}
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Motivo de Rechazo (Médicos)</label>
                            <textarea 
                                value={rejectionReason}
                                onChange={e => setRejectionReason(e.target.value)}
                                rows="2"
                                placeholder="Escribe el motivo..."
                                className="w-full p-4 bg-slate-950/50 border border-slate-800 focus:border-purple-500 rounded-2xl text-xs font-semibold text-white focus:outline-none focus:ring-1 focus:ring-purple-500/30 transition-all resize-none"
                            />
                        </div>
                    </div>
                </div>

                {/* BOTONES DE DISPARO DE CORREOS */}
                <div className="lg:col-span-7 flex flex-col gap-6">
                    
                    {/* FEEDBACK STATUS */}
                    {status && (
                        <div className={`p-5 rounded-2xl border flex items-start gap-3.5 animate-slideUp ${status.success ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-rose-500/10 border-rose-500/20 text-rose-300'}`}>
                            <div className="mt-0.5">
                                {status.success ? <CheckCircle2 className="text-emerald-400" size={20} /> : <ShieldAlert className="text-rose-400" size={20} />}
                            </div>
                            <div>
                                <h4 className="font-bold text-sm">{status.success ? 'Proceso Exitoso' : 'Error en el Servidor'}</h4>
                                <p className="text-xs mt-1 opacity-90 leading-relaxed">{status.message}</p>
                            </div>
                        </div>
                    )}

                    <div className="space-y-6">
                        {emailTypes.map((cat, idx) => (
                            <div key={idx} className="bg-slate-900/40 border border-slate-800/60 rounded-3xl p-6 shadow-xl flex flex-col gap-4">
                                <div>
                                    <h3 className="font-black text-sm text-white uppercase tracking-wider">{cat.category}</h3>
                                    <p className="text-slate-400 text-xs mt-1 leading-relaxed">{cat.description}</p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {cat.items.map((item) => {
                                        const Icon = item.icon;
                                        const secs = scheduledEmails[item.id];
                                        const isScheduled = secs !== undefined;
                                        const isSending = loading === item.id;
                                        return (
                                            <button
                                                key={item.id}
                                                disabled={loading !== null && !isScheduled}
                                                onClick={() => handleSendTestEmail(item.id)}
                                                className={`group relative flex items-center justify-between p-4 bg-slate-950/60 hover:bg-slate-950/90 border rounded-2xl text-left transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 ${isScheduled ? 'border-purple-500 shadow-lg shadow-purple-500/10 animate-pulse' : 'border-slate-800 hover:border-slate-700/80'}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2.5 rounded-xl bg-gradient-to-br ${item.color} text-white shadow-md group-hover:scale-105 transition-transform`}>
                                                        <Icon size={18} />
                                                    </div>
                                                    <div>
                                                        <span className="block text-xs font-bold text-slate-200 group-hover:text-white transition-colors">{item.label}</span>
                                                        <span className="block text-[10px] text-slate-500 font-bold uppercase mt-0.5 tracking-wider">
                                                            {isScheduled ? `⏳ En 0${Math.floor(secs / 60)}:${(secs % 60).toString().padStart(2, '0')}` : `Test ${item.id}`}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div>
                                                    {isSending ? (
                                                        <RefreshCw className="animate-spin text-purple-400" size={16} />
                                                    ) : isScheduled ? (
                                                        <XCircle className="text-rose-500 hover:scale-110 transition-transform" size={16} title="Cancelar envío" />
                                                    ) : (
                                                        <ChevronRight className="text-slate-600 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all" size={16} />
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default EmailTester;
