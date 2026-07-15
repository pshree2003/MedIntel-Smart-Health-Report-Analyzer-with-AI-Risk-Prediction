import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import BookConsultant from './pages/BookConsultant';
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/AdminLogin';
import DoctorLogin from './pages/DoctorLogin';
import DoctorDashboard from './pages/DoctorDashboard';
import { ThemeProvider } from './context/ThemeContext';
import './App.css';

// Simple Route Guard for Patient Pages — admin and doctor are blocked
const ProtectedRoute = ({ children }) => {
  const currentUserStr = localStorage.getItem('medintel_current_user');
  if (!currentUserStr) {
    return <Navigate to="/" replace />;
  }
  const currentUser = JSON.parse(currentUserStr);
  if (currentUser.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }
  if (currentUser.role === 'doctor') {
    return <Navigate to="/doctor-dashboard" replace />;
  }
  return children;
};

// Admin Route Guard
const AdminRoute = ({ children }) => {
  const currentUserStr = localStorage.getItem('medintel_current_user');
  if (!currentUserStr) {
    return <Navigate to="/" replace />;
  }
  const currentUser = JSON.parse(currentUserStr);
  if (currentUser.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

// Doctor Route Guard
const DoctorRoute = ({ children }) => {
  const currentUserStr = localStorage.getItem('medintel_current_user');
  if (!currentUserStr) {
    return <Navigate to="/" replace />;
  }
  const currentUser = JSON.parse(currentUserStr);
  if (currentUser.role !== 'doctor') {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

function App() {
  useEffect(() => {
    const migrationFlag = 'medintel_auth_bootstrap_v2';
    if (localStorage.getItem(migrationFlag)) {
      return;
    }

    const ensureArray = (storageKey) => {
      try {
        const records = JSON.parse(localStorage.getItem(storageKey) || '[]');
        return Array.isArray(records) ? records : [];
      } catch {
        return [];
      }
    };

    const seedUsers = () => {
      const existingUsers = ensureArray('medintel_users');
      const demoPatient = {
        name: 'Demo Patient',
        email: 'patient@medintel.ai',
        phone: '+91 90000 10001',
        password: 'patient@2003',
        role: 'patient',
        reports: []
      };
      const updatedUsers = existingUsers.filter((user) => user?.email?.toLowerCase() !== demoPatient.email);
      updatedUsers.push(demoPatient);
      localStorage.setItem('medintel_users', JSON.stringify(updatedUsers));
    };

    const seedDoctors = () => {
      const existingDoctors = ensureArray('medintel_verified_doctors');
      const demoDoctor = {
        name: 'Demo Doctor',
        email: 'doctor@medintel.ai',
        password: 'doctor@2003',
        spec: 'General Physician',
        regNum: 'MED-2003-001',
        hospital: 'MedIntel Demo Hospital',
        role: 'doctor'
      };
      const updatedDoctors = existingDoctors.filter((doctor) => doctor?.email?.toLowerCase() !== demoDoctor.email);
      updatedDoctors.push(demoDoctor);
      localStorage.setItem('medintel_verified_doctors', JSON.stringify(updatedDoctors));
    };

    seedUsers();
    seedDoctors();
    localStorage.removeItem('medintel_patient_credentials_sheet');
    localStorage.setItem(migrationFlag, '1');
  }, []);

  return (
    <ThemeProvider>
      <Router basename={import.meta.env.BASE_URL}>
        <div className="app-container">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<Navigate to="/" replace />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/doctor-login" element={<DoctorLogin />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/consultant" 
              element={
                <ProtectedRoute>
                  <BookConsultant />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              } 
            />
            <Route 
              path="/doctor-dashboard" 
              element={
                <DoctorRoute>
                  <DoctorDashboard />
                </DoctorRoute>
              } 
            />
            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
