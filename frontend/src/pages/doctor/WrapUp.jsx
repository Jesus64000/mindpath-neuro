import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axiosConfig';
import {
    FileText, RefreshCw, Save, Lock, Share2, Bot,
    AlertTriangle, Stethoscope, User, Calendar, ChevronRight, ChevronLeft,
    CheckCircle, XCircle
} from 'lucide-react';
import { PDFExportButton } from '../../components/ReportPDF';
import { BACKEND_URL } from '../../api/constants';


// ── Toast ──────────────────────────────────────────────────────
const Toast = ({ message, type, onClose }) => {
    useEffect(() => {
        const t = setTimeout(onClose, 3500);
        return () => clearTimeout(t);
    }, [onClose]);
    const colors = type === 'success'
        ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/30 dark:border-green-500/30 dark:text-green-300'
        : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/30 dark:border-red-500/30 dark:text-red-300';
    const Icon = type === 'success' ? CheckCircle : XCircle;
    return (
        <div className={`fixed top-6 right-6 z-[9999] flex items-center gap-3 px-5 py-4 rounded-2xl border shadow-xl ${colors} max-w-sm backdrop-blur-md`}>
            <Icon size={20} className="shrink-0" />
            <p className="text-sm font-bold">{message}</p>
        </div>
    );
};

// ── Constantes ─────────────────────────────────────────────────────────────
const CAMPOS = [
    { key: 'motivo_sintomas',        label: 'Motivo de Consulta y Síntomas',       col: 'full' },
    { key: 'antecedentes',           label: 'Antecedentes Personales / Patológicos', col: 'half' },
    { key: 'hallazgos',              label: 'Hallazgos Neurológicos',               col: 'half' },
    { key: 'diagnostico',            label: 'Diagnóstico',                          col: 'full', bold: true },
    { key: 'tratamiento',            label: 'Tratamiento Indicado',                 col: 'half' },
    { key: 'estudios_observaciones', label: 'Estudios / Observaciones',             col: 'half' },
];

const calculateAge = (dob) => {
    if (!dob) return 'N/A';
    return Math.floor((Date.now() - new Date(dob)) / (365.25 * 24 * 60 * 60 * 1000));
};

const EMPTY_REPORT = {
    motivo_sintomas: '', antecedentes: '', hallazgos: '',
    diagnostico: '', tratamiento: '', estudios_observaciones: '',
};

