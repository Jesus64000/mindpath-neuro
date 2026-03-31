import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
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
import PatientSettings from './pages/patient/PatientSettings';
import AppointmentDetail from './pages/doctor/AppointmentDetail';
import AILab from './pages/doctor/AILab';
import WrapUp from './pages/doctor/WrapUp';
import ConsultationRoom from './pages/doctor/ConsultationRoom';
import AdminDashboard from './pages/admin/AdminDashboard';
import SuperAdminSetup from './pages/admin/SuperAdminSetup';
import MyHistory from './pages/patient/MyHistory';
import DoctorStats from './pages/doctor/DoctorStats';
import ResetPassword from './pages/auth/ResetPassword';
import useSettingsStore from './store/useSettingsStore';

import api from './api/axiosConfig';

const Unauthorized = () => <div className="p-8 text-2xl font-bold text-red-600">🚫 Acceso Denegado</div>;

function App() {
  const applySettings = useSettingsStore(s => s.applySettings);

  useEffect(() => {
    // Aplicar dark mode guardado en localStorage
    const savedTheme = localStorage.getItem('mindpath_theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    }

    // Cargar configuración del sistema (theming)
    api.get('/admin/settings').then(res => applySettings(res.data)).catch(() => {});
  }, [applySettings]);

  return (
    <Router>
      <Routes>
        {/* Rutas Públicas */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/superadmin" element={<SuperAdminSetup />} />

        {/* Rutas Privadas envueltas en el Layout */}
        <Route element={<ProtectedRoute />}>
          {/* Rutas inmersivas (Sin Sidebar) */}
          <Route path="/doctor/video-room/:id" element={<VideoRoom />} />
          <Route path="/doctor/wrap-up/:appointmentId" element={<WrapUp />} />
          <Route path="/doctor/consultation/:appointmentId" element={<ConsultationRoom />} />
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
              <Route path="/doctor/appointment/:id" element={<AppointmentDetail />} />
              <Route path="/doctor/stats" element={<DoctorStats />} />
            </Route>


            {/* Rutas específicas para Pacientes */}
            <Route element={<ProtectedRoute allowedRoles={['patient']} />}>
              <Route path="/patient/dashboard" element={<PatientDashboard />} />
              <Route path="/patient/doctors" element={<DoctorsDirectory />} />
              <Route path="/patient/doctor/:id" element={<DoctorProfile />} />
              <Route path="/patient/appointments" element={<PatientAppointments />} />
              <Route path="/patient/history" element={<MyHistory />} />
              <Route path="/patient/settings" element={<PatientSettings />} />
            </Route>

            {/* Rutas para Admin y Supervisor */}
            <Route element={<ProtectedRoute allowedRoles={['admin', 'supervisor']} />}>
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
