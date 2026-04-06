import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, Shield, Activity, ArrowRight, CheckCircle, FileText, Cpu, HeartPulse, Key, Sun, Moon } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { useTheme } from '../context/ThemeContext';

const LandingPage = () => {
  const [isHovering, setIsHovering] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [apiKey, setApiKey] = useState(import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('gemini_api_key') || '');
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
      const genAI = new GoogleGenerativeAI(apiKey);
      const modelsToTry = ["gemini-2.0-flash", "gemini-pro", "gemini-1.5-pro", "gemini-1.5-flash-latest"];

      const reports = await Promise.all(files.map(async (file) => {
        const base64Data = await fileToBase64(file);
        const mimeType = file.type || 'application/pdf';

        const prompt = `You are an expert medical AI assistant. Look at the provided medical report document. Extract the patient's details and medical values, and generate health recommendations. 
        Return ONLY a strict JSON object with this exact structure (no markdown formatting, no backticks, no code blocks, just pure JSON):
        {
          "patientName": "string or Unknown",
          "age": "string",
          "gender": "string or Unknown",
          "address": "string",
          "referredDoctor": "string",
          "healthScore": number (0-100 indicating overall health based on report anomalies),
          "medicalValues": [
            { "name": "string (e.g. WBC Count)", "value": "string", "unit": "string", "normal": "string", "status": "High" | "Low" | "Normal" }
          ],
          "riskPrediction": "string (2-3 sentences analyzing abnormal values and potential risks)",
          "recoveryEstimate": "string (e.g. '3-5 days with proper care')",
          "naturalTreatments": ["string"],
          "medicalTreatments": ["string"],
          "exerciseReminders": [
            { "title": "string", "time": "string (e.g. 07:00 AM)", "reason": "string" }
          ],
          "reportDate": "string (extract date from report if possible, else use current date)"
        }`;

        let result = null;
        let lastErr = null;
        for (const mName of modelsToTry) {
          try {
            const model = genAI.getGenerativeModel({ model: mName });
            result = await model.generateContent([
              prompt,
              {
                inlineData: {
                  data: base64Data.split(',')[1],
                  mimeType: mimeType
                }
              }
            ]);
            if (result && result.response) break;
          } catch (e) {
            lastErr = e;
            console.warn(`Model ${mName} failed in landing page:`, e);
          }
        }

        if (!result) throw new Error(`Report analysis failed on all models. Latest error: ${lastErr?.message}`);

        const responseText = result.response.text();
        const startIdx = responseText.indexOf('{');
        const endIdx = responseText.lastIndexOf('}') + 1;
        if (startIdx === -1 || endIdx === 0) throw new Error("Could not find JSON in AI response.");
        const cleanJsonStr = responseText.substring(startIdx, endIdx);
        return JSON.parse(cleanJsonStr);
      }));

      setUploading(false);
      navigate('/dashboard', { state: { reports } });

    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Failed to process the reports. Ensure your API Key is valid and the files are clear.");
      setUploading(false);
    }
  };

  const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });


  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-color)', overflow: 'hidden', position: 'relative' }}>

      {/* Left Content Pane */}
      <div style={{ flex: 1, padding: '2rem 5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ background: 'var(--primary-glow)', padding: '0.5rem', borderRadius: '50%' }}>
              <Activity size={28} color="var(--primary)" />
            </div>
            <h2 style={{ fontSize: '1.5rem', margin: 0, fontWeight: '700', letterSpacing: '0.5px' }}>MedIntel AI</h2>
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
      <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>

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
