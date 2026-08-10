import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import {
  Shield,
  Users,
  Stethoscope,
  Trash2,
  CheckCircle,
  XCircle,
  Plus,
  Search,
  LogOut,
  MapPin,
  Award,
  Phone,
  Mail,
  User,
  HeartPulse,
  Clock,
  Briefcase,
  AlertCircle,
  Sun,
  Moon,
  Check,
  X,
  Eye,
  Lock
} from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  // Admin user verification
  const [adminUser] = useState(() => {
    const userStr = localStorage.getItem('medintel_current_user');
    if (userStr) {
      const parsed = JSON.parse(userStr);
      if (parsed.role === 'admin') return parsed;
    }
    return null;
  });

  useEffect(() => {
    if (!adminUser) {
      navigate('/');
    }
  }, [adminUser, navigate]);

  // Tab State
  const [activeTab, setActiveTab] = useState('patients'); // 'patients' | 'verifications' | 'doctors'

  // Data States
  const [patients, setPatients] = useState(() => JSON.parse(localStorage.getItem('medintel_users') || '[]'));
  const [pendingSpecialists, setPendingSpecialists] = useState(() => JSON.parse(localStorage.getItem('medintel_pending_specialists') || '[]'));
  const [verifiedDoctors, setVerifiedDoctors] = useState(() => JSON.parse(localStorage.getItem('medintel_verified_doctors') || '[]'));

  // Search & Filters
  const [patientSearch, setPatientSearch] = useState('');
  const [doctorSearch, setDoctorSearch] = useState('');

  // Modal States
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);

  // New Patient Form State
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientEmail, setNewPatientEmail] = useState('');
  const [newPatientPhone, setNewPatientPhone] = useState('');
  const [newPatientPassword, setNewPatientPassword] = useState('');
  const [patientModalError, setPatientModalError] = useState('');

  // New Doctor Form State
  const [newDocName, setNewDocName] = useState('');
  const [newDocEmail, setNewDocEmail] = useState('');
  const [newDocSpecialty, setNewDocSpecialty] = useState('General Physician');
  const [newDocHospital, setNewDocHospital] = useState('');
  const [newDocCity, setNewDocCity] = useState('');
  const [newDocRating, setNewDocRating] = useState('4.5');
  const [newDocContact, setNewDocContact] = useState('');
  const [newDocFee, setNewDocFee] = useState('₹500');
  const [newDocExp, setNewDocExp] = useState('');
  const [newDocRegNum, setNewDocRegNum] = useState('');
  const [doctorModalError, setDoctorModalError] = useState('');

  // Detail / Document Viewer Modal States
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [viewDocSpecialist, setViewDocSpecialist] = useState(null);
  const [showPwdEdit, setShowPwdEdit] = useState(false);
  const [imageModal, setImageModal] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [approvalEmailModal, setApprovalEmailModal] = useState(null);

  // Password editing inside detail modals
  const [editPatientPwd, setEditPatientPwd] = useState('');
  const [editPatientPwdErr, setEditPatientPwdErr] = useState('');
  const [editPatientPwdOk, setEditPatientPwdOk] = useState('');
  const [editDoctorPwd, setEditDoctorPwd] = useState('');
  const [editDoctorPwdErr, setEditDoctorPwdErr] = useState('');
  const [editDoctorPwdOk, setEditDoctorPwdOk] = useState('');

  // Save new password for a patient
  const handleSavePatientPassword = () => {
    setEditPatientPwdErr(''); setEditPatientPwdOk('');
    if (!editPatientPwd || editPatientPwd.length < 6) {
      setEditPatientPwdErr('Password must be at least 6 characters.');
      return;
    }
    const updated = patients.map(p =>
      p.email.toLowerCase() === selectedPatient.email.toLowerCase()
        ? { ...p, password: editPatientPwd }
        : p
    );
    savePatients(updated);
    setSelectedPatient(prev => ({ ...prev, password: editPatientPwd }));
    setEditPatientPwd('');
    setEditPatientPwdOk('Password updated successfully!');
    setTimeout(() => setEditPatientPwdOk(''), 3000);
  };

  // Save new password for a verified doctor (stored as email-keyed entry)
  const handleSaveDoctorPassword = () => {
    setEditDoctorPwdErr(''); setEditDoctorPwdOk('');
    if (!editDoctorPwd || editDoctorPwd.length < 6) {
      setEditDoctorPwdErr('Password must be at least 6 characters.');
      return;
    }
    const updated = verifiedDoctors.map(d =>
      d.regNum === selectedDoctor.regNum
        ? { ...d, password: editDoctorPwd }
        : d
    );
    saveVerifiedDoctors(updated);
    setSelectedDoctor(prev => ({ ...prev, password: editDoctorPwd }));
    setEditDoctorPwd('');
    setEditDoctorPwdOk('Password updated successfully!');
    setTimeout(() => setEditDoctorPwdOk(''), 3000);
  };

  const specialties = [
    'General Physician', 'Cardiologist', 'Endocrinologist', 'Nephrologist',
    'Hematologist', 'Gastroenterologist', 'Pulmonologist', 'Neurologist',
    'Orthopedic Surgeon', 'Dermatologist', 'Oncologist', 'Pediatrician'
  ];



  // Sync Helpers
  const savePatients = (updatedPatients) => {
    localStorage.setItem('medintel_users', JSON.stringify(updatedPatients));
    setPatients(updatedPatients);
  };

  const savePendingSpecialists = (updatedPending) => {
    localStorage.setItem('medintel_pending_specialists', JSON.stringify(updatedPending));
    setPendingSpecialists(updatedPending);
  };

  const saveVerifiedDoctors = (updatedVerified) => {
    localStorage.setItem('medintel_verified_doctors', JSON.stringify(updatedVerified));
    setVerifiedDoctors(updatedVerified);
  };

  // Actions: Logout
  const handleLogout = () => {
    localStorage.removeItem('medintel_current_user');
    navigate('/');
  };

  // Actions: Patients
  const handleAddPatient = (e) => {
    e.preventDefault();
    setPatientModalError('');

    if (!newPatientName.trim() || !newPatientEmail.trim() || !newPatientPhone.trim() || !newPatientPassword.trim()) {
      setPatientModalError('All fields are required.');
      return;
    }

    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(newPatientEmail)) {
      setPatientModalError('Please enter a valid email address.');
      return;
    }

    if (patients.some(p => p.email.toLowerCase() === newPatientEmail.toLowerCase())) {
      setPatientModalError('This email is already registered.');
      return;
    }

    const newPatient = {
      name: newPatientName.trim(),
      email: newPatientEmail.toLowerCase(),
      phone: newPatientPhone.trim(),
      password: newPatientPassword,
      reports: []
    };

    const updated = [...patients, newPatient];
    savePatients(updated);

    // Reset Form & Close Modal
    setNewPatientName('');
    setNewPatientEmail('');
    setNewPatientPhone('');
    setNewPatientPassword('');
    setIsPatientModalOpen(false);
  };

  const handleDeletePatient = (email) => {
    if (window.confirm(`Are you sure you want to remove patient with email: ${email}?`)) {
      const updated = patients.filter(p => p.email.toLowerCase() !== email.toLowerCase());
      savePatients(updated);
    }
  };

  // Actions: Verification Approval / Rejection
  const handleApproveDoctor = (pendingDoc) => {
    // 1. Remove from pending
    const updatedPending = pendingSpecialists.filter(
      d => d.email.toLowerCase() !== pendingDoc.email.toLowerCase() || d.regNum !== pendingDoc.regNum
    );
    savePendingSpecialists(updatedPending);

    // 2. Add to verified list
    const ratingFloat = (4.2 + ((pendingDoc.name.charCodeAt(0) || 0) % 7) * 0.1).toFixed(1); // Pure deterministic rating based on name
    const docFee = pendingDoc.specialty.includes('Cardiologist') || pendingDoc.specialty.includes('Neurologist') ? '₹800' : '₹500';
    const regDigits = pendingDoc.regNum ? pendingDoc.regNum.replace(/\D/g, '') : '';
    const last4 = regDigits.slice(-4) || '1234';
    const defaultPassword = `doc@${last4}`;

    const newVerified = {
      name: pendingDoc.name.startsWith('Dr.') ? pendingDoc.name : `Dr. ${pendingDoc.name}`,
      email: pendingDoc.email.toLowerCase(),
      spec: pendingDoc.specialty,
      hospital: pendingDoc.hospital || 'MedIntel Panel Clinic',
      city: pendingDoc.city || 'Mumbai',
      rating: ratingFloat,
      contact: pendingDoc.phone || '+91-9999999999',
      fee: docFee,
      regNum: pendingDoc.regNum,
      expYears: pendingDoc.expYears || '5',
      status: 'Verified',
      approvedAt: new Date().toISOString(),
      password: defaultPassword,
      onlineAvailable: true
    };

    const updatedVerified = [...verifiedDoctors, newVerified];
    saveVerifiedDoctors(updatedVerified);

    const emailPayload = {
      recipient: newVerified.email,
      doctorName: newVerified.name,
      regNum: newVerified.regNum,
      specialty: newVerified.spec,
      username: newVerified.email,
      password: defaultPassword,
      sentAt: new Date().toLocaleString()
    };

    const sentEmails = JSON.parse(localStorage.getItem('medintel_sent_emails') || '[]');
    sentEmails.unshift({
      id: Date.now(),
      type: 'DOCTOR_APPROVAL',
      to: newVerified.email,
      subject: `MedIntel.AI Verification Approved — Credentials & Portal Access`,
      data: emailPayload
    });
    localStorage.setItem('medintel_sent_emails', JSON.stringify(sentEmails));

    setApprovalEmailModal(emailPayload);
  };

  const handleRejectDoctor = (pendingDoc) => {
    if (window.confirm(`Reject registration request for ${pendingDoc.name}?`)) {
      const updatedPending = pendingSpecialists.filter(
        d => d.email.toLowerCase() !== pendingDoc.email.toLowerCase() || d.regNum !== pendingDoc.regNum
      );
      savePendingSpecialists(updatedPending);
    }
  };

  // Actions: Verified Doctors
  const handleAddDoctor = (e) => {
    e.preventDefault();
    setDoctorModalError('');

    if (!newDocName.trim() || !newDocHospital.trim() || !newDocCity.trim() || !newDocContact.trim() || !newDocRegNum.trim() || !newDocEmail.trim()) {
      setDoctorModalError('Please fill in all required fields marked with *');
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(newDocEmail.trim())) {
      setDoctorModalError('Please enter a valid email address.');
      return;
    }

    if (verifiedDoctors.some(d => d.email && d.email.toLowerCase() === newDocEmail.trim().toLowerCase())) {
      setDoctorModalError('A doctor with this Email address already exists.');
      return;
    }

    const regDigits = newDocRegNum.trim().replace(/\D/g, '');
    const last4 = regDigits.slice(-4) || '1234';
    const defaultPassword = `doc@${last4}`;

    const newDoc = {
      name: newDocName.trim().startsWith('Dr.') ? newDocName.trim() : `Dr. ${newDocName.trim()}`,
      email: newDocEmail.trim().toLowerCase(),
      spec: newDocSpecialty,
      hospital: newDocHospital.trim(),
      city: newDocCity.trim(),
      rating: parseFloat(newDocRating) ? parseFloat(newDocRating).toFixed(1) : '4.5',
      contact: newDocContact.trim(),
      fee: newDocFee.trim(),
      regNum: newDocRegNum.trim(),
      expYears: newDocExp.trim() || 'N/A',
      status: 'Verified',
      approvedAt: new Date().toISOString(),
      password: defaultPassword,
      onlineAvailable: true
    };

    if (verifiedDoctors.some(d => d.regNum === newDoc.regNum)) {
      setDoctorModalError('A doctor with this Medical Registration Number already exists.');
      return;
    }

    const updated = [...verifiedDoctors, newDoc];
    saveVerifiedDoctors(updated);

    const emailPayload = {
      recipient: newDoc.email,
      doctorName: newDoc.name,
      regNum: newDoc.regNum,
      specialty: newDoc.spec,
      username: newDoc.email,
      password: defaultPassword,
      sentAt: new Date().toLocaleString()
    };

    const sentEmails = JSON.parse(localStorage.getItem('medintel_sent_emails') || '[]');
    sentEmails.unshift({
      id: Date.now(),
      type: 'DOCTOR_APPROVAL',
      to: newDoc.email,
      subject: `MedIntel.AI Verification Approved — Credentials & Portal Access`,
      data: emailPayload
    });
    localStorage.setItem('medintel_sent_emails', JSON.stringify(sentEmails));

    setApprovalEmailModal(emailPayload);

    // Reset Form & Close Modal
    setNewDocName('');
    setNewDocEmail('');
    setNewDocSpecialty('General Physician');
    setNewDocHospital('');
    setNewDocCity('');
    setNewDocRating('4.5');
    setNewDocContact('');
    setNewDocFee('₹500');
    setNewDocExp('');
    setNewDocRegNum('');
    setIsDoctorModalOpen(false);
  };

  const handleDeleteDoctor = (regNum) => {
    if (window.confirm(`Remove doctor with registration number: ${regNum} from verified panel?`)) {
      const updated = verifiedDoctors.filter(d => d.regNum !== regNum);
      saveVerifiedDoctors(updated);
    }
  };

  // Filtered Patients
  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
    p.email.toLowerCase().includes(patientSearch.toLowerCase()) ||
    p.phone.includes(patientSearch)
  );

  // Filtered Verified Doctors
  const filteredDoctors = verifiedDoctors.filter(d =>
    d.name.toLowerCase().includes(doctorSearch.toLowerCase()) ||
    d.spec.toLowerCase().includes(doctorSearch.toLowerCase()) ||
    d.hospital.toLowerCase().includes(doctorSearch.toLowerCase()) ||
    d.city.toLowerCase().includes(doctorSearch.toLowerCase())
  );

  if (!adminUser) return null;

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-color)' }}>
      {/* Top Navbar */}
      <nav className="top-navbar" style={{ background: theme === 'dark' ? 'rgba(20, 25, 41, 0.8)' : 'rgba(255, 255, 255, 0.8)' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
          <div style={{ position: 'relative', width: '42px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, var(--primary) 0%, rgba(0, 210, 255, 0.5) 100%)', borderRadius: '12px', transform: 'rotate(10deg)', opacity: 0.2 }}></div>
            <div style={{ position: 'absolute', inset: '2px', background: 'linear-gradient(135deg, var(--primary) 0%, #2563eb 100%)', borderRadius: '10px' }}></div>
            <Shield size={22} color="#ffffff" style={{ position: 'relative', zIndex: 1 }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h2 style={{ fontSize: '1.3rem', margin: 0, fontWeight: '800', letterSpacing: '0.2px', color: 'var(--text-primary)', lineHeight: 1 }}>MedIntel<span style={{ color: 'var(--primary)' }}>.AI</span></h2>
            <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--primary)', fontWeight: '700', marginTop: '4px' }}>Admin Portal</span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="nav-actions">
          <button onClick={toggleTheme} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          <div style={{ width: '1px', height: '24px', background: 'var(--surface-border)' }}></div>
          <div className="dashboard-profile-pill" style={{ background: 'rgba(0, 210, 255, 0.08)', border: '1px solid rgba(0, 210, 255, 0.15)' }}>
            <div className="dashboard-avatar" style={{ background: 'var(--primary)', color: '#fff' }}>AD</div>
            <div className="dashboard-profile-copy">
              <strong style={{ color: 'var(--text-primary)' }}>System Admin</strong>
              <span style={{ color: 'var(--primary)' }}>Root Administrator</span>
            </div>
          </div>
          <button className="nav-btn" onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem', borderRadius: 'var(--radius-full)', background: 'rgba(231, 76, 60, 0.1)', color: 'var(--danger)', border: 'none', cursor: 'pointer', transition: 'all 0.2s', fontWeight: '600' }}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="main-content">
        {/* Header Title */}
        <header style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: '1.75rem', margin: '0 0 0.5rem 0' }}>Control Panel</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.95rem' }}>
            Verify registered health specialists, add/delete doctors, and manage patient directories.
          </p>
        </header>

        {/* Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', borderLeft: '4px solid var(--primary)' }}>
            <div style={{ background: 'var(--primary-glow)', padding: '1rem', borderRadius: '12px' }}>
              <Users size={28} color="var(--primary)" />
            </div>
            <div>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Patients</span>
              <h3 style={{ fontSize: '1.8rem', margin: '0.2rem 0 0 0', fontWeight: '800' }}>{patients.length}</h3>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', borderLeft: '4px solid var(--success)' }}>
            <div style={{ background: 'rgba(46, 204, 113, 0.1)', padding: '1rem', borderRadius: '12px' }}>
              <Stethoscope size={28} color="var(--success)" />
            </div>
            <div>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Verified Doctors</span>
              <h3 style={{ fontSize: '1.8rem', margin: '0.2rem 0 0 0', fontWeight: '800' }}>{verifiedDoctors.length}</h3>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', borderLeft: '4px solid var(--warning)' }}>
            <div style={{ background: 'rgba(243, 156, 18, 0.1)', padding: '1rem', borderRadius: '12px' }}>
              <Clock size={28} color="var(--warning)" />
            </div>
            <div>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pending Verifications</span>
              <h3 style={{ fontSize: '1.8rem', margin: '0.2rem 0 0 0', fontWeight: '800' }}>
                {pendingSpecialists.filter(d => d.status === 'Pending Verification').length}
              </h3>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--surface-border)', gap: '2rem', marginBottom: '2rem' }}>
          <button
            onClick={() => setActiveTab('patients')}
            style={{
              padding: '1rem 0.5rem',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'patients' ? '3px solid var(--primary)' : '3px solid transparent',
              color: activeTab === 'patients' ? 'var(--primary)' : 'var(--text-muted)',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s'
            }}
          >
            <Users size={18} /> Patients Directory
          </button>

          <button
            onClick={() => setActiveTab('verifications')}
            style={{
              padding: '1rem 0.5rem',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'verifications' ? '3px solid var(--warning)' : '3px solid transparent',
              color: activeTab === 'verifications' ? 'var(--warning)' : 'var(--text-muted)',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s',
              position: 'relative'
            }}
          >
            <Clock size={18} /> Verification Inbox
            {pendingSpecialists.filter(d => d.status === 'Pending Verification').length > 0 && (
              <span style={{
                position: 'absolute',
                top: '6px',
                right: '-16px',
                background: 'var(--warning)',
                color: '#000',
                borderRadius: '50%',
                width: '18px',
                height: '18px',
                fontSize: '0.68rem',
                fontWeight: '800',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {pendingSpecialists.filter(d => d.status === 'Pending Verification').length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('doctors')}
            style={{
              padding: '1rem 0.5rem',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'doctors' ? '3px solid var(--success)' : '3px solid transparent',
              color: activeTab === 'doctors' ? 'var(--success)' : 'var(--text-muted)',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s'
            }}
          >
            <Stethoscope size={18} /> Verified Panel Doctors
          </button>
        </div>

        {/* Tab Views */}
        {activeTab === 'patients' && (
          <div className="glass-panel animate-fade-in" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ position: 'relative', width: '100%', maxWidth: '350px' }}>
                <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Search by name, email, phone..."
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 1rem 0.65rem 2.5rem',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--surface-border)',
                    borderRadius: 'var(--radius-full)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    fontSize: '0.9rem'
                  }}
                />
              </div>
              <button className="btn-primary" onClick={() => setIsPatientModalOpen(true)} style={{ padding: '0.65rem 1.25rem', fontSize: '0.9rem' }}>
                <Plus size={16} /> Add Patient Manually
              </button>
            </div>

            {filteredPatients.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', border: '1px dashed var(--surface-border)', borderRadius: 'var(--radius-md)' }}>
                <Users size={40} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                <h4 style={{ color: 'var(--text-muted)' }}>No patients found.</h4>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--surface-border)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      <th style={{ padding: '1rem 0.5rem' }}>Patient Name</th>
                      <th style={{ padding: '1rem 0.5rem' }}>Email Address</th>
                      <th style={{ padding: '1rem 0.5rem' }}>Mobile Number</th>
                      <th style={{ padding: '1rem 0.5rem' }}>Reports Uploaded</th>
                      <th style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPatients.map((patient, index) => (
                      <tr key={patient.email || index} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '0.92rem', transition: 'background 0.2s' }} className="table-row-hover">
                        <td style={{ padding: '1.1rem 0.5rem', fontWeight: '600' }}>{patient.name}</td>
                        <td style={{ padding: '1.1rem 0.5rem', color: 'var(--text-secondary)' }}>{patient.email}</td>
                        <td style={{ padding: '1.1rem 0.5rem', color: 'var(--text-secondary)' }}>{patient.phone}</td>
                        <td style={{ padding: '1.1rem 0.5rem' }}>
                          <span style={{ background: 'rgba(0, 210, 255, 0.08)', color: 'var(--primary)', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '600' }}>
                            {patient.reports?.length || 0} Reports
                          </span>
                        </td>
                        <td style={{ padding: '1.1rem 0.5rem', textAlign: 'right', display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                          <button
                            onClick={() => { setSelectedPatient(patient); setShowPwdEdit(false); setEditPatientPwd(''); setEditPatientPwdErr(''); setEditPatientPwdOk(''); }}
                            style={{
                              background: 'rgba(0,210,255,0.08)', border: '1px solid rgba(0,210,255,0.2)',
                              color: 'var(--primary)', cursor: 'pointer', padding: '0.35rem 0.7rem',
                              borderRadius: '4px', fontSize: '0.78rem', fontWeight: '600',
                              display: 'flex', alignItems: 'center', gap: '0.3rem', transition: 'all 0.2s'
                            }}
                            title="View Patient Details"
                          >
                            <Eye size={13} /> Details
                          </button>
                          <button
                            onClick={() => handleDeletePatient(patient.email)}
                            style={{
                              background: 'transparent', border: 'none',
                              color: 'var(--danger)', cursor: 'pointer',
                              padding: '0.4rem', borderRadius: '4px', transition: 'all 0.2s'
                            }}
                            className="hover-danger"
                            title="Delete Patient"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'verifications' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {pendingSpecialists.filter(d => d.status === 'Pending Verification').length === 0 ? (
              <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                <CheckCircle size={48} color="var(--success)" style={{ marginBottom: '1.5rem', opacity: 0.8 }} />
                <h3 style={{ fontSize: '1.35rem', marginBottom: '0.5rem' }}>Verification Inbox Clear</h3>
                <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.92rem' }}>
                  There are no pending doctor registration applications awaiting verification.
                </p>
              </div>
            ) : (
              pendingSpecialists
                .filter(d => d.status === 'Pending Verification')
                .map((specialist, index) => (
                  <div key={index} className="glass-panel" style={{ padding: '2rem', display: 'flex', justifyContent: 'space-between', gap: '2rem', flexWrap: 'wrap', borderLeft: '4px solid var(--warning)' }}>
                    {/* Specialist Info */}
                    <div style={{ flex: 1, minWidth: '300px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.9rem' }}>
                        <span style={{ background: 'rgba(243, 156, 18, 0.1)', color: 'var(--warning)', padding: '0.2rem 0.75rem', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: '700' }}>
                          Pending Verification
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Submitted: {new Date(specialist.submittedAt).toLocaleDateString()}
                        </span>
                      </div>

                      <h3 style={{ fontSize: '1.3rem', margin: '0 0 0.5rem 0', fontWeight: '700' }}>Dr. {specialist.name}</h3>
                      <p style={{ margin: '0 0 1rem 0', color: 'var(--primary)', fontWeight: '600', fontSize: '0.95rem' }}>{specialist.specialty}</p>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.9rem', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><MapPin size={16} /> {specialist.hospital || 'N/A'}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Phone size={16} /> {specialist.phone || 'N/A'}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Mail size={16} /> {specialist.email}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Briefcase size={16} /> Reg No: <strong>{specialist.regNum}</strong></div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Award size={16} /> Experience: {specialist.expYears ? `${specialist.expYears} Years` : 'N/A'}</div>
                      </div>

                      {/* Documents Section */}
                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--surface-border)' }}>
                        <h4 style={{ fontSize: '0.82rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px', marginBottom: '0.75rem' }}>Submitted Proof Documents</h4>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', background: 'rgba(255,255,255,0.05)', padding: '0.5rem 0.75rem', borderRadius: '4px' }}>
                            <AlertCircle size={14} color="var(--primary)" /> Govt ID: <strong>{specialist.idFileName || 'id_proof.pdf'}</strong>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', background: 'rgba(255,255,255,0.05)', padding: '0.5rem 0.75rem', borderRadius: '4px' }}>
                            <AlertCircle size={14} color="var(--primary)" /> Medical Degree: <strong>{specialist.certFileName || 'cert_copy.pdf'}</strong>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', justifyContent: 'center', minWidth: '180px' }}>
                      <button
                        onClick={() => setViewDocSpecialist(specialist)}
                        style={{
                          background: 'rgba(0,210,255,0.08)', border: '1px solid rgba(0,210,255,0.25)',
                          color: 'var(--primary)', padding: '0.8rem', fontSize: '0.9rem',
                          width: '100%', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                          fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,210,255,0.16)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,210,255,0.08)'}
                      >
                        <Eye size={15} /> View Documents
                      </button>
                      <button
                        onClick={() => handleApproveDoctor(specialist)}
                        className="btn-primary"
                        style={{
                          background: 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)',
                          boxShadow: '0 4px 15px rgba(46, 204, 113, 0.2)',
                          padding: '0.8rem', fontSize: '0.9rem', width: '100%', justifyContent: 'center'
                        }}
                      >
                        <Check size={16} /> Approve &amp; Verify Doctor
                      </button>
                      <button
                        onClick={() => handleRejectDoctor(specialist)}
                        className="btn-secondary"
                        style={{
                          borderColor: 'rgba(231, 76, 60, 0.3)', color: 'var(--danger)',
                          background: 'transparent', padding: '0.8rem', fontSize: '0.9rem',
                          width: '100%', justifyContent: 'center'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(231, 76, 60, 0.08)'; e.currentTarget.style.borderColor = 'var(--danger)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(231, 76, 60, 0.3)'; }}
                      >
                        <X size={16} /> Reject Application
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        )}

        {activeTab === 'doctors' && (
          <div className="glass-panel animate-fade-in" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ position: 'relative', width: '100%', maxWidth: '350px' }}>
                <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Search by name, specialty, city..."
                  value={doctorSearch}
                  onChange={(e) => setDoctorSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 1rem 0.65rem 2.5rem',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--surface-border)',
                    borderRadius: 'var(--radius-full)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    fontSize: '0.9rem'
                  }}
                />
              </div>
              <button className="btn-primary" onClick={() => setIsDoctorModalOpen(true)} style={{ padding: '0.65rem 1.25rem', fontSize: '0.9rem' }}>
                <Plus size={16} /> Add Doctor Manually
              </button>
            </div>

            {filteredDoctors.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', border: '1px dashed var(--surface-border)', borderRadius: 'var(--radius-md)' }}>
                <Stethoscope size={40} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                <h4 style={{ color: 'var(--text-muted)' }}>No verified doctors listed.</h4>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--surface-border)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      <th style={{ padding: '1rem 0.5rem' }}>Doctor Details</th>
                      <th style={{ padding: '1rem 0.5rem' }}>Specialty</th>
                      <th style={{ padding: '1rem 0.5rem' }}>Hospital &amp; City</th>
                      <th style={{ padding: '1rem 0.5rem' }}>Fee &amp; Rating</th>
                      <th style={{ padding: '1rem 0.5rem' }}>Contact</th>
                      <th style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDoctors.map((doc, index) => (
                      <tr key={doc.regNum || index} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '0.92rem' }} className="table-row-hover">
                        <td style={{ padding: '1.1rem 0.5rem' }}>
                          <div style={{ fontWeight: '600' }}>{doc.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>Reg: {doc.regNum} • Exp: {doc.expYears} Yrs</div>
                        </td>
                        <td style={{ padding: '1.1rem 0.5rem' }}>
                          <span style={{ color: 'var(--primary)', fontWeight: '500' }}>{doc.spec}</span>
                        </td>
                        <td style={{ padding: '1.1rem 0.5rem', color: 'var(--text-secondary)' }}>
                          <div>{doc.hospital}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{doc.city}</div>
                        </td>
                        <td style={{ padding: '1.1rem 0.5rem' }}>
                          <div style={{ fontWeight: '600' }}>{doc.fee}</div>
                          <div style={{ fontSize: '0.78rem', color: '#f1c40f', display: 'flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.15rem' }}>★ {doc.rating} Rating</div>
                        </td>
                        <td style={{ padding: '1.1rem 0.5rem', color: 'var(--text-secondary)' }}>{doc.contact}</td>
                        <td style={{ padding: '1.1rem 0.5rem', textAlign: 'right', display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                          <button
                            onClick={() => { setSelectedDoctor(doc); setEditDoctorPwd(''); setEditDoctorPwdErr(''); setEditDoctorPwdOk(''); }}
                            style={{
                              background: 'rgba(46,204,113,0.08)', border: '1px solid rgba(46,204,113,0.22)',
                              color: 'var(--success)', cursor: 'pointer', padding: '0.35rem 0.7rem',
                              borderRadius: '4px', fontSize: '0.78rem', fontWeight: '600',
                              display: 'flex', alignItems: 'center', gap: '0.3rem', transition: 'all 0.2s'
                            }}
                            title="View Doctor Details"
                          >
                            <Eye size={13} /> Details
                          </button>
                          <button
                            onClick={() => handleDeleteDoctor(doc.regNum)}
                            style={{
                              background: 'transparent', border: 'none',
                              color: 'var(--danger)', cursor: 'pointer',
                              padding: '0.4rem', borderRadius: '4px', transition: 'all 0.2s'
                            }}
                            className="hover-danger"
                            title="Remove Doctor"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODAL 1: ADD PATIENT */}
      {isPatientModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '460px', padding: '2rem', position: 'relative' }}>
            <button onClick={() => setIsPatientModalOpen(false)} style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={20} />
            </button>

            <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.35rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={22} color="var(--primary)" /> Add Patient Profile
            </h3>

            {patientModalError && (
              <div style={{ padding: '0.6rem 0.85rem', background: 'rgba(231,76,60,0.1)', borderLeft: '3px solid var(--danger)', color: 'var(--danger)', fontSize: '0.82rem', borderRadius: '4px', marginBottom: '1rem' }}>
                <AlertCircle size={13} style={{ marginRight: '0.35rem', verticalAlign: 'middle' }} />{patientModalError}
              </div>
            )}

            <form onSubmit={handleAddPatient} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Full Name *</label>
                <input style={inputStyle(theme)} type="text" placeholder="John Doe" required value={newPatientName} onChange={e => setNewPatientName(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Email Address *</label>
                <input style={inputStyle(theme)} type="email" placeholder="patient@email.com" required value={newPatientEmail} onChange={e => setNewPatientEmail(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Mobile Number *</label>
                <input style={inputStyle(theme)} type="tel" placeholder="+91 9876543210" required value={newPatientPhone} onChange={e => setNewPatientPhone(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Temporary Password *</label>
                <input style={inputStyle(theme)} type="text" placeholder="Min 6 characters" required value={newPatientPassword} onChange={e => setNewPatientPassword(e.target.value)} />
              </div>

              <button type="submit" className="btn-primary" style={{ padding: '0.8rem', marginTop: '0.5rem', fontSize: '0.95rem' }}>
                Create Patient Account
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD DOCTOR */}
      {isDoctorModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '540px', padding: '2rem', position: 'relative' }}>
            <button onClick={() => setIsDoctorModalOpen(false)} style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={20} />
            </button>

            <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.35rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Stethoscope size={22} color="var(--success)" /> Add Doctor Manually
            </h3>

            {doctorModalError && (
              <div style={{ padding: '0.6rem 0.85rem', background: 'rgba(231,76,60,0.1)', borderLeft: '3px solid var(--danger)', color: 'var(--danger)', fontSize: '0.82rem', borderRadius: '4px', marginBottom: '1rem' }}>
                <AlertCircle size={13} style={{ marginRight: '0.35rem', verticalAlign: 'middle' }} />{doctorModalError}
              </div>
            )}

            <form onSubmit={handleAddDoctor} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              {/* Row 1: Name + Specialty */}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Doctor Name *</label>
                  <input style={inputStyle(theme)} type="text" placeholder="Dr. Suresh Patil" required value={newDocName} onChange={e => setNewDocName(e.target.value)} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Specialization *</label>
                  <select style={{ ...inputStyle(theme), background: theme === 'dark' ? '#151928' : '#fff' }} value={newDocSpecialty} onChange={e => setNewDocSpecialty(e.target.value)}>
                    {specialties.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Row 2: Hospital + City */}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Hospital / Clinic *</label>
                  <input style={inputStyle(theme)} type="text" placeholder="Apollo Hospital" required value={newDocHospital} onChange={e => setNewDocHospital(e.target.value)} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>City *</label>
                  <input style={inputStyle(theme)} type="text" placeholder="Pune" required value={newDocCity} onChange={e => setNewDocCity(e.target.value)} />
                </div>
              </div>

              {/* Row 3: Reg Number + Exp */}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Medical Reg. Number *</label>
                  <input style={inputStyle(theme)} type="text" placeholder="MCI-2023-XXXXX" required value={newDocRegNum} onChange={e => setNewDocRegNum(e.target.value)} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Years of Experience</label>
                  <input style={inputStyle(theme)} type="number" placeholder="e.g. 10" value={newDocExp} onChange={e => setNewDocExp(e.target.value)} />
                </div>
              </div>

              {/* Row 4: Fee + Rating */}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Consultation Fee</label>
                  <input style={inputStyle(theme)} type="text" placeholder="₹500" value={newDocFee} onChange={e => setNewDocFee(e.target.value)} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Rating (0.0 - 5.0)</label>
                  <input style={inputStyle(theme)} type="number" step="0.1" min="0" max="5" placeholder="4.5" value={newDocRating} onChange={e => setNewDocRating(e.target.value)} />
                </div>
              </div>

              {/* Row 5: Email + Contact */}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Email Address *</label>
                  <input style={inputStyle(theme)} type="email" placeholder="doctor@medintel.ai" required value={newDocEmail} onChange={e => setNewDocEmail(e.target.value)} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Contact Number *</label>
                  <input style={inputStyle(theme)} type="tel" placeholder="+91 9876543210" required value={newDocContact} onChange={e => setNewDocContact(e.target.value)} />
                </div>
              </div>

              <button type="submit" className="btn-primary" style={{ padding: '0.8rem', marginTop: '0.5rem', fontSize: '0.95rem', background: 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)', boxShadow: '0 4px 15px rgba(46, 204, 113, 0.2)' }}>
                Add Verified Doctor
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
           MODAL: PATIENT DETAILS + PASSWORD EDIT
      ══════════════════════════════════════ */}
      {selectedPatient && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', position: 'relative', boxShadow: '0 30px 60px rgba(0,0,0,0.5)' }}>
            <button onClick={() => setSelectedPatient(null)} style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.75rem' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <User size={26} color="#fff" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '800' }}>{selectedPatient.name}</h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: '600' }}>Patient Account</span>
              </div>
            </div>

            {/* Info Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              {[
                { label: 'Full Name', value: selectedPatient.name },
                { label: 'Email Address', value: selectedPatient.email },
                { label: 'Mobile Number', value: selectedPatient.phone || 'N/A' },
                { label: 'Current Password', value: selectedPatient.password || '(hidden)' },
                { label: 'Reports Uploaded', value: `${selectedPatient.reports?.length || 0} Reports` },
                { label: 'Account Role', value: 'Patient' },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-sm)', padding: '0.85rem 1rem' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '0.25rem' }}>{label}</span>
                  <span style={{ fontWeight: '600', fontSize: '0.9rem', wordBreak: 'break-all' }}>{value}</span>
                </div>
              ))}
            </div>

            {/* Uploaded Reports List */}
            {selectedPatient.reports?.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.82rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px', marginBottom: '0.75rem' }}>Uploaded Report Files</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '160px', overflowY: 'auto' }}>
                  {selectedPatient.reports.map((r, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.83rem', background: 'rgba(0,210,255,0.04)', border: '1px solid rgba(0,210,255,0.12)', borderRadius: '4px', padding: '0.5rem 0.75rem' }}>
                      <HeartPulse size={13} color="var(--primary)" />
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: '600' }}>{r.name || r.fileName || `Report ${i + 1}`}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.73rem', flexShrink: 0, marginRight: '0.4rem' }}>{r.date ? new Date(r.date).toLocaleDateString() : ''}</span>
                      <button
                        onClick={() => setSelectedReport(r)}
                        style={{
                          background: 'var(--primary)', border: 'none', color: '#fff',
                          padding: '0.25rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem',
                          fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center',
                          gap: '0.25rem', transition: 'all 0.2s', flexShrink: 0
                        }}
                      >
                        <Eye size={11} /> View Details
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Password Edit Section */}
            <div style={{ borderTop: '1px solid var(--surface-border)', paddingTop: '1.25rem' }}>
              <h4 style={{ fontSize: '0.88rem', fontWeight: '700', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Lock size={15} color="var(--warning)" />
                <button onClick={() => setShowPwdEdit(!showPwdEdit)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.88rem', fontWeight: '600' }}>Edit Password</button>
              </h4>
              {showPwdEdit && (
                <>
                  {editPatientPwdErr && <div style={{ padding: '0.5rem 0.75rem', background: 'rgba(231,76,60,0.1)', borderLeft: '3px solid var(--danger)', color: 'var(--danger)', fontSize: '0.8rem', borderRadius: '4px', marginBottom: '0.75rem' }}>{editPatientPwdErr}</div>}
                  {editPatientPwdOk && <div style={{ padding: '0.5rem 0.75rem', background: 'rgba(46,204,113,0.1)', borderLeft: '3px solid var(--success)', color: 'var(--success)', fontSize: '0.8rem', borderRadius: '4px', marginBottom: '0.75rem' }}>{editPatientPwdOk}</div>}
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <input
                      type="text"
                      placeholder="Enter new password (min 6 chars)"
                      value={editPatientPwd}
                      onChange={e => setEditPatientPwd(e.target.value)}
                      style={{ flex: 1, padding: '0.65rem 1rem', background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', outline: 'none', fontSize: '0.88rem' }}
                    />
                    <button
                      onClick={handleSavePatientPassword}
                      style={{ padding: '0.65rem 1.25rem', background: 'linear-gradient(135deg, #f39c12, #e67e22)', border: 'none', borderRadius: 'var(--radius-sm)', color: '#fff', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                    >Save Password</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
           MODAL: DOCTOR DETAILS + PASSWORD EDIT
      ══════════════════════════════════════ */}
      {selectedDoctor && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', position: 'relative', boxShadow: '0 30px 60px rgba(0,0,0,0.5)' }}>
            <button onClick={() => setSelectedDoctor(null)} style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.75rem' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'linear-gradient(135deg, #2ecc71, #27ae60)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Stethoscope size={26} color="#fff" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '800' }}>{selectedDoctor.name}</h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--success)', fontWeight: '600' }}>✓ Verified Panel Doctor</span>
              </div>
            </div>

            {/* Info Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              {[
                { label: 'Doctor Name', value: selectedDoctor.name },
                { label: 'Specialization', value: selectedDoctor.spec },
                { label: 'Email Address', value: selectedDoctor.email || 'N/A' },
                { label: 'Hospital / Clinic', value: selectedDoctor.hospital },
                { label: 'City', value: selectedDoctor.city },
                { label: 'Contact Number', value: selectedDoctor.contact },
                { label: 'Reg. Number', value: selectedDoctor.regNum },
                { label: 'Experience', value: selectedDoctor.expYears ? `${selectedDoctor.expYears} Years` : 'N/A' },
                { label: 'Consultation Fee', value: selectedDoctor.fee },
                { label: 'Rating', value: `★ ${selectedDoctor.rating}` },
                { label: 'Portal Password', value: selectedDoctor.password || '(not set)' },
                { label: 'Status', value: selectedDoctor.status || 'Verified' },
                { label: 'Approved On', value: selectedDoctor.approvedAt ? new Date(selectedDoctor.approvedAt).toLocaleDateString() : 'N/A' },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-sm)', padding: '0.85rem 1rem' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '0.25rem' }}>{label}</span>
                  <span style={{ fontWeight: '600', fontSize: '0.9rem', wordBreak: 'break-all', color: label === 'Rating' ? '#f1c40f' : 'inherit' }}>{value}</span>
                </div>
              ))}
            </div>

            {/* Password Edit Section */}
            <div style={{ borderTop: '1px solid var(--surface-border)', paddingTop: '1.25rem' }}>
              <h4 style={{ fontSize: '0.88rem', fontWeight: '700', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Lock size={15} color="var(--warning)" /> Change Doctor Portal Password
              </h4>
              {editDoctorPwdErr && <div style={{ padding: '0.5rem 0.75rem', background: 'rgba(231,76,60,0.1)', borderLeft: '3px solid var(--danger)', color: 'var(--danger)', fontSize: '0.8rem', borderRadius: '4px', marginBottom: '0.75rem' }}>{editDoctorPwdErr}</div>}
              {editDoctorPwdOk  && <div style={{ padding: '0.5rem 0.75rem', background: 'rgba(46,204,113,0.1)', borderLeft: '3px solid var(--success)', color: 'var(--success)', fontSize: '0.8rem', borderRadius: '4px', marginBottom: '0.75rem' }}>{editDoctorPwdOk}</div>}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <input
                  type="text"
                  placeholder="Enter new password (min 6 chars)"
                  value={editDoctorPwd}
                  onChange={e => setEditDoctorPwd(e.target.value)}
                  style={{ flex: 1, padding: '0.65rem 1rem', background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', outline: 'none', fontSize: '0.88rem' }}
                />
                <button
                  onClick={handleSaveDoctorPassword}
                  style={{ padding: '0.65rem 1.25rem', background: 'linear-gradient(135deg, #f39c12, #e67e22)', border: 'none', borderRadius: 'var(--radius-sm)', color: '#fff', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                >
                  Save Password
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
           MODAL: PROOF DOCUMENT VIEWER
      ══════════════════════════════════════ */}
      {viewDocSpecialist && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '560px', padding: '2rem', position: 'relative', boxShadow: '0 30px 60px rgba(0,0,0,0.5)' }}>
            <button onClick={() => setViewDocSpecialist(null)} style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>

            <h3 style={{ margin: '0 0 0.4rem 0', fontSize: '1.25rem', fontWeight: '800' }}>Proof Documents</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0 0 1.75rem 0' }}>
              Submitted by <strong>{viewDocSpecialist.name}</strong> · {viewDocSpecialist.specialty}
            </p>

            {/* Doctor Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.75rem' }}>
              {[
                { label: 'Full Name', value: viewDocSpecialist.name },
                { label: 'Email', value: viewDocSpecialist.email },
                { label: 'Phone', value: viewDocSpecialist.phone || 'N/A' },
                { label: 'Reg. Number', value: viewDocSpecialist.regNum },
                { label: 'Hospital', value: viewDocSpecialist.hospital || 'N/A' },
                { label: 'Experience', value: viewDocSpecialist.expYears ? `${viewDocSpecialist.expYears} Years` : 'N/A' },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-sm)', padding: '0.65rem 0.85rem' }}>
                  <span style={{ fontSize: '0.67rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '0.2rem' }}>{label}</span>
                  <span style={{ fontWeight: '600', fontSize: '0.85rem' }}>{value}</span>
                </div>
              ))}
            </div>

            {/* Document Cards */}
            <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px', marginBottom: '0.9rem' }}>Submitted Proof Files</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', marginBottom: '1.5rem' }}>
              {/* Gov ID */}
              <div style={{ background: 'rgba(0,210,255,0.05)', border: '1px solid rgba(0,210,255,0.18)', borderRadius: 'var(--radius-sm)', padding: '1.1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ background: 'rgba(0,210,255,0.12)', padding: '0.65rem', borderRadius: '8px' }}>
                  <User size={20} color="var(--primary)" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.15rem' }}>Government ID Proof</div>
                  <div style={{ fontWeight: '700', fontSize: '0.92rem', wordBreak: 'break-all' }}>{viewDocSpecialist.idFileName || 'id_proof.pdf'}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Aadhaar / Passport / PAN · Uploaded during registration</div>
                </div>
                <span style={{ background: 'rgba(46,204,113,0.12)', color: 'var(--success)', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', fontSize: '0.72rem', fontWeight: '700', whiteSpace: 'nowrap' }}>✓ Received</span>
                <button onClick={() => setImageModal({title: 'Government ID Proof', data: viewDocSpecialist.idFileData})} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.8rem' }}>View Uploaded Images</button>
              </div>

              {/* Medical Certificate */}
              <div style={{ background: 'rgba(46,204,113,0.04)', border: '1px solid rgba(46,204,113,0.18)', borderRadius: 'var(--radius-sm)', padding: '1.1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ background: 'rgba(46,204,113,0.12)', padding: '0.65rem', borderRadius: '8px' }}>
                  <Award size={20} color="var(--success)" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.15rem' }}>Medical Degree / Certificate</div>
                  <div style={{ fontWeight: '700', fontSize: '0.92rem', wordBreak: 'break-all' }}>{viewDocSpecialist.certFileName || 'cert_copy.pdf'}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Registration certificate · Uploaded during registration</div>
                </div>
                <span style={{ background: 'rgba(46,204,113,0.12)', color: 'var(--success)', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', fontSize: '0.72rem', fontWeight: '700', whiteSpace: 'nowrap' }}>✓ Received</span>
                <button onClick={() => setImageModal({title: 'Medical Certificate', data: viewDocSpecialist.certFileData})} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.8rem' }}>View Uploaded Images</button>
              </div>
            </div>

            {/* Info note */}
            <div style={{ background: 'rgba(243,156,18,0.08)', border: '1px solid rgba(243,156,18,0.22)', borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              ⓘ Files are stored securely on the server. Physical verification of original documents is recommended before final approval.
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button
                onClick={() => { handleApproveDoctor(viewDocSpecialist); setViewDocSpecialist(null); }}
                className="btn-primary"
                style={{ flex: 1, padding: '0.8rem', background: 'linear-gradient(135deg, #2ecc71, #27ae60)', boxShadow: '0 4px 15px rgba(46,204,113,0.2)', justifyContent: 'center', fontSize: '0.9rem' }}
              >
                <Check size={16} /> Approve Doctor
              </button>
              <button
                onClick={() => { handleRejectDoctor(viewDocSpecialist); setViewDocSpecialist(null); }}
                style={{ flex: 1, padding: '0.8rem', background: 'rgba(231,76,60,0.08)', border: '1px solid rgba(231,76,60,0.3)', color: 'var(--danger)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: '700', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
              >
                <X size={16} /> Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
           MODAL: IMAGE / PDF DOCUMENT PREVIEW
      ══════════════════════════════════════ */}
      {imageModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 4000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '700px', padding: '2rem', position: 'relative', boxShadow: '0 30px 60px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <button onClick={() => setImageModal(null)} style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
            <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', fontWeight: '800', width: '100%', textAlign: 'left' }}>{imageModal.title}</h3>
            
            {imageModal.data ? (
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
                {imageModal.data.startsWith('data:image/') ? (
                  <div style={{ width: '100%', maxHeight: '60vh', overflow: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-sm)', padding: '1rem' }}>
                    <img src={imageModal.data} alt={imageModal.title} style={{ maxWidth: '100%', maxHeight: '50vh', objectFit: 'contain', borderRadius: '4px' }} />
                  </div>
                ) : imageModal.data.startsWith('data:application/pdf') ? (
                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    <object data={imageModal.data} type="application/pdf" style={{ width: '100%', height: '50vh', border: 'none', borderRadius: '4px' }}>
                      <iframe src={imageModal.data} title={imageModal.title} style={{ width: '100%', height: '50vh', border: 'none' }}>
                        <p>PDF preview is not supported by your browser.</p>
                      </iframe>
                    </object>
                    <a href={imageModal.data} download={imageModal.title + '.pdf'} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.25rem', background: 'var(--primary)', color: '#fff', textDecoration: 'none', borderRadius: 'var(--radius-sm)', fontWeight: '700', fontSize: '0.85rem' }}>
                      Download / Open PDF
                    </a>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '2rem 0' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>This document file cannot be previewed directly in the browser.</p>
                    <a href={imageModal.data} download={imageModal.title} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.25rem', background: 'var(--primary)', color: '#fff', textDecoration: 'none', borderRadius: 'var(--radius-sm)', fontWeight: '700', fontSize: '0.85rem' }}>
                      Download File
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: '3rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                No document data available.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
           MODAL: PATIENT REPORT DETAILS
      ══════════════════════════════════════ */}
      {selectedReport && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 4000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', position: 'relative', boxShadow: '0 30px 60px rgba(0,0,0,0.5)' }}>
            <button onClick={() => setSelectedReport(null)} style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>

            {/* Header */}
            <div style={{ borderBottom: '1px solid var(--surface-border)', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <HeartPulse size={24} color="var(--primary)" />
                <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '800' }}>Clinical Summary & AI Analysis</h3>
              </div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Report Name: <strong>{selectedReport.name || selectedReport.fileName || 'General Report'}</strong> · Date Stored: {selectedReport.date ? new Date(selectedReport.date).toLocaleDateString() : 'N/A'}
              </p>
            </div>

            {/* Demographic Info Banner */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-sm)', padding: '1rem', marginBottom: '1.5rem' }}>
              {[
                { label: 'Patient Name', value: selectedReport.patientName || selectedPatient?.name || 'N/A' },
                { label: 'Age / Gender', value: `${selectedReport.age || 'N/A'} Yrs · ${selectedReport.gender || 'N/A'}` },
                { label: 'Referred By', value: selectedReport.referredDoctor || 'N/A' },
                { label: 'Address', value: selectedReport.address || 'N/A' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '0.2rem' }}>{label}</span>
                  <span style={{ fontWeight: '600', fontSize: '0.88rem' }}>{value}</span>
                </div>
              ))}
            </div>

            {/* Health Score & AI Risk Prediction Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
              {/* Health Score Panel */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-sm)', padding: '1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>Overall Health Score</span>
                <div style={{
                  fontSize: '2.5rem', fontWeight: '800',
                  color: selectedReport.healthScore >= 80 ? 'var(--success)' : (selectedReport.healthScore >= 60 ? 'var(--warning)' : 'var(--danger)'),
                  lineHeight: 1
                }}>
                  {selectedReport.healthScore || 'N/A'}
                </div>
                <span style={{
                  fontSize: '0.75rem', fontWeight: '700', marginTop: '0.5rem',
                  padding: '0.2rem 0.6rem', borderRadius: '10px',
                  background: selectedReport.healthScore >= 80 ? 'rgba(46,204,113,0.12)' : (selectedReport.healthScore >= 60 ? 'rgba(243,156,18,0.12)' : 'rgba(231,76,60,0.12)'),
                  color: selectedReport.healthScore >= 80 ? 'var(--success)' : (selectedReport.healthScore >= 60 ? 'var(--warning)' : 'var(--danger)')
                }}>
                  {selectedReport.healthScore >= 80 ? 'Healthy' : (selectedReport.healthScore >= 60 ? 'Moderate Risk' : 'High Risk')}
                </span>
              </div>

              {/* Risk Prediction Panel */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-sm)', padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <AlertCircle size={18} color="var(--warning)" />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>AI Health Risk Prediction</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.92rem', fontWeight: '600', lineHeight: 1.4 }}>
                  {selectedReport.riskPrediction || 'No health risks identified.'}
                </p>
                {selectedReport.recoveryEstimate && (
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    <strong>Recovery Estimate:</strong> {selectedReport.recoveryEstimate}
                  </p>
                )}
              </div>
            </div>

            {/* Medical Metrics Table */}
            {selectedReport.medicalValues?.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.82rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px', marginBottom: '0.75rem' }}>Extracted Medical Metrics</h4>
                <div style={{ border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid var(--surface-border)', fontWeight: '600', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '0.65rem 1rem', textAlign: 'left' }}>Test Parameter</th>
                        <th style={{ padding: '0.65rem 1rem', textAlign: 'center' }}>Extracted Value</th>
                        <th style={{ padding: '0.65rem 1rem', textAlign: 'center' }}>Reference Range</th>
                        <th style={{ padding: '0.65rem 1rem', textAlign: 'right' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedReport.medicalValues.map((val, idx) => {
                        const statusLower = val.status?.toLowerCase() || '';
                        const isNormal = statusLower === 'normal';
                        const isHigh = statusLower === 'high' || statusLower === 'critical';
                        const badgeColor = isNormal ? 'var(--success)' : (isHigh ? 'var(--danger)' : 'var(--warning)');
                        const badgeBg = isNormal ? 'rgba(46,204,113,0.1)' : (isHigh ? 'rgba(231,76,60,0.1)' : 'rgba(243,156,18,0.1)');
                        
                        return (
                          <tr key={idx} style={{ borderBottom: idx < selectedReport.medicalValues.length - 1 ? '1px solid var(--surface-border)' : 'none' }}>
                            <td style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>{val.name}</td>
                            <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: '700' }}>{val.value} {val.unit}</td>
                            <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>{val.normal || 'N/A'}</td>
                            <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                              <span style={{ fontSize: '0.72rem', fontWeight: '700', padding: '0.15rem 0.5rem', borderRadius: '4px', background: badgeBg, color: badgeColor }}>
                                {val.status || 'Normal'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Treatment & Precautions Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
              {/* Treatments Panel */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-sm)', padding: '1.25rem' }}>
                <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.82rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>Therapy & Treatment Recommendations</h4>
                
                {/* Natural */}
                {selectedReport.naturalTreatments?.length > 0 && (
                  <div style={{ marginBottom: '0.75rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--success)', marginBottom: '0.25rem' }}>🍃 Natural & Dietary Remedies</div>
                    <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {selectedReport.naturalTreatments.map((t, idx) => <li key={idx} style={{ marginBottom: '0.2rem' }}>{t}</li>)}
                    </ul>
                  </div>
                )}

                {/* Medical */}
                {selectedReport.medicalTreatments?.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--primary)', marginBottom: '0.25rem' }}>💊 Prescribed / Clinical Guidance</div>
                    <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {selectedReport.medicalTreatments.map((t, idx) => <li key={idx} style={{ marginBottom: '0.2rem' }}>{t}</li>)}
                    </ul>
                  </div>
                )}
              </div>

              {/* Precautions Panel */}
              {selectedReport.patientPrecautions?.length > 0 && (
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-sm)', padding: '1.25rem' }}>
                  <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.82rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>Safety Warnings & Precautions</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '160px', overflowY: 'auto' }}>
                    {selectedReport.patientPrecautions.map((prec, idx) => (
                      <div key={idx} style={{ fontSize: '0.8rem', background: 'rgba(231,76,60,0.05)', border: '1px solid rgba(231,76,60,0.15)', borderRadius: '4px', padding: '0.5rem 0.75rem' }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--danger)', display: 'block', marginBottom: '0.15rem' }}>{prec.category || 'Warning'}</span>
                        <span style={{ color: 'var(--text-secondary)' }}>{prec.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Exercise Reminders Section */}
            {selectedReport.exerciseReminders?.length > 0 && (
              <div style={{ borderTop: '1px solid var(--surface-border)', paddingTop: '1.25rem' }}>
                <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.82rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>Activity & Exercise Scheduling</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {selectedReport.exerciseReminders.map((ex, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--surface-border)', borderRadius: '4px', padding: '0.6rem 0.85rem', fontSize: '0.82rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Clock size={13} color="var(--primary)" />
                        <span style={{ fontWeight: '700', color: 'var(--primary)' }}>{ex.time}</span>
                        <span style={{ color: 'var(--text-muted)' }}>·</span>
                        <span style={{ fontWeight: '600' }}>{ex.title}</span>
                      </div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{ex.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.75rem' }}>
              <button onClick={() => setSelectedReport(null)} className="btn-primary" style={{ padding: '0.65rem 1.5rem' }}>Close Details</button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
           MODAL: DOCTOR APPROVAL EMAIL NOTIFICATION
      ══════════════════════════════════════ */}
      {approvalEmailModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }} onClick={() => setApprovalEmailModal(null)}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', position: 'relative', boxShadow: '0 30px 70px rgba(0,0,0,0.6)' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setApprovalEmailModal(null)} style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>

            {/* Email Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid var(--surface-border)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ background: 'rgba(46, 204, 113, 0.15)', padding: '0.6rem', borderRadius: '12px' }}>
                <Mail size={24} color="#2ecc71" />
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#2ecc71', fontWeight: '700' }}>Email Notification Sent</span>
                <h3 style={{ margin: '0.15rem 0 0 0', fontSize: '1.2rem', fontWeight: '800' }}>Doctor Verification &amp; Credentials Email</h3>
              </div>
            </div>

            {/* Email Meta Card */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>To Doctor:</span>
                <strong style={{ color: 'var(--primary)' }}>{approvalEmailModal.recipient}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Subject:</span>
                <span style={{ fontWeight: '600' }}>Welcome to MedIntel.AI Doctor Portal — Verification Approved!</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Sent At:</span>
                <span style={{ color: 'var(--text-muted)' }}>{approvalEmailModal.sentAt}</span>
              </div>
            </div>

            {/* Email Content Body */}
            <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-md)', padding: '1.25rem', fontSize: '0.9rem', lineHeight: 1.6 }}>
              
              <p style={{ marginTop: 0, fontWeight: '700', fontSize: '1rem', color: 'var(--text-primary)' }}>
                Dear {approvalEmailModal.doctorName},
              </p>

              <p style={{ color: 'var(--text-secondary)' }}>
                Greetings! We are pleased to inform you that your medical registration credentials (Reg. No: <strong>{approvalEmailModal.regNum}</strong>) have been verified and approved by the MedIntel Administrative Board. Welcome to the MedIntel AI Telehealth Network!
              </p>

              {/* Login Credentials Box */}
              <div style={{ background: 'rgba(0, 210, 255, 0.08)', border: '1px dashed rgba(0, 210, 255, 0.3)', borderRadius: 'var(--radius-sm)', padding: '1rem', margin: '1rem 0' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: 'var(--primary)', fontWeight: '800' }}>🔑 Doctor Portal Login Credentials</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Username / Email ID:</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{approvalEmailModal.username}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Default Password:</span>
                    <strong style={{ color: '#f1c40f', background: 'rgba(241,196,15,0.1)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>{approvalEmailModal.password}</strong>
                  </div>
                </div>
              </div>

              {/* Steps to Login */}
              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ margin: '0 0 0.4rem 0', fontSize: '0.88rem', fontWeight: '800' }}>🚀 Steps to Login:</h4>
                <ol style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  <li>Go to the Doctor Portal: <strong style={{ color: 'var(--primary)' }}>http://localhost:5173/doctor-login</strong></li>
                  <li>Enter your Username (registered email) and default password shown above.</li>
                  <li>Access your Doctor Console &amp; Dashboard.</li>
                </ol>
              </div>

              {/* Work & Responsibilities */}
              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ margin: '0 0 0.4rem 0', fontSize: '0.88rem', fontWeight: '800' }}>🩺 Roles &amp; Clinical Responsibilities:</h4>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  <li><strong>Patient Grid View:</strong> Search &amp; access clinical profiles of assigned patients.</li>
                  <li><strong>Daily Consultations:</strong> Manage online video appointments &amp; clinic visits.</li>
                  <li><strong>AI Lab Report Review:</strong> Inspect patient health scores &amp; AI risk predictions.</li>
                  <li><strong>Digital Prescriptions:</strong> Formulate and assign official digital Rx reports to patients.</li>
                </ul>
              </div>

              {/* Privacy Notice */}
              <div style={{ background: 'rgba(46, 204, 113, 0.08)', border: '1px solid rgba(46, 204, 113, 0.2)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', fontSize: '0.8rem', color: '#2ecc71' }}>
                <strong>🔒 Identity Secrecy &amp; Privacy Assurance:</strong> Your medical license details, Government ID documents, and personal contact information are strictly stored under HIPAA-compliant medical data encryption. Your identity is verified and protected.
              </div>

            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button
                className="btn-primary"
                onClick={() => {
                  navigator.clipboard.writeText(`MedIntel Doctor Login Credentials:\nUsername: ${approvalEmailModal.username}\nPassword: ${approvalEmailModal.password}\nLogin URL: http://localhost:5173/doctor-login`);
                  alert('Doctor login credentials copied to clipboard!');
                }}
                style={{ padding: '0.65rem 1.25rem', fontSize: '0.88rem' }}
              >
                Copy Credentials
              </button>
              <button
                className="btn-secondary"
                onClick={() => setApprovalEmailModal(null)}
                style={{ padding: '0.65rem 1.25rem', fontSize: '0.88rem' }}
              >
                Close Email Preview
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Styled inline elements */}
      <style>{`
        .table-row-hover:hover {
          background: rgba(255, 255, 255, 0.02) !important;
        }
        .hover-danger:hover {
          background: rgba(231, 76, 60, 0.1) !important;
          color: #ff6b6b !important;
        }
        .top-navbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 3rem;
          border-bottom: 1px solid var(--surface-border);
          -webkit-backdrop-filter: blur(10px);
          backdrop-filter: blur(10px);
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .nav-actions {
          display: flex;
          align-items: center;
          gap: 1.25rem;
        }
        .main-content {
          flex: 1;
          padding: 2rem 3rem;
          max-width: 1400px;
          width: 100%;
          margin: 0 auto;
        }
        .dashboard-profile-pill {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.35rem 0.85rem;
          border-radius: var(--radius-full);
        }
        .dashboard-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.8rem;
        }
        .dashboard-profile-copy {
          display: flex;
          flex-direction: column;
        }
        .dashboard-profile-copy strong {
          font-size: 0.82rem;
          line-height: 1.2;
        }
        .dashboard-profile-copy span {
          font-size: 0.68rem;
          line-height: 1.2;
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
