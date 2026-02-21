import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import PatientDashboard from './pages/patient/PatientDashboard';

// Placeholder temporal para el Doctor
const DoctorDashboard = () => <div className="p-8">Panel del Doctor (En construcción)</div>;
const AdminDashboard = () => <div className="p-8 text-2xl font-bold text-slate-800">⚙️ Panel de Administración</div>;
const Unauthorized = () => <div className="p-8 text-2xl font-bold text-red-600">🚫 Acceso Denegado</div>;

function App() {
  return (
    <Router>
      <Routes>
        {/* Rutas Públicas */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Rutas Privadas envueltas en el Layout */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            {/* Rutas específicas para Doctores */}
            <Route element={<ProtectedRoute allowedRoles={['doctor']} />}>
              <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
            </Route>

            {/* Rutas específicas para Pacientes */}
            <Route element={<ProtectedRoute allowedRoles={['patient']} />}>
              <Route path="/patient/dashboard" element={<PatientDashboard />} />
            </Route>

            {/* Rutas específicas para Administradores */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
            </Route>
          </Route>
        </Route>

        {/* Ruta 404 (Not Found) */}
        <Route path="*" element={<div className="p-8 text-2xl font-bold">404 - Página no encontrada</div>} />
      </Routes>
    </Router>
  );
}

export default App;
