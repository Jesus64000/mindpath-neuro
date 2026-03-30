import { useEffect, useState, useCallback } from 'react';
import api from '../../api/axiosConfig';
import useSettingsStore from '../../store/useSettingsStore';
import { useAuthStore } from '../../store/useAuthStore';
import { BACKEND_URL } from '../../api/constants';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import {
    Users, UserCheck, UserX, Calendar, CheckCircle2, XCircle,
    TrendingUp, Stethoscope, ShieldCheck, ShieldX, Palette,
    Upload, Save, RefreshCw, Plus, Pencil, Trash2, AlertTriangle,
    ToggleLeft, ToggleRight, Search, ChevronDown
} from 'lucide-react';

// ── Constantes ─────────────────────────────────────────────────────────────────
// COLORES DINAMICOS
const getDynamicChartColors = () => {
    const root = document.documentElement;
    const baseRGB = getComputedStyle(root).getPropertyValue('--color-primary-rgb').trim() || '109 40 217';
    // Generar variaciones de opacidad para el pie chart
    return [
        `rgb(${baseRGB})`,
        `rgb(${baseRGB} / 0.8)`,
        `rgb(${baseRGB} / 0.6)`,
        `rgb(${baseRGB} / 0.4)`,
        `rgb(${baseRGB} / 0.2)`,
    ];
};
const MONTH_NAMES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

const ROLE_LABEL = {
    admin: { label: 'Admin', color: 'text-mindpath-primary bg-mindpath-light' },
    supervisor: { label: 'Supervisor', color: 'text-blue-700 bg-blue-100' },
    doctor: { label: 'Doctor', color: 'text-green-700 bg-green-100' },
    patient: { label: 'Paciente', color: 'text-gray-700 bg-gray-100' },
};

