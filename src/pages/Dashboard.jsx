import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, MessageSquare, Activity, Droplet, Heart, HeartPulse, 
  ShieldAlert, Cpu, User, TrendingUp, TrendingDown, Leaf, Pill, Clock, 
  LayoutDashboard, FileText, Settings, Bell, Search, Activity as ActivityIcon, 
  MapPin, Star, Calendar, Phone, Sun, Moon, UploadCloud, CheckCircle, X, ShieldCheck 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import html2pdf from 'html2pdf.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { useTheme } from '../context/ThemeContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  
  // Load current user and their reports
  const [currentUser, setCurrentUser] = useState(() => {
    const userStr = localStorage.getItem('medintel_current_user');
    return userStr ? JSON.parse(userStr) : null;
  });

  // Safe redirect if not logged in (fallback in case Route Guard is bypassed)
  useEffect(() => {
    if (!currentUser) {
      navigate('/');
      return;
    }

    if (sessionStorage.getItem('medintel_open_upload_popup') === '1') {
      setIsInputModalOpen(true);
      setInputOption('select');
      sessionStorage.removeItem('medintel_open_upload_popup');
    }
  }, [currentUser, navigate]);

  const allReports = currentUser?.reports || [];
  const [selectedReportIndex, setSelectedReportIndex] = useState(0);
  
  // Safe extraction of report data
  const reportData = allReports.length > 0 ? allReports[selectedReportIndex] : null;

  // Modals / Popup controls
  const [isInputModalOpen, setIsInputModalOpen] = useState(false);
  const [inputOption, setInputOption] = useState('select'); // 'select' | 'upload' | 'manual'


  // Manual Health Entry inputs
  const [manualAge, setManualAge] = useState('');
  const [manualGender, setManualGender] = useState('Male');
  const [manualAddress, setManualAddress] = useState('');
  const [manualDoctor, setManualDoctor] = useState('');
  const [manualBloodSugar, setManualBloodSugar] = useState('');
  const [manualHemoglobin, setManualHemoglobin] = useState('');
  const [manualWBC, setManualWBC] = useState('');

  // Upload zones
  const [isHovering, setIsHovering] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [chatOpen, setChatOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Precautions check state
  const [checkedPrecautions, setCheckedPrecautions] = useState(() => {
    if (!currentUser) return {};
    const saved = localStorage.getItem(`medintel_checked_precautions_${currentUser.email}`);
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(`medintel_checked_precautions_${currentUser.email}`, JSON.stringify(checkedPrecautions));
    }
  }, [checkedPrecautions, currentUser]);

  const patientInitial = (currentUser?.name || 'P').slice(0, 1).toUpperCase();

  const handleLogout = () => {
    localStorage.removeItem('medintel_current_user');
    navigate('/');
  };

  // Generate ID once to satisfy purity rules
  const [patientId] = useState(() => `MED-${Math.floor(Math.random() * 10000)}X`);

  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', text: `Hello! I am MedIntel AI. I've analyzed your report. What would you like to know about your results?` }
  ]);

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isChatLoading) return;
    if (!reportData) {
      setChatMessages(prev => [...prev, { role: 'assistant', text: "Please complete your health profile first so I can analyze your metrics." }]);
      return;
    }
    
    const userMsg = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsChatLoading(true);

    try {
      const apiKey = localStorage.getItem('gemini_api_key');
      if (!apiKey) {
        setChatMessages(prev => [...prev, { role: 'assistant', text: 'Error: Gemini API Key not found. Please log in and enter your key.' }]);
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
          console.warn(`Model ${mName} failed:`, e.message);
        }
      }

      if (!responseText) {
        throw new Error(`All fallback AI models failed. Last error: ${lastError?.message || 'Unknown'}`);
      }

      setChatMessages(prev => [...prev, { role: 'assistant', text: responseText }]);
    } catch (error) {
      console.error(error);
      setChatMessages(prev => [...prev, { role: 'assistant', text: `Sorry! The AI server is overloaded right now. Please wait 30 seconds and try again.` }]);
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
    if (!reportData) return;
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

  // Helper to save report in local user context and global users list
  const saveReport = (report) => {
    const updatedReports = [...(currentUser.reports || []), report];
    const updatedUser = { ...currentUser, reports: updatedReports };
    
    // Update local react state & localStorage
    setCurrentUser(updatedUser);
    localStorage.setItem('medintel_current_user', JSON.stringify(updatedUser));

    // Update global list
    const users = JSON.parse(localStorage.getItem('medintel_users') || '[]');
    const updatedUsers = users.map(u => {
      if (u.email.toLowerCase() === currentUser.email.toLowerCase()) {
        return { ...u, reports: updatedReports };
      }
      return u;
    });
    localStorage.setItem('medintel_users', JSON.stringify(updatedUsers));
    
    setSelectedReportIndex(updatedReports.length - 1);
  };

  // File Upload Handlers (inside popup modal)
  const handleDrop = (e) => {
    e.preventDefault();
    setIsHovering(false);
    if (e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsHovering(true);
  };

  const handleDragLeave = () => {
    setIsHovering(false);
  };

  const handleFileSelect = (e) => {
    if (e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
    }
  };

  const processFiles = async (files) => {
    setErrorMsg('');
    setSuccessMsg('');
    const apiKey = localStorage.getItem('gemini_api_key');
    if (!apiKey) {
      setErrorMsg("Please enter your Google Gemini API Key first.");
      return;
    }

    setUploading(true);

    try {
      const PROMPT = `You are an expert medical AI. Analyze this health report and extract all relevant data.
