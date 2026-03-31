import { useState, useEffect } from 'react';
import { 
    X, Calendar, Activity, Mail, Phone, Shield, User, MapPin, 
    CreditCard, Stethoscope, Briefcase, Languages, GraduationCap, 
    FileText, DollarSign, Globe, CheckCircle2, RefreshCw
} from 'lucide-react';
import api from '../../../api/axiosConfig';

const UserDetailModal = ({ user, onClose }) => {
    const [fullData, setFullData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sendingReset, setSendingReset] = useState(false);
    const [resetSent, setResetSent] = useState(false);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const res = await api.get(`/admin/users/${user.id}/history`);
                setFullData(res.data);
            } catch {
                console.error("Error cargando detalles");
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
        
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = 'unset'; };
    }, [user.id]);

    const handleSendReset = async () => {
        if (sendingReset || resetSent) return;
        setSendingReset(true);
        try {
            await api.post(`/admin/users/${user.id}/send-reset`);
            setResetSent(true);
            setTimeout(() => setResetSent(false), 5000);
        } catch (error) {
            alert(error.response?.data?.message || "Error al enviar correo de recuperación");
        } finally {
            setSendingReset(false);
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            completed: 'bg-green-500/10 text-green-500 border border-green-500/20',
            cancelled: 'bg-red-500/10 text-red-500 border border-red-500/20',
            scheduled: 'bg-blue-500/10 text-blue-500 border border-blue-500/20',
            confirmed: 'bg-mindpath-primary/10 text-mindpath-primary border border-mindpath-primary/20',
            pending: 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
        };
        const style = badges[status] || 'bg-gray-500/10 text-gray-500 border border-gray-500/20';
        return <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${style}`}>{status}</span>;
    };

    const InfoCard = ({ icon: Icon, label, value, fullWidth = false }) => (
        <div className={`bg-gray-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-gray-100 dark:border-slate-700/50 group hover:border-mindpath-primary/30 transition-colors ${fullWidth ? 'col-span-full' : ''}`}>
            <p className="text-[10px] text-gray-400 dark:text-slate-500 font-black uppercase mb-1.5 flex items-center gap-2 tracking-widest">
                <Icon size={12} className="text-mindpath-primary/60 group-hover:text-mindpath-primary transition-colors"/> 
                {label}
            </p>
            <p className="text-sm text-gray-900 dark:text-slate-200 font-bold leading-relaxed">{value || 'No especificado'}</p>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-fadeIn">
            <div className="bg-white dark:bg-[#111827] rounded-[2.5rem] w-full max-w-5xl shadow-2xl border border-gray-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[95vh] animate-slideUp">
                
                {/* 1. HEADER INTEGRADO */}
                <div className="flex justify-between items-center p-8 border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <div className="h-20 w-20 bg-gradient-to-br from-mindpath-primary to-indigo-600 rounded-3xl flex items-center justify-center text-white font-black text-3xl shadow-xl shadow-mindpath-primary/20">
                                {user.full_name?.charAt(0)}
                            </div>
                            <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-green-500 border-4 border-white dark:border-[#111827] rounded-full shadow-lg"></div>
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{user.full_name}</h2>
                                <span className="text-[10px] font-black tracking-[0.2em] uppercase bg-gray-100 dark:bg-slate-800 text-mindpath-primary border border-mindpath-primary/20 px-3 py-1 rounded-full">
                                    {user.role}
                                </span>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-slate-400 flex items-center gap-2 mt-1.5 font-bold">
                                <Mail size={16} className="text-gray-400 dark:text-slate-500"/> {user.email}
                                <span className="mx-2 text-gray-200 dark:text-slate-700">|</span>
                                <span className="text-gray-400 dark:text-slate-500 uppercase tracking-tighter">ID #{user.id}</span>
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-3 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-500 dark:text-slate-300 rounded-2xl transition-all border border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-500 hover:rotate-90"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* 2. BODY GRID (DOS COLUMNAS) */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                    
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-100 dark:border-slate-800 border-t-mindpath-primary"></div>
                            <p className="text-gray-400 dark:text-slate-500 font-black text-xs uppercase tracking-widest animate-pulse">Obteniendo expediente completo...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                            
                            {/* COLUMNA IZQUIERDA: PERFIL EXHAUSTIVO (5/12) */}
                            <div className="lg:col-span-5">
                                <div className="sticky top-0 space-y-8 self-start">
                                    <section className="space-y-4">
                                        <h3 className="text-[11px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.25em] flex items-center gap-3">
                                            <div className="h-1 w-6 bg-mindpath-primary rounded-full"></div>
                                            Ficha de Identidad
                                        </h3>
                                        
                                        <div className="grid grid-cols-2 gap-3">
                                            <InfoCard icon={CreditCard} label="Documento / DNI" value={fullData?.profile?.dni} />
                                            <InfoCard icon={Phone} label="Teléfono" value={fullData?.profile?.phone} />
                                            
                                            {user.role === 'patient' && (
                                                <>
                                                    <InfoCard icon={Calendar} label="Fecha Nac." value={fullData?.profile?.date_of_birth ? new Date(fullData.profile.date_of_birth).toLocaleDateString() : ''} />
                                                    <InfoCard icon={Shield} label="Seguro Med." value={fullData?.profile?.health_insurance} />
                                                    <InfoCard icon={User} label="Contacto Emerg." value={fullData?.profile?.emergency_contact} />
                                                    <InfoCard icon={Globe} label="Género" value={fullData?.profile?.gender} />
                                                </>
                                            )}

                                            {user.role === 'doctor' && (
                                                <>
                                                    <InfoCard icon={Stethoscope} label="Especialidad" value={fullData?.profile?.specialty} />
                                                    <InfoCard icon={FileText} label="Licencia" value={fullData?.profile?.license_number} />
                                                    <InfoCard icon={Briefcase} label="Años Exp." value={fullData?.profile?.experience_years} />
                                                    <InfoCard icon={Languages} label="Idiomas" value={fullData?.profile?.languages} />
                                                    <InfoCard icon={GraduationCap} label="Educación" value={fullData?.profile?.education} fullWidth />
                                                    <InfoCard icon={CreditCard} label="RIF" value={fullData?.profile?.rif} />
                                                    <InfoCard icon={DollarSign} label="Costo Consult." value={fullData?.profile?.consultation_fee ? `$${fullData.profile.consultation_fee}` : ''} />
                                                </>
                                            )}

                                            <InfoCard icon={MapPin} label="Dirección / Clínica" value={fullData?.profile?.address || fullData?.profile?.clinic_name} fullWidth />
                                            {fullData?.profile?.clinic_address && (
                                                <InfoCard icon={MapPin} label="Dirección Clínica" value={fullData.profile.clinic_address} fullWidth />
                                            )}
                                            
                                            {fullData?.profile?.bio && (
                                                <div className="col-span-full bg-gray-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-gray-100 dark:border-slate-700/50">
                                                    <p className="text-[10px] text-gray-400 dark:text-slate-500 font-black uppercase mb-2 flex items-center gap-2 tracking-widest">
                                                        <FileText size={12} className="text-mindpath-primary/60"/> Bio Profesional
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed font-medium line-clamp-4 italic">
                                                        "{fullData.profile.bio}"
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </section>
                                </div>
                            </div>

                            {/* COLUMNA DERECHA: RADIOGRAFÍA (7/12) */}
                            <div className="lg:col-span-span-7 space-y-8">
                                <section className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-[11px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.25em] flex items-center gap-3">
                                            <div className="h-1 w-6 bg-indigo-500 rounded-full"></div>
                                            Radiografía de Actividad
                                        </h3>
                                        <span className="text-[10px] text-gray-300 dark:text-slate-600 font-black uppercase">Últimos 10 registros</span>
                                    </div>
                                    
                                    <div className="space-y-3">
                                        {fullData?.history?.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center p-12 bg-gray-50 dark:bg-slate-900/40 rounded-[2rem] border border-dashed border-gray-200 dark:border-slate-800">
                                                <Calendar size={48} className="text-gray-200 dark:text-slate-800 mb-4"/>
                                                <p className="text-sm text-gray-400 dark:text-slate-600 font-bold">Expediente de citas vacío.</p>
                                            </div>
                                        ) : (
                                            fullData?.history?.map((appt, i) => (
                                                <div key={i} className="group p-5 bg-gray-50 dark:bg-slate-900/40 rounded-3xl border border-gray-100 dark:border-slate-800 flex justify-between items-center transition-all hover:bg-gray-100/50 dark:hover:bg-slate-800/20">
                                                    <div className="flex items-center gap-5">
                                                        <div className="h-12 w-12 bg-gray-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-gray-400 dark:text-slate-500 group-hover:text-mindpath-primary group-hover:bg-mindpath-primary/10 transition-all">
                                                            <User size={22}/>
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-base text-gray-900 dark:text-slate-200 group-hover:text-black dark:group-hover:text-white transition-colors">
                                                                {user.role === 'patient' ? `Dr. ${appt.counterparty_name}` : appt.counterparty_name}
                                                            </p>
                                                            <div className="flex items-center gap-4 mt-1.5">
                                                                {appt.specialty && (
                                                                    <span className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-wider">{appt.specialty}</span>
                                                                )}
                                                                <span className="text-[11px] text-gray-500 dark:text-slate-500 flex items-center gap-1.5 font-bold">
                                                                    <Calendar size={13} className="text-gray-400 dark:text-slate-600"/> 
                                                                    {new Date(appt.appointment_date).toLocaleDateString('es-ES')}
                                                                    <span className="mx-1 text-gray-200 dark:text-slate-800">|</span>
                                                                    {appt.start_time.substring(0,5)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        {getStatusBadge(appt.status)}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </section>
                            </div>

                        </div>
                    )}
                </div>

                {/* 3. FOOTER: ZONA DE SEGURIDAD (Fase 3) */}
                <div className="p-8 bg-gray-50 dark:bg-slate-900/80 border-t border-gray-100 dark:border-slate-800">
                    <div className="relative overflow-hidden p-6 bg-gradient-to-br from-red-100/50 dark:from-red-950/20 to-transparent border border-red-500/20 dark:border-red-900/30 rounded-[2rem] group">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.5)]"></div>
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                            <div className="flex items-start gap-4">
                                <div className="h-12 w-12 bg-red-600/10 rounded-2xl flex items-center justify-center text-red-500 shrink-0 border border-red-600/20">
                                    <Shield size={24}/>
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-red-600 dark:text-red-500 flex items-center gap-3 uppercase tracking-widest">
                                        Zona de Seguridad
                                    </h3>
                                    <p className="text-xs text-red-600/60 dark:text-red-300/40 mt-1 font-bold leading-relaxed max-w-lg">
                                        {resetSent 
                                            ? `¡Enlace enviado a ${user.email}! El token expirará en 1 hora.`
                                            : `Gestión de credenciales para ${user.full_name}. Motor de recuperación por email activo.`
                                        }
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={handleSendReset}
                                disabled={sendingReset || resetSent} 
                                className={`w-full sm:w-auto px-8 py-4 border rounded-2xl text-[11px] font-black tracking-[0.2em] uppercase flex items-center justify-center gap-3 transition-all duration-500 shadow-xl ${
                                    resetSent 
                                    ? 'bg-green-600/20 border-green-500 text-green-500' 
                                    : 'bg-red-600/10 border-red-600/20 text-red-600 hover:bg-red-600 hover:text-white hover:border-red-600 shadow-red-900/10'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                {sendingReset ? <RefreshCw className="animate-spin" size={16}/> : (resetSent ? <CheckCircle2 size={16}/> : <Mail size={16}/>)}
                                {sendingReset ? 'ENVIANDO...' : (resetSent ? '¡ENVIADO CON ÉXITO!' : 'ENVIAR RECUPERACIÓN')}
                            </button>
                        </div>
                    </div>
                </div>

            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #334155; }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
                .animate-slideUp { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
            `}</style>
        </div>
    );
};

export default UserDetailModal;
