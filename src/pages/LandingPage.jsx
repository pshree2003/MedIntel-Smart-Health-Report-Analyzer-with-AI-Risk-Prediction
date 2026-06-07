import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield, Cpu, HeartPulse, Sun, Moon, UserPlus, LogIn,
  Stethoscope, Mail, Lock, Eye, EyeOff, Upload, CheckCircle,
  AlertTriangle, User, Phone, BookOpen, Briefcase, X
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

/* ─── helpers ─── */
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const inputStyle = (theme) => ({
  width: '100%',
  padding: '0.7rem 1rem',
  background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
  border: '1px solid var(--surface-border)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--text-primary)',
  outline: 'none',
  fontSize: '0.9rem',
  boxSizing: 'border-box',
});

const labelStyle = { fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.3rem', display: 'block' };

const credentialSheetKey = 'medintel_patient_credentials_sheet';

const csvEscape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

const buildCredentialSheet = (rows) => {
  const header = ['name', 'email', 'password', 'mobile number'];
  const lines = [header.map(csvEscape).join(',')];

  rows.forEach((row) => {
    lines.push([
      csvEscape(row.name),
      csvEscape(row.email),
      csvEscape(row.password),
      csvEscape(row.phone)
    ].join(','));
  });

  return lines.join('\n');
};

const persistCredentialRow = async (row) => {
  try {
    const response = await fetch('http://localhost:3001/api/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(row)
    });

    if (!response.ok) {
      throw new Error('Credential server rejected the request.');
    }

    return true;
  } catch (error) {
    const existingRows = JSON.parse(localStorage.getItem(credentialSheetKey) || '[]');
    localStorage.setItem(credentialSheetKey, JSON.stringify([...existingRows, row]));
    return false;
  }
};

