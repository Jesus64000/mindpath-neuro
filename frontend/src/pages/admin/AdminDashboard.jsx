import { useEffect, useState, useCallback } from 'react';
import api from '../../api/axiosConfig';
import useSettingsStore from '../../store/useSettingsStore';
import { useAuthStore } from '../../store/useAuthStore';
import { BACKEND_URL } from '../../api/constants';

import {
    Users, UserCheck, UserX, Calendar, CheckCircle2, XCircle,
    TrendingUp, Stethoscope, ShieldCheck, ShieldX, Palette,
    Upload, Save, RefreshCw, Plus, Pencil, Trash2, AlertTriangle,
    ToggleLeft, ToggleRight, Search, ChevronDown
} from 'lucide-react';

// Componentes Modulares
import Toast from '../../components/admin/Toast';
import KpiCard from '../../components/admin/KpiCard';
import UserList from '../../components/admin/UserList';

// Tabs
import MetricsTab from '../../components/admin/tabs/MetricsTab';
import VerificationTab from '../../components/admin/tabs/VerificationTab';
import CatalogsTab from '../../components/admin/tabs/CatalogsTab';
import UsersTab from '../../components/admin/tabs/UsersTab';
import ThemingTab from '../../components/admin/tabs/ThemingTab';
import AppointmentsTab from '../../components/admin/tabs/AppointmentsTab';

// ── Constantes ─────────────────────────────────────────────────────────────────
const MONTH_NAMES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

