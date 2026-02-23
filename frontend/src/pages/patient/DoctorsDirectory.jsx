import { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Activity, UserX } from 'lucide-react';
import api from '../../api/axiosConfig';
import DoctorCard from '../../components/DoctorCard';

const DoctorsDirectory = () => {
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Estados para los filtros
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSpecialty, setSelectedSpecialty] = useState('Todas');

    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                // Reutilizamos la ruta general que ya hicimos en el Sprint 15
                const response = await api.get('/doctors');
                setDoctors(response.data);
            } catch (error) {
                console.error("Error al cargar el directorio:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDoctors();
    }, []);

    // Extraer especialidades únicas para el filtro desplegable (Select)
    const specialties = useMemo(() => {
        const unique = [...new Set(doctors.map(doc => doc.specialty))];
        return ['Todas', ...unique];
    }, [doctors]);

    // Lógica de Filtrado Inteligente (Cliente)
    const filteredDoctors = useMemo(() => {
        return doctors.filter(doc => {
            const matchesSearch = doc.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                  doc.specialty?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesSpecialty = selectedSpecialty === 'Todas' || doc.specialty === selectedSpecialty;
            
            return matchesSearch && matchesSpecialty;
        });
    }, [doctors, searchTerm, selectedSpecialty]);

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-12">
            
        {/* Header del Directorio */}
            <div className="bg-mindpath-dark rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
                <div className="relative z-10">
                    <h1 className="text-3xl md:text-4xl font-bold mb-3">Directorio Médico</h1>
                    <p className="text-gray-300 max-w-2xl text-lg">
                        Encuentra a los mejores especialistas en salud mental. Filtra por especialidad y agenda tu consulta online o presencial.
                    </p>
                </div>
            </div>

            {/* Barra de Búsqueda y Filtros */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4">
                
                {/* Buscador de Texto */}
                <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search size={20} className="text-gray-400" />
                    </div>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-mindpath-primary focus:border-transparent outline-none text-gray-700 transition-all"
                        placeholder="Buscar por nombre o especialidad..."
                    />
                </div>

                {/* Filtro por Especialidad */}
                <div className="relative w-full md:w-64 shrink-0">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Filter size={20} className="text-gray-400" />
                    </div>
                    <select
                        value={selectedSpecialty}
                        onChange={(e) => setSelectedSpecialty(e.target.value)}
                        className="w-full pl-12 pr-10 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-mindpath-primary focus:border-transparent outline-none text-gray-700 appearance-none cursor-pointer font-medium"
                    >
                        {specialties.map(spec => (
                            <option key={spec} value={spec}>{spec}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Resultados (Cuadrícula de Doctores) */}
            <div>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800">
                        {filteredDoctors.length} {filteredDoctors.length === 1 ? 'Especialista encontrado' : 'Especialistas encontrados'}
                    </h2>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <Activity className="animate-spin text-mindpath-primary" size={40} />
                    </div>
                ) : filteredDoctors.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredDoctors.map(doc => (
                            <DoctorCard key={doc.doctor_id} doctor={doc} />
                        ))}
                    </div>
                ) : (
                    <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl p-16 text-center flex flex-col items-center">
                        <UserX size={48} className="text-gray-300 mb-4" />
                        <h3 className="text-xl font-bold text-gray-700 mb-2">No hay resultados</h3>
                        <p className="text-gray-500 max-w-md">
                            No pudimos encontrar especialistas que coincidan con tu búsqueda. Intenta usar otros términos o quitar el filtro de especialidad.
                        </p>
                        <button 
                            onClick={() => { setSearchTerm(''); setSelectedSpecialty('Todas'); }}
                            className="mt-6 px-6 py-2.5 text-mindpath-primary font-bold bg-mindpath-light rounded-xl hover:bg-purple-100 transition-colors"
                        >
                            Limpiar filtros
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DoctorsDirectory;
