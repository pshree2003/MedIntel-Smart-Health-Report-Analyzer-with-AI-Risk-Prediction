import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Stethoscope, LogOut, Sun, Moon, Search, Calendar,
  MapPin, CheckCircle, HeartPulse, ShieldAlert,
  User, Phone, Mail, FileText, Plus, Trash2, X, Clipboard, Briefcase
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const normalizeReportMetric = (metric) => ({
    name: metric?.name || metric?.parameter || 'Test',
    value: metric?.value || 'N/A',
    unit: metric?.unit || '',
    normal: metric?.normal || metric?.referenceRange || 'N/A',
    status: metric?.status || metric?.evaluation || 'Normal'
  });

  const normalizePrecaution = (precaution) => (
    typeof precaution === 'string' ? precaution : precaution?.text || precaution?.title || 'General precaution'
  );

  // Load doctor from session
  const [currentDoctor, setCurrentDoctor] = useState(() => {
    const userStr = localStorage.getItem('medintel_current_user');
    return userStr ? JSON.parse(userStr) : null;
  });

  const [patients, setPatients] = useState(() => {
    return JSON.parse(localStorage.getItem('medintel_users') || '[]');
  });

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  // Modals state
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [selectedPatientForReports, setSelectedPatientForReports] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);

  // Prescription Form state
  const [advice, setAdvice] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [medications, setMedications] = useState([{ name: '', dosage: '1-0-1', duration: '5 Days', instruction: 'After food' }]);
  const [toastMessage, setToastMessage] = useState('');

  // Online availability state (loaded from verified doctors list)
  const [onlineAvailable, setOnlineAvailable] = useState(() => {
    const doctors = JSON.parse(localStorage.getItem('medintel_verified_doctors') || '[]');
    const session = JSON.parse(localStorage.getItem('medintel_current_user') || '{}');
    const match = doctors.find(d => d.email && session.email && d.email.toLowerCase() === session.email.toLowerCase());
    return match ? (match.onlineAvailable !== false) : true;
  });

  // Reload data
  const refreshData = () => {
    setPatients(JSON.parse(localStorage.getItem('medintel_users') || '[]'));
  };

  // Toast Helper
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Normalization helper to check if consultation matches the doctor
  const docNameNormalized = useMemo(() => {
    if (!currentDoctor?.name) return '';
    return currentDoctor.name.toLowerCase().replace('dr. ', '').trim();
  }, [currentDoctor?.name]);

  // Aggregate consultations belonging to this doctor
  const doctorConsultations = useMemo(() => {
    if (!currentDoctor) return [];
    
    const list = [];
    patients.forEach(patient => {
      const history = patient.consultHistory || [];
      history.forEach(consult => {
        const cDocName = consult.doctorName || '';
        const consultDocNormalized = cDocName.toLowerCase().replace('dr. ', '').trim();
        
        if (consultDocNormalized === docNameNormalized) {
          list.push({
            id: consult.id,
            patientName: patient.name,
            patientEmail: patient.email,
            patientPhone: patient.phone,
            patientReports: patient.reports || [],
            ...consult
          });
        }
      });
    });
    // Sort by bookedAt or date/time descending
    return list.sort((a, b) => new Date(b.bookedAt || b.date) - new Date(a.bookedAt || a.date));
  }, [patients, currentDoctor, docNameNormalized]);

  // Statistics
  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const total = doctorConsultations.length;
    const daily = doctorConsultations.filter(c => c.date === todayStr).length;
    const online = doctorConsultations.filter(c => c.consultationMode === 'Online').length;
    const offline = doctorConsultations.filter(c => c.consultationMode === 'Offline').length;
    return { total, daily, online, offline };
  }, [doctorConsultations]);

  // Filtered consultations
  const filteredConsultations = useMemo(() => {
    return doctorConsultations.filter(c => {
      const matchesSearch = 
        c.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.patientEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.patientPhone.includes(searchTerm);
      
      const matchesMode = filterMode === 'All' || c.consultationMode === filterMode;
      const matchesStatus = filterStatus === 'All' || c.status === filterStatus;

      return matchesSearch && matchesMode && matchesStatus;
    });
  }, [doctorConsultations, searchTerm, filterMode, filterStatus]);

  // Handle Prescription Form
  const handleAddMedication = () => {
    setMedications(prev => [...prev, { name: '', dosage: '1-0-1', duration: '5 Days', instruction: 'After food' }]);
  };

  const handleRemoveMedication = (index) => {
    if (medications.length === 1) return;
    setMedications(prev => prev.filter((_, i) => i !== index));
  };

  const handleMedicationChange = (index, field, value) => {
    setMedications(prev => {
      const copy = [...prev];
      copy[index][field] = value;
      return copy;
    });
  };

  const openPrescriptionModal = (consult) => {
    setSelectedConsultation(consult);
    if (consult.prescription) {
      setAdvice(consult.prescription.advice || '');
      setFollowUp(consult.prescription.followUp || '');
      setMedications(consult.prescription.medications || [{ name: '', dosage: '1-0-1', duration: '5 Days', instruction: 'After food' }]);
    } else {
      setAdvice('');
      setFollowUp('');
      setMedications([{ name: '', dosage: '1-0-1', duration: '5 Days', instruction: 'After food' }]);
    }
    setIsPrescriptionModalOpen(true);
  };

  const handleSavePrescription = (e) => {
    e.preventDefault();
    if (!selectedConsultation) return;

    if (medications.some(m => !m.name.trim())) {
      alert('Please fill in the name of all medications.');
      return;
    }

    const prescriptionData = {
      advice: advice.trim(),
      followUp: followUp,
      medications: medications,
      doctorName: currentDoctor.name,
      doctorSpec: currentDoctor.spec,
      doctorRegNum: currentDoctor.regNum,
      doctorHospital: currentDoctor.hospital || 'MedIntel Panel Clinic',
      date: new Date().toISOString().split('T')[0]
    };

    // Update patient list in localStorage
    const updatedPatients = patients.map(p => {
      if (p.email.toLowerCase() === selectedConsultation.patientEmail.toLowerCase()) {
        const updatedHistory = (p.consultHistory || []).map(c => {
          if (c.id === selectedConsultation.id) {
            return {
              ...c,
              status: 'Prescribed',
              prescription: prescriptionData
            };
          }
          return c;
        });
        
        // Update user key history for consistency
        localStorage.setItem(`medintel_consult_history_${p.email.toLowerCase()}`, JSON.stringify(updatedHistory));
        
        return {
          ...p,
          consultHistory: updatedHistory
        };
      }
      return p;
    });

    localStorage.setItem('medintel_users', JSON.stringify(updatedPatients));
    refreshData();
    setIsPrescriptionModalOpen(false);
    showToast(`Prescription saved successfully for ${selectedConsultation.patientName}!`);
  };

  const handleLogout = () => {
    localStorage.removeItem('medintel_current_user');
    navigate('/');
  };

  const toggleOnlineAvailability = () => {
    const nextVal = !onlineAvailable;
    setOnlineAvailable(nextVal);
    const doctors = JSON.parse(localStorage.getItem('medintel_verified_doctors') || '[]');
    const session = JSON.parse(localStorage.getItem('medintel_current_user') || '{}');
    const updated = doctors.map(d =>
      d.email && session.email && d.email.toLowerCase() === session.email.toLowerCase()
        ? { ...d, onlineAvailable: nextVal }
        : d
    );
    localStorage.setItem('medintel_verified_doctors', JSON.stringify(updated));
    showToast(nextVal ? '✅ You are now available for Online Consultations' : '⛔ Online availability turned OFF');
  };

  const inputStyle = (theme) => ({
    width: '100%',
    padding: '0.65rem 0.9rem',
    background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
    border: '1px solid var(--surface-border)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)',
    outline: 'none',
    fontSize: '0.9rem',
    boxSizing: 'border-box'
  });

  const labelStyle = {
    fontSize: '0.78rem',
    color: 'var(--text-secondary)',
    marginBottom: '0.3rem',
    display: 'block',
    fontWeight: '600'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-color)', color: 'var(--text-primary)' }}>
      {/* Navbar */}
      <nav className="top-navbar" style={{ background: theme === 'dark' ? 'rgba(20, 25, 41, 0.8)' : 'rgba(255, 255, 255, 0.8)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
          <div style={{ position: 'relative', width: '42px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, var(--primary) 0%, rgba(0,210,255,0.5) 100%)', borderRadius: '12px', transform: 'rotate(10deg)', opacity: 0.2 }} />
            <div style={{ position: 'absolute', inset: '2px', background: 'linear-gradient(135deg, var(--primary) 0%, #2980b9 100%)', borderRadius: '10px' }} />
            <Stethoscope size={22} color="#ffffff" style={{ position: 'relative', zIndex: 1 }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: '800', letterSpacing: '0.2px', lineHeight: 1 }}>
              MedIntel<span style={{ color: 'var(--primary)' }}>.AI</span>
            </h2>
            <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', fontWeight: '600', marginTop: '2px' }}>Doctor Console</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {currentDoctor && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontSize: '0.8rem' }}>
              <span style={{ fontWeight: '700' }}>{currentDoctor.name}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{currentDoctor.spec} · Reg: {currentDoctor.regNum}</span>
            </div>
          )}
          <button onClick={toggleTheme} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--surface-border)', padding: '0.45rem', borderRadius: '50%', cursor: 'pointer', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>
          {/* Online Availability Toggle */}
          <button
            onClick={toggleOnlineAvailability}
            title={onlineAvailable ? 'Click to go offline' : 'Click to go online'}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.45rem',
              background: onlineAvailable ? 'rgba(46,204,113,0.12)' : 'rgba(180,180,180,0.08)',
              border: `1px solid ${onlineAvailable ? 'rgba(46,204,113,0.35)' : 'var(--surface-border)'}`,
              color: onlineAvailable ? '#2ecc71' : 'var(--text-muted)',
              padding: '0.45rem 0.9rem', borderRadius: 'var(--radius-full)',
              cursor: 'pointer', fontWeight: '700', fontSize: '0.78rem',
              transition: 'all 0.2s'
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: onlineAvailable ? '#2ecc71' : '#aaa', display: 'inline-block', boxShadow: onlineAvailable ? '0 0 6px #2ecc71' : 'none' }} />
            {onlineAvailable ? 'Online' : 'Offline'}
          </button>
          <button onClick={handleLogout} style={{ background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.2)', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)', cursor: 'pointer', fontWeight: '700', fontSize: '0.8rem' }}>
            <LogOut size={13} /> Logout
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '2rem', maxWidth: '1400px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        
        {/* Toast Notification */}
        {toastMessage && (
          <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', background: '#2ecc71', color: '#fff', padding: '1rem 1.5rem', borderRadius: 'var(--radius-md)', boxShadow: '0 10px 30px rgba(46, 204, 113, 0.3)', display: 'flex', alignItems: 'center', gap: '0.75rem', zIndex: 10000, fontWeight: '600', animation: 'slide-in 0.3s ease-out' }}>
            <CheckCircle size={20} />
            {toastMessage}
          </div>
        )}

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
          {[
            { label: 'Total Appointments', value: stats.total, color: 'var(--primary)', icon: Clipboard },
            { label: "Today's Consultations", value: stats.daily, color: '#f1c40f', icon: Calendar },
            { label: 'Online Consultations', value: stats.online, color: '#3498db', icon: Stethoscope },
            { label: 'Offline / Clinic Visits', value: stats.offline, color: '#9b59b6', icon: MapPin }
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '1.25rem', borderLeft: `4px solid ${color}` }}>
              <div style={{ background: `rgba(${color === 'var(--primary)' ? '0,210,255' : color === '#f1c40f' ? '241,196,15' : color === '#3498db' ? '52,152,219' : '155,89,182'}, 0.1)`, padding: '0.75rem', borderRadius: '12px' }}>
                <Icon size={24} color={color} />
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
                <h3 style={{ margin: '0.2rem 0 0 0', fontSize: '1.75rem', fontWeight: '800' }}>{value}</h3>
              </div>
            </div>
          ))}
        </div>

        {/* Actions & Filters */}
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0, fontWeight: '800', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clipboard size={18} color="var(--primary)" /> Consultation Bookings Directory
            </h3>

            {/* Search and Filters */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', flex: 1, justifyContent: 'flex-end', maxWidth: '800px' }}>
              {/* Search */}
              <div style={{ position: 'relative', flex: '1 1 200px' }}>
                <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input
                  type="text"
                  placeholder="Search patient name, phone, email..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{ ...inputStyle(theme), paddingLeft: '2.4rem' }}
                />
              </div>

              {/* Mode filter */}
              <select 
                value={filterMode} 
                onChange={e => setFilterMode(e.target.value)}
                style={{ ...inputStyle(theme), width: 'auto', minWidth: '140px', background: theme === 'dark' ? '#151928' : '#fff' }}
              >
                <option value="All">All Visit Modes</option>
                <option value="Online">Online Consultation</option>
                <option value="Offline">Offline Visit</option>
              </select>

              {/* Status filter */}
              <select 
                value={filterStatus} 
                onChange={e => setFilterStatus(e.target.value)}
                style={{ ...inputStyle(theme), width: 'auto', minWidth: '140px', background: theme === 'dark' ? '#151928' : '#fff' }}
              >
                <option value="All">All Statuses</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Prescribed">Prescribed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Patient Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.5rem' }}>
          {filteredConsultations.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', padding: '4rem', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--surface-border)', borderRadius: 'var(--radius-md)' }}>
              <Stethoscope size={40} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <h4 style={{ margin: 0, fontWeight: '700', fontSize: '1.1rem' }}>No consultations found</h4>
              <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.88rem' }}>Try adjusting your search query or filter tags.</p>
            </div>
          ) : (
            filteredConsultations.map((consult) => {
              const isPrescribed = consult.status === 'Prescribed';
              const hasReports = consult.patientReports && consult.patientReports.length > 0;
              return (
                <div key={consult.id} className="glass-panel card-hover" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid var(--surface-border)', position: 'relative' }}>
                  
                  {/* Top Header */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <div>
                        <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>Patient Name</span>
                        <h4 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <User size={16} color="var(--primary)" /> {consult.patientName}
                        </h4>
                      </div>
                      
                      {/* Visit Mode Badge */}
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: '700',
                        padding: '0.25rem 0.65rem',
                        borderRadius: '9999px',
                        background: consult.consultationMode === 'Online' ? 'rgba(52,152,219,0.12)' : 'rgba(155,89,182,0.12)',
                        color: consult.consultationMode === 'Online' ? '#3498db' : '#9b59b6',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}>
                        {consult.consultationMode === 'Online' ? <Stethoscope size={11} /> : <MapPin size={11} />}
                        {consult.consultationMode}
                      </span>
                    </div>

                    {/* Meta info details */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem', marginBottom: '1.25rem', padding: '0.85rem', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid var(--surface-border)' }}>
                      <div>
                        <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Date</span>
                        <span style={{ fontWeight: '600' }}>{consult.date}</span>
                      </div>
                      <div>
                        <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Time</span>
                        <span style={{ fontWeight: '600' }}>{consult.time}</span>
                      </div>
                      <div>
                        <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</span>
                        <span style={{
                          fontWeight: '700',
                          color: isPrescribed ? 'var(--primary)' : 'var(--success)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}>
                          <CheckCircle size={12} /> {consult.status}
                        </span>
                      </div>
                      <div>
                        <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>City / Location</span>
                        <span style={{ fontWeight: '600', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', display: 'block' }}>{consult.city || 'Mumbai'}</span>
                      </div>
                    </div>

                    {/* Patient Contact Info */}
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Mail size={13} color="var(--text-muted)" /> <span style={{ wordBreak: 'break-all' }}>{consult.patientEmail}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Phone size={13} color="var(--text-muted)" /> <span>{consult.patientPhone || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: 'auto', borderTop: '1px solid var(--surface-border)', paddingTop: '1rem' }}>
                    {/* View Patient Reports Button (if any) */}
                    {hasReports ? (
                      <button
                        type="button"
                        onClick={() => setSelectedPatientForReports({ name: consult.patientName, email: consult.patientEmail, reports: consult.patientReports })}
                        style={{
                          width: '100%',
                          padding: '0.55rem',
                          background: 'rgba(0, 210, 255, 0.08)',
                          border: '1px solid rgba(0, 210, 255, 0.25)',
                          color: 'var(--primary)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.82rem',
                          fontWeight: '700',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.4rem',
                          transition: 'all 0.2s'
                        }}
                      >
                        <HeartPulse size={14} /> Review Patient Health Reports ({consult.patientReports.length})
                      </button>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '0.45rem', background: 'rgba(0,0,0,0.02)', border: '1px dashed var(--surface-border)', borderRadius: '4px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        No clinical health reports uploaded by patient.
                      </div>
                    )}

                    {/* Prescription Button */}
                    <button
                      type="button"
                      onClick={() => openPrescriptionModal(consult)}
                      style={{
                        width: '100%',
                        padding: '0.65rem',
                        background: isPrescribed ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, var(--primary) 0%, #2980b9 100%)',
                        border: isPrescribed ? '1px solid var(--surface-border)' : 'none',
                        color: isPrescribed ? 'var(--text-primary)' : '#fff',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.85rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem',
                        transition: 'all 0.2s',
                        boxShadow: isPrescribed ? 'none' : '0 4px 15px rgba(0, 210, 255, 0.15)'
                      }}
                    >
                      <FileText size={15} />
                      {isPrescribed ? 'Modify Prescription' : 'Create Digital Prescription'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* MODAL: CREATE / MODIFY PRESCRIPTION */}
      {isPrescriptionModalOpen && selectedConsultation && (
        <div className="consult-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setIsPrescriptionModalOpen(false)}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', position: 'relative', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', boxSizing: 'border-box' }} onClick={e => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--surface-border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>Prescription Assignment</span>
                <h3 style={{ margin: '0.2rem 0 0 0', fontSize: '1.25rem', fontWeight: '800' }}>Patient: {selectedConsultation.patientName}</h3>
              </div>
              <button className="auth-icon-button" onClick={() => setIsPrescriptionModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSavePrescription} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Clinical Advice / Diagnosis Notes */}
              <div>
                <label style={labelStyle}>Diagnosis Notes / Clinical Advice *</label>
                <textarea
                  required
                  placeholder="Describe patient diagnosis, clinical findings, precautions and general health instructions..."
                  value={advice}
                  onChange={e => setAdvice(e.target.value)}
                  style={{
                    ...inputStyle(theme),
                    minHeight: '100px',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Medications Table */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>Medications List *</label>
                  <button
                    type="button"
                    onClick={handleAddMedication}
                    style={{
                      background: 'rgba(0, 210, 255, 0.1)',
                      border: '1px solid rgba(0, 210, 255, 0.25)',
                      color: 'var(--primary)',
                      padding: '0.35rem 0.75rem',
                      borderRadius: '4px',
                      fontSize: '0.78rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem'
                    }}
                  >
                    <Plus size={13} /> Add Drug
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {medications.map((med, index) => (
                    <div key={index} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--surface-border)' }}>
                      
                      {/* Name */}
                      <div style={{ flex: '2 1 180px' }}>
                        <input
                          type="text"
                          placeholder="Medicine Name (e.g. Paracetamol 650mg)"
                          required
                          value={med.name}
                          onChange={e => handleMedicationChange(index, 'name', e.target.value)}
                          style={inputStyle(theme)}
                        />
                      </div>

                      {/* Dosage */}
                      <div style={{ flex: '1 1 90px' }}>
                        <select
                          value={med.dosage}
                          onChange={e => handleMedicationChange(index, 'dosage', e.target.value)}
                          style={{ ...inputStyle(theme), background: theme === 'dark' ? '#151928' : '#fff' }}
                        >
                          <option value="1-0-1">1-0-1 (Morning & Night)</option>
                          <option value="1-1-1">1-1-1 (Morning, Noon & Night)</option>
                          <option value="1-0-0">1-0-0 (Morning Only)</option>
                          <option value="0-1-0">0-1-0 (Noon Only)</option>
                          <option value="0-0-1">0-0-1 (Night Only)</option>
                          <option value="1-1-1-1">1-1-1-1 (Four times daily)</option>
                          <option value="As Needed">As Needed (SOS)</option>
                        </select>
                      </div>

                      {/* Duration */}
                      <div style={{ flex: '1 1 80px' }}>
                        <input
                          type="text"
                          placeholder="e.g. 5 Days"
                          required
                          value={med.duration}
                          onChange={e => handleMedicationChange(index, 'duration', e.target.value)}
                          style={inputStyle(theme)}
                        />
                      </div>

                      {/* Instruction */}
                      <div style={{ flex: '1 1 100px' }}>
                        <select
                          value={med.instruction}
                          onChange={e => handleMedicationChange(index, 'instruction', e.target.value)}
                          style={{ ...inputStyle(theme), background: theme === 'dark' ? '#151928' : '#fff' }}
                        >
                          <option value="After food">After food</option>
                          <option value="Before food">Before food</option>
                          <option value="With food">With food</option>
                          <option value="Empty stomach">Empty stomach</option>
                        </select>
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveMedication(index)}
                        disabled={medications.length === 1}
                        style={{
                          background: 'rgba(231,76,60,0.08)',
                          border: '1px solid rgba(231,76,60,0.2)',
                          color: 'var(--danger)',
                          padding: '0.6rem',
                          borderRadius: 'var(--radius-sm)',
                          cursor: medications.length === 1 ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: medications.length === 1 ? 0.4 : 1
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Follow-up Date */}
              <div>
                <label style={labelStyle}>Next Recommended Follow-up Date</label>
                <input
                  type="date"
                  value={followUp}
                  onChange={e => setFollowUp(e.target.value)}
                  style={{ ...inputStyle(theme), maxWidth: '240px' }}
                />
              </div>

              {/* Form submit */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem', borderTop: '1px solid var(--surface-border)', paddingTop: '1.25rem' }}>
                <button
                  type="button"
                  onClick={() => setIsPrescriptionModalOpen(false)}
                  style={{
                    padding: '0.65rem 1.25rem',
                    background: 'transparent',
                    border: '1px solid var(--surface-border)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.65rem 1.5rem',
                    background: 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    color: '#fff',
                    cursor: 'pointer',
                    fontWeight: '700',
                    boxShadow: '0 4px 15px rgba(46, 204, 113, 0.2)'
                  }}
                >
                  Save &amp; Finalize Prescription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VIEW PATIENT HEALTH REPORTS */}
      {selectedPatientForReports && (
        <div className="consult-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setSelectedPatientForReports(null)}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto', padding: '2rem', position: 'relative', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', boxSizing: 'border-box' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--surface-border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>Clinical Record History</span>
                <h3 style={{ margin: '0.2rem 0 0 0', fontSize: '1.25rem', fontWeight: '800' }}>{selectedPatientForReports.name}'s Health Reports</h3>
              </div>
              <button className="auth-icon-button" onClick={() => setSelectedPatientForReports(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {selectedPatientForReports.reports.map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', padding: '1rem', background: 'rgba(0, 210, 255, 0.03)', border: '1px solid rgba(0, 210, 255, 0.12)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.93rem', fontWeight: '700' }}>{r.name || r.fileName || `Report ${i + 1}`}</h4>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Date: {r.date ? new Date(r.date).toLocaleDateString() : 'N/A'} · Health Score: <strong style={{ color: r.healthScore >= 80 ? 'var(--success)' : (r.healthScore >= 60 ? 'var(--warning)' : 'var(--danger)') }}>{r.healthScore || 'N/A'}</strong>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedReport(r)}
                    style={{
                      padding: '0.45rem 0.9rem',
                      background: 'var(--primary)',
                      border: 'none',
                      color: '#fff',
                      borderRadius: '4px',
                      fontSize: '0.78rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem'
                    }}
                  >
                    <FileText size={13} /> View AI Analysis
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VIEW DETAILED AI REPORT */}
      {selectedReport && (
        <div className="consult-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setSelectedReport(null)}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', position: 'relative', boxShadow: '0 30px 60px rgba(0,0,0,0.6)', border: '1px solid var(--surface-border)', boxSizing: 'border-box' }} onClick={e => e.stopPropagation()}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--surface-border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>Clinical Report AI Analysis</span>
                <h3 style={{ margin: '0.2rem 0 0 0', fontSize: '1.25rem', fontWeight: '800' }}>{selectedReport.name || selectedReport.fileName || 'Report Details'}</h3>
              </div>
              <button className="auth-icon-button" onClick={() => setSelectedReport(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* Health Score Summary Card */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-md)', padding: '1.5rem' }}>
              {/* Score circle */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid var(--surface-border)', paddingRight: '1.5rem' }}>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Health Score</span>
                <div style={{
                  width: '90px',
                  height: '90px',
                  borderRadius: '50%',
                  border: `4px solid ${selectedReport.healthScore >= 80 ? 'var(--success)' : (selectedReport.healthScore >= 60 ? 'var(--warning)' : 'var(--danger)')}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column'
                }}>
                  <span style={{
                    fontSize: '1.75rem',
                    fontWeight: '900',
                    color: selectedReport.healthScore >= 80 ? 'var(--success)' : (selectedReport.healthScore >= 60 ? 'var(--warning)' : 'var(--danger)'),
                  }}>
                    {selectedReport.healthScore || 'N/A'}
                  </span>
                  <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>/ 100</span>
                </div>
                <div style={{
                  marginTop: '0.75rem',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '4px',
                  fontSize: '0.7rem',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  background: selectedReport.healthScore >= 80 ? 'rgba(46,204,113,0.12)' : (selectedReport.healthScore >= 60 ? 'rgba(243,156,18,0.12)' : 'rgba(231,76,60,0.12)'),
                  color: selectedReport.healthScore >= 80 ? 'var(--success)' : (selectedReport.healthScore >= 60 ? 'var(--warning)' : 'var(--danger)')
                }}>
                  {selectedReport.healthScore >= 80 ? 'Healthy' : (selectedReport.healthScore >= 60 ? 'Moderate Risk' : 'High Risk')}
                </div>
              </div>

              {/* Risk Prediction Summary */}
              <div>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>AI Clinical Diagnosis / Prediction</span>
                <p style={{ margin: 0, fontSize: '0.93rem', lineHeight: 1.6, fontWeight: '600' }}>
                  {selectedReport.riskPrediction || 'No immediate clinical health risks identified.'}
                </p>
                {selectedReport.recoveryEstimate && (
                  <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <strong>Recovery Estimate:</strong> {selectedReport.recoveryEstimate}
                  </div>
                )}
              </div>
            </div>

            {/* Medical Metrics Table */}
            {selectedReport.medicalValues?.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>Observed Lab Metrics</span>
                <div style={{ border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--surface-border)', textAlign: 'left' }}>
                        <th style={{ padding: '0.6rem 0.85rem' }}>Biomarker / Test Name</th>
                        <th style={{ padding: '0.6rem 0.85rem' }}>Reported Value</th>
                        <th style={{ padding: '0.6rem 0.85rem' }}>Reference Limits</th>
                        <th style={{ padding: '0.6rem 0.85rem', textAlign: 'center' }}>Evaluation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedReport.medicalValues.map((val, idx) => {
                        const metric = normalizeReportMetric(val);
                        const isAbnormal = metric.status && metric.status.toLowerCase() !== 'normal';
                        return (
                          <tr key={idx} style={{ borderBottom: idx < selectedReport.medicalValues.length - 1 ? '1px solid var(--surface-border)' : 'none' }}>
                            <td style={{ padding: '0.6rem 0.85rem', fontWeight: '600' }}>{metric.name}</td>
                            <td style={{ padding: '0.6rem 0.85rem' }}>{metric.value}{metric.unit ? ` ${metric.unit}` : ''}</td>
                            <td style={{ padding: '0.6rem 0.85rem', color: 'var(--text-muted)' }}>{metric.normal}</td>
                            <td style={{ padding: '0.6rem 0.85rem', textAlign: 'center' }}>
                              <span style={{
                                padding: '0.15rem 0.45rem',
                                borderRadius: '4px',
                                fontSize: '0.72rem',
                                fontWeight: '700',
                                background: isAbnormal ? 'rgba(231,76,60,0.1)' : 'rgba(46,204,113,0.1)',
                                color: isAbnormal ? 'var(--danger)' : 'var(--success)'
                              }}>{metric.status}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Treatment recommendations */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div>
                <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>Natural Remedies / Lifestyle Advice</span>
                {selectedReport.naturalTreatments?.length > 0 ? (
                  <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.85rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                    {selectedReport.naturalTreatments.map((t, idx) => <li key={idx} style={{ marginBottom: '0.2rem' }}>{t}</li>)}
                  </ul>
                ) : <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>No specific lifestyle recommendations found.</p>}
              </div>

              <div>
                <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>Clinical Guidelines / Medical Care</span>
                {selectedReport.medicalTreatments?.length > 0 ? (
                  <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.85rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                    {selectedReport.medicalTreatments.map((t, idx) => <li key={idx} style={{ marginBottom: '0.2rem' }}>{t}</li>)}
                  </ul>
                ) : <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>No standard medical treatments flagged.</p>}
              </div>
            </div>

            {/* Precautions */}
                {selectedReport.patientPrecautions?.length > 0 && (
              <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(231,76,60,0.03)', border: '1px solid rgba(231,76,60,0.15)', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--danger)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.5rem' }}>
                  <ShieldAlert size={14} /> Immediate Health Precautions
                </span>
                <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.85rem', lineHeight: 1.5, color: 'var(--text-secondary)' }}>
                  {selectedReport.patientPrecautions.map((prec, idx) => (
                    <li key={idx} style={{ marginBottom: '0.2rem' }}>{normalizePrecaution(prec)}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Close Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--surface-border)', paddingTop: '1.25rem' }}>
              <button
                onClick={() => setSelectedReport(null)}
                style={{
                  padding: '0.55rem 1.5rem',
                  background: 'var(--primary)',
                  border: 'none',
                  color: '#fff',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DoctorDashboard;
