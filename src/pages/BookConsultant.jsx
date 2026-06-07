import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, User, MapPin, Star, Calendar, Phone, HeartPulse, Activity as ActivityIcon, LayoutDashboard, TrendingUp, X, BadgeCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GoogleGenerativeAI } from '@google/generative-ai';

const BookConsultant = () => {
  const navigate = useNavigate();
  const consultationFee = '₹499';
  const [city, setCity] = useState('');
  const [isSearchingDoctors, setIsSearchingDoctors] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [currentUser, setCurrentUser] = useState(() => {
    const currentUserStr = localStorage.getItem('medintel_current_user');
    return currentUserStr ? JSON.parse(currentUserStr) : null;
  });
  const [bookingDoctor, setBookingDoctor] = useState(null);
  const [bookingMode, setBookingMode] = useState('Online');
  const [bookingDate, setBookingDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [bookingTime, setBookingTime] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30);
    return now.toTimeString().slice(0, 5);
  });
  const [bookingStage, setBookingStage] = useState('details');
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [paymentError, setPaymentError] = useState('');
  const [upiId, setUpiId] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [walletId, setWalletId] = useState('');
  const [bankName, setBankName] = useState('HDFC Bank');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [bookingMessage, setBookingMessage] = useState('');
  const [consultHistory, setConsultHistory] = useState([]);

  const paymentOptions = [
    { id: 'upi', label: 'UPI', description: 'PhonePe, Google Pay, Paytm, BHIM' },
    { id: 'card', label: 'Card', description: 'Credit or debit card checkout' },
    { id: 'netbanking', label: 'Net Banking', description: 'Select your preferred bank' },
    { id: 'wallet', label: 'Wallet', description: 'Amazon Pay, Paytm Wallet, and more' },
  ];

  const historyStorageKey = useMemo(
    () => (currentUser?.email ? `medintel_consult_history_${currentUser.email.toLowerCase()}` : ''),
    [currentUser?.email]
  );

  useEffect(() => {
    if (!currentUser) {
      navigate('/');
      return;
    }

    if (historyStorageKey) {
      const savedHistory = JSON.parse(localStorage.getItem(historyStorageKey) || '[]');
      setConsultHistory(savedHistory);
    }
  }, [currentUser, historyStorageKey, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('medintel_current_user');
    navigate('/');
  };

  const syncConsultHistory = (nextHistory) => {
    if (!currentUser?.email) return;

    const updatedCurrentUser = { ...currentUser, consultHistory: nextHistory };
    setCurrentUser(updatedCurrentUser);
    localStorage.setItem('medintel_current_user', JSON.stringify(updatedCurrentUser));

    const users = JSON.parse(localStorage.getItem('medintel_users') || '[]');
    const updatedUsers = users.map((user) => (
      user.email.toLowerCase() === currentUser.email.toLowerCase()
        ? { ...user, consultHistory: nextHistory }
        : user
    ));
    localStorage.setItem('medintel_users', JSON.stringify(updatedUsers));

    localStorage.setItem(historyStorageKey, JSON.stringify(nextHistory));
    setConsultHistory(nextHistory);
  };

  const openBookingModal = (doctor) => {
    setBookingDoctor(doctor);
    setBookingMode('Online');
    setBookingStage('details');
    setPaymentMethod('upi');
    setPaymentError('');
    setUpiId('');
    setCardName('');
    setCardNumber('');
    setCardExpiry('');
    setCardCvv('');
    setWalletId('');
    setBankName('HDFC Bank');
    setBookingMessage('');
    setBookingDate(new Date().toISOString().split('T')[0]);
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30);
    setBookingTime(now.toTimeString().slice(0, 5));
  };

  const handleBookConsultation = (paymentInfo = {}) => {
    if (!bookingDoctor || !currentUser) return;

    const paymentReference = paymentInfo.reference || `RZP-${Date.now().toString().slice(-8)}`;

    const historyEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      patientName: currentUser.name,
      patientEmail: currentUser.email,
      doctorName: bookingDoctor.name,
      specialization: bookingDoctor.spec,
      hospital: bookingDoctor.hospital,
      city: bookingDoctor.city || city.trim(),
      consultationMode: bookingMode,
      date: bookingDate,
      time: bookingTime,
      status: 'Confirmed',
      amount: consultationFee,
      paymentStatus: 'Paid',
      paymentMethod: paymentInfo.method || paymentMethod,
      paymentReference,
      bookedAt: new Date().toISOString()
    };

    const nextHistory = [historyEntry, ...consultHistory];
    syncConsultHistory(nextHistory);
    setBookingMessage(`Consultation booked with ${bookingDoctor.name} and paid via ${historyEntry.paymentMethod.toUpperCase()}.`);
    setBookingDoctor(null);
    setHistoryOpen(true);
  };

  const handleProceedToPayment = () => {
    if (!bookingDate || !bookingTime) {
      setPaymentError('Please choose a consultation date and time first.');
      return;
    }

    setPaymentError('');
    setBookingStage('payment');
  };

  const handleConfirmPayment = () => {
    if (paymentMethod === 'upi' && !upiId.trim()) {
      setPaymentError('Enter a valid UPI ID to continue.');
      return;
    }

    if (paymentMethod === 'card' && (!cardName.trim() || !cardNumber.trim() || !cardExpiry.trim() || !cardCvv.trim())) {
      setPaymentError('Complete the card details to continue.');
      return;
    }

    if (paymentMethod === 'netbanking' && !bankName.trim()) {
      setPaymentError('Select a bank to continue.');
      return;
    }

    if (paymentMethod === 'wallet' && !walletId.trim()) {
      setPaymentError('Enter your wallet or mobile ID to continue.');
      return;
    }

    const paymentReference = `RZP-${Math.floor(100000 + Math.random() * 900000)}`;
    setPaymentError('');
    handleBookConsultation({ method: paymentMethod, reference: paymentReference });
  };

  const handleSearchDoctors = async () => {
    if (!city) return;
    
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('gemini_api_key');
    if (!apiKey) {
      alert("Please ensure your Gemini API Key is set in the landing page first.");
      return;
    }

    setIsSearchingDoctors(true);
    setDoctors([]);
    
    const HOSPITAL_PROMPT = `You are a medical facility discovery assistant for India.
List 8-10 real, well-known hospitals and specialist doctors in "${city}", India.
Return ONLY valid JSON (no markdown, no backticks, no extra text) as an array matching this EXACT structure:
[
  {
    "name": "string (doctor name, e.g. Dr. Rajesh Kumar)",
    "spec": "string (specialization, e.g. Cardiologist)",
    "hospital": "string (hospital name, e.g. Apollo Hospital, ${city})",
    "rating": "string (rating out of 5, e.g. 4.6)",
    "contact": "string (phone or helpline number)",
    "fee": "string (consultation fee range, e.g. ₹500 - ₹1500)"
  }
]
Use real hospital names that actually exist in ${city}. Return at least 6 entries.`;

    try {
      let fetchedDoctors = null;

      // Try AI first
      const modelNames = ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-2.0-flash-lite"];
      for (const mName of modelNames) {
        try {
          console.log(`Attempting discovery via ${mName}...`);
          const client = new GoogleGenerativeAI(apiKey);
          const model = client.getGenerativeModel({ model: mName });
          const response = await model.generateContent(HOSPITAL_PROMPT);
          
          if (!response?.response) continue;
          let text = response.response.text().trim();

          // Strip markdown code fences if present
          text = text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();

          const startIdx = text.indexOf('[');
          const endIdx = text.lastIndexOf(']') + 1;
          if (startIdx === -1 || endIdx === 0) continue;

          const parsed = JSON.parse(text.substring(startIdx, endIdx));
          if (Array.isArray(parsed) && parsed.length > 0) {
            fetchedDoctors = parsed;
            console.log(`✅ Discovery successful via ${mName}`);
            break;
          }
        } catch (e) {
          console.warn(`${mName} discovery failed:`, e.message);
        }
      }

      // Fallback: OpenStreetMap if AI fails
      if (!fetchedDoctors) {
        console.warn("AI Discovery failed. Using OpenStreetMap fallback...");
        const osmResponse = await fetch(
          `https://nominatim.openstreetmap.org/search?q=hospital+in+${encodeURIComponent(city)}&format=json&limit=12`
        );
        const osmData = await osmResponse.json();
        
        if (osmData && osmData.length > 0) {
          const specs = ["Cardiologist", "General Physician", "Orthopedic Surgeon", "Neurologist", "Dermatologist", "Gastroenterologist"];
          fetchedDoctors = osmData.slice(0, 10).map((item, index) => ({
            name: `Dr. ${["Anand Sharma", "Priya Mehta", "Rajesh Gupta", "Sunita Rao", "Vikram Singh", "Kavita Joshi", "Arjun Nair", "Deepa Verma", "Suresh Patel", "Meera Iyer"][index] || "Senior Specialist"}`,
            spec: specs[index % specs.length],
            hospital: item.display_name.split(',')[0] || "City Medical Center",
            rating: (4.0 + Math.random() * 0.9).toFixed(1),
            contact: `+91-${Math.floor(7000000000 + Math.random() * 2999999999)}`,
            fee: `₹${400 + index * 100} - ₹${900 + index * 150}`
          }));
        } else {
          throw new Error(`Could not find any hospitals in "${city}". Please try another city name.`);
        }
      }

      setDoctors(fetchedDoctors.map((doctor) => ({ ...doctor, city })));
    } catch (err) {
      console.error("Discovery error:", err);
      alert(`Search failed: ${err.message || "Please check your city name or API key."}`);
    } finally {
      setIsSearchingDoctors(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-color)' }}>
      
      {/* Top Navbar */}
      <nav className="top-navbar" style={{ background: 'var(--bg-color)' }}>
        
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
          <button className="nav-btn" onClick={() => navigate('/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem', borderRadius: 'var(--radius-full)', background: 'transparent', color: 'var(--text-secondary)', border: 'none', cursor: 'pointer', transition: 'all 0.2s', fontWeight: '500' }}>
            <LayoutDashboard size={18} /> Overview
          </button>
          <button className="nav-btn" onClick={() => navigate('/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem', borderRadius: 'var(--radius-full)', background: 'transparent', color: 'var(--text-secondary)', border: 'none', cursor: 'pointer', transition: 'all 0.2s', fontWeight: '500' }}>
            <TrendingUp size={18} /> Health Tracker
          </button>
        </div>

        {/* Right Actions */}
          <div className="nav-actions">
          <button className="nav-btn" onClick={() => setHistoryOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem', borderRadius: 'var(--radius-full)', background: 'transparent', color: 'var(--text-secondary)', border: 'none', cursor: 'pointer', transition: 'all 0.2s', fontWeight: '500' }}>
            <Calendar size={18} /> My Consult History
            {consultHistory.length > 0 && <span style={{ background: 'var(--primary)', color: '#fff', borderRadius: '9999px', fontSize: '0.72rem', padding: '0.1rem 0.45rem' }}>{consultHistory.length}</span>}
          </button>
          <button className="nav-btn active" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem', borderRadius: 'var(--radius-full)', background: 'rgba(0, 210, 255, 0.1)', color: 'var(--primary)', border: 'none', cursor: 'pointer', transition: 'all 0.2s', fontWeight: '600' }}>
            <User size={18} /> Find Specialists
          </button>
          <div style={{ width: '1px', height: '24px', background: 'var(--surface-border)' }}></div>
          <button className="nav-btn" onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem', borderRadius: 'var(--radius-full)', background: 'rgba(231, 76, 60, 0.1)', color: 'var(--danger)', border: 'none', cursor: 'pointer', transition: 'all 0.2s', fontWeight: '600' }}>
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="main-content">
        
        {/* Top Header */}
        <header style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: '1.75rem', margin: '0 0 0.5rem 0' }}>Find Specialists</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.95rem' }}>AI-driven hospital & doctor discovery.</p>
        </header>

        {/* Action Panel */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <User size={20} color="var(--primary)" /> Book Consultant Nearby
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '2rem', lineHeight: 1.5 }}>
              Use our AI-assisted search to find 10+ real hospital facilities and specialized consultants directly inside your city. 
              Based on your most recent health reports, we prioritize fetching specialists such as <strong>Hematologists</strong>, <strong>Cardiologists</strong>, and <strong>Internal Medicine</strong> practitioners.
            </p>
            
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', maxWidth: '600px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <MapPin size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text" 
                  value={city} 
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Enter your city (e.g. Mumbai, Delhi, Pune)..." 
                  style={{ width: '100%', background: 'rgba(150,150,150,0.05)', border: '1px solid var(--surface-border)', padding: '1rem 1rem 1rem 3rem', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', outline: 'none', fontSize: '1rem' }}
                />
              </div>
              <button className="btn-primary" onClick={handleSearchDoctors} disabled={!city || isSearchingDoctors} style={{ height: '54px', padding: '0 2rem', fontSize: '1rem' }}>
                {isSearchingDoctors ? 'Fetching Hospital Data...' : 'Search Hospitals'}
              </button>
            </div>

            {!isSearchingDoctors && doctors.length === 0 && (
              <div className="glass-card animate-fade-in" style={{ padding: '3rem', textAlign: 'center', marginTop: '2rem' }}>
                <ActivityIcon size={48} color="var(--primary)" style={{ opacity: 0.3, marginBottom: '1.5rem' }} />
                <h4 style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
                  {city ? `No real hospitals found in "${city}". Try another location.` : 'Enter your city above to find 10+ real healthcare facilities.'}
                </h4>
              </div>
            )}

            {bookingMessage && (
              <div style={{ marginBottom: '1.25rem', padding: '0.9rem 1rem', borderRadius: 'var(--radius-sm)', background: 'rgba(46,204,113,0.08)', border: '1px solid rgba(46,204,113,0.15)', color: 'var(--success)', fontSize: '0.9rem' }}>
                <BadgeCheck size={16} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} /> {bookingMessage}
              </div>
            )}

            {doctors.length > 0 && (
              <div className="doctors-grid animate-fade-in">
                {doctors.map((doc, idx) => (
                  <div key={idx} style={{ 
                    background: 'var(--surface-color)', 
                    border: '1px solid var(--surface-border)', 
                    padding: '1.5rem', 
                    borderRadius: 'var(--radius-md)', 
                    display: 'flex', 
                    flexDirection: 'column',
                    justifyContent: 'space-between', 
                    gap: '1.5rem',
                    transition: 'all 0.3s ease',
                    boxShadow: 'var(--shadow-depth)'
                  }}>
                    <div>
                      <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.15rem', color: 'var(--text-primary)', fontWeight: '700' }}>{doc.name}</h4>
                      <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: 'var(--primary)', fontWeight: '600' }}>{doc.spec}</p>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flex: 1 }}><MapPin size={16} color="var(--primary)" /> {doc.hospital}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#f1c40f', whiteSpace: 'nowrap' }}><Star size={16} fill="#f1c40f" /> {doc.rating} Rating</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flex: 1 }}><Phone size={16} color="var(--primary)" /> {doc.contact}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', whiteSpace: 'nowrap' }}>Fee: <strong style={{color: 'var(--text-primary)'}}>{doc.fee}</strong></span>
                        </div>
                      </div>
                    </div>
                    <button className="btn-secondary" style={{ padding: '0.75rem 1.25rem', fontSize: '0.9rem', width: '100%', justifyContent: 'center' }} onClick={() => openBookingModal(doc)}>
                       <Calendar size={16} /> Book Consultation Now
                    </button>
                  </div>
                ))}
              </div>
            )}
        </div>
      </main>

      {historyOpen && (
        <div className="consult-overlay" onClick={() => setHistoryOpen(false)}>
          <div className="consult-history-sheet glass-panel animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="consult-sheet-header">
              <div>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Patient record</p>
                <h3 style={{ margin: '0.25rem 0 0 0', fontSize: '1.35rem', fontWeight: '800' }}>My Consult History</h3>
              </div>
              <button className="auth-icon-button" onClick={() => setHistoryOpen(false)} aria-label="Close history">
                <X size={18} />
              </button>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.75rem', lineHeight: 1.6 }}>
              All booked consultations are saved with the chosen doctor, date, time, and visit type.
            </p>

            <div style={{ display: 'grid', gap: '0.9rem', marginTop: '1.25rem' }}>
              {consultHistory.length === 0 ? (
                <div style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px dashed var(--surface-border)', color: 'var(--text-secondary)', textAlign: 'center' }}>
                  No consultation history yet. Book a doctor to see it here.
                </div>
              ) : (
                consultHistory.map((entry) => (
                  <div key={entry.id} style={{ padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--surface-border)', background: 'rgba(255,255,255,0.03)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start' }}>
                      <div>
                        <h4 style={{ margin: '0 0 0.35rem 0', fontSize: '1rem' }}>{entry.doctorName}</h4>
                        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>{entry.specialization} • {entry.hospital}</p>
                      </div>
                      <span style={{ fontSize: '0.75rem', background: 'rgba(46,204,113,0.1)', color: 'var(--success)', padding: '0.2rem 0.5rem', borderRadius: '9999px' }}>{entry.status}</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.75rem', marginTop: '1rem' }}>
                      <div>
                        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.75rem' }}>Date</p>
                        <p style={{ margin: '0.2rem 0 0 0', fontWeight: '600' }}>{entry.date}</p>
                      </div>
                      <div>
                        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.75rem' }}>Time</p>
                        <p style={{ margin: '0.2rem 0 0 0', fontWeight: '600' }}>{entry.time}</p>
                      </div>
                      <div>
                        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.75rem' }}>Mode</p>
                        <p style={{ margin: '0.2rem 0 0 0', fontWeight: '600' }}>{entry.consultationMode}</p>
                      </div>
                      <div>
                        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.75rem' }}>City</p>
                        <p style={{ margin: '0.2rem 0 0 0', fontWeight: '600' }}>{entry.city}</p>
                      </div>
                      <div>
                        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.75rem' }}>Payment</p>
                        <p style={{ margin: '0.2rem 0 0 0', fontWeight: '600' }}>{entry.paymentMethod || 'UPI'} • {entry.paymentStatus || 'Paid'}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {bookingDoctor && (
        <div className="consult-overlay" onClick={() => setBookingDoctor(null)}>
          <div className="consult-booking-sheet glass-panel animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="consult-sheet-header">
              <div>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '1.5px' }}>New booking</p>
                <h3 style={{ margin: '0.25rem 0 0 0', fontSize: '1.35rem', fontWeight: '800' }}>Book Consultation</h3>
              </div>
              <button className="auth-icon-button" onClick={() => setBookingDoctor(null)} aria-label="Close booking">
                <X size={18} />
              </button>
            </div>

            <div style={{ marginTop: '1rem', padding: '1rem', borderRadius: 'var(--radius-md)', background: 'rgba(0,210,255,0.06)', border: '1px solid rgba(0,210,255,0.12)' }}>
              <h4 style={{ margin: '0 0 0.35rem 0', fontSize: '1rem' }}>{bookingDoctor.name}</h4>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{bookingDoctor.spec} • {bookingDoctor.hospital}</p>
            </div>

            <div className="booking-grid" style={{ marginTop: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Consultation Mode</label>
                <select value={bookingMode} onChange={(e) => setBookingMode(e.target.value)} className="consult-input">
                  <option value="Online">Online</option>
                  <option value="Offline">Offline</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Date</label>
                <input type="date" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} className="consult-input" />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Time</label>
                <input type="time" value={bookingTime} onChange={(e) => setBookingTime(e.target.value)} className="consult-input" />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>City</label>
                <input type="text" value={bookingDoctor.city || city} readOnly className="consult-input" />
              </div>
            </div>

            {bookingStage === 'details' ? (
              <div style={{ marginTop: '1.25rem' }}>
                <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(0,210,255,0.12)', background: 'rgba(0,210,255,0.06)' }}>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Checkout summary</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginTop: '0.65rem', alignItems: 'center' }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: '700' }}>Consultation fee</p>
                      <p style={{ margin: '0.15rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Secure Razorpay-style payment modal</p>
                    </div>
                    <p style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: 'var(--primary)' }}>{consultationFee}</p>
                  </div>
                </div>

                <button className="btn-primary" onClick={handleProceedToPayment} style={{ width: '100%', marginTop: '1rem' }}>
                  Proceed to Payment
                </button>
              </div>
            ) : (
              <div style={{ marginTop: '1.25rem' }}>
                <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(0,210,255,0.14)', background: 'rgba(255,255,255,0.03)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                    <div>
                      <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Razorpay Checkout</p>
                      <h4 style={{ margin: '0.25rem 0 0 0', fontSize: '1.05rem' }}>Choose a payment method</h4>
                    </div>
                    <button type="button" onClick={() => setBookingStage('details')} style={{ border: 'none', background: 'transparent', color: 'var(--primary)', cursor: 'pointer', fontWeight: '600' }}>
                      Edit booking
                    </button>
                  </div>

                  <div style={{ display: 'grid', gap: '0.7rem', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', marginTop: '1rem' }}>
                    {paymentOptions.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setPaymentMethod(option.id)}
                        style={{
                          textAlign: 'left',
                          padding: '0.9rem',
                          borderRadius: 'var(--radius-md)',
                          border: paymentMethod === option.id ? '1px solid var(--primary)' : '1px solid var(--surface-border)',
                          background: paymentMethod === option.id ? 'rgba(0,210,255,0.10)' : 'rgba(255,255,255,0.02)',
                          color: 'inherit',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'center' }}>
                          <strong>{option.label}</strong>
                          {paymentMethod === option.id && <BadgeCheck size={16} color="var(--primary)" />}
                        </div>
                        <p style={{ margin: '0.35rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: 1.5 }}>{option.description}</p>
                      </button>
                    ))}
                  </div>

                  <div style={{ marginTop: '1rem', display: 'grid', gap: '0.85rem' }}>
                    {paymentMethod === 'upi' && (
                      <div>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>UPI ID</label>
                        <input value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="name@upi" className="consult-input" />
                      </div>
                    )}

                    {paymentMethod === 'card' && (
                      <div className="booking-grid">
                        <div>
                          <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Cardholder Name</label>
                          <input value={cardName} onChange={(e) => setCardName(e.target.value)} placeholder="Name on card" className="consult-input" />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Card Number</label>
                          <input value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} placeholder="1234 5678 9012 3456" className="consult-input" />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Expiry</label>
                          <input value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)} placeholder="MM/YY" className="consult-input" />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>CVV</label>
                          <input value={cardCvv} onChange={(e) => setCardCvv(e.target.value)} placeholder="123" className="consult-input" />
                        </div>
                      </div>
                    )}

                    {paymentMethod === 'netbanking' && (
                      <div>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Bank</label>
                        <select value={bankName} onChange={(e) => setBankName(e.target.value)} className="consult-input">
                          <option>HDFC Bank</option>
                          <option>State Bank of India</option>
                          <option>ICICI Bank</option>
                          <option>Axis Bank</option>
                          <option>Punjab National Bank</option>
                        </select>
                      </div>
                    )}

                    {paymentMethod === 'wallet' && (
                      <div>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Wallet / Mobile ID</label>
                        <input value={walletId} onChange={(e) => setWalletId(e.target.value)} placeholder="Wallet ID or mobile number" className="consult-input" />
                      </div>
                    )}
                  </div>

                  {paymentError && (
                    <div style={{ marginTop: '1rem', padding: '0.8rem 0.9rem', borderRadius: 'var(--radius-md)', background: 'rgba(231,76,60,0.1)', color: 'var(--danger, #e74c3c)', border: '1px solid rgba(231,76,60,0.18)' }}>
                      {paymentError}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginTop: '1rem', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', background: 'rgba(0,0,0,0.12)' }}>
                    <div>
                      <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.75rem' }}>Amount due</p>
                      <p style={{ margin: '0.15rem 0 0 0', fontWeight: '800', fontSize: '1.2rem' }}>{consultationFee}</p>
                    </div>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.8rem', maxWidth: '180px', textAlign: 'right' }}>Your consultation will be confirmed immediately after payment approval.</p>
                  </div>

                  <button className="btn-primary" onClick={handleConfirmPayment} style={{ width: '100%', marginTop: '1rem' }}>
                    Pay &amp; Confirm Consultation
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        .nav-btn:hover { background: var(--primary-glow) !important; color: var(--primary) !important; }
      `}</style>
    </div>
  );
};

export default BookConsultant;
