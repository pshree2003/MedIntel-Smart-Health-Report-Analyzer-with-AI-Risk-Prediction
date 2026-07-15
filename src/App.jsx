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
    const migrationFlag = 'medintel_credential_reset_v1';
    if (localStorage.getItem(migrationFlag)) {
      return;
    }

    const stripPasswords = (storageKey) => {
      try {
        const records = JSON.parse(localStorage.getItem(storageKey) || '[]');
        if (!Array.isArray(records)) return;
        const updatedRecords = records.map(({ password, ...rest }) => rest);
        localStorage.setItem(storageKey, JSON.stringify(updatedRecords));
      } catch {
        localStorage.setItem(storageKey, '[]');
      }
    };

    stripPasswords('medintel_users');
    stripPasswords('medintel_verified_doctors');
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
