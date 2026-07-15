import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Stethoscope, Lock, Mail, Eye, EyeOff, AlertTriangle,
  Sun, Moon, ArrowLeft, Activity
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const DoctorLogin = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in as doctor
  useEffect(() => {
    const userStr = localStorage.getItem('medintel_current_user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user.role === 'doctor') navigate('/doctor-dashboard', { replace: true });
    }
  }, [navigate]);

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      const verifiedDocs = JSON.parse(localStorage.getItem('medintel_verified_doctors') || '[]');
      const found = verifiedDocs.find(
        d => d.email && d.email.toLowerCase() === email.toLowerCase() && d.password === password
      );

      if (found) {
        const doctorUser = { 
          name: found.name, 
          email: found.email, 
          role: 'doctor', 
          spec: found.spec, 
          regNum: found.regNum,
          hospital: found.hospital
        };
        localStorage.setItem('medintel_current_user', JSON.stringify(doctorUser));
        navigate('/doctor-dashboard', { replace: true });
      } else {
        setError('Invalid doctor credentials. Please check your email and password or contact the administrator.');
        setLoading(false);
      }
    }, 800);
  };

  const inputStyle = {
    width: '100%',
    padding: '0.8rem 1rem 0.8rem 2.8rem',
    background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
    border: '1px solid var(--surface-border)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)',
    outline: 'none',
    fontSize: '0.93rem',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-color)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Animated background blobs */}
      <div style={{
        position: 'absolute', width: '600px', height: '600px',
        background: 'radial-gradient(circle, rgba(0,210,255,0.08) 0%, transparent 70%)',
        top: '-100px', left: '-100px', filter: 'blur(60px)', zIndex: 0,
      }} />
      <div style={{
        position: 'absolute', width: '500px', height: '500px',
        background: 'radial-gradient(circle, rgba(46,204,113,0.07) 0%, transparent 70%)',
        bottom: '-80px', right: '-80px', filter: 'blur(60px)', zIndex: 0,
      }} />

      {/* Top controls */}
      <div style={{
        position: 'absolute', top: '1.5rem', left: 0, right: 0,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0 2rem', zIndex: 10,
      }}>
        <button
          onClick={() => navigate('/')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            background: 'transparent', border: 'none', color: 'var(--text-muted)',
            cursor: 'pointer', fontSize: '0.88rem', fontWeight: '600',
            transition: 'color 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          <ArrowLeft size={16} /> Back to Portal
        </button>
        <button
          onClick={toggleTheme}
          style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid var(--surface-border)',
            padding: '0.5rem', borderRadius: '50%', cursor: 'pointer',
            color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
      </div>

      {/* Login Card */}
      <div
        className="glass-panel animate-fade-in"
        style={{
          width: '100%', maxWidth: '440px', padding: '2.5rem',
          zIndex: 1, position: 'relative',
          boxShadow: '0 30px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.08)',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          {/* Icon */}
          <div style={{
            width: '68px', height: '68px', borderRadius: '20px',
            background: 'linear-gradient(135deg, var(--primary) 0%, #2980b9 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.25rem',
            boxShadow: '0 8px 24px rgba(0,210,255,0.25)',
          }}>
            <Stethoscope size={32} color="#ffffff" />
          </div>

          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            background: 'rgba(52, 152, 219, 0.1)', border: '1px solid rgba(52, 152, 219, 0.2)',
            color: '#3498db', padding: '0.3rem 0.85rem', borderRadius: 'var(--radius-full)',
            fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px',
            marginBottom: '1rem',
          }}>
            <Activity size={11} /> Doctor Portal Access
          </div>

          <h1 style={{ fontSize: '1.6rem', fontWeight: '800', margin: '0 0 0.4rem 0' }}>
            Doctor Sign In
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0 }}>
            Enter the login details assigned to you by the system administrator.
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.7rem 1rem', background: 'rgba(231,76,60,0.1)',
            borderLeft: '3px solid #e74c3c', color: '#e74c3c',
            fontSize: '0.85rem', borderRadius: '4px', marginBottom: '1.25rem',
          }}>
            <AlertTriangle size={14} />
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          {/* Email */}
          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', display: 'block', fontWeight: '600' }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                style={inputStyle}
                type="email"
                required
                placeholder="doctor@medintel.ai"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                onBlur={e => e.target.style.borderColor = 'var(--surface-border)'}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', display: 'block', fontWeight: '600' }}>
              Portal Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                style={{ ...inputStyle, paddingRight: '3rem' }}
                type={showPass ? 'text' : 'password'}
                required
                placeholder="••••••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                onBlur={e => e.target.style.borderColor = 'var(--surface-border)'}
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                style={{
                  position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                  display: 'flex', alignItems: 'center',
                }}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{
              padding: '0.9rem', marginTop: '0.5rem', fontSize: '0.97rem',
              opacity: loading ? 0.75 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            }}
          >
            {loading ? (
              <>
                <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                Authenticating…
              </>
            ) : (
              <><Stethoscope size={16} /> Access Doctor Dashboard</>
            )}
          </button>
        </form>

        {/* Footer note */}
        <p style={{ textAlign: 'center', fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '1.5rem', marginBottom: 0 }}>
          Not a verified panel doctor yet? Register via the landing page form.<br />
          Patient &amp; Admin login is available at the{' '}
          <span
            onClick={() => navigate('/')}
            style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: '600' }}
          >
            Landing Page
          </span>.
        </p>
      </div>
    </div>
  );
};

export default DoctorLogin;