// ── Componente ──────────────────────────────────────────────────────────────
const WrapUp = () => {
    const { appointmentId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    const [rawText,      setRawText]      = useState(() => {
        // Prioridad: state de navegación (telemedicina) > localStorage (presencial) > vacío
        if (location.state?.initialText) return location.state.initialText;
        return localStorage.getItem(`transcription_${appointmentId}`) || '';
    });
    const [headerData,   setHeaderData]   = useState(null);
    const [report,       setReport]       = useState(() => {
        const saved = localStorage.getItem(`report_draft_${appointmentId}`);
        return saved ? JSON.parse(saved) : null;
    });
    const [privateNotes, setPrivateNotes] = useState(() => {
        return localStorage.getItem(`private_notes_${appointmentId}`) || '';
    });
    const [isShared,     setIsShared]     = useState(true);
    const [paymentReceived, setPaymentReceived] = useState(false);
    const [paymentReference, setPaymentReference] = useState('');
    const [paymentMethod, setPaymentMethod] = useState(() => {
        return localStorage.getItem(`payment_method_${appointmentId}`) || '';
    });
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving,     setIsSaving]     = useState(false);
    const [sidebarOpen,  setSidebarOpen]  = useState(true);
    const [toast,        setToast]        = useState(null);

    // ── Autoguardado Continuo en LocalStorage ───────────────────────────
    useEffect(() => {
        if (rawText) localStorage.setItem(`transcription_${appointmentId}`, rawText);
    }, [rawText, appointmentId]);

    useEffect(() => {
        if (report) localStorage.setItem(`report_draft_${appointmentId}`, JSON.stringify(report));
    }, [report, appointmentId]);

    useEffect(() => {
        localStorage.setItem(`private_notes_${appointmentId}`, privateNotes);
    }, [privateNotes, appointmentId]);

    useEffect(() => {
        localStorage.setItem(`payment_method_${appointmentId}`, paymentMethod);
    }, [paymentMethod, appointmentId]);

    // Cargar membrete + prevención de cierre accidental
    useEffect(() => {
        api.get(`/reports/header/${appointmentId}`)
            .then(res => {
                setHeaderData(res.data);
                if (res.data?.payment_status === 'paid') {
                    setPaymentReceived(true);
                }
                if (res.data?.payment_method) {
                    setPaymentMethod(res.data.payment_method);
                }
                if (res.data?.payment_reference) {
                    setPaymentReference(res.data.payment_reference);
                }
            })
            .catch(err => console.error('Error cargando membrete:', err));

        const guard = (e) => { e.preventDefault(); e.returnValue = ''; };
        window.addEventListener('beforeunload', guard);
        return () => window.removeEventListener('beforeunload', guard);
    }, [appointmentId]);

    // Al generar el informe, colapsar el sidebar automáticamente
    const generateAIReport = async () => {
        if (!rawText.trim()) {
            setToast({ message: 'El texto de la consulta está vacío. Escribe o dicta la transcripción primero.', type: 'error' });
            return;
        }
        setIsGenerating(true);
        try {
            const res = await api.post('/ia/generate-report', { text: rawText });
            const data = res.data.report;
            setReport({
                motivo_sintomas:        data.motivo_sintomas        || '',
                antecedentes:           data.antecedentes           || '',
                hallazgos:              data.hallazgos              || '',
                diagnostico:            data.diagnostico            || '',
                tratamiento:            data.tratamiento            || '',
                estudios_observaciones: data.estudios_observaciones || '',
            });
            setSidebarOpen(false); // ← colapsar para dar protagonismo al informe
        } catch (err) {
            console.error(err);
            setToast({ message: 'Error al conectar con la IA. Revisa que el servidor esté activo.', type: 'error' });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSave = async () => {
        if (!report) {
            setToast({ message: 'Debes generar el informe con IA antes de firmar.', type: 'error' });
            return;
        }
        if (headerData?.type === 'presencial' && headerData?.payment_method === 'in_person' && headerData?.payment_status !== 'paid' && !paymentReceived) {
            setToast({ message: 'Debes confirmar el pago en consultorio antes de finalizar esta consulta.', type: 'error' });
            return;
        }
        setIsSaving(true);
        try {
            await api.post('/reports/wrap-up', {
                appointmentId,
                ...report,
                privateNotes,
                isShared,
                paymentReceived,
                paymentReference,
                paymentMethod,
            });
            
            // Limpiar todo rastro local tras firma exitosa
            localStorage.removeItem(`transcription_${appointmentId}`);
            localStorage.removeItem(`report_draft_${appointmentId}`);
            localStorage.removeItem(`private_notes_${appointmentId}`);
            localStorage.removeItem(`payment_method_${appointmentId}`);

            setToast({ message: '✅ Historia Clínica guardada y firmada exitosamente.', type: 'success' });
            setTimeout(() => navigate('/doctor/dashboard'), 2000);
        } catch (err) {
            console.error(err);
            setToast({ message: 'Error al guardar. Revisa tu conexión e intenta de nuevo.', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    if (!headerData) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center animate-pulse">
                    <FileText size={48} className="text-mindpath-primary mx-auto mb-4" />
                    <p className="font-bold text-gray-600 dark:text-gray-400">Cargando expediente clínico...</p>
                </div>
            </div>
        );
    }

    // Bug #15 Fix: fecha de firma desde el servidor (headerData), no desde el cliente
    const signatureDate = headerData.appointment_date
        ? new Date(headerData.appointment_date).toLocaleDateString('es-VE', { day: '2-digit', month: 'long', year: 'numeric' })
        : new Date().toLocaleDateString('es-VE', { day: '2-digit', month: 'long', year: 'numeric' });

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-slate-950 transition-colors">
            {/* Toast global */}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* ── SIDEBAR DE TRANSCRIPCIÓN (colapsable) ─────────────────── */}
            <aside
                className={`
                    flex-shrink-0 bg-white dark:bg-slate-900 border-r border-gray-100 dark:border-white/10 shadow-sm flex flex-col
                    transition-all duration-300 ease-in-out overflow-hidden
                    ${sidebarOpen ? 'w-80' : 'w-0'}
                `}
            >
                <div className="p-6 flex flex-col h-full min-w-[320px]">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-700 dark:text-white flex items-center">
                            <Bot className="mr-2 text-mindpath-primary" size={18} />
                            Transcripción
                        </h3>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 dark:text-slate-400"
                            title="Colapsar panel"
                        >
                            <ChevronLeft size={16} />
                        </button>
                    </div>
                    <p className="text-xs text-gray-400 dark:text-slate-500 mb-3">
                        Texto capturado durante la consulta. Edita antes de generar.
                    </p>
                    <textarea
                        value={rawText}
                        onChange={(e) => setRawText(e.target.value)}
                        className="flex-1 p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-white/10 text-xs text-gray-800 dark:text-slate-200 leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-mindpath-primary"
                        placeholder="Texto de la videollamada o notas manuales..."
                    />
                    <button
                        onClick={generateAIReport}
                        disabled={isGenerating}
                        className="mt-4 w-full py-3 bg-mindpath-primary text-white font-black text-sm rounded-xl hover:bg-mindpath-primaryHover flex justify-center items-center transition-all disabled:bg-gray-300 disabled:dark:bg-slate-700 disabled:cursor-not-allowed"
                    >
                        {isGenerating
                            ? <><RefreshCw size={16} className="animate-spin mr-2" /> Analizando...</>
                            : <><Bot size={16} className="mr-2" /> {report ? 'Regenerar con IA' : 'Generar con IA'}</>
                        }
                    </button>
                </div>
            </aside>

            {/* ── CONTENIDO PRINCIPAL ───────────────────────────────────── */}
            <main className="flex-1 overflow-y-auto">
                <div className="max-w-5xl mx-auto p-6 space-y-6 pb-20">

                    {/* Header de página */}
                    <div className="flex items-center justify-between border-b border-gray-200 dark:border-white/10 pb-4">
                        <div>
                            <button 
                                onClick={() => navigate('/doctor/dashboard')} 
                                className="flex items-center text-sm font-bold text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 px-4 py-2 rounded-xl transition-all mb-4 w-fit"
                            >
                                <ChevronLeft size={16} className="mr-1" /> Volver al Panel
                            </button>
                            <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center">
                                <FileText className="mr-3 text-mindpath-primary" size={26} />
                                Historia Clínica Electrónica
                            </h1>
                            <p className="text-gray-500 dark:text-slate-400 text-sm mt-0.5">Documento médico oficial de cierre de consulta.</p>
                        </div>
                        {/* Botón para reabrir el sidebar si está cerrado */}
                        {!sidebarOpen && (
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-mindpath-primary/10 text-mindpath-primary font-bold text-sm rounded-xl hover:bg-mindpath-primary/20 transition-all"
                            >
                                <ChevronRight size={16} />
                                Ver Transcripción
                            </button>
                        )}
                    </div>

                    {/* ── MEMBRETE ─────────────────────────────────────────── */}
                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-gray-100 dark:border-white/10 shadow-sm overflow-hidden">
                        {/* Banda de color superior */}
                        <div className="h-2 bg-mindpath-primary w-full" />
                        <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* 1. Datos del Paciente */}
                            <div>
                                <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest flex items-center mb-3">
                                    <User size={11} className="mr-1.5" /> Datos del Paciente
                                </p>
                                <p className="font-black text-gray-900 dark:text-white text-base">{headerData.patient_name}</p>
                                <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
                                    {calculateAge(headerData.date_of_birth)} años &bull;{' '}
                                    {headerData.gender === 'M' ? 'Masculino' : headerData.gender === 'F' ? 'Femenino' : 'N/A'}
                                </p>
                                {headerData.phone && (
                                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{headerData.phone}</p>
                                )}
                            </div>

                            {/* 2. Datos del Médico */}
                            <div>
                                <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest flex items-center mb-3">
                                    <Stethoscope size={11} className="mr-1.5" /> Especialista
                                </p>
                                <p className="font-black text-gray-900 dark:text-white text-base">Dr(a). {headerData.doctor_name}</p>
                                <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">{headerData.specialty}</p>
                                <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                                    {headerData.clinic_name || 'MindPath Online'}
                                </p>
                            </div>

                            {/* 3. Datos de la Consulta */}
                            <div>
                                <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest flex items-center mb-3">
                                    <Calendar size={11} className="mr-1.5" /> Datos de la Consulta
                                </p>
                                <p className="font-black text-gray-900 dark:text-white text-base">
                                    {new Date(headerData.appointment_date).toLocaleDateString('es-VE', {
                                        day: '2-digit', month: 'long', year: 'numeric'
                                    })}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
                                    {headerData.start_time?.slice(0, 5)} hrs
                                </p>
                                <span className={`
                                    inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-bold uppercase
                                    ${(headerData.type === 'virtual' || headerData.type === 'online')
                                        ? 'bg-mindpath-primary/10 text-mindpath-primary'
                                        : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'}
                                `}>
                                    {(headerData.type === 'virtual' || headerData.type === 'online') ? 'Online' : 'Presencial'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-100 dark:border-white/10 px-8 pb-8 pt-6">
                        <h3 className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-4">
                            Pago y reembolso
                        </h3>
                        {headerData.payment_status === 'paid' && (headerData.type === 'virtual' || headerData.type === 'online' || headerData.payment_proof_url) ? (
                            <div className="bg-green-50 dark:bg-green-950/20 rounded-3xl p-6 border border-green-200 dark:border-green-800/40">
                                <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-bold mb-3 text-sm">
                                    <CheckCircle size={18} className="text-green-500" />
                                    Pago Verificado Exitosamente
                                </div>
                                <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed mb-4">
                                    Esta consulta online fue pagada y verificada antes de iniciar. Los datos de facturación se adjuntarán automáticamente al expediente médico y kit de reembolso.
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-bold text-gray-700 dark:text-slate-300">
                                    <div className="bg-white dark:bg-slate-900/60 p-3 rounded-xl border border-gray-100 dark:border-white/5">
                                        <span className="text-[10px] text-gray-400 block uppercase">Monto Cotizado</span>
                                        ${headerData.consultation_fee_snapshot ? Number(headerData.consultation_fee_snapshot).toFixed(2) : '0.00'} USD
                                    </div>
                                    <div className="bg-white dark:bg-slate-900/60 p-3 rounded-xl border border-gray-100 dark:border-white/5">
                                        <span className="text-[10px] text-gray-400 block uppercase">Método de Pago</span>
                                        {headerData.payment_method === 'platform' ? 'Pago por plataforma' : headerData.payment_method}
                                    </div>
                                    <div className="bg-white dark:bg-slate-900/60 p-3 rounded-xl border border-gray-100 dark:border-white/5">
                                        <span className="text-[10px] text-gray-400 block uppercase">Referencia</span>
                                        {headerData.payment_reference || 'Confirmado por admin'}
                                    </div>
                                </div>
                                {headerData.payment_proof_url && (
                                    <div className="mt-4">
                                        <a
                                            href={headerData.payment_proof_url.startsWith('http') ? headerData.payment_proof_url : `${BACKEND_URL}${headerData.payment_proof_url}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 text-xs text-mindpath-primary font-black hover:underline"
                                        >
                                            📄 Ver captura del comprobante adjunto
                                        </a>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-gray-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-gray-100 dark:border-white/10">
                                    <p className="text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-2">Método de pago</p>
                                    {headerData.payment_method === 'platform' ? (
                                        <>
                                            <p className="text-sm font-bold text-gray-800 dark:text-white mb-3">
                                                Pago por plataforma
                                            </p>
                                            <label className="flex items-center gap-2 text-sm font-bold text-gray-400 cursor-not-allowed">
                                                <input
                                                    type="checkbox"
                                                    checked={true}
                                                    disabled
                                                    className="w-4 h-4 text-mindpath-primary rounded border-gray-300"
                                                />
                                                Pago recibido (Verificado)
                                            </label>
                                        </>
                                    ) : (
                                        <>
                                            <select
                                                value={paymentMethod}
                                                onChange={(e) => setPaymentMethod(e.target.value)}
                                                className="w-full p-2.5 mb-3 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-white/10 text-sm font-bold text-gray-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-mindpath-primary"
                                            >
                                                <option value="in_person">💵 Efectivo en consultorio</option>
                                                <option value="Pago móvil">📱 Pago móvil</option>
                                                <option value="Transferencia">🏦 Transferencia bancaria</option>
                                                <option value="Zelle">🇺🇸 Zelle</option>
                                                <option value="Binance">🪙 Binance (Cripto)</option>
                                                <option value="Otro">✏️ Otro método</option>
                                            </select>
                                            <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-gray-700 dark:text-slate-300">
                                                <input
                                                    type="checkbox"
                                                    checked={paymentReceived}
                                                    onChange={(e) => setPaymentReceived(e.target.checked)}
                                                    className="w-4 h-4 text-mindpath-primary rounded border-gray-300"
                                                />
                                                Confirmo que el pago fue recibido
                                            </label>
                                        </>
                                    )}
                                    <p className="text-[11px] text-gray-500 dark:text-slate-500 mt-2 leading-relaxed">
                                        Indica cómo se recaudó el cobro de la consulta presencial.
                                    </p>
                                </div>
                                <div className="bg-gray-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-gray-100 dark:border-white/10">
                                    <p className="text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-2">Referencia de pago</p>
                                    <input
                                        type="text"
                                        value={paymentReference}
                                        onChange={(e) => setPaymentReference(e.target.value)}
                                        className="w-full p-3 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-white/10 text-sm text-gray-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-mindpath-primary"
                                        placeholder="Ej: efectivo, transferencia, comprobante..."
                                    />
                                    <p className="text-[11px] text-gray-500 dark:text-slate-500 mt-2 leading-relaxed">
                                        Este dato queda como trazabilidad para el expediente y el kit de reembolso.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── CUERPO DEL INFORME ────────────────────────────────── */}
                    {!report ? (
                        <div className="bg-white dark:bg-slate-900 rounded-[2rem] border-2 border-dashed border-gray-200 dark:border-white/10 flex flex-col items-center justify-center py-24 text-center">
                            <Bot size={52} className="text-gray-300 dark:text-slate-600 mb-4" />
                            <h3 className="font-bold text-gray-500 dark:text-slate-400 text-lg">Sin análisis clínico aún</h3>
                            <p className="text-sm text-gray-400 dark:text-slate-500 mt-2 max-w-xs">
                                Abre el panel de transcripción y presiona <strong>"Generar con IA"</strong> para estructurar el expediente.
                            </p>
                            {!sidebarOpen && (
                                <button
                                    onClick={() => setSidebarOpen(true)}
                                    className="mt-6 px-6 py-3 bg-mindpath-primary text-white font-bold rounded-xl hover:bg-mindpath-primaryHover"
                                >
                                    Abrir Transcripción
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-gray-100 dark:border-white/10 shadow-sm p-8 space-y-8">
                            {/* Aviso médico */}
                            <div className="flex items-start bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-500/30 text-yellow-800 dark:text-yellow-300 p-4 rounded-2xl text-xs font-bold">
                                <AlertTriangle className="mr-2 shrink-0 mt-0.5" size={16} />
                                Revisa y corrige todos los campos antes de firmar. Tú eres el responsable médico del expediente.
                            </div>

                            {/* ── PARTE 4: Consulta médica (6 campos en grid 2 col) ── */}
                            <div>
                                <h3 className="text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-4">
                                    Consulta Médica
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {CAMPOS.map(({ key, label, col, bold }) => (
                                        <div key={key} className={col === 'full' ? 'md:col-span-2' : ''}>
                                            <label className="block text-xs font-black text-mindpath-primary uppercase tracking-wide mb-1.5">
                                                {label}
                                            </label>
                                            <textarea
                                                value={report[key]}
                                                onChange={(e) => setReport({ ...report, [key]: e.target.value })}
                                                className={`
                                                    w-full p-3 bg-gray-50 dark:bg-slate-800/80 rounded-xl border border-gray-100 dark:border-white/10 text-sm text-gray-800 dark:text-slate-200 resize-none
                                                    focus:outline-none focus:ring-2 focus:ring-mindpath-primary leading-relaxed
                                                    ${bold ? 'font-bold text-gray-900 dark:text-white' : ''}
                                                    ${col === 'full' ? 'h-20' : 'h-24'}
                                                `}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* ── PARTE 5 + 6: Cierre del informe ─────────────────── */}
                            <div className="pt-6 border-t border-gray-100 dark:border-white/10 grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Notas privadas */}
                                <div className="bg-gray-900 p-5 rounded-2xl text-white relative overflow-hidden">
                                    <Lock size={80} className="absolute -right-3 -bottom-3 text-white/5" />
                                    <p className="text-[10px] font-black text-mindpath-primary uppercase tracking-widest flex items-center mb-2">
                                        <Lock size={12} className="mr-1.5" /> Notas Privadas del Médico
                                    </p>
                                    <p className="text-[10px] text-gray-500 mb-3">Ocultas para el paciente. Solo las verás tú.</p>
                                    <textarea
                                        value={privateNotes}
                                        onChange={(e) => setPrivateNotes(e.target.value)}
                                        className="w-full h-20 p-3 bg-white/10 rounded-xl text-xs text-white placeholder-gray-500 resize-none focus:outline-none focus:ring-1 focus:ring-mindpath-primary relative z-10"
                                        placeholder="Recordatorios, observaciones confidenciales..."
                                    />
                                </div>

                                {/* Firma y guardado */}
                                <div className="flex flex-col justify-between space-y-4">
                                    {/* Firma digital */}
                                    <div className="bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-white/10 rounded-2xl p-5 text-center">
                                        <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-3">
                                            Firma Digital
                                        </p>
                                        <p className="font-bold text-xl text-gray-800 dark:text-white italic border-b-2 border-gray-300 dark:border-slate-600 inline-block px-8 pb-1">
                                            Dr(a). {headerData.doctor_name}
                                        </p>
                                        <p className="text-xs text-gray-400 dark:text-slate-500 mt-2">
                                            Emitido el {signatureDate}
                                        </p>
                                    </div>

                                    {/* Toggle de compartir */}
                                    <label className="flex items-center cursor-pointer bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-white/5 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={isShared}
                                            onChange={(e) => setIsShared(e.target.checked)}
                                            className="w-4 h-4 text-mindpath-primary rounded bg-gray-800 border-gray-600"
                                        />
                                        <span className="ml-2 text-sm font-bold text-gray-900 dark:text-slate-300 flex items-center">
                                            <Share2 size={14} className="mr-1.5 text-green-500 dark:text-green-400" />
                                            Hacer visible para el paciente
                                        </span>
                                    </label>

                                    {/* Botón PDF — Sprint 27 */}
                                    {report && (
                                        <div className="flex justify-center">
                                            <PDFExportButton
                                                report={{ ...report, private_notes: privateNotes }}
                                                header={headerData}
                                                className="w-full justify-center"
                                            />
                                        </div>
                                    )}

                                    {/* Botón de guardado */}
                                    <button
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="w-full py-4 bg-gray-900 text-white font-black rounded-2xl hover:bg-black transition-all flex items-center justify-center disabled:bg-gray-400 disabled:cursor-not-allowed shadow-xl"
                                    >
                                        {isSaving
                                            ? <><RefreshCw size={18} className="animate-spin mr-2" /> FIRMANDO...</>
                                            : <><Save size={18} className="mr-2" /> FIRMAR DOCUMENTO Y FINALIZAR</>
                                        }
                                    </button>

                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default WrapUp;