// ── Toast ─────────────────────────────────────────────────────────────────────
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
const KpiCard = ({ icon: Icon, label, value, color = 'text-mindpath-primary', bg = 'bg-mindpath-light', onClick }) => (
    <div onClick={onClick} className="bg-white dark:bg-[var(--bg-card)] rounded-2xl border border-gray-100 dark:border-[var(--border-color)] p-5 flex items-center gap-4 shadow-sm cursor-pointer hover:ring-2 hover:ring-mindpath-primary/30 transition-all">
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
    const { user } = useAuthStore();
    const isAdmin = user?.role === 'admin';

    // ── Tabs dinámicos según rol ───────────────────────────────────────────────
    const TABS = [
        ...(isAdmin ? ['📊 Métricas'] : []),
        '🩺 Verificación',
        '🗂️ Catálogos',
        ...(isAdmin ? ['🛡️ Equipo'] : []),
        '👥 Usuarios',
        ...(isAdmin ? ['🎨 Personalización'] : []),
    ];
    // Índices lógicos (invariantes)
    const TAB = {
        metrics:      isAdmin ? 0 : -1,
        verification: isAdmin ? 1 : 0,
        catalogs:     isAdmin ? 2 : 1,
        staff:        isAdmin ? 3 : -1,
        users:        isAdmin ? 4 : 2,
        theming:      isAdmin ? 5 : -1,
    };

    const [activeTab, setActiveTab]     = useState(TAB.verification);
    const [stats, setStats]             = useState(null);
    const [pending, setPending]         = useState([]);
    const [specialties, setSpecialties] = useState([]);
    const [toast, setToast]             = useState(null);
    const [loading, setLoading]         = useState({ stats: true, pending: true, spe: true, users: true, staff: true });
    const { clinicName, logoUrl, primaryColor, primaryHover, fontFamily, applySettings } = useSettingsStore();

    // Theming
    const PRESET_FONTS = ['Inter','Roboto','Poppins','Outfit','Nunito','Lato','Open Sans','Montserrat','Raleway','system-ui'];
    const [theme, setTheme]         = useState({ clinic_name: clinicName, logo_url: logoUrl || '', primary_color: primaryColor, primary_hover: primaryHover, font_family: 'Inter' });
    const [logoFile, setLogoFile]   = useState(null);
    const [savingTheme, setSavingTheme] = useState(false);
    const [customFontName, setCustomFontName] = useState('');
    const isCustomFont = !PRESET_FONTS.includes(theme.font_family) && theme.font_family !== '__custom__';

    // Specialties
    const [newSpe, setNewSpe]     = useState('');
    const [editSpe, setEditSpe]   = useState(null);

    // Verificacion modal
    const [rejectTarget, setRejectTarget] = useState(null);
    const [rejectNotes, setRejectNotes]   = useState('');

    // Usuarios
    const [staff, setStaff]               = useState([]);
    const [users, setUsers]               = useState([]);
    const [userSearch, setUserSearch]     = useState('');
    const [userRoleFilter, setUserRoleFilter] = useState('');
    const [changingRole, setChangingRole]     = useState(null);
    const [roleDropdown, setRoleDropdown]     = useState(null);

    const showToast = (msg, type = 'success') => setToast({ msg, type });

    // Data Fetching
    const loadStats = useCallback(async () => {
        if (!isAdmin) return;
        try { const res = await api.get('/admin/stats'); setStats(res.data); }
        catch { showToast('Error al cargar metricas.', 'error'); }
        finally { setLoading(p => ({ ...p, stats: false })); }
    }, [isAdmin]);

    const loadPending = useCallback(async () => {
        try { const res = await api.get('/admin/doctors/pending'); setPending(res.data); }
        catch { /* silencioso */ }
        finally { setLoading(p => ({ ...p, pending: false })); }
    }, []);

    const loadSpecialties = useCallback(async () => {
        try { const res = await api.get('/admin/specialties'); setSpecialties(res.data); }
        catch { /* silencioso */ }
        finally { setLoading(p => ({ ...p, spe: false })); }
    }, []);

    const loadUsers = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            if (userSearch) params.set('search', userSearch);
            if (userRoleFilter) params.set('role', userRoleFilter);
            const res = await api.get(`/admin/users?${params.toString()}`);
            setUsers(res.data);
        } catch { showToast('Error al cargar usuarios.', 'error'); }
        finally { setLoading(p => ({ ...p, users: false })); }
    }, [userSearch, userRoleFilter]);

    const loadStaff = useCallback(async () => {
        try { const res = await api.get('/admin/users?role=staff'); setStaff(res.data); }
        catch { showToast('Error al cargar equipo.', 'error'); }
        finally { setLoading(p => ({ ...p, staff: false })); }
    }, []);

    useEffect(() => {
        loadStats(); loadPending(); loadSpecialties(); loadUsers(); loadStaff();
        setTheme({ clinic_name: clinicName, logo_url: logoUrl || '', primary_color: primaryColor, primary_hover: primaryHover, font_family: fontFamily || 'Inter' });
    }, [loadStats, loadPending, loadSpecialties, loadUsers, loadStaff, clinicName, logoUrl, primaryColor, primaryHover]);

    const verifyDoctor = async (id) => {
        try { await api.put(`/admin/doctors/${id}/verify`); showToast('Doctor verificado.'); loadPending(); loadStats(); }
        catch { showToast('Error al verificar doctor.', 'error'); }
    };

    const rejectDoctor = async () => {
        if (!rejectTarget) return;
        try { await api.put(`/admin/doctors/${rejectTarget}/reject`, { notes: rejectNotes }); showToast('Doctor rechazado.'); setRejectTarget(null); setRejectNotes(''); loadPending(); }
        catch { showToast('Error al rechazar doctor.', 'error'); }
    };

    const createSpe = async () => {
        if (!newSpe.trim()) return;
        try { const res = await api.post('/admin/specialties', { name: newSpe.trim() }); setSpecialties(p => [...p, res.data]); setNewSpe(''); showToast('Especialidad creada.'); }
        catch (e) { showToast(e.response?.data?.message || 'Error.', 'error'); }
    };

    const updateSpe = async () => {
        if (!editSpe?.name.trim()) return;
        try { await api.put(`/admin/specialties/${editSpe.id}`, { name: editSpe.name.trim() }); setSpecialties(p => p.map(s => s.id === editSpe.id ? { ...s, name: editSpe.name } : s)); setEditSpe(null); showToast('Especialidad actualizada.'); }
        catch { showToast('Error al actualizar.', 'error'); }
    };

    const deleteSpe = async (id) => {
        if (!confirm('Eliminar esta especialidad?')) return;
        try { await api.delete(`/admin/specialties/${id}`); setSpecialties(p => p.filter(s => s.id !== id)); showToast('Especialidad eliminada.'); }
        catch (e) { showToast(e.response?.data?.message || 'Error.', 'error'); }
    };

    const toggleUserActive = async (userId, currentlyActive) => {
        try { await api.put(`/admin/users/${userId}/toggle`); setUsers(p => p.map(u => u.id === userId ? { ...u, is_active: !currentlyActive } : u)); setStaff(p => p.map(u => u.id === userId ? { ...u, is_active: !currentlyActive } : u)); showToast(currentlyActive ? 'Cuenta suspendida.' : 'Cuenta reactivada.'); }
        catch { showToast('Error al cambiar estado del usuario.', 'error'); }
    };

    const changeUserRole = async (userId, newRole) => {
        if (!isAdmin) return;
        setChangingRole(userId);
        try { await api.put(`/admin/users/${userId}/role`, { role: newRole }); loadUsers(); loadStaff(); showToast(`Rol actualizado a ${ROLE_LABEL[newRole]?.label || newRole}.`); }
        catch { showToast('Error al cambiar rol.', 'error'); }
        finally { setChangingRole(null); setRoleDropdown(null); }
    };

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
            const finalFont = (isCustomFont || theme.font_family === '__custom__')
                ? (customFontName.trim() || 'Inter')
                : theme.font_family;
            const payload = { ...theme, logo_url, font_family: finalFont };
            await api.put('/admin/settings', payload);
            applySettings({ clinic_name: payload.clinic_name, logo_url: payload.logo_url, primary_color: payload.primary_color, primary_hover: payload.primary_hover, font_family: finalFont });
            showToast('Configuracion guardada y aplicada!');
        } catch { showToast('Error al guardar configuracion.', 'error'); }
        finally { setSavingTheme(false); }
    };


    const chartData = stats?.apptsByMonth?.map(r => ({
        name: MONTH_NAMES[(r.month || 1) - 1],
        Citas: r.total,
    })) || [];

    const renderUserList = (listToRender) => (
        <div className="bg-white dark:bg-[var(--bg-card)] rounded-2xl border border-gray-100 dark:border-[var(--border-color)]">
            {listToRender.map((u, i) => {
                const roleInfo = ROLE_LABEL[u.role] || { label: u.role, color: 'text-gray-600 bg-gray-100' };
                const isSelf = u.id === user?.id;
                return (
                    <div key={u.id} className={`flex items-center gap-4 px-5 py-4 ${i !== 0 ? 'border-t border-gray-50 dark:border-[var(--border-color)]' : ''} ${!u.is_active ? 'opacity-60' : ''}`}>
                        <div className="h-10 w-10 rounded-full bg-mindpath-light flex items-center justify-center text-mindpath-primary font-bold text-sm shrink-0">
                            {u.full_name?.charAt(0) || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-bold text-gray-900 dark:text-white text-sm truncate">{u.full_name}</p>
                                {isSelf && <span className="text-[10px] text-gray-4000 font-black">(Tú)</span>}
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${roleInfo.color}`}>{roleInfo.label}</span>
                                {!u.is_active && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600">Suspendido</span>}
                            </div>
                            <p className="text-xs text-gray-400 dark:text-slate-500 truncate">{u.email}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            {isAdmin && !isSelf && (
                                <div className="relative">
                                    <button
                                        onClick={() => setRoleDropdown(prev => prev === u.id ? null : u.id)}
                                        className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-xl hover:border-mindpath-primary text-gray-600 dark:text-slate-300 transition-colors"
                                    >
                                        {changingRole === u.id ? '…' : 'Rol'} <ChevronDown size={12}/>
                                    </button>
                                    {roleDropdown === u.id && (
                                        <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-100 dark:border-slate-700 z-20 overflow-hidden">
                                            {Object.entries(ROLE_LABEL).filter(([r]) => r !== u.role).map(([r, info]) => (
                                                <button key={r} onClick={() => changeUserRole(u.id, r)}
                                                    className="w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 transition-colors">
                                                    {info.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                            {!isSelf && (
                                <button
                                    onClick={() => toggleUserActive(u.id, u.is_active)}
                                    title={u.is_active ? 'Suspender cuenta' : 'Reactivar cuenta'}
                                    className={`p-2 rounded-xl transition-colors ${u.is_active ? 'text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20' : 'text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'}`}
                                >
                                    {u.is_active ? <ToggleRight size={22}/> : <ToggleLeft size={22}/>}
                                </button>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-20">
            {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Panel de Administración</h1>
                    <p className="text-gray-500 dark:text-[var(--text-muted)] text-sm mt-1">
                        {isAdmin ? 'Control total de MindPath Neuro' : 'Panel del Supervisor'}
                    </p>
                </div>
                <button onClick={() => { loadStats(); loadPending(); loadUsers(); loadStaff(); }} className="flex items-center gap-2 text-sm text-mindpath-primary hover:underline font-medium">
                    <RefreshCw size={15}/> Actualizar
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 dark:bg-[var(--bg-card)] p-1 rounded-2xl w-fit flex-wrap">
                {TABS.map((tab, i) => (
                    <button key={tab} onClick={() => setActiveTab(i)}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeTab === i ? 'bg-white dark:bg-slate-700 shadow text-mindpath-primary' : 'text-gray-500 dark:text-[var(--text-muted)] hover:text-gray-700'}`}>
                        {tab}
                    </button>
                ))}
            </div>

            {/* ── TAB: MÉTRICAS (solo admin) ────────────────────────────────────── */}
            {activeTab === TAB.metrics && isAdmin && (
                <div className="space-y-6">
                    {loading.stats ? (
                        <p className="text-gray-400 animate-pulse">Cargando métricas...</p>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <KpiCard icon={Users}       label="Usuarios Totales"    value={stats?.kpis.totalUsers} onClick={() => setActiveTab(TAB.users)} />
                                <KpiCard icon={UserCheck}   label="Doctores Verificados" value={stats?.kpis.totalDoctors} color="text-green-600" bg="bg-green-50" onClick={() => setActiveTab(TAB.users)} />
                                <KpiCard icon={UserX}       label="Pendientes Verificar" value={stats?.kpis.pendingDoctors} color="text-yellow-600" bg="bg-yellow-50" onClick={() => setActiveTab(TAB.verification)} />
                                <KpiCard icon={Stethoscope} label="Pacientes Registrados" value={stats?.kpis.totalPatients} color="text-blue-600" bg="bg-blue-50" />
                                <KpiCard icon={CheckCircle2} label="Citas Completadas"   value={stats?.kpis.completedAppts} color="text-green-600" bg="bg-green-50" />
                                <KpiCard icon={Calendar}   label="Citas Activas"         value={stats?.kpis.activeAppts} color="text-mindpath-primary" bg="bg-mindpath-light" />
                                <KpiCard icon={XCircle}    label="Citas Canceladas"       value={stats?.kpis.cancelledAppts} color="text-red-500" bg="bg-red-50" />
                                <KpiCard icon={TrendingUp} label="Tasa Confirmación"     value={`${stats?.kpis.confirmationRate}%`} color="text-indigo-600" bg="bg-indigo-50" />
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
                        </>
                    )}
                </div>
            )}

            {/* ── TAB: VERIFICACIÓN ─────────────────────────────────────────────── */}
            {activeTab === TAB.verification && (
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

            {/* ── TAB: CATÁLOGOS ────────────────────────────────────────────────── */}
            {activeTab === TAB.catalogs && (
                <div className="space-y-4">
                    <h2 className="font-bold text-gray-800 dark:text-white">Gestión de Especialidades</h2>

                    <div className="flex gap-3">
                        <input value={newSpe} onChange={e => setNewSpe(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && createSpe()}
                            placeholder="Nueva especialidad (ej: Cardiología)..."
                            className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-mindpath-primary dark:bg-[var(--bg-card)] dark:border-[var(--border-color)] dark:text-white" />
                        <button onClick={createSpe} className="flex items-center gap-2 bg-mindpath-primary hover:bg-mindpath-primaryHover text-white font-bold px-5 py-3 rounded-xl transition-colors text-sm">
                            <Plus size={16}/> Agregar
                        </button>
                    </div>

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

            {/* ── TAB: EQUIPO (STAFF) ─────────────────────────────────────────────────── */}
            {activeTab === TAB.staff && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="font-bold text-gray-800 dark:text-white">
                            Equipo del Sistema
                            <span className="ml-2 text-xs font-normal text-gray-400">({staff.length} resultados)</span>
                        </h2>
                    </div>

                    {loading.staff ? (
                        <p className="text-gray-400 animate-pulse">Cargando equipo...</p>
                    ) : staff.length === 0 ? (
                        <div className="text-center py-16 bg-white dark:bg-[var(--bg-card)] rounded-2xl border border-gray-100 dark:border-[var(--border-color)]">
                            <ShieldCheck size={40} className="text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 dark:text-slate-400">No se encontraron administradores o supervisores.</p>
                        </div>
                    ) : (
                        renderUserList(staff)
                    )}
                </div>
            )}

            {/* ── TAB: USUARIOS ─────────────────────────────────────────────────── */}
            {activeTab === TAB.users && (
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                        <h2 className="font-bold text-gray-800 dark:text-white">
                            Gestión de Usuarios
                            <span className="ml-2 text-xs font-normal text-gray-400">({users.length} resultados)</span>
                        </h2>
                        <div className="flex gap-2 flex-wrap">
                            {/* Búsqueda */}
                            <div className="relative">
                                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    value={userSearch}
                                    onChange={e => setUserSearch(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && loadUsers()}
                                    placeholder="Buscar nombre o email..."
                                    className="pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-[var(--border-color)] rounded-xl focus:outline-none focus:border-mindpath-primary dark:bg-[var(--bg-card)] dark:text-white w-52"
                                />
                            </div>
                            {/* Filtro por rol */}
                            <select
                                value={userRoleFilter}
                                onChange={e => setUserRoleFilter(e.target.value)}
                                className="px-3 py-2 text-sm border border-gray-200 dark:border-[var(--border-color)] rounded-xl focus:outline-none focus:border-mindpath-primary dark:bg-[var(--bg-card)] dark:text-white"
                            >
                                <option value="">Todos los roles</option>
                                <option value="admin">Admin</option>
                                <option value="supervisor">Supervisor</option>
                                <option value="doctor">Doctor</option>
                                <option value="patient">Paciente</option>
                            </select>
                            <button onClick={loadUsers} className="px-4 py-2 bg-mindpath-primary text-white text-sm font-bold rounded-xl hover:bg-mindpath-primaryHover transition-colors">
                                Buscar
                            </button>
                        </div>
                    </div>

                    {loading.users ? (
                        <p className="text-gray-400 animate-pulse">Cargando usuarios...</p>
                    ) : users.length === 0 ? (
                        <div className="text-center py-16 bg-white dark:bg-[var(--bg-card)] rounded-2xl border border-gray-100 dark:border-[var(--border-color)]">
                            <Users size={40} className="text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 dark:text-slate-400">No se encontraron usuarios.</p>
                        </div>
                    ) : (
                        renderUserList(users)
                    )}
                </div>
            )}

            {/* ── TAB: THEMING (solo admin) ─────────────────────────────────────── */}
            {activeTab === TAB.theming && isAdmin && (
                <div className="space-y-6">
                    <h2 className="font-bold text-gray-800 dark:text-white">Motor de Personalización</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-5">
                            <div className="bg-white dark:bg-[var(--bg-card)] rounded-2xl border border-gray-100 dark:border-[var(--border-color)] p-5">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Nombre de la Clínica</label>
                                <input value={theme.clinic_name} onChange={e => setTheme(p => ({ ...p, clinic_name: e.target.value }))}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-mindpath-primary dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                            </div>

                            <div className="bg-white dark:bg-[var(--bg-card)] rounded-2xl border border-gray-100 dark:border-[var(--border-color)] p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Colores del Sistema</label>
                                    <button 
                                        onClick={() => {
                                            previewColor('primary_color', '#6D28D9');
                                            previewColor('primary_hover', '#5B21B6');
                                        }}
                                        className="text-xs font-bold text-mindpath-primary hover:underline"
                                    >
                                        Restaurar por defecto
                                    </button>
                                </div>
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


                            <div className="bg-white dark:bg-[var(--bg-card)] rounded-2xl border border-gray-100 dark:border-[var(--border-color)] p-5">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Tipografía del Sistema</label>

                                {/* Select de fuentes predefinidas + opción custom */}
                                <select
                                    value={isCustomFont ? '__custom__' : theme.font_family}
                                    onChange={e => {
                                        if (e.target.value === '__custom__') {
                                            // Al elegir "custom" dejamos el font_family intacto para preservar cualquier fuente previa
                                            setCustomFontName('');
                                            setTheme(p => ({ ...p, font_family: '__custom__' }));
                                        } else {
                                            setCustomFontName('');
                                            setTheme(p => ({ ...p, font_family: e.target.value }));
                                        }
                                    }}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-mindpath-primary dark:bg-slate-700 dark:border-slate-600 dark:text-white mb-3"
                                >
                                    <option value="Inter">Inter (Moderna)</option>
                                    <option value="Roboto">Roboto (Clásica)</option>
                                    <option value="Poppins">Poppins (Redondeada)</option>
                                    <option value="Outfit">Outfit (Geométrica)</option>
                                    <option value="Nunito">Nunito (Suave)</option>
                                    <option value="Lato">Lato (Elegante)</option>
                                    <option value="Open Sans">Open Sans (Legible)</option>
                                    <option value="Montserrat">Montserrat (Fuerte)</option>
                                    <option value="Raleway">Raleway (Fina)</option>
                                    <option value="system-ui">Sistema (Por defecto del SO)</option>
                                    <option value="__custom__">✨ Google Font personalizada...</option>
                                </select>

                                {/* Input de fuente custom — solo aparece cuando se elige esa opción */}
                                {(isCustomFont || theme.font_family === '__custom__') && (
                                    <div className="animate-fadeIn mt-1 mb-3 p-4 bg-mindpath-primary/5 border border-mindpath-primary/20 rounded-xl">
                                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                                            Nombre exacto de la fuente en Google Fonts
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Ej: Space Mono, Oswald, Playfair Display..."
                                            value={customFontName}
                                            onChange={e => {
                                                setCustomFontName(e.target.value);
                                                // Preview en tiempo real: inyectamos el <link> al vuelo
                                                if (e.target.value.trim()) {
                                                    const formatted = e.target.value.trim().replace(/\s+/g, '+');
                                                    const url = `https://fonts.googleapis.com/css2?family=${formatted}:wght@300;400;500;600;700;800&display=swap`;
                                                    let el = document.getElementById('mindpath-preview-font');
                                                    if (!el) { el = document.createElement('link'); el.id = 'mindpath-preview-font'; el.rel = 'stylesheet'; document.head.appendChild(el); }
                                                    el.href = url;
                                                }
                                            }}
                                            className="w-full px-3 py-2.5 border border-gray-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:border-mindpath-primary dark:bg-slate-800 dark:text-white"
                                        />
                                        <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-2">
                                            Busca en{' '}
                                            <a href="https://fonts.google.com" target="_blank" rel="noopener noreferrer" className="text-mindpath-primary hover:underline font-semibold">fonts.google.com</a>
                                            {' '}y copia el nombre tal cual aparece (sensible a mayúsculas).
                                        </p>
                                    </div>
                                )}

                                {/* Caja de vista previa — aplica la fuente en tiempo real */}
                                <div className="p-4 rounded-xl bg-gray-50 dark:bg-slate-700/50 border border-gray-100 dark:border-slate-600">
                                    <p className="text-[10px] uppercase font-bold text-gray-400 mb-1 tracking-wider">Vista previa</p>
                                    <p
                                        className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed"
                                        style={{ fontFamily: `'${ (isCustomFont || theme.font_family === '__custom__') ? customFontName || 'Inter' : theme.font_family}', sans-serif` }}
                                    >
                                        El zorro marrón ágil salta sobre el perro perezoso. 0123456789<br/>
                                        <span className="font-bold">Texto en negrita</span> · <span className="font-light">Texto ligero</span>
                                    </p>
                                </div>
                            </div>

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

                        <div className="bg-white dark:bg-[var(--bg-card)] rounded-2xl border border-gray-100 dark:border-[var(--border-color)] p-5">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Vista Previa</h3>
                            <div className="rounded-xl overflow-hidden border border-gray-100 dark:border-slate-600">
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
                                    <div className="flex-1 bg-gray-50 dark:bg-slate-900 p-3 space-y-2">
                                        <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-3/4" />
                                        <div className="h-2 bg-gray-100 dark:bg-slate-800 rounded w-1/2" />
                                        <button className="text-xs text-white px-3 py-1.5 rounded-lg font-bold mt-1"
                                            style={{ backgroundColor: theme.primary_color }}>
                                            Botón primario
                                        </button>
                                        <button className="text-xs text-white px-3 py-1.5 rounded-lg font-bold"
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
                        className="flex items-center gap-2 bg-mindpath-primary hover:bg-mindpath-primaryHover text-white font-bold px-8 py-4 rounded-2xl transition-colors disabled:opacity-60 shadow-lg shadow-mindpath-primary/25">
                        {savingTheme ? <RefreshCw size={18} className="animate-spin"/> : <Save size={18}/>}
                        {savingTheme ? 'Guardando...' : 'Guardar Configuración'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
