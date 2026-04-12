import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, Shield, Activity, ArrowRight, CheckCircle, FileText, Cpu, HeartPulse, Key, Sun, Moon } from 'lucide-react';

import { useTheme } from '../context/ThemeContext';

const LandingPage = () => {
  const [isHovering, setIsHovering] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [apiKey] = useState(import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('gemini_api_key') || '');
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

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
    if (!apiKey) {
      setErrorMsg("Please enter your Google Gemini API Key first.");
      return;
    }

    localStorage.setItem('gemini_api_key', apiKey);
    setErrorMsg('');
    setUploading(true);

    try {
      const PROMPT = `You are an expert medical AI. Analyze this health report and extract all relevant data.
Return ONLY valid JSON (no markdown, no backticks, no extra text) matching this EXACT structure:
{
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
            const { GoogleGenerativeAI } = await import('@google/generative-ai');
            const client = new GoogleGenerativeAI(apiKey);
            const model = client.getGenerativeModel({ model: mName });

            const result = await model.generateContent([
              PROMPT,
              { inlineData: { data: base64Only, mimeType } }
            ]);

            if (!result?.response) throw new Error("No response from model");
            let responseText = result.response.text().trim();

            // Strip markdown code fences if present
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

      setUploading(false);
      navigate('/dashboard', { state: { reports: finalReports } });

    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Failed to process the file. Please ensure your API Key is valid and the file is a clear PDF or image.");
      setUploading(false);
    }
  };



  return (
    <div className="landing-container">

      {/* Left Content Pane */}
      <div className="landing-left">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.1rem' }}>
            <div style={{ position: 'relative', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, var(--primary) 0%, rgba(0, 210, 255, 0.5) 100%)', borderRadius: '14px', transform: 'rotate(10deg)', opacity: 0.2 }}></div>
              <div style={{ position: 'absolute', inset: '2px', background: 'linear-gradient(135deg, var(--primary) 0%, #2563eb 100%)', borderRadius: '12px' }}></div>
              <HeartPulse size={26} color="#ffffff" style={{ position: 'relative', zIndex: 1 }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <h2 style={{ fontSize: '1.6rem', margin: 0, fontWeight: '800', letterSpacing: '0.2px', color: 'var(--text-primary)', lineHeight: 1 }}>MedIntel<span style={{ color: 'var(--primary)' }}>.AI</span></h2>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--text-muted)', fontWeight: '600', marginTop: '4px' }}>Patient Intelligence</span>
            </div>
          </div>
          <button onClick={toggleTheme} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--surface-border)', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
        </div>

        <h1 style={{ fontSize: '3.5rem', marginBottom: '1.5rem', lineHeight: '1.1' }}>
          Analyze Health Reports <br /><span style={{ color: 'var(--primary)' }}>in Seconds.</span>
        </h1>
        <p style={{ fontSize: '1.15rem', color: 'var(--text-secondary)', marginBottom: '3rem', maxWidth: '500px', lineHeight: '1.6' }}>
          Instantly extract patient data, detect critical medical values, and receive real AI-driven dietary and treatment recommendations by simply uploading your document.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.75rem', background: 'rgba(46, 204, 113, 0.1)', borderRadius: '12px' }}>
              <Shield size={24} color="var(--success)" />
            </div>
            <div>
              <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem' }}>Powered by Gemini AI</h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Using massive language models to read PDFs & Images.</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.75rem', background: 'rgba(0, 210, 255, 0.1)', borderRadius: '12px' }}>
              <Cpu size={24} color="var(--primary)" />
            </div>
            <div>
              <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem' }}>Smart Value Detection</h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Automatically extracts WBC, sugars, limits, and flags risks.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Upload Pane */}
      <div className="landing-right">

        {/* Background decorative blob */}
        <div style={{ position: 'absolute', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(0,210,255,0.1) 0%, rgba(0,0,0,0) 70%)', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', filter: 'blur(50px)', zIndex: 0 }}></div>

        <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '500px', padding: '3rem', textAlign: 'center', zIndex: 1, boxShadow: '0 20px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)' }}>
          <h2 style={{ marginBottom: '0.5rem', fontSize: '1.75rem' }}>Upload Report(s)</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>Drop one or more PDF or image reports below</p>

          {errorMsg && (
            <div style={{ padding: '0.75rem', background: 'rgba(231, 76, 60, 0.1)', color: 'var(--danger)', fontSize: '0.85rem', borderRadius: '4px', marginBottom: '1.5rem', textAlign: 'left' }}>
              {errorMsg}
            </div>
          )}

          {uploading ? (
            <div style={{ padding: '3rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--surface-border)' }}>
              <div style={{ position: 'relative', width: '80px', height: '80px' }}>
                <div style={{ width: '80px', height: '80px', border: '3px solid rgba(255,255,255,0.1)', borderRadius: '50%' }}></div>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '80px', height: '80px', border: '3px solid transparent', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite' }}></div>
                <FileText size={32} color="var(--primary)" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
              </div>
              <div>
                <h3 style={{ margin: '0 0 0.5rem 0' }}>AI is Analyzing...</h3>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Extracting insights and comparing metrics</p>
              </div>
              <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
            </div>
          ) : (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              style={{
                padding: '4rem 2rem',
                border: `2px dashed ${isHovering ? 'var(--primary)' : 'rgba(255,255,255,0.2)'}`,
                background: isHovering ? 'rgba(0,210,255,0.05)' : 'rgba(255,255,255,0.02)',
                borderRadius: 'var(--radius-lg)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}
            >
              <div style={{ background: isHovering ? 'rgba(0,210,255,0.1)' : 'rgba(255,255,255,0.05)', padding: '1.25rem', borderRadius: '50%', marginBottom: '1.5rem', transition: 'all 0.3s ease' }}>
                <UploadCloud size={40} color={isHovering ? 'var(--primary)' : 'var(--text-secondary)'} />
              </div>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>Drag & Drop your file(s)</h3>
              <p style={{ color: 'var(--text-muted)', margin: '0 0 2rem 0', fontSize: '0.9rem' }}>Supports .pdf, .jpg, .png</p>

              <label className="btn-primary" style={{ cursor: 'pointer', width: '100%' }}>
                Browse Report By AI
                <input type="file" style={{ display: 'none' }} accept=".pdf,image/*" multiple onChange={handleFileSelect} />
              </label>
            </div>
          )}
        </div>
      </div>
    </div>
  );

};

export default LandingPage;
