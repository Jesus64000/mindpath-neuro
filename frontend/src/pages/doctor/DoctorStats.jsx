import { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import { useNavigate } from 'react-router-dom';
import {
    BarChart3, Activity, Users, Star, Video, MapPin,
    TrendingUp, Award, Calendar, ChevronLeft
} from 'lucide-react';

// ── Helpers ────────────────────────────────────────────────────────────────
const MONTH_NAMES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

const getMonthLabel = (isoMonth) => {
    const [, m] = isoMonth.split('-');
    return MONTH_NAMES[parseInt(m) - 1] || isoMonth;
};

// ── Contador animado ───────────────────────────────────────────────────────
const AnimatedNumber = ({ value }) => {
    const [display, setDisplay] = useState(0);
    useEffect(() => {
        const target = parseInt(value) || 0;
        if (target === 0) return setDisplay(0);
        let start = 0;
        const step = Math.max(1, Math.ceil(target / 40));
        const t = setInterval(() => {
            start += step;
            if (start >= target) { setDisplay(target); clearInterval(t); }
            else setDisplay(start);
        }, 25);
        return () => clearInterval(t);
    }, [value]);
    return <>{display}</>;
};

// ── Componente Principal ────────────────────────────────────────────────────
const DoctorStats = () => {
    const [data, setData]       = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        api.get('/doctors/my-stats')
            .then(res => setData(res.data))
            .catch(() => setError('No se pudieron cargar las estadísticas.'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <Activity className="animate-spin text-mindpath-primary" size={40} />
        </div>
    );

    if (error) return (
        <div className="max-w-md mx-auto mt-16 p-8 bg-red-50 dark:bg-red-900/20 rounded-3xl text-center border border-red-100 dark:border-red-500/30">
            <p className="font-bold text-red-600 dark:text-red-400">{error}</p>
        </div>
    );

    // Datos del gráfico de barras
    const maxMonth = Math.max(...(data.byMonth.map(r => r.total)), 1);
    const total    = Object.values(data.byStatus).reduce((a, b) => a + b, 0);
    const completed = data.byStatus.completed || 0;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const virtualCount    = data.byType.find(t => t.type === 'virtual')?.total    || 0;
    const presencialCount = data.byType.find(t => t.type === 'presencial')?.total || 0;
    const typeTotal       = virtualCount + presencialCount || 1;

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-12">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white">Mis Estadísticas</h1>
                    <p className="text-gray-500 dark:text-slate-400 mt-1">Resumen del rendimiento clínico personal.</p>
                </div>
                <button
                    onClick={() => navigate('/doctor/dashboard')}
                    className="flex items-center gap-2 text-sm font-bold text-gray-500 dark:text-slate-400 hover:text-mindpath-primary dark:hover:text-mindpath-primary transition-colors"
                >
                    <ChevronLeft size={16}/> Panel
                </button>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    {
                        label: 'Citas Totales', value: total, icon: Calendar,
                        color: 'bg-blue-50 dark:bg-blue-900/30 text-blue-500 dark:text-blue-400'
                    },
                    {
                        label: 'Pac. Únicos', value: data.uniquePatients, icon: Users,
                        color: 'bg-mindpath-light dark:bg-mindpath-primary/30 text-gray-4000 dark:text-mindpath-primary'
                    },
                    {
                        label: 'Completadas', value: completed, icon: Award,
                        color: 'bg-green-50 dark:bg-green-900/30 text-green-500 dark:text-green-400'
                    },
                    {
                        label: 'Tasa Éxito', value: `${completionRate}%`, icon: TrendingUp,
                        color: 'bg-orange-50 dark:bg-orange-900/30 text-orange-500 dark:text-orange-400',
                        raw: true
                    },
                ].map(({ label, value, icon: Icon, color, raw }) => (
                    <div key={label} className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-gray-100 dark:border-white/10 shadow-sm">
                        <div className={`h-10 w-10 ${color} rounded-xl flex items-center justify-center mb-3`}>
                            <Icon size={20} />
                        </div>
                        <p className="text-gray-400 dark:text-slate-400 text-xs font-bold mb-1">{label}</p>
                        <p className="text-3xl font-black text-gray-900 dark:text-white">
                            {raw ? value : <AnimatedNumber value={value} />}
                        </p>
                    </div>
                ))}
            </div>

            {/* Gráfico de citas por mes + Rating + Retención */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Gráfico de barras — últimos 6 meses */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-white/10 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center">
                            <BarChart3 className="text-mindpath-primary mr-2" size={20} /> Citas por Mes
                        </h3>
                        <span className="text-xs font-bold text-gray-400 dark:text-slate-500">últimos 6 meses</span>
                    </div>

                    {data.byMonth.length === 0 ? (
                        <div className="flex items-center justify-center h-32 text-gray-400 dark:text-slate-500 font-bold">
                            Sin datos aún
                        </div>
                    ) : (
                        <div className="h-48 flex items-end justify-around gap-4 mt-4">
                            {data.byMonth.map(({ month, total: t }, index) => {
                                const heightPercentage = maxMonth === 0 ? 0 : (t / maxMonth) * 100;

                                return (
                                    <div key={index} className="flex flex-col items-center justify-end w-full h-full group">
                                        <span className="text-mindpath-primary font-bold text-sm mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {t}
                                        </span>
                                        
                                        <div className="flex-1 w-full max-w-[60px] bg-gray-100 dark:bg-slate-700 rounded-t-2xl relative overflow-hidden">
                                            <div 
                                                className="absolute bottom-0 left-0 w-full bg-mindpath-primary rounded-t-2xl transition-all duration-1000 ease-out"
                                                style={{ height: `${heightPercentage}%`, minHeight: '4px' }}
                                            >
                                                <div className="w-full h-full bg-gradient-to-t from-black/10 dark:from-purple-900/50 to-transparent"></div>
                                            </div>
                                        </div>
                                        
                                        <span className="text-xs text-gray-500 dark:text-slate-400 mt-3 font-bold">
                                            {getMonthLabel(month)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Rating + Retención */}
                <div className="space-y-4">
                    {/* Rating */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-white/10 shadow-sm h-fit">
                        <div className="flex items-center mb-4">
                            <Star className="text-yellow-400 mr-2" size={20} />
                            <h3 className="font-black text-gray-900 dark:text-white">Valoración</h3>
                        </div>
                        <div className="text-center">
                            <div className="text-5xl font-black text-gray-900 dark:text-white mb-1">
                                {data.avgRating ? Number(data.avgRating).toFixed(1) : '—'}
                            </div>
                            <div className="flex justify-center mb-2">
                                {[1,2,3,4,5].map(i => (
                                    <Star key={i} size={16}
                                        className={i <= Math.round(Number(data.avgRating) || 0)
                                            ? 'text-yellow-400 fill-yellow-400'
                                            : 'text-gray-200 dark:text-slate-600'}
                                    />
                                ))}
                            </div>
                            <p className="text-xs text-gray-400 dark:text-slate-500">{data.ratingCount} reseñas</p>
                        </div>
                    </div>

                    {/* Retención */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-white/10 shadow-sm">
                        <div className="flex items-center mb-4">
                            <Users className="text-mindpath-primary mr-2" size={20} />
                            <h3 className="font-black text-gray-900 dark:text-white text-sm">Retención</h3>
                        </div>
                        <div className="space-y-3">
                            {[
                                { label: 'Pacientes Nuevos', value: data.retention.new_patients || 0, color: 'bg-blue-400' },
                                { label: 'Recurrentes',      value: data.retention.recurrent_patients || 0, color: 'bg-mindpath-light0' },
                            ].map(({ label, value, color }) => {
                                const total2 = (data.retention.new_patients || 0) + (data.retention.recurrent_patients || 0) || 1;
                                const pct = Math.round((value / total2) * 100);
                                return (
                                    <div key={label}>
                                        <div className="flex justify-between text-xs font-bold mb-1">
                                            <span className="text-gray-600 dark:text-slate-300">{label}</span>
                                            <span className="text-gray-900 dark:text-white">{value} ({pct}%)</span>
                                        </div>
                                        <div className="h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                            <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{width: `${pct}%`}} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Distribución por tipo */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-white/10 shadow-sm">
                <div className="flex items-center mb-4">
                    <Activity className="text-mindpath-primary mr-2" size={20} />
                    <h3 className="font-black text-gray-900 dark:text-white">Modalidad de Consultas Completadas</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    {[
                        { label: 'Telemedicina', value: virtualCount,    pct: Math.round((virtualCount    / typeTotal) * 100), icon: Video,   color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/30' },
                        { label: 'Presencial',   value: presencialCount, pct: Math.round((presencialCount / typeTotal) * 100), icon: MapPin,  color: 'text-green-500 bg-green-50 dark:bg-green-900/30' },
                    ].map(({ label, value, pct, icon: Icon, color }) => (
                        <div key={label} className={`p-5 rounded-2xl flex items-center gap-4 border border-transparent ${color.split(' ')[1]} ${color.split(' ')[2] || ''}`}>
                            <div className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0 bg-white/60 dark:bg-white/10">
                                <Icon size={24} className={color.split(' ')[0]} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-700 dark:text-slate-200">{label}</p>
                                <p className="text-2xl font-black text-gray-900 dark:text-white">{value}</p>
                                <p className="text-xs text-gray-400 dark:text-slate-400">{pct}% del total</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Desglose por estado */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-white/10 shadow-sm">
                <h3 className="font-black text-gray-900 dark:text-white mb-4">Desglose de Citas</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                        { key: 'completed', label: 'Completadas', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' },
                        { key: 'confirmed', label: 'Confirmadas', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' },
                        { key: 'pending',   label: 'Pendientes',  color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' },
                        { key: 'cancelled', label: 'Canceladas',  color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' },
                    ].map(({ key, label, color }) => (
                        <div key={key} className={`p-4 rounded-2xl text-center ${color}`}>
                            <p className="text-2xl font-black">{data.byStatus[key] || 0}</p>
                            <p className="text-xs font-bold opacity-80">{label}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DoctorStats;
