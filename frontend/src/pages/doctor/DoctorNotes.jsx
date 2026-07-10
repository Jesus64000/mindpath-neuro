import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axiosConfig';
import { BACKEND_URL } from '../../api/constants';
import { 
    StickyNote, Search, ExternalLink, RefreshCw, AlertCircle, 
    Check, Clock, User, Phone, Mail, Calendar
} from 'lucide-react';
import Avatar from '../../components/ui/Avatar';

const DoctorNotes = () => {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPatientId, setSelectedPatientId] = useState(null);
    const [selectedPatient, setSelectedPatient] = useState(null);
    
    // Estado del editor
    const [editorNotes, setEditorNotes] = useState('');
    const [saveStatus, setSaveStatus] = useState('idle'); // 'idle', 'saving', 'saved', 'error'
    const notesTimeoutRef = useRef(null);

    const fetchAllNotes = async (selectFirst = false) => {
        setLoading(true);
        setError('');
        try {
            const res = await api.get('/doctors/notes/all');
            setPatients(res.data);
            if (selectFirst && res.data.length > 0) {
                const first = res.data[0];
                setSelectedPatientId(first.patient_id);
                setSelectedPatient(first);
                setEditorNotes(first.notes || '');
            }
        } catch (err) {
            console.error('Error al cargar notas rápidas:', err);
            setError('No se pudieron cargar las notas rápidas.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllNotes(true);
    }, []);

    // Sincronizar el paciente seleccionado si la lista cambia
    useEffect(() => {
        if (selectedPatientId && patients.length > 0) {
            const matched = patients.find(p => p.patient_id === selectedPatientId);
            if (matched) {
                setSelectedPatient(matched);
            }
        }
    }, [selectedPatientId, patients]);

    const handleSelectPatient = (patient) => {
        // Guardar cualquier nota pendiente si se cambia de paciente rápidamente
        if (notesTimeoutRef.current) {
            clearTimeout(notesTimeoutRef.current);
            // Guardar inmediatamente la nota anterior
            saveNotesImmediately(selectedPatientId, editorNotes);
        }

        setSelectedPatientId(patient.patient_id);
        setSelectedPatient(patient);
        setEditorNotes(patient.notes || '');
        setSaveStatus('idle');
    };

    const saveNotesImmediately = async (pId, text) => {
        try {
            await api.put(`/doctors/patient/${pId}/notes`, { notes: text });
            // Actualizar la lista localmente
            setPatients(prev => prev.map(p => 
                p.patient_id === pId ? { ...p, notes: text, notes_updated_at: new Date().toISOString() } : p
            ));
        } catch (err) {
            console.error('Error al guardar notas de forma inmediata:', err);
        }
    };

    const handleNotesChange = (e) => {
        const text = e.target.value;
        setEditorNotes(text);
        setSaveStatus('saving');

        if (notesTimeoutRef.current) clearTimeout(notesTimeoutRef.current);

        notesTimeoutRef.current = setTimeout(async () => {
            try {
                await api.put(`/doctors/patient/${selectedPatientId}/notes`, { notes: text });
                setSaveStatus('saved');
                
                // Actualizar la lista local
                setPatients(prev => prev.map(p => 
                    p.patient_id === selectedPatientId 
                        ? { ...p, notes: text, notes_updated_at: new Date().toISOString() } 
                        : p
                ));

                // Restablecer el estado a idle después de 3 segundos
                setTimeout(() => {
                    setSaveStatus(prev => prev === 'saved' ? 'idle' : prev);
                }, 3000);

            } catch (err) {
                console.error('Error al guardar notas:', err);
                setSaveStatus('error');
            }
        }, 1000);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        const datePart = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
        const d = new Date(`${datePart}T12:00:00`);
        return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const formatDateTime = (dateTimeStr) => {
        if (!dateTimeStr) return '';
        const d = new Date(dateTimeStr);
        return d.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Limpieza al desmontar
    useEffect(() => {
        return () => {
            if (notesTimeoutRef.current) {
                clearTimeout(notesTimeoutRef.current);
            }
        };
    }, []);

    // Filtrar la lista por la barra de búsqueda
    const filteredPatients = patients.filter(p => 
        p.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.patient_email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="max-w-[1600px] mx-auto p-4 md:p-6 space-y-6 animate-fadeIn">
            {/* Header del Panel */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
                        <StickyNote className="text-mindpath-primary" size={28} /> Notas Rápidas
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                        Consulta y edita las observaciones privadas de tus pacientes desde un solo panel.
                    </p>
                </div>
                
                <button
                    onClick={() => fetchAllNotes(false)}
                    className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-white/10 dark:text-slate-200 rounded-xl transition shadow-sm"
                >
                    <RefreshCw size={15} className={`${loading ? 'animate-spin' : ''}`} />
                    Sincronizar
                </button>
            </div>

            {error && (
                <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30 rounded-2xl text-red-700 dark:text-red-400 text-sm">
                    <AlertCircle size={20} className="shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Layout Principal: Dos columnas */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* COLUMNA IZQUIERDA: Buscador y Listado de Pacientes */}
                <div className="lg:col-span-4 bg-white dark:bg-slate-800 rounded-[2rem] border border-gray-100 dark:border-white/10 shadow-sm p-4 space-y-4">
                    {/* Buscador */}
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400 dark:text-slate-500 pointer-events-none">
                            <Search size={18} />
                        </span>
                        <input
                            type="text"
                            placeholder="Buscar paciente..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-white/10 rounded-xl text-sm placeholder-gray-400 dark:placeholder-slate-500 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-mindpath-primary/50 transition-all"
                        />
                    </div>

                    {/* Listado */}
                    <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                                <RefreshCw size={32} className="animate-spin text-mindpath-primary mb-3" />
                                <span className="text-sm font-medium">Cargando pacientes...</span>
                            </div>
                        ) : filteredPatients.length === 0 ? (
                            <div className="text-center py-12 text-gray-400">
                                <StickyNote size={40} className="mx-auto mb-3 opacity-30" />
                                <p className="text-sm">No se encontraron pacientes.</p>
                            </div>
                        ) : (
                            filteredPatients.map((pat) => {
                                const isSelected = pat.patient_id === selectedPatientId;
                                return (
                                    <button
                                        key={pat.patient_id}
                                        onClick={() => handleSelectPatient(pat)}
                                        className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-start gap-3 ${
                                            isSelected
                                                ? 'bg-mindpath-light/50 border-mindpath-primary/30 dark:bg-mindpath-primary/10 dark:border-mindpath-primary/30 shadow-sm'
                                                : 'bg-white hover:bg-gray-50 dark:bg-slate-800 dark:hover:bg-slate-700/40 border-gray-100 dark:border-white/5'
                                        }`}
                                    >
                                        <Avatar
                                            fullName={pat.patient_name}
                                            profilePictureUrl={pat.patient_picture}
                                            size="10"
                                        />
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="font-extrabold text-sm text-gray-900 dark:text-white truncate">
                                                    {pat.patient_name}
                                                </span>
                                                {pat.last_visit && (
                                                    <span className="text-[10px] text-gray-400 dark:text-slate-500 shrink-0 font-medium">
                                                        {formatDate(pat.last_visit)}
                                                    </span>
                                                )}
                                            </div>
                                            
                                            {/* Vista previa de la nota */}
                                            <p className="text-xs text-gray-500 dark:text-slate-400 truncate mt-1">
                                                {pat.notes ? pat.notes : <span className="italic text-gray-300 dark:text-slate-600">Sin notas aún...</span>}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* COLUMNA DERECHA: Editor de Notas */}
                <div className="lg:col-span-8 bg-white dark:bg-slate-800 rounded-[2rem] border border-gray-100 dark:border-white/10 shadow-sm p-6 min-h-[500px] flex flex-col">
                    {selectedPatient ? (
                        <div className="flex-1 flex flex-col space-y-6">
                            
                            {/* Cabecera del Paciente Seleccionado */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-100 dark:border-white/5">
                                <div className="flex items-center gap-3">
                                    <Avatar
                                        fullName={selectedPatient.patient_name}
                                        profilePictureUrl={selectedPatient.patient_picture}
                                        size="14"
                                    />
                                    <div className="min-w-0">
                                        <h2 className="text-lg font-black text-gray-900 dark:text-white truncate">
                                            {selectedPatient.patient_name}
                                        </h2>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-gray-500 dark:text-slate-400">
                                            {selectedPatient.patient_phone && (
                                                <span className="flex items-center gap-1.5">
                                                    <Phone size={12} className="text-mindpath-primary" /> {selectedPatient.patient_phone}
                                                </span>
                                            )}
                                            <span className="flex items-center gap-1.5">
                                                <Mail size={12} className="text-mindpath-primary" /> {selectedPatient.patient_email}
                                            </span>
                                            {selectedPatient.last_visit && (
                                                <span className="flex items-center gap-1.5">
                                                    <Calendar size={12} className="text-mindpath-primary" /> Última consulta: {formatDate(selectedPatient.last_visit)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <Link
                                    to={`/doctor/patient/${selectedPatient.patient_id}`}
                                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-black bg-mindpath-light hover:bg-mindpath-light/80 text-mindpath-primary dark:bg-mindpath-primary/10 dark:hover:bg-mindpath-primary/20 rounded-xl transition"
                                >
                                    Ver Expediente Completo
                                    <ExternalLink size={13} />
                                </Link>
                            </div>

                            {/* Editor de Notas */}
                            <div className="flex-1 flex flex-col space-y-3">
                                <div className="flex items-center justify-between gap-3">
                                    <h3 className="font-extrabold text-sm text-gray-700 dark:text-slate-300 flex items-center gap-2">
                                        <StickyNote size={16} className="text-mindpath-primary" /> Observaciones del Paciente
                                    </h3>
                                    
                                    {/* Indicadores de guardado */}
                                    <div className="text-xs font-bold transition-all duration-300">
                                        {saveStatus === 'saving' && (
                                            <span className="flex items-center gap-1.5 text-gray-400 dark:text-slate-500">
                                                <RefreshCw size={12} className="animate-spin" /> Guardando...
                                            </span>
                                        )}
                                        {saveStatus === 'saved' && (
                                            <span className="flex items-center gap-1.5 text-green-500">
                                                <Check size={13} /> Guardado con éxito
                                            </span>
                                        )}
                                        {saveStatus === 'error' && (
                                            <span className="flex items-center gap-1.5 text-red-500">
                                                <AlertCircle size={13} /> Error al guardar
                                            </span>
                                        )}
                                        {saveStatus === 'idle' && selectedPatient.notes_updated_at && (
                                            <span className="flex items-center gap-1 text-[11px] text-gray-400 dark:text-slate-500 font-normal">
                                                <Clock size={11} /> Act. el {formatDateTime(selectedPatient.notes_updated_at)}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <textarea
                                    value={editorNotes}
                                    onChange={handleNotesChange}
                                    placeholder="Escribe aquí observaciones privadas, ideas sobre diagnóstico, dosis de medicamentos o recordatorios personales sobre este paciente. Estas notas son 100% privadas y solo tú tienes acceso a ellas."
                                    className="w-full flex-1 min-h-[300px] resize-none rounded-2xl bg-gray-50/50 dark:bg-slate-700/30 border border-gray-200 dark:border-white/10 text-sm text-gray-800 dark:text-slate-200 p-4 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-mindpath-primary/50 transition-all font-sans leading-relaxed"
                                />
                            </div>

                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center py-20 text-gray-400">
                            <div className="p-5 bg-gray-50 dark:bg-slate-700/30 rounded-[2rem] border border-gray-100 dark:border-white/5 mb-4 animate-pulse">
                                <StickyNote size={48} className="text-gray-300 dark:text-slate-600" />
                            </div>
                            <h3 className="font-extrabold text-gray-900 dark:text-white text-base">
                                Sin paciente seleccionado
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1.5 max-w-sm">
                                Selecciona un paciente de la lista lateral para visualizar sus datos y gestionar sus notas rápidas en tiempo real.
                            </p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default DoctorNotes;
