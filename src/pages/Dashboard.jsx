import React, { useState } from 'react';
import { ArrowLeft, Download, MessageSquare, Activity, Droplet, Heart, HeartPulse, ShieldAlert, Cpu, User, TrendingUp, TrendingDown, Leaf, Pill, Clock, LayoutDashboard, FileText, Settings, Bell, Search, Activity as ActivityIcon, MapPin, Star, Calendar, Phone, Sun, Moon } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import html2pdf from 'html2pdf.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { useTheme } from '../context/ThemeContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [chatOpen, setChatOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  
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
  
  // Using useState to generate ID once to satisfy purity rules
  const [patientId] = useState(() => `MED-${Math.floor(Math.random() * 10000)}X`);

  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', text: `Hello! I am MedIntel AI. I've analyzed your report. What would you like to know about your results?` }
  ]);

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isChatLoading) return;
    
    const userMsg = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsChatLoading(true);

    try {
      const apiKey = localStorage.getItem('gemini_api_key');
      if (!apiKey) {
        setChatMessages(prev => [...prev, { role: 'assistant', text: 'Error: Gemini API Key not found. Please go to the home page and enter your key.' }]);
        setIsChatLoading(false);
        return;
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const modelNames = ["gemini-1.5-flash", "gemini-1.5-flash-8b", "gemini-2.0-flash", "gemini-1.5-pro"];

      const context = `
You are MedIntel AI, a strictly bounded professional virtual medical data assistant.
Your ONLY purpose is to answer questions specifically regarding the uploaded medical report detailed below.
IMPORTANT GUARDRAILS:
1. You MUST REFUSE to answer any questions unrelated to this report (e.g., general conversation, asking for code, programming, unrelated health issues).
2. If the user asks for unauthorized medical advice, definitively diagnosing a condition, or prescribing medicine, you MUST refuse and instruct them to consult their referring doctor (${reportData.referredDoctor}).
3. Always base your replies purely on the data provided below.

--- REPORT DATA ---
Patient Name: ${reportData.patientName}, Age ${reportData.age}, Gender ${reportData.gender}.
Detected medical values:
${reportData?.medicalValues?.map(v => `- ${v.name}: ${v.value} ${v.unit} (Status: ${v.status}, Normal Range: ${v.normal})`).join('\n') || 'None'}

Overall health score: ${reportData.healthScore}/100.
AI Risk Prediction: ${reportData.riskPrediction}
Treatment Plan: ${reportData?.naturalTreatments?.join(', ') || 'None'}
-------------------

Be conversational, very empathetic, and highly professional. Limit responses to 2 short paragraphs maximum.
`;

      const historyString = chatMessages.map(msg => 
        msg.role === 'user' ? `Patient: ${msg.text}` : `MedIntel AI: ${msg.text}`
      ).join('\n\n');
      const prompt = `${context}\n\n--- PREVIOUS CONVERSATION ---\n${historyString}\n\nPatient: ${userMsg}\nMedIntel AI:`;

      let responseText = "";
      let lastError = null;

      for (const mName of modelNames) {
        try {
          const model = genAI.getGenerativeModel({ model: mName });
          const result = await model.generateContent(prompt);
          responseText = result.response.text();
          break; // If successful, exit loop
        } catch (e) {
          lastError = e;
          // Only log warnings, keep trying next models
          console.warn(`Model ${mName} failed:`, e.message);
        }
      }

      if (!responseText) {
        throw new Error(`All fallback AI models failed or rate limits exceeded. Last error: ${lastError?.message.split('[429]')[0] || lastError?.message || 'Unknown'}`);
      }

      setChatMessages(prev => [...prev, { role: 'assistant', text: responseText }]);
    } catch (error) {
      console.error(error);
      setChatMessages(prev => [...prev, { role: 'assistant', text: `Sorry! The AI server is overloaded right now (Rate Limit / Quota Exceeded). Please wait 30 seconds and try again.` }]);
    } finally {
      setIsChatLoading(false);
    }
  };


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

  const exportPDF = async () => {
    const element = document.getElementById('doctor-friendly-report');
    if (!element) return;

    const patientSafeName = (reportData.patientName || 'Patient').replace(/\s+/g, '_');
    const filename = `MedIntel_Report_${patientSafeName}.pdf`;

    const opt = {
      margin:      [10, 10, 10, 10],
      filename,
      image:       { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF:       { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
      // Generate blob and force-download with correct filename
      const pdfBlob = await html2pdf().set(opt).from(element).outputPdf('blob');
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF export failed:', err);
      alert('Failed to generate PDF. Please try again.');
    }
  };


  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-color)' }}>
      
      {/* Top Navbar */}
      <nav className="top-navbar" style={{ background: theme === 'dark' ? 'rgba(20, 25, 41, 0.8)' : 'rgba(255, 255, 255, 0.8)' }}>
        
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', cursor: 'pointer' }} onClick={() => navigate('/')}>
          <div style={{ position: 'relative', width: '42px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, var(--primary) 0%, rgba(0, 210, 255, 0.5) 100%)', borderRadius: '12px', transform: 'rotate(10deg)', opacity: 0.2 }}></div>
            <div style={{ position: 'absolute', inset: '2px', background: 'linear-gradient(135deg, var(--primary) 0%, #2563eb 100%)', borderRadius: '10px' }}></div>
            <HeartPulse size={22} color="#ffffff" style={{ position: 'relative', zIndex: 1 }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h2 style={{ fontSize: '1.3rem', margin: 0, fontWeight: '800', letterSpacing: '0.2px', color: 'var(--text-primary)', lineHeight: 1 }}>MedIntel<span style={{ color: 'var(--primary)' }}>.AI</span></h2>
            <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--text-muted)', fontWeight: '600', marginTop: '4px' }}>Patient Intelligence</span>
          </div>
        </div>

        {/* Center Links */}
        <div className="nav-links">
          <button className={`nav-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => { setActiveTab('overview'); window.scrollTo({top: 0, behavior: 'smooth'}); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem', borderRadius: 'var(--radius-full)', background: activeTab === 'overview' ? 'rgba(0, 210, 255, 0.1)' : 'transparent', color: activeTab === 'overview' ? 'var(--primary)' : 'var(--text-secondary)', border: 'none', cursor: 'pointer', transition: 'all 0.2s', fontWeight: activeTab === 'overview' ? '600' : '500' }}>
            <LayoutDashboard size={18} /> Overview
          </button>
          <button className={`nav-btn ${activeTab === 'tracker' ? 'active' : ''}`} onClick={() => { setActiveTab('tracker'); document.getElementById('health-tracker')?.scrollIntoView({ behavior: 'smooth' }); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem', borderRadius: 'var(--radius-full)', background: activeTab === 'tracker' ? 'rgba(0, 210, 255, 0.1)' : 'transparent', color: activeTab === 'tracker' ? 'var(--primary)' : 'var(--text-secondary)', border: 'none', cursor: 'pointer', transition: 'all 0.2s', fontWeight: activeTab === 'tracker' ? '600' : '500' }}>
            <TrendingUp size={18} /> Health Tracker
          </button>
          {allReports.length > 1 && (
            <button className={`nav-btn ${activeTab === 'comparison' ? 'active' : ''}`} onClick={() => setActiveTab('comparison')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem', borderRadius: 'var(--radius-full)', background: activeTab === 'comparison' ? 'rgba(0, 210, 255, 0.1)' : 'transparent', color: activeTab === 'comparison' ? 'var(--primary)' : 'var(--text-secondary)', border: 'none', cursor: 'pointer', transition: 'all 0.2s', fontWeight: activeTab === 'comparison' ? '600' : '500' }}>
              <FileText size={18} /> Comparison
            </button>
          )}
          
          {allReports.length > 1 && (
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginLeft: '1rem', paddingLeft: '1rem', borderLeft: '1px solid var(--surface-border)' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginRight: '0.5rem' }}>Select Report:</span>
              <select 
                value={selectedReportIndex}
                onChange={(e) => setSelectedReportIndex(Number(e.target.value))}
                style={{ background: 'transparent', border: '1px solid var(--surface-border)', color: 'var(--text-primary)', padding: '0.4rem 0.5rem', borderRadius: 'var(--radius-sm)', outline: 'none', cursor: 'pointer', fontSize: '0.85rem' }}
              >
                {allReports.map((r, i) => (
                  <option key={i} value={i}>{r.reportDate || `Report ${i+1}`}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Right Actions */}
        <div className="nav-actions">
          <button className="nav-btn" onClick={() => navigate('/consultant', { state: { reports: allReports, selectedIndex: selectedReportIndex } })} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem', borderRadius: 'var(--radius-full)', background: 'transparent', color: 'var(--text-secondary)', border: 'none', cursor: 'pointer', transition: 'all 0.2s', fontWeight: '500' }}>
            <User size={18} /> Find Specialists
          </button>
          <div style={{ width: '1px', height: '24px', background: 'var(--surface-border)' }}></div>
          <button onClick={toggleTheme} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <Bell size={20} />
          </button>
          <button className="btn-primary" onClick={exportPDF} style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem', borderRadius: 'var(--radius-full)' }}>
            <Download size={16} /> Export PDF
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="main-content">
        
        {/* Top Header Label */}
        <header style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: '1.75rem', margin: '0 0 0.5rem 0' }}>Health Overview</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.95rem' }}>Your AI-generated analysis based on the latest report.</p>
        </header>


        {/* Patient Info Banner */}
        <div className="glass-panel patient-info-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ width: '50px', height: '50px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <User size={24} color="var(--text-primary)" />
            </div>
            <div>
              <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem' }}>{reportData.patientName}</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>{reportData.age} Yrs • {reportData.gender} • ID: {patientId}</p>
            </div>
          </div>
          
          <div className="patient-info-details">
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
          <div className="dashboard-grid">
            
            {/* Top KPI row - spanning across */}
            <div className="glass-panel grid-col-4" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
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

            <div id="health-tracker" className="glass-panel grid-col-8" style={{ padding: '1.5rem' }}>
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
            <div className="glass-panel grid-col-7" style={{ padding: '1.5rem' }}>
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

            <div className="glass-panel grid-col-5" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
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
            <div className="glass-panel grid-col-8" style={{ padding: '1.5rem' }}>
               <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.1rem' }}>Treatment Plan & Recommendations</h3>
               
               <div className="treatments-grid">
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

            <div className="glass-panel grid-col-4" style={{ padding: '1.5rem' }}>
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
              {chatMessages.map((msg, i) => (
                <div key={i} style={{ 
                  background: msg.role === 'user' ? 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)' : 'rgba(255,255,255,0.05)', 
                  color: msg.role === 'user' ? '#fff' : 'var(--text-primary)',
                  padding: '1rem', 
                  borderRadius: msg.role === 'user' ? 'var(--radius-md) var(--radius-md) 0 var(--radius-md)' : 'var(--radius-md) var(--radius-md) var(--radius-md) 0', 
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', 
                  maxWidth: '85%' 
                }}>
                  <p style={{ fontSize: '0.9rem', margin: 0, lineHeight: 1.5 }}>{msg.text}</p>
                </div>
              ))}
              {isChatLoading && (
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: 'var(--radius-md)', alignSelf: 'flex-start', display: 'flex', gap: '0.5rem' }}>
                   <div style={{ width: '8px', height: '8px', background: 'var(--text-muted)', borderRadius: '50%', animation: 'pulse 1s infinite' }}></div>
                   <div style={{ width: '8px', height: '8px', background: 'var(--text-muted)', borderRadius: '50%', animation: 'pulse 1s infinite 0.2s' }}></div>
                   <div style={{ width: '8px', height: '8px', background: 'var(--text-muted)', borderRadius: '50%', animation: 'pulse 1s infinite 0.4s' }}></div>
                </div>
              )}
            </div>

            <div style={{ padding: '1rem', borderTop: '1px solid var(--surface-border)', display: 'flex', gap: '0.75rem', background: 'rgba(0,0,0,0.2)' }}>
              <input 
                type="text" 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask about your report..." 
                style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--surface-border)', color: 'var(--text-primary)', borderRadius: 'var(--radius-full)', padding: '0.75rem 1.25rem', outline: 'none', fontSize: '0.9rem' }}
              />
              <button className="btn-primary" onClick={handleSendMessage} disabled={isChatLoading} style={{ width: '42px', height: '42px', borderRadius: '50%', padding: 0, opacity: isChatLoading ? 0.6 : 1 }}>
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

      {/* Hidden Doctor-Friendly Report Template — rendered off-screen for PDF export */}
      <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
        <div id="doctor-friendly-report" style={{ width: '794px', background: '#ffffff', color: '#1a1a2e', padding: '48px 52px', fontFamily: "'Segoe UI', Arial, sans-serif", boxSizing: 'border-box', fontSize: '13px', lineHeight: '1.6' }}>

          {/* ── LETTERHEAD ── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid #0d47a1', paddingBottom: '18px', marginBottom: '24px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <div style={{ width: '42px', height: '42px', background: 'linear-gradient(135deg, #0d47a1 0%, #1976d2 100%)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M12 5 9.04 9.2a3.13 3.13 0 0 0 0 3.82l2.35 2.16"/></svg>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <h1 style={{ margin: 0, fontSize: '26px', fontWeight: '800', color: '#0d47a1', letterSpacing: '-0.5px', lineHeight: '1.1' }}>MedIntel<span style={{ color: '#1976d2' }}>.AI</span></h1>
                  <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: '#555', fontWeight: '600', marginTop: '2px' }}>Clinical Intelligence</span>
                </div>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#555', fontStyle: 'italic' }}>AI-Powered Health Intelligence Platform — Confidential Medical Summary</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: '12px', color: '#333', fontWeight: '600' }}>Report ID: {patientId}</p>
              <p style={{ margin: '3px 0 0 0', fontSize: '11px', color: '#777' }}>Generated: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
              <p style={{ margin: '3px 0 0 0', fontSize: '11px', color: '#777' }}>Report Date: {reportData.reportDate || 'N/A'}</p>
            </div>
          </div>

          {/* ── PATIENT INFORMATION ── */}
          <div style={{ background: '#f0f4ff', border: '1px solid #c5cfe8', borderRadius: '8px', padding: '16px 20px', marginBottom: '24px' }}>
            <h2 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: '700', color: '#0d47a1', textTransform: 'uppercase', letterSpacing: '1px' }}>Patient Information</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '4px 0', width: '25%', color: '#555' }}>Full Name</td>
                  <td style={{ padding: '4px 12px', fontWeight: '700', color: '#111', width: '25%' }}>{reportData.patientName}</td>
                  <td style={{ padding: '4px 0', width: '25%', color: '#555' }}>Age / Gender</td>
                  <td style={{ padding: '4px 0', fontWeight: '700', color: '#111' }}>{reportData.age} Yrs &nbsp;|&nbsp; {reportData.gender}</td>
                </tr>
                <tr>
                  <td style={{ padding: '4px 0', color: '#555' }}>Referring Doctor</td>
                  <td style={{ padding: '4px 12px', fontWeight: '600', color: '#111' }}>{reportData.referredDoctor || 'N/A'}</td>
                  <td style={{ padding: '4px 0', color: '#555' }}>Health Score</td>
                  <td style={{ padding: '4px 0' }}>
                    <span style={{ background: reportData.healthScore >= 75 ? '#e8f5e9' : reportData.healthScore >= 50 ? '#fff8e1' : '#ffebee', color: reportData.healthScore >= 75 ? '#2e7d32' : reportData.healthScore >= 50 ? '#f57f17' : '#c62828', fontWeight: '800', padding: '2px 10px', borderRadius: '20px', fontSize: '12px' }}>
                      {reportData.healthScore} / 100
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '4px 0', color: '#555' }}>Address</td>
                  <td colSpan={3} style={{ padding: '4px 12px', color: '#333' }}>{reportData.address || 'N/A'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ── LABORATORY VALUES ── */}
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: '700', color: '#0d47a1', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid #c5cfe8', paddingBottom: '6px' }}>
              Laboratory Investigation Results
            </h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
              <thead>
                <tr style={{ background: '#0d47a1', color: '#fff' }}>
                  <th style={{ padding: '9px 12px', textAlign: 'left', fontWeight: '600' }}>Parameter</th>
                  <th style={{ padding: '9px 12px', textAlign: 'center', fontWeight: '600' }}>Observed Value</th>
                  <th style={{ padding: '9px 12px', textAlign: 'center', fontWeight: '600' }}>Reference Range</th>
                  <th style={{ padding: '9px 12px', textAlign: 'center', fontWeight: '600' }}>Unit</th>
                  <th style={{ padding: '9px 12px', textAlign: 'center', fontWeight: '600' }}>Flag</th>
                </tr>
              </thead>
              <tbody>
                {reportData.medicalValues.map((val, idx) => {
                  const isAbnormal = val.status?.toLowerCase() !== 'normal';
                  const isHigh = val.status?.toLowerCase().includes('high');
                  const rowBg = idx % 2 === 0 ? '#fafafa' : '#fff';
                  const flagColor = isHigh ? '#c62828' : isAbnormal ? '#e65100' : '#2e7d32';
                  const flagBg = isHigh ? '#ffebee' : isAbnormal ? '#fff3e0' : '#e8f5e9';
                  return (
                    <tr key={idx} style={{ background: rowBg, borderLeft: isAbnormal ? `3px solid ${flagColor}` : '3px solid transparent' }}>
                      <td style={{ padding: '9px 12px', fontWeight: isAbnormal ? '600' : '400', color: '#111' }}>{val.name}</td>
                      <td style={{ padding: '9px 12px', textAlign: 'center', fontWeight: '700', color: isAbnormal ? flagColor : '#111' }}>{val.value}</td>
                      <td style={{ padding: '9px 12px', textAlign: 'center', color: '#555' }}>{val.normal}</td>
                      <td style={{ padding: '9px 12px', textAlign: 'center', color: '#888' }}>{val.unit}</td>
                      <td style={{ padding: '9px 12px', textAlign: 'center' }}>
                        <span style={{ background: flagBg, color: flagColor, fontWeight: '700', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>
                          {val.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p style={{ margin: '6px 0 0 0', fontSize: '10.5px', color: '#888', fontStyle: 'italic' }}>
              ▲ = Above normal range &nbsp;|&nbsp; ▼ = Below normal range &nbsp;|&nbsp; Abnormal rows are highlighted and flagged
            </p>
          </div>

          {/* ── AI CLINICAL ANALYSIS ── */}
          <div style={{ marginBottom: '24px', background: '#fff8e1', border: '1px solid #ffe082', borderRadius: '8px', padding: '16px 20px' }}>
            <h2 style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: '700', color: '#e65100', textTransform: 'uppercase', letterSpacing: '1px' }}>
              ⚕ AI Clinical Analysis &amp; Risk Assessment
            </h2>
            <p style={{ margin: '0 0 12px 0', fontSize: '13px', lineHeight: '1.75', color: '#333' }}>
              {reportData.riskPrediction}
            </p>
            <div style={{ background: '#fff', border: '1px solid #ffcc80', borderRadius: '6px', padding: '10px 14px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '18px' }}>⏱</span>
              <div>
                <p style={{ margin: 0, fontWeight: '700', color: '#bf360c', fontSize: '12px' }}>Estimated Recovery Timeline</p>
                <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#444' }}>{reportData.recoveryEstimate}</p>
              </div>
            </div>
          </div>

          {/* ── TREATMENT PLAN ── */}
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ margin: '0 0 14px 0', fontSize: '13px', fontWeight: '700', color: '#0d47a1', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid #c5cfe8', paddingBottom: '6px' }}>
              Treatment Plan &amp; Recommendations
            </h2>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ flex: 1, background: '#e8f5e9', border: '1px solid #a5d6a7', borderRadius: '8px', padding: '14px 16px' }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#2e7d32', fontWeight: '700' }}>🌿 Natural &amp; Lifestyle Remedies</h3>
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12.5px', lineHeight: '1.8', color: '#333' }}>
                  {reportData.naturalTreatments?.map((t, i) => <li key={i}>{t}</li>)}
                </ul>
              </div>
              <div style={{ flex: 1, background: '#e3f2fd', border: '1px solid #90caf9', borderRadius: '8px', padding: '14px 16px' }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#0d47a1', fontWeight: '700' }}>💊 Medical Treatment</h3>
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12.5px', lineHeight: '1.8', color: '#333' }}>
                  {reportData.medicalTreatments?.map((t, i) => <li key={i}>{t}</li>)}
                </ul>
              </div>
            </div>
          </div>

          {/* ── EXERCISE PLAN ── */}
          {reportData.exerciseReminders?.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: '700', color: '#0d47a1', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid #c5cfe8', paddingBottom: '6px' }}>
                Physical Activity Plan
              </h2>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                <thead>
                  <tr style={{ background: '#f5f5f5' }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left', color: '#555', fontWeight: '600' }}>Activity</th>
                    <th style={{ padding: '8px 12px', textAlign: 'center', color: '#555', fontWeight: '600' }}>Time</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', color: '#555', fontWeight: '600' }}>Clinical Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.exerciseReminders.map((ex, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '8px 12px', fontWeight: '600' }}>🏃 {ex.title}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'center', color: '#0d47a1' }}>{ex.time}</td>
                      <td style={{ padding: '8px 12px', color: '#444' }}>{ex.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── FOOTER / SIGNATURE ── */}
          <div style={{ borderTop: '2px solid #0d47a1', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <p style={{ margin: 0, fontSize: '10.5px', color: '#888', fontStyle: 'italic', maxWidth: '420px', lineHeight: '1.5' }}>
                ⚠ Disclaimer: This report is AI-generated by MedIntel AI for informational purposes. It does not constitute a medical diagnosis or prescription. Please consult a licensed physician before making any clinical decisions.
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ borderTop: '1px solid #333', width: '160px', marginBottom: '4px' }} />
              <p style={{ margin: 0, fontSize: '11px', fontWeight: '700', color: '#333' }}>Authorised by MedIntel AI</p>
              <p style={{ margin: '2px 0 0 0', fontSize: '10px', color: '#888' }}>Powered by Google Gemini</p>
            </div>
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