const ROLE_LABEL = {
    admin: { label: 'Admin', color: 'text-mindpath-primary bg-mindpath-light' },
    supervisor: { label: 'Supervisor', color: 'text-blue-700 bg-blue-100' },
    doctor: { label: 'Doctor', color: 'text-green-700 bg-green-100' },
    patient: { label: 'Paciente', color: 'text-gray-700 bg-gray-100' },
};

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
        '📅 Citas',
        ...(isAdmin ? ['🎨 Personalización'] : []),
    ];
    
    // Índices lógicos (invariantes)
    const TAB = {
        metrics:      isAdmin ? 0 : -1,
        verification: isAdmin ? 1 : 0,
        catalogs:     isAdmin ? 2 : 1,
        staff:        isAdmin ? 3 : -1,
        users:        isAdmin ? 4 : 2,
        appointments: isAdmin ? 5 : 3,
        theming:      isAdmin ? 6 : -1,
    };

    const [activeTab, setActiveTab]     = useState(TAB.verification);
    const [stats, setStats]             = useState(null);
    const [pending, setPending]         = useState([]);
    const [pendingPagination, setPendingPagination] = useState(null);
    const [pendingPage, setPendingPage] = useState(1);
    
    const [specialties, setSpecialties] = useState([]);
    const [specialtiesPagination, setSpecialtiesPagination] = useState(null);
    const [specialtiesPage, setSpecialtiesPage] = useState(1);
    const [paymentCatalog, setPaymentCatalog] = useState([]);
    const [paymentCatalogLoading, setPaymentCatalogLoading] = useState(true);
    const [paymentCatalogForm, setPaymentCatalogForm] = useState({ name: '', description: '', sort_order: 100, is_active: true });
    const [editingPaymentCatalog, setEditingPaymentCatalog] = useState(null);

    // Clínicas
    const [clinics, setClinics] = useState([]);
    const [clinicsPagination, setClinicsPagination] = useState(null);
    const [clinicsPage, setClinicsPage] = useState(1);
    const [newClinicName, setNewClinicName] = useState('');
    const [newClinicAddress, setNewClinicAddress] = useState('');
    const [editClinic, setEditClinic] = useState(null);

    // Tipos de examen
    const [studyTypes, setStudyTypes] = useState([]);
    const [studyTypesPagination, setStudyTypesPagination] = useState(null);
    const [studyTypesPage, setStudyTypesPage] = useState(1);
    const [newStudyTypeName, setNewStudyTypeName] = useState('');
    const [editStudyType, setEditStudyType] = useState(null);

    const [toast, setToast]             = useState(null);
    const [loading, setLoading]         = useState({ stats: true, pending: true, spe: true, users: true, staff: true, clinics: true, studyTypes: true });
    const { clinicName, logoUrl, hideSidebarText, primaryColor, primaryHover, fontFamily, exchangeRate, exchangeRateMode, applySettings } = useSettingsStore();

    // Theming
    const PRESET_FONTS = ['Inter','Roboto','Poppins','Outfit','Nunito','Lato','Open Sans','Montserrat','Raleway','system-ui'];
    const [theme, setTheme]         = useState({ 
        clinic_name: clinicName, 
        logo_url: logoUrl || '', 
        hide_sidebar_text: hideSidebarText || false,
        primary_color: primaryColor, 
        primary_hover: primaryHover, 
        font_family: fontFamily || 'Inter',
        exchange_rate: exchangeRate,
        exchange_rate_mode: exchangeRateMode
    });
    const [logoFile, setLogoFile]   = useState(null);
    const [savingTheme, setSavingTheme] = useState(false);
    const [syncingBcv, setSyncingBcv]   = useState(false);
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
    const [staffPagination, setStaffPagination] = useState(null);
    const [staffPage, setStaffPage]       = useState(1);

    const [users, setUsers]               = useState([]);
    const [usersPagination, setUsersPagination] = useState(null);
    const [usersPage, setUsersPage]       = useState(1);

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
        setLoading(p => ({ ...p, pending: true }));
        try { 
            const res = await api.get(`/admin/doctors/pending?page=${pendingPage}&limit=10`); 
            setPending(res.data.data); 
            setPendingPagination(res.data.pagination);
        }
        catch { /* silencioso */ }
        finally { setLoading(p => ({ ...p, pending: false })); }
    }, [pendingPage]);

    const loadSpecialties = useCallback(async () => {
        setLoading(p => ({ ...p, spe: true }));
        try { 
            const res = await api.get(`/admin/specialties?page=${specialtiesPage}&limit=10`); 
            setSpecialties(res.data.data); 
            setSpecialtiesPagination(res.data.pagination);
        }
        catch { /* silencioso */ }
        finally { setLoading(p => ({ ...p, spe: false })); }
    }, [specialtiesPage]);

    const loadPaymentCatalog = useCallback(async () => {
        setPaymentCatalogLoading(true);
        try {
            const res = await api.get('/admin/payment-methods');
            setPaymentCatalog(res.data || []);
        } catch {
            setPaymentCatalog([]);
        } finally {
            setPaymentCatalogLoading(false);
        }
    }, []);

    const loadUsers = useCallback(async () => {
        setLoading(p => ({ ...p, users: true }));
        try {
            const params = new URLSearchParams();
            if (userSearch) params.set('search', userSearch);
            if (userRoleFilter) params.set('role', userRoleFilter);
            params.set('page', usersPage);
            params.set('limit', 10);
            const res = await api.get(`/admin/users?${params.toString()}`);
            setUsers(res.data.data);
            setUsersPagination(res.data.pagination);
        } catch { showToast('Error al cargar usuarios.', 'error'); }
        finally { setLoading(p => ({ ...p, users: false })); }
    }, [userSearch, userRoleFilter, usersPage]);

    const loadStaff = useCallback(async () => {
        setLoading(p => ({ ...p, staff: true }));
        try { 
            const res = await api.get(`/admin/users?role=staff&page=${staffPage}&limit=10`); 
            setStaff(res.data.data); 
            setStaffPagination(res.data.pagination);
        }
        catch { showToast('Error al cargar equipo.', 'error'); }
        finally { setLoading(p => ({ ...p, staff: false })); }
    }, [staffPage]);

    const loadClinicsAdmin = useCallback(async () => {
        setLoading(p => ({ ...p, clinics: true }));
        try { 
            const res = await api.get(`/admin/clinics/admin?page=${clinicsPage}&limit=10`); 
            setClinics(res.data.data); 
            setClinicsPagination(res.data.pagination);
        }
        catch { /* silencioso */ }
        finally { setLoading(p => ({ ...p, clinics: false })); }
    }, [clinicsPage]);

    const loadStudyTypesAdmin = useCallback(async () => {
        setLoading(p => ({ ...p, studyTypes: true }));
        try { 
            const res = await api.get(`/admin/study-types/admin?page=${studyTypesPage}&limit=10`); 
            setStudyTypes(res.data.data); 
            setStudyTypesPagination(res.data.pagination);
        }
        catch { /* silencioso */ }
        finally { setLoading(p => ({ ...p, studyTypes: false })); }
    }, [studyTypesPage]);

    useEffect(() => {
        loadStats(); loadPending(); loadSpecialties(); loadUsers(); loadStaff(); loadPaymentCatalog(); loadClinicsAdmin(); loadStudyTypesAdmin();
    }, [loadStats, loadPending, loadSpecialties, loadUsers, loadStaff, loadPaymentCatalog, loadClinicsAdmin, loadStudyTypesAdmin]);

    useEffect(() => {
        setTheme({ 
            clinic_name: clinicName, 
            logo_url: logoUrl || '', 
            hide_sidebar_text: hideSidebarText || false,
            primary_color: primaryColor, 
            primary_hover: primaryHover, 
            font_family: fontFamily || 'Inter',
            exchange_rate: exchangeRate,
            exchange_rate_mode: exchangeRateMode
        });
    }, [clinicName, logoUrl, hideSidebarText, primaryColor, primaryHover, fontFamily, exchangeRate, exchangeRateMode]);

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

    const resetPaymentCatalogForm = () => {
        setPaymentCatalogForm({ name: '', description: '', sort_order: 100, is_active: true });
        setEditingPaymentCatalog(null);
    };

    const createPaymentCatalog = async () => {
        if (!paymentCatalogForm.name.trim()) return;
        try {
            const res = await api.post('/admin/payment-methods', {
                ...paymentCatalogForm,
                sort_order: Number(paymentCatalogForm.sort_order || 100),
                is_active: !!paymentCatalogForm.is_active,
            });
            setPaymentCatalog(prev => [...prev, res.data]);
            resetPaymentCatalogForm();
            showToast('Método global creado.');
        } catch (error) {
            showToast(error.response?.data?.message || 'Error al crear método global.', 'error');
        }
    };

    const updatePaymentCatalog = async () => {
        if (!editingPaymentCatalog?.id || !paymentCatalogForm.name.trim()) return;
        try {
            const res = await api.put(`/admin/payment-methods/${editingPaymentCatalog.id}`, {
                ...paymentCatalogForm,
                sort_order: Number(paymentCatalogForm.sort_order || 100),
                is_active: !!paymentCatalogForm.is_active,
            });
            setPaymentCatalog(prev => prev.map(item => item.id === editingPaymentCatalog.id ? res.data : item));
            resetPaymentCatalogForm();
            showToast('Método global actualizado.');
        } catch (error) {
            showToast(error.response?.data?.message || 'Error al actualizar método global.', 'error');
        }
    };

    const deletePaymentCatalog = async (id) => {
        if (!confirm('¿Eliminar este método global?')) return;
        try {
            await api.delete(`/admin/payment-methods/${id}`);
            setPaymentCatalog(prev => prev.filter(item => item.id !== id));
            showToast('Método global eliminado.');
        } catch (error) {
            showToast(error.response?.data?.message || 'Error al eliminar método global.', 'error');
        }
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

    // CRUD Clínicas
    const createClinic = async () => {
        if (!newClinicName.trim()) return;
        try {
            await api.post('/admin/clinics', { name: newClinicName.trim(), default_address: newClinicAddress.trim() });
            setNewClinicName('');
            setNewClinicAddress('');
            showToast('Clínica / Centro de salud creado.');
            loadClinicsAdmin();
        } catch (e) {
            showToast(e.response?.data?.message || 'Error al crear clínica.', 'error');
        }
    };

    const updateClinic = async () => {
        if (!editClinic?.name.trim()) return;
        try {
            await api.put(`/admin/clinics/${editClinic.id}`, { name: editClinic.name.trim(), default_address: editClinic.default_address?.trim() });
            setEditClinic(null);
            showToast('Clínica actualizada.');
            loadClinicsAdmin();
        } catch (e) {
            showToast(e.response?.data?.message || 'Error al actualizar.', 'error');
        }
    };

    const deleteClinic = async (id) => {
        if (!confirm('¿Eliminar esta clínica?')) return;
        try {
            await api.delete(`/admin/clinics/${id}`);
            showToast('Clínica eliminada.');
            loadClinicsAdmin();
        } catch (e) {
            showToast(e.response?.data?.message || 'Error al eliminar.', 'error');
        }
    };

    // CRUD Tipos de Exámenes
    const createStudyType = async () => {
        if (!newStudyTypeName.trim()) return;
        try {
            await api.post('/admin/study-types', { name: newStudyTypeName.trim() });
            setNewStudyTypeName('');
            showToast('Examen médico creado.');
            loadStudyTypesAdmin();
        } catch (e) {
            showToast(e.response?.data?.message || 'Error al crear examen.', 'error');
        }
    };

    const updateStudyType = async () => {
        if (!editStudyType?.name.trim()) return;
        try {
            await api.put(`/admin/study-types/${editStudyType.id}`, { name: editStudyType.name.trim() });
            setEditStudyType(null);
            showToast('Examen médico actualizado.');
            loadStudyTypesAdmin();
        } catch (e) {
            showToast(e.response?.data?.message || 'Error al actualizar.', 'error');
        }
    };

    const deleteStudyType = async (id) => {
        if (!confirm('¿Eliminar este examen médico?')) return;
        try {
            await api.delete(`/admin/study-types/${id}`);
            showToast('Examen médico eliminado.');
            loadStudyTypesAdmin();
        } catch (e) {
            showToast(e.response?.data?.message || 'Error al eliminar.', 'error');
        }
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
            applySettings({ 
                clinic_name: payload.clinic_name, 
                logo_url: payload.logo_url, 
                hide_sidebar_text: payload.hide_sidebar_text,
                primary_color: payload.primary_color, 
                primary_hover: payload.primary_hover, 
                font_family: finalFont,
                exchange_rate: payload.exchange_rate,
                exchange_rate_mode: payload.exchange_rate_mode
            });
            showToast('Configuracion guardada y aplicada!');
        } catch { showToast('Error al guardar configuracion.', 'error'); }
        finally { setSavingTheme(false); }
    };

    const syncBcvRate = async () => {
        setSyncingBcv(true);
        try {
            const res = await api.post('/admin/settings/sync-bcv');
            const newRate = parseFloat(res.data.bcv_rate);
            setTheme(prev => ({ ...prev, exchange_rate: newRate }));
            applySettings({ 
                clinic_name: theme.clinic_name, 
                logo_url: theme.logo_url, 
                primary_color: theme.primary_color, 
                primary_hover: theme.primary_hover, 
                font_family: theme.font_family,
                exchange_rate: newRate,
                exchange_rate_mode: theme.exchange_rate_mode
            });
            showToast(res.data.message || 'Tasa BCV sincronizada con éxito 🇻🇪');
        } catch (err) {
            showToast(err.response?.data?.message || 'Error al conectar con las APIs de BCV.', 'error');
        } finally {
            setSyncingBcv(false);
        }
    };

    const handleKpiClick = (type) => {
        if (!isAdmin) return;
        switch (type) {
            case 'users':
                setUserRoleFilter('');
                setActiveTab(TAB.users);
                break;
            case 'doctors':
                setUserRoleFilter('doctor');
                setActiveTab(TAB.users);
                break;
            case 'patients':
                setUserRoleFilter('patient');
                setActiveTab(TAB.users);
                break;
            case 'verification':
                setActiveTab(TAB.verification);
                break;
            case 'appts_completed':
            case 'appts_active':
            case 'appts_cancelled':
                setActiveTab(TAB.appointments);
                break;
            default:
                break;
        }
    };

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

            {/* ── CONTENIDO DE TABS ── */}
            
            {activeTab === TAB.metrics && isAdmin && (
                <MetricsTab 
                    stats={stats} 
                    loading={loading.stats} 
                    onKpiClick={handleKpiClick} 
                />
            )}

            {activeTab === TAB.verification && (
                <VerificationTab 
                    pending={pending}
                    pagination={pendingPagination}
                    onPageChange={setPendingPage}
                    loading={loading.pending}
                    onVerify={verifyDoctor}
                    onReject={rejectDoctor}
                    rejectTarget={rejectTarget}
                    setRejectTarget={setRejectTarget}
                    rejectNotes={rejectNotes}
                    setRejectNotes={setRejectNotes}
                />
            )}

            {activeTab === TAB.catalogs && (
                <CatalogsTab 
                    specialties={specialties}
                    pagination={specialtiesPagination}
                    onPageChange={setSpecialtiesPage}
                    loading={loading.spe}
                    newSpe={newSpe}
                    setNewSpe={setNewSpe}
                    editSpe={editSpe}
                    setEditSpe={setEditSpe}
                    onCreate={createSpe}
                    onUpdate={updateSpe}
                    onDelete={deleteSpe}
                    isAdmin={isAdmin}
                    paymentCatalog={paymentCatalog}
                    paymentCatalogLoading={paymentCatalogLoading}
                    paymentCatalogForm={paymentCatalogForm}
                    setPaymentCatalogForm={setPaymentCatalogForm}
                    editingPaymentCatalog={editingPaymentCatalog}
                    setEditingPaymentCatalog={(method) => {
                        if (!method) return resetPaymentCatalogForm();
                        setEditingPaymentCatalog(method);
                        setPaymentCatalogForm({
                            name: method.name || '',
                            description: method.description || '',
                            sort_order: method.sort_order ?? 100,
                            is_active: !!method.is_active,
                        });
                    }}
                    onCreatePaymentCatalog={createPaymentCatalog}
                    onUpdatePaymentCatalog={updatePaymentCatalog}
                    onDeletePaymentCatalog={deletePaymentCatalog}
                    
                    // Nuevos catálogos: Clínicas
                    clinics={clinics}
                    clinicsPagination={clinicsPagination}
                    clinicsPage={clinicsPage}
                    onClinicsPageChange={setClinicsPage}
                    clinicsLoading={loading.clinics}
                    newClinicName={newClinicName}
                    setNewClinicName={setNewClinicName}
                    newClinicAddress={newClinicAddress}
                    setNewClinicAddress={setNewClinicAddress}
                    editClinic={editClinic}
                    setEditClinic={setEditClinic}
                    onCreateClinic={createClinic}
                    onUpdateClinic={updateClinic}
                    onDeleteClinic={deleteClinic}

                    // Nuevos catálogos: Exámenes
                    studyTypes={studyTypes}
                    studyTypesPagination={studyTypesPagination}
                    studyTypesPage={studyTypesPage}
                    onStudyTypesPageChange={setStudyTypesPage}
                    studyTypesLoading={loading.studyTypes}
                    newStudyTypeName={newStudyTypeName}
                    setNewStudyTypeName={setNewStudyTypeName}
                    editStudyType={editStudyType}
                    setEditStudyType={setEditStudyType}
                    onCreateStudyType={createStudyType}
                    onUpdateStudyType={updateStudyType}
                    onDeleteStudyType={deleteStudyType}
                />
            )}

            {activeTab === TAB.staff && isAdmin && (
                <UsersTab 
                    users={staff}
                    pagination={staffPagination}
                    onPageChange={setStaffPage}
                    loading={loading.staff}
                    userSearch=""
                    setUserSearch={() => {}}
                    userRoleFilter="staff"
                    setUserRoleFilter={() => {}}
                    onSearch={loadStaff}
                    currentUser={user}
                    onToggleActive={toggleUserActive}
                    onChangeRole={changeUserRole}
                    roleDropdown={roleDropdown}
                    setRoleDropdown={setRoleDropdown}
                    changingRole={changingRole}
                />
            )}

            {activeTab === TAB.users && (
                <UsersTab 
                    users={users}
                    pagination={usersPagination}
                    onPageChange={setUsersPage}
                    loading={loading.users}
                    userSearch={userSearch}
                    setUserSearch={setUserSearch}
                    userRoleFilter={userRoleFilter}
                    setUserRoleFilter={setUserRoleFilter}
                    onSearch={loadUsers}
                    currentUser={user}
                    onToggleActive={toggleUserActive}
                    onChangeRole={changeUserRole}
                    roleDropdown={roleDropdown}
                    setRoleDropdown={setRoleDropdown}
                    changingRole={changingRole}
                />
            )}

            {activeTab === TAB.appointments && (
                <AppointmentsTab />
            )}

            {activeTab === TAB.theming && isAdmin && (
                <ThemingTab 
                    theme={theme}
                    setTheme={setTheme}
                    logoFile={logoFile}
                    setLogoFile={setLogoFile}
                    customFontName={customFontName}
                    setCustomFontName={setCustomFontName}
                    onSave={saveTheme}
                    onPreviewColor={previewColor}
                    saving={savingTheme}
                    onSyncBcv={syncBcvRate}
                    syncingBcv={syncingBcv}
                />
            )}
        </div>
    );
};

export default AdminDashboard;
