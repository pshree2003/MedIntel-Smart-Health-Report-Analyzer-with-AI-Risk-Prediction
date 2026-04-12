import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import BookConsultant from './pages/BookConsultant';
import { ThemeProvider } from './context/ThemeContext';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <Router basename={import.meta.env.BASE_URL}>
        <div className="app-container">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/consultant" element={<BookConsultant />} />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;