/* ══════════════════════════════════════════
   PATIENT AUTH PANEL (Login / Register tabs)
══════════════════════════════════════════ */
const PatientAuth = ({ onSuccess }) => {
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const { theme } = useTheme();
  const authPanelClass = tab === 'login' ? 'auth-swap-panel auth-swap-login' : 'auth-swap-panel auth-swap-register';

  // Login state
  const [loginEmail, setLoginEmail]     = useState('');
  const [loginPass, setLoginPass]       = useState('');
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [loginErr, setLoginErr]         = useState('');

  // Register state
  const [regName, setRegName]           = useState('');
  const [regEmail, setRegEmail]         = useState('');
  const [regPhone, setRegPhone]         = useState('');
  const [regPass, setRegPass]           = useState('');
  const [regPass2, setRegPass2]         = useState('');
  const [showRegPass, setShowRegPass]   = useState(false);
  const [regErr, setRegErr]             = useState('');
  const [regOk, setRegOk]              = useState('');

  /* ── login ── */
  const handleLogin = (e) => {
    e.preventDefault();
    setLoginErr('');
    const users = JSON.parse(localStorage.getItem('medintel_users') || '[]');
    const found = users.find(u => u.email.toLowerCase() === loginEmail.toLowerCase() && u.password === regPass || u.email.toLowerCase() === loginEmail.toLowerCase() && u.password === loginPass);
    if (!found) return setLoginErr('Incorrect email or password.');
    localStorage.setItem('medintel_current_user', JSON.stringify(found));
    sessionStorage.setItem('medintel_open_upload_popup', '1');
    onSuccess('/dashboard');
  };

  /* ── register ── */
  const handleRegister = (e) => {
    e.preventDefault();
    setRegErr(''); setRegOk('');
    if (!regName.trim())               return setRegErr('Full name is required.');
    if (!emailRe.test(regEmail))       return setRegErr('Enter a valid email address.');
    if (!regPhone.trim())              return setRegErr('Mobile number is required.');
    if (regPass.length < 6)            return setRegErr('Password must be at least 6 characters.');
    if (regPass !== regPass2)          return setRegErr('Passwords do not match.');

    const users = JSON.parse(localStorage.getItem('medintel_users') || '[]');
    if (users.find(u => u.email.toLowerCase() === regEmail.toLowerCase()))
      return setRegErr('This email is already registered.');

    const newUser = { name: regName.trim(), email: regEmail.toLowerCase(), phone: regPhone, password: regPass, reports: [] };
    users.push(newUser);
    localStorage.setItem('medintel_users', JSON.stringify(users));
    localStorage.setItem('medintel_current_user', JSON.stringify(newUser));
    sessionStorage.setItem('medintel_open_upload_popup', '1');
    persistCredentialRow({ name: regName.trim(), email: regEmail.toLowerCase(), password: regPass, phone: regPhone })
      .finally(() => {
        setRegOk('Account created! Redirecting…');
        setTimeout(() => onSuccess('/dashboard'), 1000);
      });
  };

  const tabBtn = (id, label, Icon) => (
    <button
      onClick={() => { setLoginErr(''); setRegErr(''); setTab(id); }}
      style={{
        flex: 1, padding: '0.65rem', background: tab === id ? 'rgba(0,210,255,0.12)' : 'transparent',
        border: 'none', color: tab === id ? 'var(--primary)' : 'var(--text-muted)',
        borderBottom: tab === id ? '2px solid var(--primary)' : '2px solid transparent',
        cursor: 'pointer', fontWeight: tab === id ? '700' : '500', fontSize: '0.88rem',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
        transition: 'all 0.2s'
      }}
    >
      <Icon size={15} /> {label}
    </button>
  );

  const Err = ({ msg }) => msg ? (
    <div style={{ padding: '0.6rem 0.85rem', background: 'rgba(231,76,60,0.1)', borderLeft: '3px solid var(--danger)', color: 'var(--danger)', fontSize: '0.82rem', borderRadius: '4px', marginBottom: '0.75rem' }}>
      <AlertTriangle size={13} style={{ marginRight: '0.35rem', verticalAlign: 'middle' }} />{msg}
    </div>
  ) : null;

  const Ok = ({ msg }) => msg ? (
    <div style={{ padding: '0.6rem 0.85rem', background: 'rgba(46,204,113,0.1)', borderLeft: '3px solid var(--success)', color: 'var(--success)', fontSize: '0.82rem', borderRadius: '4px', marginBottom: '0.75rem' }}>
      <CheckCircle size={13} style={{ marginRight: '0.35rem', verticalAlign: 'middle' }} />{msg}
    </div>
  ) : null;

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--surface-border)', marginBottom: '1.5rem' }}>
        {tabBtn('login',    'Patient Login',    LogIn)}
        {tabBtn('register', 'New Patient',      UserPlus)}
      </div>

      <div key={tab} className={authPanelClass}>
        {/* ── LOGIN ── */}
        {tab === 'login' && (
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <Err msg={loginErr} />
          <div>
            <label style={labelStyle}>Email Address</label>
            <input style={inputStyle(theme)} type="email" required placeholder="patient@email.com"
              value={loginEmail} onChange={e => setLoginEmail(e.target.value)} />
          </div>
          <div style={{ position: 'relative' }}>
            <label style={labelStyle}>Password</label>
            <input style={inputStyle(theme)} type={showLoginPass ? 'text' : 'password'} required placeholder="••••••••"
              value={loginPass} onChange={e => setLoginPass(e.target.value)} />
            <button type="button" onClick={() => setShowLoginPass(v => !v)}
              style={{ position: 'absolute', right: '0.75rem', top: '60%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
              {showLoginPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <button type="submit" className="btn-primary" style={{ padding: '0.8rem', marginTop: '0.5rem', fontSize: '0.95rem' }}>
            Login to Dashboard
          </button>
        </form>
        )}

        {/* ── REGISTER ── */}
        {tab === 'register' && (
        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Err msg={regErr} /><Ok msg={regOk} />
          <div>
            <label style={labelStyle}>Full Name</label>
            <input style={inputStyle(theme)} type="text" required placeholder="John Doe"
              value={regName} onChange={e => setRegName(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Email Address</label>
            <input style={inputStyle(theme)} type="email" required placeholder="patient@email.com"
              value={regEmail} onChange={e => setRegEmail(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Mobile Number</label>
            <input style={inputStyle(theme)} type="tel" required placeholder="+91 9876543210"
              value={regPhone} onChange={e => setRegPhone(e.target.value)} />
          </div>
          <div style={{ position: 'relative' }}>
            <label style={labelStyle}>Create Password</label>
            <input style={inputStyle(theme)} type={showRegPass ? 'text' : 'password'} required placeholder="Min 6 characters"
              value={regPass} onChange={e => setRegPass(e.target.value)} />
            <button type="button" onClick={() => setShowRegPass(v => !v)}
              style={{ position: 'absolute', right: '0.75rem', top: '60%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
              {showRegPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <div>
            <label style={labelStyle}>Confirm Password</label>
            <input style={inputStyle(theme)} type="password" required placeholder="Re-enter password"
              value={regPass2} onChange={e => setRegPass2(e.target.value)} />
          </div>
          <button type="submit" className="btn-primary" style={{ padding: '0.8rem', marginTop: '0.5rem', fontSize: '0.95rem' }}>
            Create Patient Account
          </button>
        </form>
        )}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════
   SPECIALIST REGISTRATION MODAL
══════════════════════════════════════════ */
const SpecialistModal = ({ onClose }) => {
  const { theme } = useTheme();

  const [step, setStep] = useState(1); // 1 = form, 2 = success
  const [name, setName]           = useState('');
  const [email, setEmail]         = useState('');
  const [phone, setPhone]         = useState('');
  const [specialty, setSpecialty] = useState('General Physician');
  const [regNum, setRegNum]       = useState('');
  const [hospital, setHospital]   = useState('');
  const [expYears, setExpYears]   = useState('');
  const [idFile, setIdFile]       = useState(null);
  const [certFile, setCertFile]   = useState(null);
  const [err, setErr]             = useState('');
  const [submitting, setSubmitting] = useState(false);

  const specialties = [
    'General Physician', 'Cardiologist', 'Endocrinologist', 'Nephrologist',
    'Hematologist', 'Gastroenterologist', 'Pulmonologist', 'Neurologist',
    'Orthopedic Surgeon', 'Dermatologist', 'Oncologist', 'Pediatrician'
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    setErr('');
    if (!name.trim())       return setErr('Full name is required.');
    if (!emailRe.test(email)) return setErr('Enter a valid email address.');
    if (!regNum.trim())     return setErr('Medical registration number is required.');
    if (!idFile)            return setErr('Please upload a government-issued ID proof.');
    if (!certFile)          return setErr('Please upload your medical degree / registration certificate.');

    setSubmitting(true);
    // Simulate verification processing + "email" sent
    setTimeout(() => {
      // Store pending specialist
      const pending = JSON.parse(localStorage.getItem('medintel_pending_specialists') || '[]');
      pending.push({
        name, email, phone, specialty, regNum, hospital, expYears,
        idFileName: idFile.name, certFileName: certFile.name,
        status: 'Pending Verification', submittedAt: new Date().toISOString()
      });
      localStorage.setItem('medintel_pending_specialists', JSON.stringify(pending));
      setSubmitting(false);
      setStep(2);
    }, 1800);
  };

  const IS = inputStyle(theme);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '580px', maxHeight: '92vh', overflowY: 'auto', padding: '2.25rem', position: 'relative', boxShadow: '0 30px 60px rgba(0,0,0,0.5)' }}>
        {/* Close */}
        <button onClick={onClose} style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
          <X size={20} />
        </button>

        {step === 1 ? (
          <>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '0.4rem' }}>
              <div style={{ background: 'rgba(0,210,255,0.12)', padding: '0.65rem', borderRadius: '12px' }}>
                <Stethoscope size={26} color="var(--primary)" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: '800' }}>Specialist Registration</h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Submit details for verification · Credentials sent via email</p>
              </div>
            </div>

            <div style={{ padding: '0.65rem 1rem', background: 'rgba(0,210,255,0.06)', border: '1px solid rgba(0,210,255,0.15)', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              🔒 Your documents are reviewed by our admin team. Login credentials are emailed to you only after successful verification.
            </div>

            {err && (
              <div style={{ padding: '0.6rem 0.85rem', background: 'rgba(231,76,60,0.1)', borderLeft: '3px solid var(--danger)', color: 'var(--danger)', fontSize: '0.82rem', borderRadius: '4px', marginBottom: '1rem' }}>
                <AlertTriangle size={13} style={{ marginRight: '0.35rem', verticalAlign: 'middle' }} />{err}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              {/* Row: Name + Specialty */}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}><User size={12} style={{ marginRight: '0.3rem', verticalAlign: 'middle' }} />Full Name *</label>
                  <input style={IS} type="text" required placeholder="Dr. Ramesh Kumar" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}><Briefcase size={12} style={{ marginRight: '0.3rem', verticalAlign: 'middle' }} />Specialization *</label>
                  <select style={{ ...IS, background: theme === 'dark' ? '#151928' : '#fff', cursor: 'pointer' }} value={specialty} onChange={e => setSpecialty(e.target.value)}>
                    {specialties.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Row: Email + Phone */}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}><Mail size={12} style={{ marginRight: '0.3rem', verticalAlign: 'middle' }} />Email Address *</label>
                  <input style={IS} type="email" required placeholder="doctor@hospital.com" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}><Phone size={12} style={{ marginRight: '0.3rem', verticalAlign: 'middle' }} />Contact Phone</label>
                  <input style={IS} type="tel" placeholder="+91 9876543210" value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
              </div>

              {/* Row: Reg No + Experience */}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}><BookOpen size={12} style={{ marginRight: '0.3rem', verticalAlign: 'middle' }} />Medical Reg. Number *</label>
                  <input style={IS} type="text" required placeholder="MCI-2024-XXXXX" value={regNum} onChange={e => setRegNum(e.target.value)} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Years of Experience</label>
                  <input style={IS} type="number" min="0" placeholder="e.g. 8" value={expYears} onChange={e => setExpYears(e.target.value)} />
                </div>
              </div>

              {/* Hospital */}
              <div>
                <label style={labelStyle}>Current Hospital / Clinic</label>
                <input style={IS} type="text" placeholder="Apollo Hospital, Mumbai" value={hospital} onChange={e => setHospital(e.target.value)} />
              </div>

              {/* File uploads */}
              <div style={{ borderTop: '1px solid var(--surface-border)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.82rem', fontWeight: '600', color: 'var(--primary)' }}>Identity & Credential Documents</p>

                {/* ID Proof */}
                <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', cursor: 'pointer' }}>
                  <span style={labelStyle}><Upload size={12} style={{ marginRight: '0.3rem', verticalAlign: 'middle' }} />Government ID Proof * (Aadhaar / Passport / PAN)</span>
                  <div style={{ padding: '0.65rem 1rem', border: `2px dashed ${idFile ? 'var(--success)' : 'var(--surface-border)'}`, borderRadius: 'var(--radius-sm)', background: idFile ? 'rgba(46,204,113,0.04)' : 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.83rem', color: idFile ? 'var(--success)' : 'var(--text-muted)' }}>
                    {idFile ? <CheckCircle size={14} /> : <Upload size={14} />}
                    {idFile ? idFile.name : 'Click to upload PDF / JPG / PNG'}
                    <input type="file" style={{ display: 'none' }} accept=".pdf,image/*" onChange={e => setIdFile(e.target.files[0])} />
                  </div>
                </label>

                {/* Certificate */}
                <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', cursor: 'pointer' }}>
                  <span style={labelStyle}><Upload size={12} style={{ marginRight: '0.3rem', verticalAlign: 'middle' }} />Medical Degree / Registration Certificate *</span>
                  <div style={{ padding: '0.65rem 1rem', border: `2px dashed ${certFile ? 'var(--success)' : 'var(--surface-border)'}`, borderRadius: 'var(--radius-sm)', background: certFile ? 'rgba(46,204,113,0.04)' : 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.83rem', color: certFile ? 'var(--success)' : 'var(--text-muted)' }}>
                    {certFile ? <CheckCircle size={14} /> : <Upload size={14} />}
                    {certFile ? certFile.name : 'Click to upload PDF / JPG / PNG'}
                    <input type="file" style={{ display: 'none' }} accept=".pdf,image/*" onChange={e => setCertFile(e.target.files[0])} />
                  </div>
                </label>
              </div>

              <button type="submit" className="btn-primary" disabled={submitting} style={{ padding: '0.85rem', marginTop: '0.5rem', fontSize: '0.95rem', opacity: submitting ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                {submitting ? (
                  <>
                    <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    Submitting for Verification…
                  </>
                ) : 'Submit Registration for Verification'}
              </button>
            </form>
          </>
        ) : (
          /* Step 2 – Success */
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <div style={{ background: 'rgba(46,204,113,0.1)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <CheckCircle size={40} color="var(--success)" />
            </div>
            <h3 style={{ fontSize: '1.4rem', marginBottom: '0.75rem' }}>Registration Submitted!</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '0.5rem' }}>
              Thank you, <strong>{name}</strong>! Your credentials and documents have been received.
            </p>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '2rem', fontSize: '0.9rem' }}>
              Our admin team will review and verify your details. Upon approval, your login credentials will be sent to&nbsp;
              <strong style={{ color: 'var(--primary)' }}>{email}</strong>.
            </p>
            <div style={{ padding: '1rem', background: 'rgba(0,210,255,0.06)', border: '1px solid rgba(0,210,255,0.15)', borderRadius: 'var(--radius-sm)', fontSize: '0.83rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
              📧 Verification usually takes 1–2 business days. Please check your inbox and spam folder.
            </div>
            <button onClick={onClose} className="btn-primary" style={{ padding: '0.8rem 2rem' }}>Close</button>
          </div>
        )}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════
   MAIN LANDING PAGE
══════════════════════════════════════════ */
const LandingPage = () => {
  const navigate  = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const currentUserStr = localStorage.getItem('medintel_current_user');
  const currentUser    = currentUserStr ? JSON.parse(currentUserStr) : null;

  const [showSpecialistModal, setShowSpecialistModal] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('medintel_current_user');
    window.location.reload();
  };

  const handleAuthSuccess = (path) => navigate(path);

  return (
    <div className="landing-container">

      {/* ── LEFT PANE ── */}
      <div className="landing-left">
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.1rem' }}>
            <div style={{ position: 'relative', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, var(--primary) 0%, rgba(0,210,255,0.5) 100%)', borderRadius: '14px', transform: 'rotate(10deg)', opacity: 0.2 }} />
              <div style={{ position: 'absolute', inset: '2px', background: 'linear-gradient(135deg, var(--primary) 0%, #2563eb 100%)', borderRadius: '12px' }} />
              <HeartPulse size={26} color="#ffffff" style={{ position: 'relative', zIndex: 1 }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <h2 style={{ fontSize: '1.6rem', margin: 0, fontWeight: '800', letterSpacing: '0.2px', color: 'var(--text-primary)', lineHeight: 1 }}>
                MedIntel<span style={{ color: 'var(--primary)' }}>.AI</span>
              </h2>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--text-muted)', fontWeight: '600', marginTop: '4px' }}>Patient Intelligence</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {currentUser && (
              <>
                <button onClick={() => navigate('/dashboard')} style={{ background: 'transparent', border: '1px solid var(--surface-border)', color: 'var(--text-secondary)', padding: '0.5rem 1.25rem', borderRadius: 'var(--radius-full)', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem' }}>
                  Dashboard
                </button>
                <button onClick={handleLogout} style={{ background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.2)', color: 'var(--danger)', padding: '0.5rem 1.25rem', borderRadius: 'var(--radius-full)', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem' }}>
                  Logout
                </button>
              </>
            )}
            <button onClick={toggleTheme} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--surface-border)', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
          </div>
        </div>

        {/* Hero text */}
        <h1 style={{ fontSize: '3.2rem', marginBottom: '1.25rem', lineHeight: '1.1' }}>
          Analyze Health Reports <br /><span style={{ color: 'var(--primary)' }}>in Seconds.</span>
        </h1>
        <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: '2.5rem', maxWidth: '500px', lineHeight: '1.65' }}>
          Instantly extract patient data, detect critical medical values, and receive real AI-driven dietary and treatment recommendations by simply uploading your document.
        </p>

        {/* Feature bullets */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem', marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.75rem', background: 'rgba(46,204,113,0.1)', borderRadius: '12px' }}>
              <Shield size={24} color="var(--success)" />
            </div>
            <div>
              <h4 style={{ margin: '0 0 0.2rem 0', fontSize: '1rem' }}>Powered by Gemini AI</h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Using massive language models to read PDFs & Images.</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.75rem', background: 'rgba(0,210,255,0.1)', borderRadius: '12px' }}>
              <Cpu size={24} color="var(--primary)" />
            </div>
            <div>
              <h4 style={{ margin: '0 0 0.2rem 0', fontSize: '1rem' }}>Smart Value Detection</h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Automatically extracts WBC, sugars, limits, and flags risks.</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.75rem', background: 'rgba(155,89,182,0.1)', borderRadius: '12px' }}>
              <Stethoscope size={24} color="var(--secondary, #9b59b6)" />
            </div>
            <div>
              <h4 style={{ margin: '0 0 0.2rem 0', fontSize: '1rem' }}>Verified Specialist Network</h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Book consultations with identity-verified medical specialists.</p>
            </div>
          </div>
        </div>

        {/* Specialist CTA */}
        <div style={{ padding: '1.25rem 1.5rem', background: 'rgba(0,210,255,0.05)', border: '1px solid rgba(0,210,255,0.15)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <p style={{ margin: '0 0 0.2rem 0', fontWeight: '700', fontSize: '0.95rem' }}>Are you a Medical Specialist?</p>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>Register & get verified to join our specialist panel.</p>
          </div>
          <button
            onClick={() => setShowSpecialistModal(true)}
            style={{ padding: '0.6rem 1.25rem', background: 'rgba(0,210,255,0.12)', border: '1px solid rgba(0,210,255,0.3)', color: 'var(--primary)', borderRadius: 'var(--radius-full)', cursor: 'pointer', fontWeight: '700', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap', transition: 'all 0.2s' }}
          >
            <Stethoscope size={15} /> Register as Specialist
          </button>
        </div>
      </div>

      {/* ── RIGHT PANE — Auth panel ── */}
      <div className="landing-right">
        {/* Background blob */}
        <div style={{ position: 'absolute', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(0,210,255,0.1) 0%, rgba(0,0,0,0) 70%)', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', filter: 'blur(50px)', zIndex: 0 }} />

        <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '480px', padding: '2.5rem', zIndex: 1, boxShadow: '0 20px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)' }}>
          {currentUser ? (
            /* Already logged in */
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{ background: 'rgba(0,210,255,0.1)', width: '72px', height: '72px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
                <User size={34} color="var(--primary)" />
              </div>
              <h3 style={{ margin: '0 0 0.4rem 0', fontSize: '1.3rem' }}>Welcome back,</h3>
              <p style={{ color: 'var(--primary)', fontWeight: '700', fontSize: '1.1rem', margin: '0 0 0.5rem 0' }}>{currentUser.name}</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '2rem' }}>{currentUser.email}</p>
              <button className="btn-primary" style={{ width: '100%', padding: '0.85rem', marginBottom: '0.75rem' }} onClick={() => navigate('/dashboard')}>
                Go to Dashboard
              </button>
              <button onClick={handleLogout} style={{ width: '100%', padding: '0.75rem', background: 'rgba(231,76,60,0.08)', border: '1px solid rgba(231,76,60,0.2)', color: 'var(--danger)', borderRadius: 'var(--radius-full)', cursor: 'pointer', fontWeight: '600' }}>
                Logout
              </button>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ margin: '0 0 0.3rem 0', fontSize: '1.6rem', fontWeight: '800' }}>Patient Portal</h2>
                <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.88rem' }}>Login or create an account to access your health dashboard.</p>
              </div>
              <PatientAuth onSuccess={handleAuthSuccess} />
            </>
          )}
        </div>
      </div>

      {/* Specialist Modal */}
      {showSpecialistModal && <SpecialistModal onClose={() => setShowSpecialistModal(false)} />}

      <style>{`
        @keyframes spin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
};

export default LandingPage;
