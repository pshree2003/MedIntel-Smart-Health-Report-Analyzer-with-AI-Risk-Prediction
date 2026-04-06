import React, { useState } from 'react';
import { ArrowLeft, Download, MessageSquare, Activity, Droplet, Heart, ShieldAlert, Cpu, User, TrendingUp, TrendingDown, Leaf, Pill, Clock, LayoutDashboard, FileText, Settings, Bell, Search, Activity as ActivityIcon, MapPin, Star, Calendar, Phone, Sun, Moon } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import html2pdf from 'html2pdf.js';
import { useTheme } from '../context/ThemeContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [chatOpen, setChatOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Handle multiple reports if available, else fallback to mock or single report
  const allReports = location.state?.reports || (location.state?.reportData ? [location.state.reportData] : [
    {
      patientName: "Guest User",
      age: "32",
      gender: "Male",
      address: "MedCity Sector 4",
      referredDoctor: "Dr. Smith Sharma",
      healthScore: 68,
      medicalValues: [
        { name: 'WBC Count', value: '11,500', unit: 'cumm', normal: '4,000 - 10,000', status: 'High' },
        { name: 'Blood Sugar', value: '105', unit: 'mg/dL', normal: '70 - 100', status: 'Slightly High' },
        { name: 'Hemoglobin', value: '13.5', unit: 'g/dL', normal: '13.8 - 17.2', status: 'Low' }
      ],
      riskPrediction: "An elevated WBC count (11,500) indicates your body is likely fighting off a mild infection or reacting to stress. Given the concurrently low Hemoglobin (13.5), it points toward a potential nutritional deficiency impacting immune response.",
      recoveryEstimate: "3-5 days with proper care and strict adherence to the treatment plan below.",
      naturalTreatments: ["Drink Turmeric milk at night (anti-inflammatory)", "Increase iron intake (spinach, lentils)", "Maintain 3L of water hydration daily"],
      medicalTreatments: ["OTC Multivitamin (for Hemoglobin)", "Paracetamol (only if fever develops)"],
      exerciseReminders: [
        { title: "Light Jogging", time: "07:00 AM", reason: "Help naturally manage borderline glucose." },
        { title: "Evening Walk", time: "06:30 PM", reason: "Low strain activity to preserve immune response." }
      ],
      reportDate: "2024-04-01"
    }
  ]);

  const [selectedReportIndex, setSelectedReportIndex] = useState(0);
  const reportData = allReports[selectedReportIndex];


  const getStatusClass = (status) => {
    if (status?.toLowerCase() === 'high' || status?.toLowerCase() === 'slightly high') return 'danger';
    if (status?.toLowerCase() === 'low') return 'warning';
    return 'success';
  };
  
  const getIcon = (name) => {
    const l = name?.toLowerCase() || '';
    if(l.includes('sugar') || l.includes('glucose')) return <Droplet size={18} />;
    if(l.includes('hemoglobin') || l.includes('blood') || l.includes('heart')) return <Heart size={18} />;
    return <Activity size={18} />;
  };

  const exportPDF = () => {
    const element = document.getElementById('doctor-friendly-report');
    const opt = {
      margin:       10,
      filename:     'MedIntel_Health_Report.pdf',
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-color)' }}>
      
      {/* Sidebar Navigation */}
      <aside style={{ width: '260px', background: theme === 'dark' ? 'rgba(20, 25, 41, 0.8)' : 'rgba(255, 255, 255, 0.8)', borderRight: '1px solid var(--surface-border)', padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '3rem', cursor: 'pointer' }} onClick={() => navigate('/')}>
          <div style={{ background: 'var(--primary-glow)', padding: '0.5rem', borderRadius: '50%' }}>
            <ActivityIcon size={24} color="var(--primary)" />
          </div>
          <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: '700', letterSpacing: '0.5px' }}>MedIntel AI</h2>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
          <button className={`nav-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => { setActiveTab('overview'); window.scrollTo({top: 0, behavior: 'smooth'}); }} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', background: activeTab === 'overview' ? 'rgba(0, 210, 255, 0.1)' : 'transparent', color: activeTab === 'overview' ? 'var(--primary)' : 'var(--text-secondary)', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s', fontWeight: activeTab === 'overview' ? '600' : '400' }}>
            <LayoutDashboard size={20} /> Overview
          </button>
          <button className={`nav-btn ${activeTab === 'tracker' ? 'active' : ''}`} onClick={() => { setActiveTab('tracker'); document.getElementById('health-tracker')?.scrollIntoView({ behavior: 'smooth' }); }} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', background: activeTab === 'tracker' ? 'rgba(0, 210, 255, 0.1)' : 'transparent', color: activeTab === 'tracker' ? 'var(--primary)' : 'var(--text-secondary)', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}>
            <TrendingUp size={20} /> Health Tracker
          </button>
          {allReports.length > 1 && (
            <button className={`nav-btn ${activeTab === 'comparison' ? 'active' : ''}`} onClick={() => setActiveTab('comparison')} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', background: activeTab === 'comparison' ? 'rgba(0, 210, 255, 0.1)' : 'transparent', color: activeTab === 'comparison' ? 'var(--primary)' : 'var(--text-secondary)', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}>
              <FileText size={20} /> Comparison
            </button>
          )}
          <button className={`nav-btn`} onClick={() => navigate('/consultant', { state: { reports: allReports, selectedIndex: selectedReportIndex } })} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', background: 'transparent', color: 'var(--text-secondary)', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}>
            <User size={20} /> Book Consultant
          </button>
          
          {allReports.length > 1 && (
            <div style={{ marginTop: '2rem' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem', paddingLeft: '1rem' }}>Selected Report</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {allReports.map((r, i) => (
                  <button 
                    key={i} 
                    onClick={() => setSelectedReportIndex(i)}
                    style={{ 
                      padding: '0.5rem 1rem', 
                      fontSize: '0.85rem', 
                      borderRadius: 'var(--radius-sm)', 
                      border: '1px solid var(--surface-border)', 
                      background: selectedReportIndex === i ? 'var(--primary-glow)' : 'transparent',
                      color: selectedReportIndex === i ? 'var(--primary)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    Report {i + 1} ({r.reportDate || 'N/A'})
                  </button>
                ))}
              </div>
            </div>
          )}
        </nav>

      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '2rem 3rem 1rem 3rem', height: '100vh', overflowY: 'auto' }}>
        
        {/* Top Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', margin: '0 0 0.5rem 0' }}>Health Overview</h1>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.95rem' }}>Your AI-generated analysis based on the latest report.</p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <button onClick={toggleTheme} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--surface-border)', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <Bell size={20} />
            </button>
            <button className="btn-primary" onClick={exportPDF} style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem' }}>
              <Download size={16} /> Export PDF
            </button>
          </div>
        </header>


        {/* Patient Info Banner */}
        <div className="glass-panel" style={{ padding: '1.5rem 2rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ width: '50px', height: '50px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <User size={24} color="var(--text-primary)" />
            </div>
            <div>
              <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem' }}>{reportData.patientName}</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>{reportData.age} Yrs • {reportData.gender} • ID: MED-{Math.floor(Math.random() * 10000)}X</p>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '3rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Referred By</span>
              <p style={{ margin: '0.25rem 0 0 0', fontWeight: '500', fontSize: '0.95rem' }}>{reportData.referredDoctor}</p>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Patient Address</span>
              <p style={{ margin: '0.25rem 0 0 0', fontWeight: '500', fontSize: '0.95rem' }}>{reportData.address}</p>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date Analyzed</span>
              <p style={{ margin: '0.25rem 0 0 0', fontWeight: '500', fontSize: '0.95rem' }}>Today, 03:45 PM</p>
            </div>
          </div>
        </div>

        {/* Dashboard Grid Container */}
        {activeTab === 'overview' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.5rem' }}>
            
            {/* Top KPI row - spanning across */}
            <div className="glass-panel" style={{ gridColumn: 'span 4', padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
              <h4 style={{ margin: '0 0 1rem 0', color: 'var(--text-secondary)', fontWeight: '500' }}>Overall Health Score</h4>
              <div style={{ position: 'relative', width: '120px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}>
                <svg viewBox="0 0 36 36" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={reportData.healthScore > 80 ? 'var(--success)' : (reportData.healthScore > 60 ? 'var(--warning)' : 'var(--danger)')} strokeWidth="3" strokeDasharray={`${reportData.healthScore}, 100`} style={{ animation: 'fillBar 1.5s ease-out forwards' }} />
                </svg>
                <span style={{ fontSize: '2rem', fontWeight: '800' }}>{reportData.healthScore}</span>
              </div>
              <span className={`badge ${reportData.healthScore > 80 ? 'success' : (reportData.healthScore > 60 ? 'warning' : 'danger')}`}>
                {reportData.healthScore > 80 ? 'Healthy' : (reportData.healthScore > 60 ? 'Moderate Risk' : 'High Risk')}
              </span>
            </div>

            <div id="health-tracker" className="glass-panel" style={{ gridColumn: 'span 8', padding: '1.5rem' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h4 style={{ margin: 0, color: 'var(--text-primary)', fontWeight: '500' }}>Health Progress Tracker</h4>
                  <span className="badge success" style={{ fontSize: '0.75rem' }}><TrendingUp size={14} /> Improving Trend</span>
               </div>
               <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Compared to your last report, your overall metrics have evolved based on the uploaded data.</p>
               
               {/* Mini Chart Mockup */}
               <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2rem', height: '80px', borderBottom: '1px solid var(--surface-border)', paddingBottom: '0.5rem' }}>
                  {allReports.slice(-5).map((r, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: '0.5rem' }}>
                      <div style={{ width: '40px', height: `${r.healthScore}%`, background: i === allReports.length - 1 ? 'var(--primary)' : 'rgba(255,255,255,0.05)', borderRadius: '4px 4px 0 0', boxShadow: i === allReports.length - 1 ? '0 0 15px rgba(0,210,255,0.2)' : 'none' }}></div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.reportDate?.split('-').slice(1).join('/') || `R${i+1}`}</span>
                    </div>
                  ))}
               </div>
            </div>

            {/* Core Content - Values and AI Risks */}
            <div className="glass-panel" style={{ gridColumn: 'span 7', padding: '1.5rem' }}>
              <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Activity size={18} color="var(--primary)" /> Detected Medical Values
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {reportData.medicalValues.map((item, idx) => (
                  <div key={idx} style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>{getIcon(item.name)}</div>
                      <div>
                        <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.95rem' }}>{item.name}</h4>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Normal: {item.normal}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {item.value} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>{item.unit}</span>
                        <span className={`badge ${getStatusClass(item.status)}`} style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem' }}>{item.status}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-panel" style={{ gridColumn: 'span 5', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)' }}>
                <ShieldAlert size={18} /> AI Risk Prediction
              </h3>
              
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <h4 style={{ fontSize: '0.95rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Overview Analysis</h4>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {reportData.riskPrediction}
                  </p>
                </div>
                <div style={{ padding: '1rem', background: 'rgba(231, 76, 60, 0.05)', borderLeft: '3px solid var(--danger)', borderRadius: '0 var(--radius-sm) var(--radius-sm) 0' }}>
                   <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}><strong>Recovery Estimate:</strong> {reportData.recoveryEstimate}</p>
                </div>
              </div>
            </div>

            {/* Bottom Row - Treatments & Exercises */}
            <div className="glass-panel" style={{ gridColumn: 'span 8', padding: '1.5rem' }}>
               <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.1rem' }}>Treatment Plan & Recommendations</h3>
               
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div style={{ background: 'rgba(46, 204, 113, 0.05)', border: '1px solid rgba(46, 204, 113, 0.1)', padding: '1.25rem', borderRadius: 'var(--radius-sm)' }}>
                    <h4 style={{ color: 'var(--success)', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Leaf size={16} /> Natural Treatment</h4>
                    <ul style={{ margin: 0, paddingLeft: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {reportData.naturalTreatments.map((t, idx) => <li key={idx}>{t}</li>)}
                    </ul>
                  </div>
                  <div style={{ background: 'rgba(0, 210, 255, 0.05)', border: '1px solid rgba(0, 210, 255, 0.1)', padding: '1.25rem', borderRadius: 'var(--radius-sm)' }}>
                    <h4 style={{ color: 'var(--primary)', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Pill size={16} /> Medical Treatment</h4>
                    <ul style={{ margin: 0, paddingLeft: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {reportData.medicalTreatments.map((t, idx) => <li key={idx}>{t}</li>)}
                    </ul>
                    <p style={{ margin: '1rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>*Consult a certified doctor before medicating.</p>
                  </div>
               </div>
            </div>

            <div className="glass-panel" style={{ gridColumn: 'span 4', padding: '1.5rem' }}>
              <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={18} color="var(--primary)" /> Exercise Reminders
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {reportData.exerciseReminders && reportData.exerciseReminders.map((ex, idx) => (
                  <div key={idx} style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderLeft: `3px solid ${idx % 2 === 0 ? 'var(--primary)' : 'var(--success)'}`, borderRadius: '0 var(--radius-sm) var(--radius-sm) 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <h4 style={{ margin: 0, fontSize: '0.95rem' }}>{ex.title}</h4>
                      <span style={{ fontSize: '0.75rem', background: idx % 2 === 0 ? 'rgba(0,210,255,0.1)' : 'rgba(46,204,113,0.1)', color: idx % 2 === 0 ? 'var(--primary)' : 'var(--success)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>{ex.time}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>{ex.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Comparison View */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Report Comparison</h2>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${allReports.length}, 1fr)`, gap: '1.5rem', overflowX: 'auto', paddingBottom: '1rem' }}>
              {allReports.map((report, idx) => (
                <div key={idx} className="glass-panel" style={{ minWidth: '300px', padding: '1.5rem' }}>
                  <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--surface-border)', paddingBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>Report {idx + 1}</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{report.reportDate || 'N/A'}</p>
                    <div style={{ marginTop: '1rem' }}>
                      <span className={`badge ${report.healthScore > 80 ? 'success' : (report.healthScore > 60 ? 'warning' : 'danger')}`} style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
                        Health Score: {report.healthScore}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h4 style={{ fontSize: '0.9rem', color: 'var(--text-primary)', textTransform: 'uppercase' }}>Key Values</h4>
                    {report.medicalValues.map((val, vidx) => (
                      <div key={vidx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>{val.name}</span>
                        <span style={{ fontWeight: '600', color: getStatusClass(val.status) === 'danger' ? 'var(--danger)' : (getStatusClass(val.status) === 'warning' ? 'var(--warning)' : 'var(--text-primary)') }}>
                          {val.value} {val.unit}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)' }}>
                    <h4 style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>AI Insight</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>{report.riskPrediction.substring(0, 100)}...</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Floating Chat Bot Widget */}
      <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 50 }}>
        {chatOpen && (
          <div className="glass-panel animate-fade-in" style={{ width: '380px', height: '500px', marginBottom: '1rem', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: 'var(--shadow-depth), 0 0 30px rgba(0, 210, 255, 0.1)' }}>
            <div style={{ background: 'rgba(0, 210, 255, 0.1)', padding: '1.25rem', borderBottom: '1px solid var(--surface-border)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ background: 'var(--primary)', padding: '0.5rem', borderRadius: '50%' }}><Cpu size={20} color="#fff" /></div>
              <div>
                <h4 style={{ margin: 0, fontSize: '1rem' }}>MedIntel AI Assistant</h4>
                <span style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>● Online</span>
              </div>
            </div>
            
            <div style={{ flex: 1, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: 'var(--radius-md) var(--radius-md) var(--radius-md) 0', alignSelf: 'flex-start', maxWidth: '85%' }}>
                <p style={{ fontSize: '0.9rem', margin: 0, lineHeight: 1.5 }}>Hello! I've analyzed your report. You have mildly elevated WBC. What would you like to know?</p>
              </div>
              <div style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)', color: '#fff', padding: '1rem', borderRadius: 'var(--radius-md) var(--radius-md) 0 var(--radius-md)', alignSelf: 'flex-end', maxWidth: '85%' }}>
                <p style={{ fontSize: '0.9rem', margin: 0, lineHeight: 1.5 }}>Can I still exercise with these levels?</p>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: 'var(--radius-md) var(--radius-md) var(--radius-md) 0', alignSelf: 'flex-start', maxWidth: '85%' }}>
                <p style={{ fontSize: '0.9rem', margin: 0, lineHeight: 1.5 }}>Yes, I've added a Light Jogging and Evening Walk routine to your reminders. Avoid heavy lifting until your WBC count normalizes.</p>
              </div>
            </div>

            <div style={{ padding: '1rem', borderTop: '1px solid var(--surface-border)', display: 'flex', gap: '0.75rem', background: 'rgba(0,0,0,0.2)' }}>
              <input 
                type="text" 
                placeholder="Ask about your report..." 
                style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--surface-border)', color: '#fff', borderRadius: 'var(--radius-full)', padding: '0.75rem 1.25rem', outline: 'none', fontSize: '0.9rem' }}
              />
              <button className="btn-primary" style={{ width: '42px', height: '42px', borderRadius: '50%', padding: 0 }}>
                <MessageSquare size={18} />
              </button>
            </div>
          </div>
        )}
        
        <button 
          className="btn-primary"
          onClick={() => setChatOpen(!chatOpen)} 
          style={{ width: '64px', height: '64px', borderRadius: '50%', padding: 0, marginLeft: 'auto', display: 'flex', boxShadow: '0 8px 30px rgba(0, 210, 255, 0.4)' }}
        >
          <MessageSquare size={28} />
        </button>
      </div>

      {/* Hidden Doctor-Friendly Report Template */}
      <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
        <div id="doctor-friendly-report" style={{ width: '800px', background: '#fff', color: '#000', padding: '40px', fontFamily: 'sans-serif', boxSizing: 'border-box' }}>
          <div style={{ borderBottom: '2px solid #222', paddingBottom: '15px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
             <div>
               <h1 style={{ margin: 0, fontSize: '24px', color: '#000' }}>MedIntel AI - Health Summary</h1>
               <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#555' }}>Generated Date: {new Date().toLocaleDateString()}</p>
             </div>
             <div>
               <p style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>Referred By: Dr. Smith Sharma</p>
               <p style={{ margin: '5px 0 0 0', fontSize: '12px' }}>Clinic Address: MedCity Sector 4</p>
             </div>
          </div>
          
          <div style={{ marginBottom: '30px' }}>
             <h2 style={{ fontSize: '18px', borderBottom: '1px solid #ddd', paddingBottom: '5px', marginBottom: '15px' }}>Patient Details</h2>
             <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
               <tbody>
                 <tr><td style={{ padding: '8px 0', width: '30%', fontWeight: 'bold' }}>Patient Name</td><td>{reportData.patientName}</td></tr>
                 <tr><td style={{ padding: '8px 0', fontWeight: 'bold' }}>Age / Gender</td><td>{reportData.age} Yrs / {reportData.gender}</td></tr>
                 <tr><td style={{ padding: '8px 0', fontWeight: 'bold' }}>Overall Health Score</td><td>{reportData.healthScore} / 100</td></tr>
               </tbody>
             </table>
          </div>

          <div style={{ marginBottom: '30px' }}>
             <h2 style={{ fontSize: '18px', borderBottom: '1px solid #ddd', paddingBottom: '5px', marginBottom: '15px' }}>Detected Biological Values</h2>
             <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse', border: '1px solid #ccc' }}>
               <thead>
                 <tr style={{ background: '#f5f5f5' }}>
                   <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ccc' }}>Parameter</th>
                   <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ccc' }}>Detected Value</th>
                   <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ccc' }}>Normal Range</th>
                   <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ccc' }}>Status</th>
                 </tr>
               </thead>
               <tbody>
                 {reportData.medicalValues.map((val, idx) => (
                   <tr key={idx}>
                     <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>{val.name}</td>
                     <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>{val.value} {val.unit}</td>
                     <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>{val.normal}</td>
                     <td style={{ padding: '10px', borderBottom: '1px solid #eee', color: val.status === 'Normal' ? 'green' : (val.status === 'High' ? 'red' : 'orange'), fontWeight: 'bold' }}>{val.status}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>

          <div style={{ marginBottom: '30px' }}>
             <h2 style={{ fontSize: '18px', borderBottom: '1px solid #ddd', paddingBottom: '5px', marginBottom: '15px' }}>AI Medical Analysis Insights</h2>
             <p style={{ fontSize: '14px', lineHeight: '1.6' }}>
               {reportData.riskPrediction} Estimated recovery: {reportData.recoveryEstimate}
             </p>
          </div>

          <div>
             <h2 style={{ fontSize: '18px', borderBottom: '1px solid #ddd', paddingBottom: '5px', marginBottom: '15px' }}>Treatment Plan & Recommendations</h2>
             <h3 style={{ fontSize: '15px', color: '#2ecc71', marginBottom: '5px' }}>Natural Treatment:</h3>
             <ul style={{ fontSize: '14px', margin: '0 0 15px 0', paddingLeft: '20px' }}>
               {reportData.naturalTreatments.map((t, i) => <li key={i}>{t}</li>)}
             </ul>
             
             <h3 style={{ fontSize: '15px', color: '#3a7bd5', marginBottom: '5px' }}>Basic Medical Treatment:</h3>
             <ul style={{ fontSize: '14px', margin: '0 0 15px 0', paddingLeft: '20px' }}>
               {reportData.medicalTreatments.map((t, i) => <li key={i}>{t}</li>)}
             </ul>
             <p style={{ fontSize: '12px', color: '#777', fontStyle: 'italic' }}>*Note: This report is generated by MedIntel AI. Please present this summary to your doctor for a final diagnosis and prescription.</p>
          </div>
        </div>
      </div>

      <style>{`
        /* Scoped style for nav buttons */
        .nav-btn:hover { 
          background: var(--primary-glow) !important; 
          color: var(--primary) !important; 
        }
        .nav-btn.active:hover { 
          background: var(--primary-glow) !important; 
          opacity: 0.8;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
