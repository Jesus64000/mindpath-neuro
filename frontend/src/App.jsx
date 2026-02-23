import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/auth/Register';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import PatientDashboard from './pages/patient/PatientDashboard';
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import DoctorSchedule from './pages/doctor/DoctorSchedule';
import VideoRoom from './pages/doctor/VideoRoom';
import ReportEditor from './pages/doctor/ReportEditor';
import PatientAppointments from './pages/patient/PatientAppointments';
import PatientVideoRoom from './pages/patient/PatientVideoRoom';
import DoctorsDirectory from './pages/patient/DoctorsDirectory';
import DoctorProfile from './pages/patient/DoctorProfile';
import PatientsList from './pages/doctor/PatientsList';
import PatientFile from './pages/doctor/PatientFile';
import ScheduleConfig from './pages/doctor/ScheduleConfig';
import DoctorProfileSettings from './pages/doctor/DoctorProfileSettings';

import AILab from './pages/doctor/AILab';

// Placeholder temporal para el Admin
const AdminDashboard = () => <div className="p-8 text-2xl font-bold text-slate-800">⚙️ Panel de Administración</div>;
const Unauthorized = () => <div className="p-8 text-2xl font-bold text-red-600">🚫 Acceso Denegado</div>;

function App() {
  return (
    <Router>
      <Routes>
        {/* Rutas Públicas */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Rutas Privadas envueltas en el Layout */}
        <Route element={<ProtectedRoute />}>
          {/* Ruta inmersiva de Telemedicina (Sin Sidebar) */}
          <Route path="/doctor/video-room/:id" element={<VideoRoom />} />
          <Route path="/patient/video-room/:id" element={<PatientVideoRoom />} />

          <Route element={<DashboardLayout />}>
            {/* Rutas específicas para Doctores */}
            <Route element={<ProtectedRoute allowedRoles={['doctor']} />}>
              <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
              <Route path="/doctor/schedule" element={<DoctorSchedule />} />
              <Route path="/doctor/schedule-config" element={<ScheduleConfig />} />
              <Route path="/doctor/profile-settings" element={<DoctorProfileSettings />} />
              <Route path="/doctor/report-editor/:reportId" element={<ReportEditor />} />
              <Route path="/doctor/patients" element={<PatientsList />} />
              <Route path="/doctor/patient/:id" element={<PatientFile />} />
              <Route path="/doctor/ia-lab" element={<AILab />} />
            </Route>

            {/* Rutas específicas para Pacientes */}
            <Route element={<ProtectedRoute allowedRoles={['patient']} />}>
              <Route path="/patient/dashboard" element={<PatientDashboard />} />
              <Route path="/patient/doctors" element={<DoctorsDirectory />} />
              <Route path="/patient/doctor/:id" element={<DoctorProfile />} />
              <Route path="/patient/appointments" element={<PatientAppointments />} />
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