First, check if the provided document is a genuine medical diagnostic laboratory report or medical record. If the document is NOT a medical report (e.g. it is an arbitrary image, a document containing non-medical text, a recipe, a chat log, or obviously fabricated nonsense), set "isGenuineReport" to false and set "fakeReportWarning" to a warning explaining why the report was rejected. Otherwise, set "isGenuineReport" to true and "fakeReportWarning" to "".

Return ONLY valid JSON (no markdown, no backticks, no extra text) matching this EXACT structure:
{
  "isGenuineReport": boolean,
  "fakeReportWarning": "string (warning message if fake, otherwise empty string)",
  "patientName": "string (patient full name or 'Unknown Patient')",
  "age": "string (age as number or 'N/A')",
  "gender": "string (Male/Female/Other or 'N/A')",
  "address": "string (patient address or 'N/A')",
  "referredDoctor": "string (doctor name or 'N/A')",
  "healthScore": number (0-100, estimate based on values),
  "reportDate": "string (date of report or today's date)",
  "medicalValues": [
    {
      "name": "string (test name)",
      "value": "string (measured value)",
      "unit": "string (unit of measurement)",
      "normal": "string (normal range)",
      "status": "string (Normal, High, Low, Slightly High, or Slightly Low)"
    }
  ],
  "riskPrediction": "string (2-4 sentences explaining health risks and findings)",
  "recoveryEstimate": "string (estimated recovery or maintenance timeline)",
  "naturalTreatments": ["string", "string", "string"],
  "medicalTreatments": ["string", "string"],
  "patientPrecautions": [
    {
      "text": "string (personalized precaution based on the report)",
      "category": "string (General, Dietary, Monitoring, Safety, or Lifestyle)"
    }
  ],
  "exerciseReminders": [
    {
      "title": "string (exercise name)",
      "time": "string (e.g. '07:00 AM')",
      "reason": "string (brief reason)"
    }
  ]
}
If any field is not in the report, use a sensible default. Always return valid parseable JSON.`;

      const fileToBase64 = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
      });

      const analyzeFile = async (file) => {
        const base64Data = await fileToBase64(file);
        const base64Only = base64Data.split(',')[1];
        const mimeType = file.type || 'application/pdf';

        const modelNames = ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-2.0-flash-lite"];
        let lastError = null;

        for (const mName of modelNames) {
          try {
            console.log(`Attempting analysis via ${mName}...`);
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: mName });

            const result = await model.generateContent([
              PROMPT,
              { inlineData: { data: base64Only, mimeType } }
            ]);

            if (!result?.response) throw new Error("No response from model");
            let responseText = result.response.text().trim();

            responseText = responseText.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
            const startIdx = responseText.indexOf('{');
            const endIdx = responseText.lastIndexOf('}') + 1;

            if (startIdx === -1 || endIdx === 0) throw new Error("AI did not return valid JSON structure.");

            return JSON.parse(responseText.substring(startIdx, endIdx));
          } catch (e) {
            lastError = e;
            console.warn(`${mName} failed:`, e.message);
          }
        }
        throw new Error(`All models failed: ${lastError?.message || 'Unknown error'}`);
      };

      const finalReports = await Promise.all(files.map(analyzeFile));

      // Validate authenticity
      const fakeReport = finalReports.find(r => r.isGenuineReport === false);
      if (fakeReport) {
        setErrorMsg(fakeReport.fakeReportWarning || "Warning: This file does not appear to be an authentic medical report. Please upload a genuine lab report.");
        setUploading(false);
        return;
      }

      finalReports.forEach(saveReport);
      setSuccessMsg('Analysis complete! Dashboard updated.');
      setTimeout(() => {
        setIsInputModalOpen(false);
        setUploading(false);
      }, 1200);

    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Failed to process the file. Please ensure your API Key is valid.");
      setUploading(false);
    }
  };

  // Manual Input Submit Handler
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!manualAge || !manualBloodSugar || !manualHemoglobin || !manualWBC) {
      setErrorMsg('Please enter all requested medical values.');
      return;
    }

    setUploading(true);
    const apiKey = localStorage.getItem('gemini_api_key');
    if (!apiKey) {
      setErrorMsg("Please enter your Google Gemini API Key first.");
      setUploading(false);
      return;
    }

    try {
      const PROMPT = `You are an expert medical AI. The patient has entered their health details manually.
