import { useEffect, useState, useCallback } from 'react';
import api from '../../api/axiosConfig';
import useSettingsStore from '../../store/useSettingsStore';
import { BACKEND_URL } from '../../api/constants';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import {
    Users, UserCheck, UserX, Calendar, CheckCircle2, XCircle,
    TrendingUp, Stethoscope, ShieldCheck, ShieldX, Palette,
    Upload, Save, RefreshCw, Plus, Pencil, Trash2, AlertTriangle
} from 'lucide-react';

// ── Constantes ─────────────────────────────────────────────────────────────────
const TABS = ['📊 Métricas', '🩺 Verificación', '🗂️ Catálogos', '🎨 Theming'];
const CHART_COLORS = ['#6D28D9', '#7C3AED', '#8B5CF6', '#A78BFA', '#C4B5FD', '#DDD6FE'];

const MONTH_NAMES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

// ── Componente Toast ──────────────────────────────────────────────────────────
const Toast = ({ msg, type, onClose }) => {
    useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
    return (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl border text-sm font-bold max-w-sm ${type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
            {type === 'success' ? <CheckCircle2 size={18}/> : <XCircle size={18}/>}
            {msg}
        </div>
    );
};

// ── KPI Card ──────────────────────────────────────────────────────────────────
const KpiCard = ({ icon: Icon, label, value, color = 'text-mindpath-primary', bg = 'bg-mindpath-light' }) => (
    <div className="bg-white dark:bg-[var(--bg-card)] rounded-2xl border border-gray-100 dark:border-[var(--border-color)] p-5 flex items-center gap-4 shadow-sm">
        <div className={`h-12 w-12 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
            <Icon size={22} className={color} />
        </div>
        <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value ?? '—'}</p>
            <p className="text-xs text-gray-500 dark:text-[var(--text-muted)] font-medium">{label}</p>
        </div>
    </div>
);

// ══════════════════════════════════════════════════════════════════════════════
const AdminDashboard = () => {
    const [activeTab, setActiveTab]     = useState(0);
    const [stats, setStats]             = useState(null);
    const [pending, setPending]         = useState([]);
    const [specialties, setSpecialties] = useState([]);
    const [toast, setToast]             = useState(null);
    const [loading, setLoading]         = useState({ stats: true, pending: true, spe: true });
    const { clinicName, logoUrl, primaryColor, primaryHover, applySettings } = useSettingsStore();

    // Theming form state
    const [theme, setTheme]     = useState({ clinic_name: clinicName, logo_url: logoUrl || '', primary_color: primaryColor, primary_hover: primaryHover });
    const [logoFile, setLogoFile] = useState(null);
    const [savingTheme, setSavingTheme] = useState(false);

    // Specialties form
    const [newSpe, setNewSpe]   = useState('');
    const [editSpe, setEditSpe] = useState(null); // { id, name }

    // Modal rechazo
    const [rejectTarget, setRejectTarget] = useState(null);
    const [rejectNotes, setRejectNotes]   = useState('');

    const showToast = (msg, type = 'success') => setToast({ msg, type });

    // ── Data Fetching ──────────────────────────────────────────────────────────
    const loadStats = useCallback(async () => {
        try {
            const res = await api.get('/admin/stats');
            setStats(res.data);
        } catch { showToast('Error al cargar métricas.', 'error'); }
        finally { setLoading(p => ({ ...p, stats: false })); }
    }, []);

    const loadPending = useCallback(async () => {
        try {
            const res = await api.get('/admin/doctors/pending');
            setPending(res.data);
        } catch { /* silencioso */ }
        finally { setLoading(p => ({ ...p, pending: false })); }
    }, []);

    const loadSpecialties = useCallback(async () => {
        try {
            const res = await api.get('/admin/specialties');
            setSpecialties(res.data);
        } catch { /* silencioso */ }
        finally { setLoading(p => ({ ...p, spe: false })); }
    }, []);

    useEffect(() => {
        loadStats(); loadPending(); loadSpecialties();
        setTheme({ clinic_name: clinicName, logo_url: logoUrl || '', primary_color: primaryColor, primary_hover: primaryHover });
    }, [loadStats, loadPending, loadSpecialties, clinicName, logoUrl, primaryColor, primaryHover]);

    // ── Verificación ───────────────────────────────────────────────────────────
    const verifyDoctor = async (id) => {
        try {
            await api.put(`/admin/doctors/${id}/verify`);
            showToast('Doctor verificado. Ya aparece en el directorio.');
            loadPending(); loadStats();
        } catch { showToast('Error al verificar doctor.', 'error'); }
    };

    const rejectDoctor = async () => {
        if (!rejectTarget) return;
        try {
            await api.put(`/admin/doctors/${rejectTarget}/reject`, { notes: rejectNotes });
            showToast('Doctor rechazado.');
            setRejectTarget(null); setRejectNotes('');
            loadPending();
        } catch { showToast('Error al rechazar doctor.', 'error'); }
    };

    // ── Especialidades CRUD ────────────────────────────────────────────────────
    const createSpe = async () => {
        if (!newSpe.trim()) return;
        try {
            const res = await api.post('/admin/specialties', { name: newSpe.trim() });
            setSpecialties(p => [...p, res.data]);
            setNewSpe('');
            showToast('Especialidad creada.');
        } catch (e) { showToast(e.response?.data?.message || 'Error.', 'error'); }
    };

    const updateSpe = async () => {
        if (!editSpe?.name.trim()) return;
        try {
            await api.put(`/admin/specialties/${editSpe.id}`, { name: editSpe.name.trim() });
            setSpecialties(p => p.map(s => s.id === editSpe.id ? { ...s, name: editSpe.name } : s));
            setEditSpe(null);
            showToast('Especialidad actualizada.');
        } catch { showToast('Error al actualizar.', 'error'); }
    };

    const deleteSpe = async (id) => {
        if (!confirm('¿Eliminar esta especialidad?')) return;
        try {
            await api.delete(`/admin/specialties/${id}`);
            setSpecialties(p => p.filter(s => s.id !== id));
            showToast('Especialidad eliminada.');
        } catch (e) { showToast(e.response?.data?.message || 'Error.', 'error'); }
    };

    // ── Theming ────────────────────────────────────────────────────────────────
    const previewColor = (field, value) => {
        setTheme(p => ({ ...p, [field]: value }));
        if (field === 'primary_color') document.documentElement.style.setProperty('--color-primary', value);
        if (field === 'primary_hover') document.documentElement.style.setProperty('--color-primary-hover', value);
    };

    const uploadLogo = async () => {
        if (!logoFile) return theme.logo_url;
        const form = new FormData();
        form.append('logo', logoFile);
        const res = await api.post('/admin/upload/logo', form, { headers: { 'Content-Type': 'multipart/form-data' } });
        return res.data.logo_url;
    };

    const saveTheme = async () => {
        setSavingTheme(true);
        try {
            const logo_url = await uploadLogo();
            const payload = { ...theme, logo_url };
            await api.put('/admin/settings', payload);
            applySettings({ clinic_name: payload.clinic_name, logo_url: payload.logo_url, primary_color: payload.primary_color, primary_hover: payload.primary_hover });
            showToast('Configuración guardada exitosamente. 🎨');
        } catch { showToast('Error al guardar configuración.', 'error'); }
        finally { setSavingTheme(false); }
    };

    // ── Datos del gráfico de citas por mes ────────────────────────────────────
    const chartData = stats?.apptsByMonth?.map(r => ({
        name: MONTH_NAMES[(r.month || 1) - 1],
        Citas: r.total,
    })) || [];

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-20">
            {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Panel de Administración</h1>
                    <p className="text-gray-500 dark:text-[var(--text-muted)] text-sm mt-1">Control total de MindPath Neuro</p>
                </div>
                <button onClick={() => { loadStats(); loadPending(); }} className="flex items-center gap-2 text-sm text-mindpath-primary hover:underline font-medium">
                    <RefreshCw size={15}/> Actualizar
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 dark:bg-[var(--bg-card)] p-1 rounded-2xl w-fit">
                {TABS.map((tab, i) => (
                    <button key={tab} onClick={() => setActiveTab(i)}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeTab === i ? 'bg-white dark:bg-slate-700 shadow text-mindpath-primary' : 'text-gray-500 dark:text-[var(--text-muted)] hover:text-gray-700'}`}>
                        {tab}
                    </button>
                ))}
            </div>

            {/* ── TAB 1: MÉTRICAS ─────────────────────────────────────────────── */}
            {activeTab === 0 && (
                <div className="space-y-6">
                    {loading.stats ? (
                        <p className="text-gray-400 animate-pulse">Cargando métricas...</p>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <KpiCard icon={Users}       label="Usuarios Totales"    value={stats?.kpis.totalUsers} />
                                <KpiCard icon={UserCheck}   label="Doctores Verificados" value={stats?.kpis.totalDoctors} color="text-green-600" bg="bg-green-50" />
                                <KpiCard icon={UserX}       label="Pendientes Verificar" value={stats?.kpis.pendingDoctors} color="text-yellow-600" bg="bg-yellow-50" />
                                <KpiCard icon={Stethoscope} label="Pacientes Registrados" value={stats?.kpis.totalPatients} color="text-blue-600" bg="bg-blue-50" />
                                <KpiCard icon={CheckCircle2} label="Citas Completadas"   value={stats?.kpis.completedAppts} color="text-green-600" bg="bg-green-50" />
                                <KpiCard icon={Calendar}   label="Citas Activas"         value={stats?.kpis.activeAppts} color="text-purple-600" bg="bg-purple-50" />
                                <KpiCard icon={XCircle}    label="Citas Canceladas"       value={stats?.kpis.cancelledAppts} color="text-red-500" bg="bg-red-50" />
                                <KpiCard icon={TrendingUp} label="Tasa Confirmación"     value={`${stats?.kpis.confirmationRate}%`} color="text-indigo-600" bg="bg-indigo-50" />
                            </div>

                            {/* Gráficos */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Barras: citas por mes */}
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

                                {/* Donut: especialidades */}
                                <div className="bg-white dark:bg-[var(--bg-card)] rounded-2xl border border-gray-100 dark:border-[var(--border-color)] p-6">
                                    <h3 className="font-bold text-gray-800 dark:text-white mb-4 text-sm uppercase tracking-wide">Especialidades</h3>
                                    <ResponsiveContainer width="100%" height={220}>
                                        <PieChart>
                                            <Pie data={stats?.topSpecialties || []} dataKey="total_appts" nameKey="specialty" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                                                {(stats?.topSpecialties || []).map((_, i) => (
                                                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend formatter={v => <span className="text-xs text-gray-600 dark:text-gray-400">{v}</span>} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Top 5 doctores */}
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
                        </>
                    )}
                </div>
            )}

            {/* ── TAB 2: VERIFICACIÓN ─────────────────────────────────────────── */}
            {activeTab === 1 && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="font-bold text-gray-800 dark:text-white">
                            Doctores pendientes de verificación
                            {pending.length > 0 && <span className="ml-2 bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-1 rounded-full">{pending.length}</span>}
                        </h2>
                    </div>

                    {loading.pending ? (
                        <p className="text-gray-400 animate-pulse">Cargando...</p>
                    ) : pending.length === 0 ? (
                        <div className="text-center py-16 bg-white dark:bg-[var(--bg-card)] rounded-2xl border border-gray-100 dark:border-[var(--border-color)]">
                            <ShieldCheck size={48} className="text-green-400 mx-auto mb-3" />
                            <p className="font-bold text-gray-600 dark:text-white">¡Todo verificado!</p>
                            <p className="text-sm text-gray-400">No hay doctores pendientes.</p>
                        </div>
                    ) : (
                        pending.map(doc => (
                            <div key={doc.id} className="bg-white dark:bg-[var(--bg-card)] rounded-2xl border border-gray-100 dark:border-[var(--border-color)] p-5 flex flex-col md:flex-row md:items-center gap-4">
                                <div className="h-12 w-12 bg-mindpath-light rounded-xl flex items-center justify-center text-mindpath-primary font-bold text-lg shrink-0">
                                    {doc.full_name?.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-gray-900 dark:text-white">{doc.full_name}</p>
                                    <p className="text-sm text-gray-500 dark:text-[var(--text-muted)]">{doc.specialty} · {doc.clinic_name}</p>
                                    <p className="text-xs text-gray-400 mt-1">📋 Licencia: <span className="font-mono font-semibold">{doc.license_number}</span></p>
                                    <p className="text-xs text-gray-400">✉ {doc.email}</p>
                                    {doc.verification_notes && (
                                        <p className="text-xs text-orange-500 mt-1">⚠ Nota: {doc.verification_notes}</p>
                                    )}
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    <button onClick={() => verifyDoctor(doc.id)}
                                        className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors">
                                        <ShieldCheck size={15}/> Aprobar
                                    </button>
                                    <button onClick={() => { setRejectTarget(doc.id); setRejectNotes(''); }}
                                        className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-bold px-4 py-2.5 rounded-xl transition-colors border border-red-200">
                                        <ShieldX size={15}/> Rechazar
                                    </button>
                                </div>
                            </div>
                        ))
                    )}

                    {/* Modal rechazo */}
                    {rejectTarget && (
                        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                            <div className="bg-white dark:bg-[var(--bg-card)] rounded-2xl p-6 max-w-md w-full shadow-2xl">
                                <h3 className="font-bold text-gray-800 dark:text-white text-lg mb-2">Rechazar Doctor</h3>
                                <p className="text-sm text-gray-500 mb-4">Motivo del rechazo (se guardará en el expediente):</p>
                                <textarea value={rejectNotes} onChange={e => setRejectNotes(e.target.value)} rows={3}
                                    placeholder="Ej: Licencia inválida, número no encontrado en el registro..."
                                    className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-mindpath-primary dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                                <div className="flex gap-3 mt-4">
                                    <button onClick={rejectDoctor} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 rounded-xl transition-colors">Confirmar rechazo</button>
                                    <button onClick={() => setRejectTarget(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl transition-colors">Cancelar</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── TAB 3: CATÁLOGOS ────────────────────────────────────────────── */}
            {activeTab === 2 && (
                <div className="space-y-4">
                    <h2 className="font-bold text-gray-800 dark:text-white">Gestión de Especialidades</h2>

                    {/* Agregar nueva */}
                    <div className="flex gap-3">
                        <input value={newSpe} onChange={e => setNewSpe(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && createSpe()}
                            placeholder="Nueva especialidad (ej: Cardiología)..."
                            className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-mindpath-primary dark:bg-[var(--bg-card)] dark:border-[var(--border-color)] dark:text-white" />
                        <button onClick={createSpe} className="flex items-center gap-2 bg-mindpath-primary hover:bg-mindpath-primaryHover text-white font-bold px-5 py-3 rounded-xl transition-colors text-sm">
                            <Plus size={16}/> Agregar
                        </button>
                    </div>

                    {/* Lista */}
                    <div className="bg-white dark:bg-[var(--bg-card)] rounded-2xl border border-gray-100 dark:border-[var(--border-color)] overflow-hidden">
                        {loading.spe ? (
                            <p className="p-6 text-gray-400 animate-pulse">Cargando especialidades...</p>
                        ) : specialties.length === 0 ? (
                            <p className="p-6 text-gray-400 text-center">Sin especialidades. Agrega la primera arriba.</p>
                        ) : (
                            specialties.map((s, i) => (
                                <div key={s.id} className={`flex items-center px-5 py-4 gap-3 ${i !== 0 ? 'border-t border-gray-50 dark:border-[var(--border-color)]' : ''}`}>
                                    {editSpe?.id === s.id ? (
                                        <>
                                            <input value={editSpe.name} onChange={e => setEditSpe(p => ({ ...p, name: e.target.value }))}
                                                className="flex-1 border border-mindpath-primary rounded-lg px-3 py-1.5 text-sm focus:outline-none dark:bg-slate-700 dark:text-white" />
                                            <button onClick={updateSpe} className="text-green-600 hover:text-green-700 font-bold text-sm px-3 py-1.5 rounded-lg hover:bg-green-50">Guardar</button>
                                            <button onClick={() => setEditSpe(null)} className="text-gray-400 hover:text-gray-600 text-sm px-3 py-1.5 rounded-lg hover:bg-gray-50">Cancelar</button>
                                        </>
                                    ) : (
                                        <>
                                            <span className="flex-1 text-gray-800 dark:text-white text-sm font-medium">{s.name}</span>
                                            <button onClick={() => setEditSpe({ id: s.id, name: s.name })} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
                                                <Pencil size={15}/>
                                            </button>
                                            <button onClick={() => deleteSpe(s.id)} className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors">
                                                <Trash2 size={15}/>
                                            </button>
                                        </>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                        <AlertTriangle size={12}/> Las especialidades con doctores asociados no pueden eliminarse.
                    </p>
                </div>
            )}

            {/* ── TAB 4: THEMING ──────────────────────────────────────────────── */}
            {activeTab === 3 && (
                <div className="space-y-6">
                    <h2 className="font-bold text-gray-800 dark:text-white">Motor de Personalización</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Columna Izquierda: Controles */}
                        <div className="space-y-5">
                            {/* Nombre clínica */}
                            <div className="bg-white dark:bg-[var(--bg-card)] rounded-2xl border border-gray-100 dark:border-[var(--border-color)] p-5">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Nombre de la Clínica</label>
                                <input value={theme.clinic_name} onChange={e => setTheme(p => ({ ...p, clinic_name: e.target.value }))}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-mindpath-primary dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                            </div>

                            {/* Color primario */}
                            <div className="bg-white dark:bg-[var(--bg-card)] rounded-2xl border border-gray-100 dark:border-[var(--border-color)] p-5">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Colores del Sistema</label>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <input type="color" value={theme.primary_color}
                                            onChange={e => previewColor('primary_color', e.target.value)}
                                            className="h-12 w-16 rounded-xl border-0 cursor-pointer bg-transparent" />
                                        <div>
                                            <p className="text-sm font-semibold text-gray-700 dark:text-white">Color Primario</p>
                                            <p className="text-xs text-gray-400 font-mono">{theme.primary_color}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <input type="color" value={theme.primary_hover}
                                            onChange={e => previewColor('primary_hover', e.target.value)}
                                            className="h-12 w-16 rounded-xl border-0 cursor-pointer bg-transparent" />
                                        <div>
                                            <p className="text-sm font-semibold text-gray-700 dark:text-white">Color Hover (botones)</p>
                                            <p className="text-xs text-gray-400 font-mono">{theme.primary_hover}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Logo */}
                            <div className="bg-white dark:bg-[var(--bg-card)] rounded-2xl border border-gray-100 dark:border-[var(--border-color)] p-5">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Logo</label>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-xs text-gray-400 mb-1">Subir desde disco</p>
                                        <label className="flex items-center gap-2 cursor-pointer border-2 border-dashed border-gray-200 dark:border-slate-600 rounded-xl p-3 hover:border-mindpath-primary transition-colors">
                                            <Upload size={16} className="text-gray-400"/>
                                            <span className="text-sm text-gray-500 dark:text-gray-400 truncate">{logoFile ? logoFile.name : 'Seleccionar imagen (PNG, JPG, SVG, WEBP · máx 2MB)'}</span>
                                            <input type="file" accept=".png,.jpg,.jpeg,.svg,.webp" className="hidden" onChange={e => {
                                                if (e.target.files[0]) setLogoFile(e.target.files[0]);
                                            }}/>
                                        </label>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 mb-1">O pegar URL externa</p>
                                        <input value={theme.logo_url} onChange={e => setTheme(p => ({ ...p, logo_url: e.target.value }))}
                                            placeholder="https://mi-sitio.com/logo.png"
                                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-mindpath-primary dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Columna Derecha: Preview */}
                        <div className="bg-white dark:bg-[var(--bg-card)] rounded-2xl border border-gray-100 dark:border-[var(--border-color)] p-5">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Vista Previa</h3>
                            <div className="rounded-xl overflow-hidden border border-gray-100 dark:border-slate-600">
                                {/* Mini sidebar */}
                                <div className="flex">
                                    <div className="w-28 bg-white dark:bg-slate-800 border-r border-gray-100 dark:border-slate-700 p-3 flex flex-col gap-2">
                                        <div className="flex items-center gap-1.5 mb-2">
                                            {(theme.logo_url || logoFile) ? (
                                                <img src={logoFile ? URL.createObjectURL(logoFile) : (theme.logo_url.startsWith('http') ? theme.logo_url : `${BACKEND_URL}${theme.logo_url}`)} alt="Logo" className="h-5 w-auto object-contain" />
                                            ) : (
                                                <div className="h-4 w-4 rounded-full" style={{ backgroundColor: theme.primary_color }} />
                                            )}
                                            <span className="text-xs font-bold text-gray-700 dark:text-white truncate">{theme.clinic_name}</span>
                                        </div>
                                        {['Panel', 'Pacientes', 'Agenda'].map(n => (
                                            <div key={n} className={`text-xs px-2 py-1.5 rounded-lg font-medium ${n === 'Panel' ? 'text-white' : 'text-gray-400 dark:text-gray-500'}`}
                                                style={n === 'Panel' ? { backgroundColor: theme.primary_color } : {}}>
                                                {n}
                                            </div>
                                        ))}
                                    </div>
                                    {/* Mini contenido */}
                                    <div className="flex-1 bg-gray-50 dark:bg-slate-900 p-3 space-y-2">
                                        <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-3/4" />
                                        <div className="h-2 bg-gray-100 dark:bg-slate-800 rounded w-1/2" />
                                        <button className="text-xs text-white px-3 py-1.5 rounded-lg font-bold mt-1 transition-colors"
                                            style={{ backgroundColor: theme.primary_color }}>
                                            Botón primario
                                        </button>
                                        <button className="text-xs text-white px-3 py-1.5 rounded-lg font-bold transition-colors"
                                            style={{ backgroundColor: theme.primary_hover }}>
                                            Botón hover
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-100 rounded-xl">
                                <p className="text-xs text-yellow-700 font-medium">
                                    💡 Los cambios de color son visibles en tiempo real en todo el sistema. Guarda para que persistan en todos los usuarios.
                                </p>
                            </div>
                        </div>
                    </div>

                    <button onClick={saveTheme} disabled={savingTheme}
                        className="flex items-center gap-2 bg-mindpath-primary hover:bg-mindpath-primaryHover text-white font-bold px-8 py-4 rounded-2xl transition-colors disabled:opacity-60 shadow-lg shadow-purple-500/25">
                        {savingTheme ? <RefreshCw size={18} className="animate-spin"/> : <Save size={18}/>}
                        {savingTheme ? 'Guardando...' : 'Guardar Configuración'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
