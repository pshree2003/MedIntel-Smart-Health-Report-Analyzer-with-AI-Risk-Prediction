import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import BookConsultant from './pages/BookConsultant';
import { ThemeProvider } from './context/ThemeContext';
import './App.css';

// Simple Route Guard for Patient Pages
const ProtectedRoute = ({ children }) => {
  const currentUser = localStorage.getItem('medintel_current_user');
  if (!currentUser) {
    return <Navigate to="/" replace />;
  }
  return children;
};

function App() {
  return (
    <ThemeProvider>
      <Router basename={import.meta.env.BASE_URL}>
        <div className="app-container">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<Navigate to="/" replace />} />
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
            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
