import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Users, UserCheck, UserX, Calendar, CheckCircle2, XCircle, TrendingUp, Stethoscope } from 'lucide-react';
import KpiCard from '../KpiCard';

const MONTH_NAMES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

const getDynamicChartColors = () => {
    const root = document.documentElement;
    const baseRGB = getComputedStyle(root).getPropertyValue('--color-primary-rgb').trim() || '109 40 217';
    return [
        `rgb(${baseRGB})`,
        `rgb(${baseRGB} / 0.8)`,
        `rgb(${baseRGB} / 0.6)`,
        `rgb(${baseRGB} / 0.4)`,
        `rgb(${baseRGB} / 0.2)`,
    ];
};

const MetricsTab = ({ stats, loading, onKpiClick }) => {
    const chartData = stats?.apptsByMonth?.map(r => ({
        name: MONTH_NAMES[(r.month || 1) - 1],
        Citas: r.total,
    })) || [];

    if (loading) {
        return <p className="text-gray-400 animate-pulse p-6">Cargando métricas...</p>;
    }

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KpiCard 
                    icon={Users} 
                    label="Usuarios Totales" 
                    value={stats?.kpis.totalUsers} 
                    onClick={() => onKpiClick('users')} 
                />
                <KpiCard 
                    icon={UserCheck} 
                    label="Doctores Verificados" 
                    value={stats?.kpis.totalDoctors} 
                    color="text-green-600" bg="bg-green-50" 
                    onClick={() => onKpiClick('doctors')} 
                />
                <KpiCard 
                    icon={UserX} 
                    label="Pendientes Verificar" 
                    value={stats?.kpis.pendingDoctors} 
                    color="text-yellow-600" bg="bg-yellow-50" 
                    onClick={() => onKpiClick('verification')} 
                />
                <KpiCard 
                    icon={Stethoscope} 
                    label="Pacientes Registrados" 
                    value={stats?.kpis.totalPatients} 
                    color="text-blue-600" bg="bg-blue-50" 
                    onClick={() => onKpiClick('patients')} 
                />
                <KpiCard 
                    icon={CheckCircle2} 
                    label="Citas Completadas" 
                    value={stats?.kpis.completedAppts} 
                    color="text-green-600" bg="bg-green-50" 
                    onClick={() => onKpiClick('appts_completed')} 
                />
                <KpiCard 
                    icon={Calendar} 
                    label="Citas Activas" 
                    value={stats?.kpis.activeAppts} 
                    color="text-mindpath-primary" bg="bg-mindpath-light" 
                    onClick={() => onKpiClick('appts_active')} 
                />
                <KpiCard 
                    icon={XCircle} 
                    label="Citas Canceladas" 
                    value={stats?.kpis.cancelledAppts} 
                    color="text-red-500" bg="bg-red-50" 
                    onClick={() => onKpiClick('appts_cancelled')} 
                />
                <KpiCard 
                    icon={TrendingUp} 
                    label="Tasa Confirmación" 
                    value={`${stats?.kpis.confirmationRate}%`} 
                    color="text-indigo-600" bg="bg-indigo-50" 
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 bg-white dark:bg-[var(--bg-card)] rounded-2xl border border-gray-100 dark:border-[var(--border-color)] p-6">
                    <h3 className="font-bold text-gray-800 dark:text-white mb-4 text-sm uppercase tracking-wide">Citas por Mes (últimos 12 meses)</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={chartData} barSize={28}>
                            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }} />
                            <Bar dataKey="Citas" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white dark:bg-[var(--bg-card)] rounded-2xl border border-gray-100 dark:border-[var(--border-color)] p-6">
                    <h3 className="font-bold text-gray-800 dark:text-white mb-4 text-sm uppercase tracking-wide">Especialidades</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                            <Pie data={stats?.topSpecialties || []} dataKey="total_appts" nameKey="specialty" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                                {(stats?.topSpecialties || []).map((_, i) => (
                                    <Cell key={i} fill={getDynamicChartColors()[i % 5]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend formatter={v => <span className="text-xs text-gray-600 dark:text-gray-400">{v}</span>} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-white dark:bg-[var(--bg-card)] rounded-2xl border border-gray-100 dark:border-[var(--border-color)] p-6">
                <h3 className="font-bold text-gray-800 dark:text-white mb-4 text-sm uppercase tracking-wide">🏆 Top 5 Doctores</h3>
                <div className="space-y-3">
                    {(stats?.topDoctors || []).map((d, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <span className="text-lg font-bold text-gray-300 w-6 shrink-0">#{i+1}</span>
                            <div className="h-9 w-9 bg-mindpath-light rounded-full flex items-center justify-center text-mindpath-primary font-bold text-sm shrink-0">
                                {d.doctor_name?.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-800 dark:text-white text-sm truncate">{d.doctor_name}</p>
                                <p className="text-xs text-gray-500 dark:text-[var(--text-muted)]">{d.specialty}</p>
                            </div>
                            <span className="text-sm font-bold text-mindpath-primary">{d.total_appts} citas</span>
                        </div>
                    ))}
                    {!stats?.topDoctors?.length && <p className="text-gray-400 text-sm">Sin datos aún.</p>}
                </div>
            </div>
        </div>
    );
};

export default MetricsTab;