Patient Details:
- Name: ${currentUser.name}
- Age: ${manualAge}
- Gender: ${manualGender}
- Address: ${manualAddress || 'N/A'}
- Referred Doctor: ${manualDoctor || 'Self Referred'}

Manual Medical Values entered:
- Blood Sugar: ${manualBloodSugar} mg/dL
- Hemoglobin: ${manualHemoglobin} g/dL
- WBC Count: ${manualWBC} cumm

Analyze these values and generate a medical dashboard report.
Return ONLY valid JSON (no markdown, no backticks, no extra text) matching this EXACT structure:
{
  "isGenuineReport": true,
  "fakeReportWarning": "",
  "patientName": "${currentUser.name}",
  "age": "${manualAge}",
  "gender": "${manualGender}",
  "address": "${manualAddress || 'N/A'}",
  "referredDoctor": "${manualDoctor || 'Self Referred'}",
  "healthScore": number (0-100, estimate based on the values. Normal ranges: Blood Sugar: 70-100 mg/dL, Hemoglobin: 13.8-17.2 g/dL for Male or 12.1-15.1 g/dL for Female, WBC Count: 4,000-10,000 cumm. Lower the score if values are significantly outside normal),
  "reportDate": "${new Date().toISOString().split('T')[0]}",
  "medicalValues": [
    {
      "name": "Blood Sugar",
      "value": "${manualBloodSugar}",
      "unit": "mg/dL",
      "normal": "70 - 100",
      "status": "string (Normal, High, Low, Slightly High, or Slightly Low based on the value)"
    },
    {
      "name": "Hemoglobin",
      "value": "${manualHemoglobin}",
      "unit": "g/dL",
      "normal": "${manualGender === 'Male' ? '13.8 - 17.2' : '12.1 - 15.1'}",
      "status": "string (Normal, High, Low, Slightly High, or Slightly Low based on the value)"
    },
    {
      "name": "WBC Count",
      "value": "${manualWBC}",
      "unit": "cumm",
      "normal": "4,000 - 10,000",
      "status": "string (Normal, High, Low, Slightly High, or Slightly Low based on the value)"
    }
  ],
  "riskPrediction": "string (2-4 sentences explaining health risks and findings from these metrics)",
  "recoveryEstimate": "string (estimated recovery or health maintenance timeline)",
  "naturalTreatments": ["string", "string", "string"],
  "medicalTreatments": ["string", "string"],
  "patientPrecautions": [
    {
      "text": "string (personalized precaution based on the report)",
      "category": "string (General, Dietary, Monitoring, Safety, or Lifestyle)"
    }
  ],
  "exerciseReminders": [
    {
      "title": "string (exercise name)",
      "time": "string (e.g. '07:00 AM')",
      "reason": "string (brief reason)"
    }
  ]
}
Always return valid parseable JSON.`;

      const genAI = new GoogleGenerativeAI(apiKey);
      const modelNames = ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-2.0-flash-lite"];
      let lastError = null;
      let responseText = "";

      for (const mName of modelNames) {
        try {
          console.log(`Analyzing manual metrics via ${mName}...`);
          const model = genAI.getGenerativeModel({ model: mName });
          const result = await model.generateContent(PROMPT);
          if (!result?.response) throw new Error("No response from model");
          responseText = result.response.text().trim();
          break;
        } catch (e) {
          lastError = e;
          console.warn(`Model ${mName} failed:`, e.message);
        }
      }

      if (!responseText) {
        throw new Error(`All models failed: ${lastError?.message || 'Unknown'}`);
      }

      responseText = responseText.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
      const startIdx = responseText.indexOf('{');
      const endIdx = responseText.lastIndexOf('}') + 1;

      if (startIdx === -1 || endIdx === 0) throw new Error("AI did not return valid JSON structure.");
      const parsedReport = JSON.parse(responseText.substring(startIdx, endIdx));

      saveReport(parsedReport);
      setSuccessMsg('Analysis complete! Dashboard updated.');
      
      setTimeout(() => {
        setIsInputModalOpen(false);
        setUploading(false);
        // Reset manual fields
        setManualAge('');
        setManualAddress('');
        setManualDoctor('');
        setManualBloodSugar('');
        setManualHemoglobin('');
        setManualWBC('');
      }, 1200);

    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Failed to analyze data. Please verify your Gemini API key.");
      setUploading(false);
    }
  };

  const getDynamicPrecautions = () => {
    if (!reportData) return [];

    const aiPrecautions = Array.isArray(reportData.patientPrecautions)
      ? reportData.patientPrecautions.filter(item => item?.text).map((item, index) => ({
          id: `ai-${index}-${item.text.slice(0, 18).replace(/\s+/g, '-').toLowerCase()}`,
          text: item.text,
          category: item.category || 'General'
        }))
      : [];

    if (aiPrecautions.length > 0) {
      return aiPrecautions;
    }

    const list = [
      { id: 'gen-1', text: 'Follow up with your physician regarding these AI-evaluated findings.', category: 'General' },
      { id: 'gen-2', text: 'Keep a daily log of physical symptoms and energy levels.', category: 'General' },
    ];

    const riskText = `${reportData.riskPrediction || ''} ${reportData.healthScore || ''}`.toLowerCase();
    const sugar = reportData.medicalValues?.find(v => v.name.toLowerCase().includes('sugar') || v.name.toLowerCase().includes('glucose'));
    if (sugar) {
      const sugarStatus = sugar.status?.toLowerCase() || '';
      if (sugarStatus.includes('high')) {
        list.push(
          { id: 'sugar-1', text: 'Restrict intake of refined sugars, carbs, and processed desserts.', category: 'Dietary' },
          { id: 'sugar-2', text: 'Check glucose after meals and record the values consistently.', category: 'Monitoring' },
          { id: 'sugar-3', text: 'Take a short walk or light activity after meals if your doctor allows it.', category: 'Lifestyle' }
        );
      } else if (sugarStatus.includes('low')) {
        list.push(
          { id: 'sugar-4', text: 'Eat small, balanced meals every 3-4 hours to stabilize glucose.', category: 'Dietary' },
          { id: 'sugar-5', text: 'Avoid strenuous exercises on an empty stomach.', category: 'Safety' }
        );
      }
    }

    const hemo = reportData.medicalValues?.find(v => v.name.toLowerCase().includes('hemoglobin') || v.name.toLowerCase().includes('iron'));
    if (hemo && (hemo.status || '').toLowerCase().includes('low')) {
      list.push(
        { id: 'hemo-1', text: 'Increase foods rich in iron such as spinach, beetroot, apples, and seeds.', category: 'Dietary' },
        { id: 'hemo-2', text: 'Take vitamin C with meals to support iron absorption.', category: 'Dietary' },
        { id: 'hemo-3', text: 'Stand up slowly from seated positions to reduce dizziness.', category: 'Safety' }
      );
    }

    const wbc = reportData.medicalValues?.find(v => v.name.toLowerCase().includes('wbc') || v.name.toLowerCase().includes('white'));
    if (wbc && (wbc.status || '').toLowerCase().includes('high')) {
      list.push(
        { id: 'wbc-1', text: 'Wash hands thoroughly before meals and after visiting public spaces.', category: 'Safety' },
        { id: 'wbc-2', text: 'Avoid sharing personal utensils or cups to reduce infection spread.', category: 'Safety' },
        { id: 'wbc-3', text: 'Prioritize 7-8 hours of sleep to support immune regulation.', category: 'Lifestyle' }
      );
    }

    if (riskText.includes('high risk') || riskText.includes('elevated') || (reportData.healthScore || 0) < 60) {
      list.push({ id: 'risk-1', text: 'Schedule a doctor review soon so the AI findings can be confirmed clinically.', category: 'General' });
    }

    if (riskText.includes('dehydr') || riskText.includes('fatigue')) {
      list.push({ id: 'risk-2', text: 'Maintain regular hydration and track fatigue or weakness throughout the day.', category: 'Lifestyle' });
    }

    return list;
  };

  const precautions = getDynamicPrecautions();
  const checkedCount = precautions.filter(p => checkedPrecautions[p.id]).length;
  const progressPercent = precautions.length > 0 ? Math.round((checkedCount / precautions.length) * 100) : 0;

  const togglePrecaution = (id) => {
    setCheckedPrecautions(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Render the empty state dashboard
  const renderEmptyState = () => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '65vh', textAlign: 'center', padding: '2rem' }}>
      <div className="glass-panel animate-fade-in" style={{ maxWidth: '500px', width: '100%', padding: '3.5rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)' }}>
        <div style={{ background: 'rgba(0, 210, 255, 0.1)', padding: '1.5rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <HeartPulse size={48} color="var(--primary)" />
        </div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: '700' }}>Complete Your Health Profile</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', margin: '0 0 1rem 0' }}>
          Welcome, <strong>{currentUser?.name}</strong>! To enable AI analytics, please upload a lab report or enter your metrics manually.
        </p>
        <button 
          onClick={() => { setInputOption('select'); setIsInputModalOpen(true); }} 
          className="btn-primary" 
          style={{ padding: '0.85rem 2rem', fontSize: '1rem', width: '100%' }}
        >
          Add Health Details
        </button>
      </div>
    </div>
  );

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
        </div>

        {/* Right Actions */}
        <div className="nav-actions" style={{ flexWrap: 'wrap' }}>
          {reportData && (
            <button className="nav-btn" onClick={() => { setInputOption('select'); setIsInputModalOpen(true); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem', borderRadius: 'var(--radius-full)', background: 'transparent', color: 'var(--text-secondary)', border: 'none', cursor: 'pointer', transition: 'all 0.2s', fontWeight: '500' }}>
              <UploadCloud size={18} /> Upload Another Report
            </button>
          )}
          <button className="nav-btn" onClick={() => navigate('/consultant', { state: { reports: allReports, selectedIndex: selectedReportIndex } })} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem', borderRadius: 'var(--radius-full)', background: 'transparent', color: 'var(--text-secondary)', border: 'none', cursor: 'pointer', transition: 'all 0.2s', fontWeight: '500' }}>
            <User size={18} /> Specialists
          </button>
          <div style={{ width: '1px', height: '24px', background: 'var(--surface-border)' }}></div>
          <button onClick={toggleTheme} className="dashboard-theme-button" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          {currentUser && (
            <div className="dashboard-profile-pill">
              <div className="dashboard-avatar">{patientInitial}</div>
              <div className="dashboard-profile-copy">
                <strong>{currentUser.name || 'Patient'}</strong>
                <span>{currentUser.email}</span>
              </div>
            </div>
          )}
          <button className="nav-btn" onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem', borderRadius: 'var(--radius-full)', background: 'rgba(231, 76, 60, 0.1)', color: 'var(--danger)', border: 'none', cursor: 'pointer', transition: 'all 0.2s', fontWeight: '600' }}>
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="main-content">
        
        {/* Top Header Label */}
        <header style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: '1.75rem', margin: '0 0 0.5rem 0' }}>Patient Portal</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.95rem' }}>
            {reportData ? 'Your AI-generated clinical diagnosis and health metrics.' : 'Get started by completing your medical profile details.'}
          </p>
        </header>

        {reportData ? (
          <>
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
                  <p style={{ margin: '0.25rem 0 0 0', fontWeight: '500', fontSize: '0.95rem' }}>{reportData.reportDate || 'Today'}</p>
                </div>
              </div>
            </div>

            {/* Dashboard Grid Container */}
            {activeTab === 'overview' ? (
              <div className="dashboard-grid">
                
                {/* Top KPI row - health score */}
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

                {/* Health tracker progress */}
                <div id="health-tracker" className="glass-panel grid-col-8" style={{ padding: '1.5rem' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h4 style={{ margin: 0, color: 'var(--text-primary)', fontWeight: '500' }}>Health Progress Tracker</h4>
                      <span className="badge success" style={{ fontSize: '0.75rem' }}><TrendingUp size={14} /> Tracking Trend</span>
                   </div>
                   <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Evolution of your cumulative health score across your uploaded or manual entries.</p>
                   
                   {/* Mini Chart Mockup */}
                   <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2rem', height: '80px', borderBottom: '1px solid var(--surface-border)', paddingBottom: '0.5rem' }}>
                      {allReports.slice(-5).map((r, i) => (
                        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: '0.5rem' }}>
                          <div style={{ width: '40px', height: `${r.healthScore}%`, background: i === selectedReportIndex ? 'var(--primary)' : 'rgba(255,255,255,0.05)', borderRadius: '4px 4px 0 0', cursor: 'pointer', boxShadow: i === selectedReportIndex ? '0 0 15px rgba(0,210,255,0.2)' : 'none' }} onClick={() => setSelectedReportIndex(allReports.indexOf(r))}></div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.reportDate?.split('-').slice(1).join('/') || `R${i+1}`}</span>
                        </div>
                      ))}
                   </div>
                </div>

                {/* Detected medical values */}
                <div className="glass-panel grid-col-7" style={{ padding: '1.5rem' }}>
                  <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Activity size={18} color="var(--primary)" /> Detected Medical Values
                  </h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {reportData.medicalValues?.map((item, idx) => (
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

                {/* AI Risk assessment */}
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

                {/* Treatments and lifestyle */}
                <div className="glass-panel grid-col-8" style={{ padding: '1.5rem' }}>
                   <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.1rem' }}>Treatment Plan & Recommendations</h3>
                   
                   <div className="treatments-grid">
                      <div style={{ background: 'rgba(46, 204, 113, 0.05)', border: '1px solid rgba(46, 204, 113, 0.1)', padding: '1.25rem', borderRadius: 'var(--radius-sm)' }}>
                        <h4 style={{ color: 'var(--success)', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Leaf size={16} /> Natural Treatment</h4>
                        <ul style={{ margin: 0, paddingLeft: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {reportData.naturalTreatments?.map((t, idx) => <li key={idx}>{t}</li>)}
                        </ul>
                      </div>
                      <div style={{ background: 'rgba(0, 210, 255, 0.05)', border: '1px solid rgba(0, 210, 255, 0.1)', padding: '1.25rem', borderRadius: 'var(--radius-sm)' }}>
                        <h4 style={{ color: 'var(--primary)', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Pill size={16} /> Medical Treatment</h4>
                        <ul style={{ margin: 0, paddingLeft: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {reportData.medicalTreatments?.map((t, idx) => <li key={idx}>{t}</li>)}
                        </ul>
                        <p style={{ margin: '1rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>*Consult a certified doctor before medicating.</p>
                      </div>
                   </div>
                </div>

                {/* Exercises reminders */}
                <div className="glass-panel grid-col-4" style={{ padding: '1.5rem' }}>
                  <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Clock size={18} color="var(--primary)" /> Exercise Reminders
                  </h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {reportData.exerciseReminders?.map((ex, idx) => (
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

                {/* ── MY PRECAUTIONS — inline panel (full width) ── */}
                {precautions.length > 0 && (
                  <div className="glass-panel grid-col-12" style={{ padding: '1.75rem' }}>
                    {/* Header row */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <CheckCircle size={18} color="var(--success)" /> My Patient Precautions
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Completion</span>
                        <span style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--primary)' }}>{progressPercent}% ({checkedCount}/{precautions.length})</span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div style={{ height: '7px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden', marginBottom: '1.5rem' }}>
                      <div style={{ width: `${progressPercent}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary) 0%, var(--success) 100%)', borderRadius: '4px', transition: 'width 0.4s ease' }} />
                    </div>

                    <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: '1.5' }}>
                      Precautions tailored to your observed metrics — check off each step daily to track your safety routine.
                    </p>

                    {/* Checklist grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
                      {precautions.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => togglePrecaution(p.id)}
                          style={{
                            padding: '0.9rem 1rem',
                            background: checkedPrecautions[p.id] ? 'rgba(46,204,113,0.05)' : 'rgba(255,255,255,0.02)',
                            border: checkedPrecautions[p.id] ? '1px solid rgba(46,204,113,0.2)' : '1px solid var(--surface-border)',
                            borderRadius: 'var(--radius-sm)',
                            display: 'flex',
                            gap: '0.75rem',
                            alignItems: 'flex-start',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={!!checkedPrecautions[p.id]}
                            onChange={() => {}}
                            style={{ marginTop: '0.2rem', cursor: 'pointer', accentColor: 'var(--success)', width: '15px', height: '15px', flexShrink: 0 }}
                          />
                          <div style={{ flex: 1 }}>
                            <span style={{
                              fontSize: '0.88rem',
                              color: checkedPrecautions[p.id] ? 'var(--text-muted)' : 'var(--text-primary)',
                              textDecoration: checkedPrecautions[p.id] ? 'line-through' : 'none',
                              lineHeight: '1.45'
                            }}>
                              {p.text}
                            </span>
                            <div style={{ marginTop: '0.35rem' }}>
                              <span style={{ fontSize: '0.68rem', padding: '0.1rem 0.45rem', borderRadius: '4px', background: p.category === 'Dietary' ? 'rgba(243,156,18,0.1)' : (p.category === 'Safety' ? 'rgba(231,76,60,0.1)' : 'rgba(0,210,255,0.1)'), color: p.category === 'Dietary' ? 'var(--warning)' : (p.category === 'Safety' ? 'var(--danger)' : 'var(--primary)') }}>
                                {p.category}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
                        {report.medicalValues?.map((val, vidx) => (
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
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>{report.riskPrediction?.substring(0, 100)}...</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          /* Empty state view */
          renderEmptyState()
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

      {/* POPUP MODAL: Upload Choice (Manual or File) */}
      {isInputModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1.5rem' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', position: 'relative', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
            
            <button 
              onClick={() => {
                if (!uploading) setIsInputModalOpen(false);
              }} 
              style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            {inputOption === 'select' && (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <h3 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>Add Health Information</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>How would you like to provide your medical values?</p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <button 
                    onClick={() => setInputOption('upload')} 
                    className="btn-secondary" 
                    style={{ width: '100%', padding: '1.25rem', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}
                  >
                    <UploadCloud size={32} color="var(--primary)" />
                    <span style={{ fontWeight: '600' }}>Extract from Medical Report</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Upload PDF or image to extract metrics via AI</span>
                  </button>

                  <button 
                    onClick={() => setInputOption('manual')} 
                    className="btn-secondary" 
                    style={{ width: '100%', padding: '1.25rem', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}
                  >
                    <FileText size={32} color="var(--success)" />
                    <span style={{ fontWeight: '600' }}>Enter Health Details Manually</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Type your test results directly in a form</span>
                  </button>
                </div>
              </div>
            )}

            {inputOption === 'upload' && (
              <div>
                <h3 style={{ fontSize: '1.3rem', marginBottom: '0.5rem' }}>Extract from Report</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Drop or browse your PDF / Image report below. The system checks report authenticity.</p>

                {errorMsg && (
                  <div style={{ padding: '0.75rem', background: 'rgba(231, 76, 60, 0.1)', borderLeft: '3px solid var(--danger)', color: 'var(--danger)', fontSize: '0.85rem', borderRadius: '4px', marginBottom: '1rem', fontWeight: '500' }}>
                    {errorMsg}
                  </div>
                )}

                {successMsg && (
                  <div style={{ padding: '0.75rem', background: 'rgba(46, 204, 113, 0.1)', borderLeft: '3px solid var(--success)', color: 'var(--success)', fontSize: '0.85rem', borderRadius: '4px', marginBottom: '1rem', fontWeight: '500' }}>
                    {successMsg}
                  </div>
                )}

                {uploading ? (
                  <div style={{ padding: '3rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--surface-border)', textAlign: 'center' }}>
                    <div className="loader-spin" style={{ position: 'relative', width: '64px', height: '64px' }}>
                      <div style={{ width: '64px', height: '64px', border: '3px solid rgba(255,255,255,0.1)', borderRadius: '50%' }}></div>
                      <div style={{ position: 'absolute', top: 0, left: 0, width: '64px', height: '64px', border: '3px solid transparent', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 0.25rem 0' }}>AI is Analyzing...</h4>
                      <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.8rem' }}>Reading documents and validating report authenticity</p>
                    </div>
                  </div>
                ) : (
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    style={{
                      padding: '3rem 1.5rem',
                      border: `2px dashed ${isHovering ? 'var(--primary)' : 'rgba(255,255,255,0.2)'}`,
                      background: isHovering ? 'rgba(0,210,255,0.05)' : 'rgba(255,255,255,0.02)',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center'
                    }}
                  >
                    <UploadCloud size={36} color={isHovering ? 'var(--primary)' : 'var(--text-muted)'} style={{ marginBottom: '1rem' }} />
                    <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem' }}>Drag & Drop report file</h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1.5rem' }}>Supports .pdf, .jpg, .png</p>
                    
                    <label className="btn-primary" style={{ cursor: 'pointer', fontSize: '0.85rem', padding: '0.5rem 1.25rem' }}>
                      Browse File
                      <input type="file" style={{ display: 'none' }} accept=".pdf,image/*" onChange={handleFileSelect} />
                    </label>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '1.5rem' }}>
                  <button onClick={() => { setErrorMsg(''); setSuccessMsg(''); setInputOption('select'); }} disabled={uploading} style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <ArrowLeft size={16} /> Choose different option
                  </button>
                </div>
              </div>
            )}

            {inputOption === 'manual' && (
              <div>
                <h3 style={{ fontSize: '1.3rem', marginBottom: '0.5rem' }}>Enter Health Details</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Provide your vital details and blood test parameters. AI will calculate your scores.</p>

                {errorMsg && (
                  <div style={{ padding: '0.75rem', background: 'rgba(231, 76, 60, 0.1)', borderLeft: '3px solid var(--danger)', color: 'var(--danger)', fontSize: '0.85rem', borderRadius: '4px', marginBottom: '1rem', fontWeight: '500' }}>
                    {errorMsg}
                  </div>
                )}

                {successMsg && (
                  <div style={{ padding: '0.75rem', background: 'rgba(46, 204, 113, 0.1)', borderLeft: '3px solid var(--success)', color: 'var(--success)', fontSize: '0.85rem', borderRadius: '4px', marginBottom: '1rem', fontWeight: '500' }}>
                    {successMsg}
                  </div>
                )}

                {uploading ? (
                  <div style={{ padding: '3.5rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--surface-border)', textAlign: 'center' }}>
                    <div style={{ position: 'relative', width: '64px', height: '64px' }}>
                      <div style={{ width: '64px', height: '64px', border: '3px solid rgba(255,255,255,0.1)', borderRadius: '50%' }}></div>
                      <div style={{ position: 'absolute', top: 0, left: 0, width: '64px', height: '64px', border: '3px solid transparent', borderTopColor: 'var(--success)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 0.25rem 0' }}>AI is Evaluating...</h4>
                      <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.8rem' }}>Generating health scores, risk predictions, and treatment recommendations</p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Age</label>
                        <input 
                          type="number" 
                          required
                          value={manualAge} 
                          onChange={(e) => setManualAge(e.target.value)} 
                          placeholder="e.g. 35" 
                          style={{ padding: '0.65rem 0.75rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--surface-border)', color: 'var(--text-primary)', borderRadius: 'var(--radius-sm)', outline: 'none' }}
                        />
                      </div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Gender</label>
                        <select 
                          value={manualGender} 
                          onChange={(e) => setManualGender(e.target.value)} 
                          style={{ padding: '0.65rem 0.75rem', background: theme === 'dark' ? '#151928' : '#fff', border: '1px solid var(--surface-border)', color: 'var(--text-primary)', borderRadius: 'var(--radius-sm)', outline: 'none', cursor: 'pointer' }}
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Patient Address</label>
                      <input 
                        type="text" 
                        value={manualAddress} 
                        onChange={(e) => setManualAddress(e.target.value)} 
                        placeholder="City, Sector, or Zip" 
                        style={{ padding: '0.65rem 0.75rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--surface-border)', color: 'var(--text-primary)', borderRadius: 'var(--radius-sm)', outline: 'none' }}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Referred Doctor</label>
                      <input 
                        type="text" 
                        value={manualDoctor} 
                        onChange={(e) => setManualDoctor(e.target.value)} 
                        placeholder="Referred Doctor name (Optional)" 
                        style={{ padding: '0.65rem 0.75rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--surface-border)', color: 'var(--text-primary)', borderRadius: 'var(--radius-sm)', outline: 'none' }}
                      />
                    </div>

                    <div style={{ borderTop: '1px solid var(--surface-border)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                      <h4 style={{ fontSize: '0.9rem', marginBottom: '0.75rem', color: 'var(--primary)' }}>Investigation Values</h4>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Blood Sugar (mg/dL)</span>
                          <input 
                            type="number" 
                            required
                            step="any"
                            value={manualBloodSugar}
                            onChange={(e) => setManualBloodSugar(e.target.value)}
                            placeholder="e.g. 95 (Normal: 70-100)" 
                            style={{ width: '180px', padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--surface-border)', color: 'var(--text-primary)', borderRadius: 'var(--radius-sm)', outline: 'none', textAlign: 'right' }}
                          />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Hemoglobin (g/dL)</span>
                          <input 
                            type="number" 
                            required
                            step="any"
                            value={manualHemoglobin}
                            onChange={(e) => setManualHemoglobin(e.target.value)}
                            placeholder="e.g. 14.2" 
                            style={{ width: '180px', padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--surface-border)', color: 'var(--text-primary)', borderRadius: 'var(--radius-sm)', outline: 'none', textAlign: 'right' }}
                          />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>WBC Count (cumm)</span>
                          <input 
                            type="number" 
                            required
                            value={manualWBC}
                            onChange={(e) => setManualWBC(e.target.value)}
                            placeholder="e.g. 7500 (Normal: 4K-10K)" 
                            style={{ width: '180px', padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--surface-border)', color: 'var(--text-primary)', borderRadius: 'var(--radius-sm)', outline: 'none', textAlign: 'right' }}
                          />
                        </div>
                      </div>
                    </div>

                    <button type="submit" className="btn-primary" style={{ width: '100%', padding: '0.8rem', marginTop: '1rem' }}>
                      Analyze Manual Values
                    </button>
                  </form>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '1.5rem' }}>
                  <button onClick={() => { setErrorMsg(''); setSuccessMsg(''); setInputOption('select'); }} disabled={uploading} style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <ArrowLeft size={16} /> Choose different option
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}


      {/* Hidden Doctor-Friendly Report Template — rendered off-screen for PDF export */}
      {reportData && (
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
                  {reportData.medicalValues?.map((val, idx) => {
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
      )}

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
        
        @keyframes spin { 
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); } 
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
