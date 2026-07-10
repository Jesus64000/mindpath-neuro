import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axiosConfig';
import { BACKEND_URL } from '../../api/constants';
import { 
    StickyNote, Search, ExternalLink, RefreshCw, AlertCircle, 
    Check, Clock, User, Phone, Mail, Calendar, Plus, Edit3, Trash2, X,
    ChevronDown, ChevronUp
} from 'lucide-react';
import Avatar from '../../components/ui/Avatar';

const DoctorNotes = () => {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPatientId, setSelectedPatientId] = useState(null);
    const [selectedPatient, setSelectedPatient] = useState(null);
    
    // Estado del historial de notas del paciente seleccionado
    const [patientNotes, setPatientNotes] = useState([]);
    const [loadingNotes, setLoadingNotes] = useState(false);
    const [expandedNoteIds, setExpandedNoteIds] = useState({});
    
    // Estados para crear nueva nota
    const [newNoteText, setNewNoteText] = useState('');
    const [saveStatus, setSaveStatus] = useState('idle'); // 'idle', 'saving', 'saved', 'error'
    
    // Estados para editar notas existentes
    const [editingNoteId, setEditingNoteId] = useState(null);
    const [editingNoteText, setEditingNoteText] = useState('');

    // Estados para filtros
    const [filterText, setFilterText] = useState('');
    const [datePreset, setDatePreset] = useState('all'); // 'all', 'today', 'week', 'month'
    const [filterDateFrom, setFilterDateFrom] = useState('');
    const [filterDateTo, setFilterDateTo] = useState('');

    const toggleNoteExpand = (noteId) => {
        setExpandedNoteIds(prev => ({
            ...prev,
            [noteId]: !prev[noteId]
        }));
    };

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
                fetchPatientNotes(first.patient_id);
            }
        } catch (err) {
            console.error('Error al cargar notas rápidas:', err);
            setError('No se pudieron cargar las notas rápidas.');
        } finally {
            setLoading(false);
        }
    };

    const fetchPatientNotes = async (patientId) => {
        setLoadingNotes(true);
        try {
            const res = await api.get(`/doctors/patient/${patientId}/notes`);
            const list = res.data.list || [];
            setPatientNotes(list);
            if (list.length > 0) {
                // Expandir por defecto la primera nota (más reciente)
                setExpandedNoteIds({ [list[0].id]: true });
            }
        } catch (err) {
            console.error('Error al cargar historial de notas:', err);
        } finally {
            setLoadingNotes(false);
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
        setSelectedPatientId(patient.patient_id);
        setSelectedPatient(patient);
        setNewNoteText('');
        setEditingNoteId(null);
        setEditingNoteText('');
        setSaveStatus('idle');
        setExpandedNoteIds({});
        fetchPatientNotes(patient.patient_id);
    };

    const handleAddNote = async () => {
        if (!newNoteText.trim()) return;
        setSaveStatus('saving');
        try {
            await api.post(`/doctors/patient/${selectedPatientId}/notes/new`, { notes: newNoteText });
            setNewNoteText('');
            setSaveStatus('saved');
            
            // Recargar notas y listado principal para actualizar la vista previa de la izquierda
            await fetchPatientNotes(selectedPatientId);
            await fetchAllNotes(false);
            
            setTimeout(() => {
                setSaveStatus('idle');
            }, 3000);
        } catch (err) {
            console.error('Error al guardar nueva nota:', err);
            setSaveStatus('error');
        }
    };

    const handleStartEdit = (note) => {
        setEditingNoteId(note.id);
        setEditingNoteText(note.notes);
    };

    const handleCancelEdit = () => {
        setEditingNoteId(null);
        setEditingNoteText('');
    };

    const handleSaveEdit = async (noteId) => {
        if (!editingNoteText.trim()) return;
        try {
            await api.put(`/doctors/notes/${noteId}`, { notes: editingNoteText });
            setEditingNoteId(null);
            setEditingNoteText('');
            
            // Actualizar localmente la nota en la lista
            setPatientNotes(prev => prev.map(n => 
                n.id === noteId ? { ...n, notes: editingNoteText, updated_at: new Date().toISOString() } : n
            ));
            
            // Recargar listado principal para actualizar la vista previa
            await fetchAllNotes(false);
        } catch (err) {
            console.error('Error al editar nota:', err);
            alert('No se pudo guardar la edición de la nota.');
        }
    };

    const handleDeleteNote = async (noteId) => {
        if (!confirm('¿Estás seguro de que deseas eliminar esta observación del historial?')) return;
        try {
            await api.delete(`/doctors/notes/${noteId}`);
            
            // Actualizar localmente
            setPatientNotes(prev => prev.filter(n => n.id !== noteId));
            
            // Recargar listado principal para la vista previa
            await fetchAllNotes(false);
        } catch (err) {
            console.error('Error al eliminar nota:', err);
            alert('No se pudo eliminar la nota.');
        }
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
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Filtrar la lista de pacientes por la barra de búsqueda
    const filteredPatients = patients.filter(p => 
        p.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.patient_email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Filtrar las observaciones (notas) del paciente seleccionado
    const filteredNotes = patientNotes.filter(note => {
        // 1. Filtro por buscador de texto
        if (filterText && !note.notes.toLowerCase().includes(filterText.toLowerCase())) {
            return false;
        }
        
        const noteDate = new Date(note.updated_at);
        
        // 2. Filtro por presets de fecha
        if (datePreset === 'today') {
            const today = new Date();
            if (noteDate.toDateString() !== today.toDateString()) return false;
        } else if (datePreset === 'week') {
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            if (noteDate < oneWeekAgo) return false;
        } else if (datePreset === 'month') {
            const oneMonthAgo = new Date();
            oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
            if (noteDate < oneMonthAgo) return false;
        }
        
        // 3. Filtro por rangos de fecha personalizados (Desde/Hasta)
        if (filterDateFrom) {
            const fromDate = new Date(`${filterDateFrom}T00:00:00`);
            if (noteDate < fromDate) return false;
        }
        if (filterDateTo) {
            const toDate = new Date(`${filterDateTo}T23:59:59`);
            if (noteDate > toDate) return false;
        }
        
        return true;
    });

    return (
        <div className="max-w-[1600px] mx-auto p-4 md:p-6 space-y-6 animate-fadeIn">
            {/* Header del Panel */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
                        <StickyNote className="text-mindpath-primary" size={28} /> Notas Rápidas
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                        Gestiona el historial de observaciones privadas e independientes de tus pacientes.
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
                    <div className="space-y-2 max-h-[700px] overflow-y-auto pr-1">
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
                                                {pat.notes_updated_at ? (
                                                    <span className="text-[9px] text-mindpath-primary dark:text-mindpath-light shrink-0 font-bold bg-mindpath-light/80 dark:bg-mindpath-primary/20 px-2 py-0.5 rounded-full">
                                                        {formatDate(pat.notes_updated_at)}
                                                    </span>
                                                ) : (
                                                    <span className="text-[9px] text-gray-400 dark:text-slate-600 shrink-0 font-medium">
                                                        Sin notas
                                                    </span>
                                                )}
                                            </div>
                                            
                                            {/* Vista previa de la última nota */}
                                            <p className="text-xs text-gray-500 dark:text-slate-400 truncate mt-1">
                                                {pat.notes ? pat.notes : <span className="italic text-gray-300 dark:text-slate-600">Sin notas registradas...</span>}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* COLUMNA DERECHA: Editor y Bitácora de Observaciones */}
                <div className="lg:col-span-8 bg-white dark:bg-slate-800 rounded-[2rem] border border-gray-100 dark:border-white/10 shadow-sm p-6 min-h-[600px] flex flex-col gap-6">
                    {selectedPatient ? (
                        <div className="flex-1 flex flex-col gap-6">
                            
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
                                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-black bg-mindpath-light hover:bg-mindpath-light/80 text-mindpath-primary dark:bg-mindpath-primary/10 dark:hover:bg-mindpath-primary/20 rounded-xl transition self-start sm:self-auto"
                                >
                                    Ver Expediente Completo
                                    <ExternalLink size={13} />
                                </Link>
                            </div>

                            {/* Creador de Nueva Observación */}
                            <div className="bg-gray-50/50 dark:bg-slate-700/20 border border-gray-100 dark:border-white/5 p-4 rounded-3xl space-y-3">
                                <div className="flex items-center justify-between gap-3">
                                    <h3 className="font-extrabold text-sm text-gray-700 dark:text-slate-300 flex items-center gap-1.5">
                                        <Plus size={16} className="text-mindpath-primary" /> Agregar Nueva Observación
                                    </h3>
                                    
                                    <div className="text-xs font-bold transition-all duration-300">
                                        {saveStatus === 'saving' && (
                                            <span className="flex items-center gap-1.5 text-gray-400 dark:text-slate-500">
                                                <RefreshCw size={12} className="animate-spin" /> Guardando...
                                            </span>
                                        )}
                                        {saveStatus === 'saved' && (
                                            <span className="flex items-center gap-1.5 text-green-500">
                                                <Check size={13} /> Agregada al historial
                                            </span>
                                        )}
                                        {saveStatus === 'error' && (
                                            <span className="flex items-center gap-1.5 text-red-500">
                                                <AlertCircle size={13} /> Error al guardar
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <textarea
                                    value={newNoteText}
                                    onChange={(e) => setNewNoteText(e.target.value)}
                                    placeholder="Escribe aquí una observación privada (diagnósticos, pautas de dosis, detalles personales, etc.) para agregarla a la bitácora..."
                                    className="w-full h-24 resize-none rounded-xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-white/5 text-sm text-gray-800 dark:text-slate-200 p-3 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-mindpath-primary/50 transition-all font-sans"
                                />

                                <div className="flex justify-end">
                                    <button
                                        onClick={handleAddNote}
                                        disabled={!newNoteText.trim() || saveStatus === 'saving'}
                                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-black bg-mindpath-primary hover:bg-mindpath-primary/95 text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition shadow-sm"
                                    >
                                        <Plus size={14} /> Agregar a la Bitácora
                                    </button>
                                </div>
                            </div>

                            {/* Barra de Filtros del Historial */}
                            <div className="border-t border-b border-gray-100 dark:border-white/5 py-4 space-y-3">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                    <h4 className="font-extrabold text-sm text-gray-800 dark:text-white">
                                        Bitácora de Observaciones ({filteredNotes.length})
                                    </h4>
                                    
                                    {/* Presets de Fecha */}
                                    <div className="flex flex-wrap items-center gap-1 bg-gray-50 dark:bg-slate-700/50 p-1 rounded-xl self-start">
                                        {[
                                            { id: 'all', label: 'Todos' },
                                            { id: 'today', label: 'Hoy' },
                                            { id: 'week', label: 'Esta Semana' },
                                            { id: 'month', label: 'Este Mes' }
                                        ].map(preset => (
                                            <button
                                                key={preset.id}
                                                onClick={() => setDatePreset(preset.id)}
                                                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                                                    datePreset === preset.id
                                                        ? 'bg-white dark:bg-slate-800 text-mindpath-primary dark:text-white shadow-sm'
                                                        : 'text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200'
                                                }`}
                                            >
                                                {preset.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    {/* Buscador en notas */}
                                    <div className="relative">
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 dark:text-slate-500 pointer-events-none">
                                            <Search size={14} />
                                        </span>
                                        <input
                                            type="text"
                                            placeholder="Buscar en observaciones..."
                                            value={filterText}
                                            onChange={(e) => setFilterText(e.target.value)}
                                            className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-slate-700/30 border border-gray-100 dark:border-white/5 rounded-xl text-xs placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-mindpath-primary/50 transition-all"
                                        />
                                        {filterText && (
                                            <button 
                                                onClick={() => setFilterText('')}
                                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                                            >
                                                <X size={14} />
                                            </button>
                                        )}
                                    </div>

                                    {/* Rango de Fecha: Desde */}
                                    <div className="relative">
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 dark:text-slate-500 pointer-events-none text-xs font-bold">
                                            Desde:
                                        </span>
                                        <input
                                            type="date"
                                            value={filterDateFrom}
                                            onChange={(e) => {
                                                setFilterDateFrom(e.target.value);
                                                setDatePreset('all'); // Desactivar preset si se usa rango
                                            }}
                                            className="w-full pl-14 pr-3 py-2 bg-gray-50 dark:bg-slate-700/30 border border-gray-100 dark:border-white/5 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-mindpath-primary/50 transition-all"
                                        />
                                    </div>

                                    {/* Rango de Fecha: Hasta */}
                                    <div className="relative">
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 dark:text-slate-500 pointer-events-none text-xs font-bold">
                                            Hasta:
                                        </span>
                                        <input
                                            type="date"
                                            value={filterDateTo}
                                            onChange={(e) => {
                                                setFilterDateTo(e.target.value);
                                                setDatePreset('all');
                                            }}
                                            className="w-full pl-14 pr-3 py-2 bg-gray-50 dark:bg-slate-700/30 border border-gray-100 dark:border-white/5 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-mindpath-primary/50 transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Historial de Notas (Timeline) */}
                            <div className="flex-1 space-y-4 max-h-[500px] overflow-y-auto pr-1">
                                {loadingNotes ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                                        <RefreshCw size={24} className="animate-spin text-mindpath-primary mb-2" />
                                        <span className="text-xs font-medium">Cargando historial...</span>
                                    </div>
                                ) : filteredNotes.length === 0 ? (
                                    <div className="text-center py-12 text-gray-400">
                                        <StickyNote size={32} className="mx-auto mb-2 opacity-30" />
                                        <p className="text-xs">No se encontraron observaciones registradas.</p>
                                        {(filterText || filterDateFrom || filterDateTo || datePreset !== 'all') && (
                                            <button 
                                                onClick={() => {
                                                    setFilterText('');
                                                    setDatePreset('all');
                                                    setFilterDateFrom('');
                                                    setFilterDateTo('');
                                                }}
                                                className="text-xs text-mindpath-primary dark:text-mindpath-light font-bold underline mt-2 hover:opacity-80"
                                            >
                                                Limpiar filtros
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    filteredNotes.map((note, index) => {
                                        const isEditing = editingNoteId === note.id;
                                        const isExpanded = expandedNoteIds[note.id] !== undefined
                                            ? expandedNoteIds[note.id]
                                            : (index === 0);
                                        return (
                                            <div 
                                                key={note.id}
                                                className="bg-gray-50/50 dark:bg-slate-700/10 border border-gray-100 dark:border-white/5 p-4 rounded-2xl flex flex-col gap-3 transition-all hover:shadow-sm"
                                            >
                                                {/* Header de la Nota (Clickable para colapsar/expandir) */}
                                                <div 
                                                    onClick={() => !isEditing && toggleNoteExpand(note.id)}
                                                    className={`flex items-center justify-between gap-3 ${!isEditing ? 'cursor-pointer select-none' : ''}`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        {!isEditing && (
                                                            isExpanded ? (
                                                                <ChevronUp size={16} className="text-gray-400 dark:text-slate-500 shrink-0" />
                                                            ) : (
                                                                <ChevronDown size={16} className="text-gray-400 dark:text-slate-500 shrink-0" />
                                                            )
                                                        )}
                                                        <span className="flex items-center gap-1.5 text-[10px] text-mindpath-primary dark:text-mindpath-light font-bold bg-mindpath-light/50 dark:bg-mindpath-primary/10 px-2.5 py-1 rounded-lg">
                                                            <Clock size={10} />
                                                            {formatDateTime(note.updated_at)}
                                                        </span>
                                                    </div>

                                                    {/* Acciones */}
                                                    {!isEditing && (
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation(); // Evitar colapsar al hacer clic
                                                                    handleStartEdit(note);
                                                                }}
                                                                className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 transition"
                                                                title="Editar nota"
                                                            >
                                                                <Edit3 size={12} />
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation(); // Evitar colapsar al hacer clic
                                                                    handleDeleteNote(note.id);
                                                                }}
                                                                className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg text-gray-400 hover:text-red-500 transition"
                                                                title="Eliminar nota"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Contenido de la Nota */}
                                                {isEditing ? (
                                                    <div className="space-y-2">
                                                        <textarea
                                                            value={editingNoteText}
                                                            onChange={(e) => setEditingNoteText(e.target.value)}
                                                            className="w-full h-20 resize-none rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 text-sm text-gray-800 dark:text-slate-200 p-3 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-mindpath-primary/50 transition-all font-sans"
                                                        />
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            <button
                                                                onClick={handleCancelEdit}
                                                                className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition"
                                                            >
                                                                <X size={11} /> Cancelar
                                                            </button>
                                                            <button
                                                                onClick={() => handleSaveEdit(note.id)}
                                                                disabled={!editingNoteText.trim()}
                                                                className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-black bg-mindpath-primary text-white disabled:opacity-50 rounded-lg transition"
                                                            >
                                                                <Check size={11} /> Guardar
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    isExpanded ? (
                                                        <p className="whitespace-pre-line text-sm text-gray-700 dark:text-slate-200 leading-relaxed font-sans mt-1">
                                                            {note.notes}
                                                        </p>
                                                    ) : (
                                                        <p className="text-sm text-gray-500 dark:text-slate-400 truncate mt-1 cursor-pointer select-none" onClick={() => toggleNoteExpand(note.id)}>
                                                            {note.notes}
                                                        </p>
                                                    )
                                                )}
                                            </div>
                                        );
                                    })
                                )}
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
                                Selecciona un paciente de la lista lateral para visualizar sus datos y gestionar sus observaciones históricas en tiempo real.
                            </p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default DoctorNotes;
