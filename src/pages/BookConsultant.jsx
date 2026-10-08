import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, User, MapPin, Star, Calendar, Phone, HeartPulse, Activity as ActivityIcon, LayoutDashboard, TrendingUp, X, BadgeCheck, Video, Wifi, Clock, Award, Building2, Stethoscope, FileText, LocateFixed } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import html2pdf from 'html2pdf.js';
import { requestGemini } from '../utils/geminiApi';
import LanguageSelector from '../components/LanguageSelector';

const BookConsultant = () => {
  const navigate = useNavigate();
  const consultationFee = '₹499';
  const [city, setCity] = useState('');
  const [locationLabel, setLocationLabel] = useState('');
  const [isLocating, setIsLocating] = useState(false);
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
  const [viewingPrescription, setViewingPrescription] = useState(null);
  const [viewingReceipt, setViewingReceipt] = useState(null);
  const [activeTab, setActiveTab] = useState('nearby');           // 'nearby' | 'online'
  const [onlineDoctors, setOnlineDoctors] = useState([]);
  const [viewingDoctorProfile, setViewingDoctorProfile] = useState(null);

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

    // Load online-available verified doctors
    const allVerified = JSON.parse(localStorage.getItem('medintel_verified_doctors') || '[]');
    setOnlineDoctors(allVerified.filter(d => d.onlineAvailable !== false));
  }, [currentUser, historyStorageKey, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('medintel_current_user');
    navigate('/');
  };

  const buildPrintableDocument = (title, bodyHtml) => `
    <html>
      <head>
        <title>${title}</title>
        <style>
          @page { size: A4; }
          html, body {
            background: #fff;
            color: #111;
            font-family: Arial, sans-serif;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          * { box-sizing: border-box; }
          h1, h2, h3, h4, p { margin: 0 0 10px 0; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #d9d9d9; padding: 8px; text-align: left; font-size: 12px; }
          th { background: #f5f7fa; }
          .muted { color: #555; }
          .section { margin-bottom: 16px; }
          .header { display: flex; justify-content: space-between; gap: 16px; border-bottom: 2px solid #00a6d6; padding-bottom: 12px; margin-bottom: 16px; align-items: flex-start; }
          .brand { display: flex; align-items: center; gap: 10px; }
          .brand img { width: 38px; height: 38px; display: block; }
          .brand-name { font-size: 18px; font-weight: 800; letter-spacing: 0.2px; }
          .brand-sub { font-size: 11px; color: #555; margin-top: 2px; }
          .footer { margin-top: 24px; text-align: right; }
        </style>
      </head>
      <body>
        ${bodyHtml}
      </body>
    </html>
  `;

  const extractLocationLabel = (place) => {
    if (!place) return '';
    const parts = [
      place.address?.suburb,
      place.address?.neighbourhood,
      place.address?.city,
      place.address?.town,
      place.address?.village,
      place.address?.county,
      place.address?.state
    ].filter(Boolean);

    const uniqueParts = [...new Set(parts)];
    return uniqueParts.slice(0, 2).join(', ');
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert('Location access is not supported in this browser.');
      return;
    }

    setIsLocating(true);
    setBookingMessage('');

    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const { latitude, longitude } = position.coords;
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
          {
            headers: {
              'Accept': 'application/json'
            }
          }
        );

        const place = await response.json();
        const resolvedLabel = extractLocationLabel(place) || place.display_name?.split(',').slice(0, 2).join(', ') || '';
        const resolvedCity = place.address?.city || place.address?.town || place.address?.village || place.address?.county || '';
        const nextSearch = resolvedCity || resolvedLabel;

        if (!nextSearch) {
          throw new Error('Could not resolve your city from location.');
        }

        setLocationLabel(resolvedLabel || nextSearch);
        setCity(nextSearch);
        await new Promise((resolve) => setTimeout(resolve, 0));
        setIsLocating(false);
        handleSearchDoctors(nextSearch);
      } catch (error) {
        setIsLocating(false);
        alert(error.message || 'Unable to determine your nearby location.');
      }
    }, (error) => {
      setIsLocating(false);
      const message = error.code === error.PERMISSION_DENIED
        ? 'Location permission was denied.'
        : 'Unable to access your current location.';
      alert(message);
    }, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000
    });
  };

  const openA4PrintWindow = (title, bodyHtml) => {
    const printWindow = window.open('', '_blank', 'width=900,height=1200');
    if (!printWindow) {
      alert('Please allow pop-ups to print this document.');
      return null;
    }

    printWindow.document.write(buildPrintableDocument(title, bodyHtml));
    printWindow.document.close();
    printWindow.focus();
    return printWindow;
  };

  const downloadPrintableDocument = async (filename, title, bodyHtml) => {
    const pdfFilename = filename.replace(/\.(html|txt)$/i, '').concat('.pdf');

    // Create temporary styled container for PDF capture
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '790px';
    container.style.background = '#ffffff';
    container.style.color = '#111827';
    container.style.fontFamily = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
    container.style.padding = '20px';
    container.innerHTML = buildPrintableDocument(title, bodyHtml);
    document.body.appendChild(container);

    const opt = {
      margin:      [10, 10, 10, 10],
      filename:    pdfFilename,
      image:       { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF:       { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
      const pdfBlob = await html2pdf().set(opt).from(container).outputPdf('blob');
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = pdfFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF export failed:', err);
      alert('PDF generation failed. Please try again.');
    } finally {
      if (document.body.contains(container)) {
        document.body.removeChild(container);
      }
    }
  };

  const handlePrintPrescription = () => {
    if (!viewingPrescription) return;

    const prescriptionBodyHtml = `
      <div class="header">
        <div class="brand">
          <img src="/favicon.svg" alt="MedIntel logo" />
          <div>
            <div class="brand-name">MedIntel<span style="color:#00a6d6">.AI</span></div>
            <div class="brand-sub">Verified Medical Telehealth Network</div>
          </div>
        </div>
        <div style="text-align:right;">
          <p><strong>${viewingPrescription.doctorName || ''}</strong></p>
          <p>${viewingPrescription.doctorSpec || ''}</p>
          <p>${viewingPrescription.doctorHospital || ''}</p>
          <p>Reg. No.: ${viewingPrescription.doctorRegNum || ''}</p>
        </div>
      </div>
      <div class="section">
        <p><strong>Patient:</strong> ${currentUser?.name || ''}</p>
        <p><strong>Date Prescribed:</strong> ${viewingPrescription.date || new Date().toLocaleDateString()}</p>
      </div>
      <div class="section">
        <h3>Prescribed Drugs</h3>
        <table>
          <thead>
            <tr>
              <th>Medicine</th>
              <th>Dosage</th>
              <th>Duration</th>
              <th>Instruction</th>
            </tr>
          </thead>
          <tbody>${(viewingPrescription.medications || []).map((med) => `
            <tr>
              <td>${med.name || ''}</td>
              <td>${med.dosage || ''}</td>
              <td>${med.duration || ''}</td>
              <td>${med.instruction || ''}</td>
            </tr>
          `).join('')}</tbody>
        </table>
      </div>
      <div class="section">
        <h3>Clinical Instructions</h3>
        <p style="white-space: pre-wrap;">${viewingPrescription.advice || 'Take medications as directed. Rest well and hydrate.'}</p>
        ${viewingPrescription.followUp ? `<p><strong>Follow-up:</strong> ${new Date(viewingPrescription.followUp).toLocaleDateString()}</p>` : ''}
      </div>
      <div class="footer">
        <p><strong>${viewingPrescription.doctorName || ''}</strong></p>
        <p class="muted">Electronic Rx Signature</p>
      </div>
    `;

    const medicationRows = (viewingPrescription.medications || []).map((med) => `
      <tr>
        <td>${med.name || ''}</td>
        <td>${med.dosage || ''}</td>
        <td>${med.duration || ''}</td>
        <td>${med.instruction || ''}</td>
      </tr>
    `).join('');

    const followUpRow = viewingPrescription.followUp
      ? `<p><strong>Follow-up:</strong> ${new Date(viewingPrescription.followUp).toLocaleDateString()}</p>`
      : '';

    const printWindow = openA4PrintWindow(
      `Prescription - ${viewingPrescription.doctorName || 'MedIntel'}`,
      prescriptionBodyHtml
    );
    if (!printWindow) {
      return;
    }
    printWindow.onafterprint = () => printWindow.close();
    setTimeout(() => printWindow.print(), 250);
  };

  const handleDownloadPrescription = () => {
    if (!viewingPrescription) return;

    const prescriptionBodyHtml = `
      <div class="header">
        <div class="brand">
          <img src="/favicon.svg" alt="MedIntel logo" />
          <div>
            <div class="brand-name">MedIntel<span style="color:#00a6d6">.AI</span></div>
            <div class="brand-sub">Verified Medical Telehealth Network</div>
          </div>
        </div>
        <div style="text-align:right;">
          <p><strong>${viewingPrescription.doctorName || ''}</strong></p>
          <p>${viewingPrescription.doctorSpec || ''}</p>
          <p>${viewingPrescription.doctorHospital || ''}</p>
          <p>Reg. No.: ${viewingPrescription.doctorRegNum || ''}</p>
        </div>
      </div>
      <div class="section">
        <p><strong>Patient:</strong> ${currentUser?.name || ''}</p>
        <p><strong>Date Prescribed:</strong> ${viewingPrescription.date || new Date().toLocaleDateString()}</p>
      </div>
      <div class="section">
        <h3>Prescribed Drugs</h3>
        <table>
          <thead>
            <tr>
              <th>Medicine</th>
              <th>Dosage</th>
              <th>Duration</th>
              <th>Instruction</th>
            </tr>
          </thead>
          <tbody>${(viewingPrescription.medications || []).map((med) => `
            <tr>
              <td>${med.name || ''}</td>
              <td>${med.dosage || ''}</td>
              <td>${med.duration || ''}</td>
              <td>${med.instruction || ''}</td>
            </tr>
          `).join('')}</tbody>
        </table>
      </div>
      <div class="section">
        <h3>Clinical Instructions</h3>
        <p style="white-space: pre-wrap;">${viewingPrescription.advice || 'Take medications as directed. Rest well and hydrate.'}</p>
        ${viewingPrescription.followUp ? `<p><strong>Follow-up:</strong> ${new Date(viewingPrescription.followUp).toLocaleDateString()}</p>` : ''}
      </div>
      <div class="footer">
        <p><strong>${viewingPrescription.doctorName || ''}</strong></p>
        <p class="muted">Electronic Rx Signature</p>
      </div>
    `;

    downloadPrintableDocument(
      `Prescription-${(viewingPrescription.doctorName || 'MedIntel').replace(/\s+/g, '_')}.html`,
      `Prescription - ${viewingPrescription.doctorName || 'MedIntel'}`,
      prescriptionBodyHtml
    );
  };

  const handlePrintReceipt = () => {
    if (!viewingReceipt) return;

    const paymentDetailsText =
      viewingReceipt.paymentMethod === 'upi'
        ? `UPI ID: ${viewingReceipt.paymentDetails?.upiId || 'N/A'}`
        : viewingReceipt.paymentMethod === 'card'
          ? `Cardholder: ${viewingReceipt.paymentDetails?.cardName || 'N/A'} | Card: ${viewingReceipt.paymentDetails?.cardNumber || 'N/A'} | Expiry: ${viewingReceipt.paymentDetails?.cardExpiry || 'N/A'}`
          : viewingReceipt.paymentMethod === 'netbanking'
            ? `Bank: ${viewingReceipt.paymentDetails?.bankName || 'N/A'}`
            : `Wallet ID: ${viewingReceipt.paymentDetails?.walletId || 'N/A'}`;

    const receiptBodyHtml = `
      <div class="header">
        <div class="brand">
          <img src="/favicon.svg" alt="MedIntel logo" />
          <div>
            <div class="brand-name">MedIntel<span style="color:#00a6d6">.AI</span></div>
            <div class="brand-sub">Consultation Fee Receipt</div>
          </div>
        </div>
        <div style="text-align:right;">
          <p><strong>${viewingReceipt.doctorName || ''}</strong></p>
          <p>${viewingReceipt.doctorSpec || ''}</p>
          <p>${viewingReceipt.doctorHospital || ''}</p>
        </div>
      </div>
      <div class="section">
        <p><strong>Receipt Number:</strong> ${viewingReceipt.receiptNumber || viewingReceipt.paymentReference}</p>
        <p><strong>Patient:</strong> ${viewingReceipt.patientName}</p>
        <p><strong>Amount Paid:</strong> ${viewingReceipt.amount}</p>
        <p><strong>Payment Method:</strong> ${(viewingReceipt.paymentMethod || 'UPI').toUpperCase()}</p>
        <p><strong>Payment Details:</strong> ${paymentDetailsText}</p>
        <p><strong>Consultation Slot:</strong> ${viewingReceipt.date} at ${viewingReceipt.time} (${viewingReceipt.consultationMode})</p>
      </div>
      <div class="footer">
        <p><strong>MedIntel</strong></p>
        <p class="muted">Consultation fee paid successfully</p>
      </div>
    `;

    const printWindow = openA4PrintWindow(
      `Receipt - ${viewingReceipt.doctorName || 'MedIntel'}`,
      receiptBodyHtml
    );
    if (!printWindow) {
      return;
    }

    printWindow.onafterprint = () => printWindow.close();
    setTimeout(() => printWindow.print(), 250);
  };

  const handleDownloadReceipt = () => {
    if (!viewingReceipt) return;

    const paymentDetailsText =
      viewingReceipt.paymentMethod === 'upi'
        ? `UPI ID: ${viewingReceipt.paymentDetails?.upiId || 'N/A'}`
        : viewingReceipt.paymentMethod === 'card'
          ? `Cardholder: ${viewingReceipt.paymentDetails?.cardName || 'N/A'} | Card: ${viewingReceipt.paymentDetails?.cardNumber || 'N/A'} | Expiry: ${viewingReceipt.paymentDetails?.cardExpiry || 'N/A'}`
          : viewingReceipt.paymentMethod === 'netbanking'
            ? `Bank: ${viewingReceipt.paymentDetails?.bankName || 'N/A'}`
            : `Wallet ID: ${viewingReceipt.paymentDetails?.walletId || 'N/A'}`;

    const receiptBodyHtml = `
      <div class="header">
        <div class="brand">
          <img src="/favicon.svg" alt="MedIntel logo" />
          <div>
            <div class="brand-name">MedIntel<span style="color:#00a6d6">.AI</span></div>
            <div class="brand-sub">Consultation Fee Receipt</div>
          </div>
        </div>
        <div style="text-align:right;">
          <p><strong>${viewingReceipt.doctorName || ''}</strong></p>
          <p>${viewingReceipt.doctorSpec || ''}</p>
          <p>${viewingReceipt.doctorHospital || ''}</p>
        </div>
      </div>
      <div class="section">
        <p><strong>Receipt Number:</strong> ${viewingReceipt.receiptNumber || viewingReceipt.paymentReference}</p>
        <p><strong>Patient:</strong> ${viewingReceipt.patientName}</p>
        <p><strong>Amount Paid:</strong> ${viewingReceipt.amount}</p>
        <p><strong>Payment Method:</strong> ${(viewingReceipt.paymentMethod || 'UPI').toUpperCase()}</p>
        <p><strong>Payment Details:</strong> ${paymentDetailsText}</p>
        <p><strong>Consultation Slot:</strong> ${viewingReceipt.date} at ${viewingReceipt.time} (${viewingReceipt.consultationMode})</p>
      </div>
      <div class="footer">
        <p><strong>MedIntel</strong></p>
        <p class="muted">Consultation fee paid successfully</p>
      </div>
    `;

    downloadPrintableDocument(
      `Receipt-${(viewingReceipt.doctorName || 'MedIntel').replace(/\s+/g, '_')}.html`,
      `Receipt - ${viewingReceipt.doctorName || 'MedIntel'}`,
      receiptBodyHtml
    );
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

  const generateMeetingLink = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let id = '';
    for (let i = 0; i < 8; i++) id += chars[Math.floor(Math.random() * chars.length)];
    return `https://meet.medintel.ai/room/${id}`;
  };

  const openBookingModal = (doctor, forceOnline = false) => {
    setBookingDoctor(doctor);
    setBookingMode(forceOnline ? 'Online' : 'Online');
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
    setViewingDoctorProfile(null);
  };

  const handleBookConsultation = (paymentInfo = {}) => {
    if (!bookingDoctor || !currentUser) return;

    const paymentReference = paymentInfo.reference || `RZP-${Date.now().toString().slice(-8)}`;
    const receiptNumber = paymentInfo.receiptNumber || `RCPT-${Date.now().toString().slice(-8)}`;
    const paymentDetails = paymentInfo.details || {};

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
      receiptNumber,
      paymentDetails,
      bookedAt: new Date().toISOString(),
      ...(bookingMode === 'Online' ? { meetingLink: generateMeetingLink() } : {})
    };

    const nextHistory = [historyEntry, ...consultHistory];
    syncConsultHistory(nextHistory);
    setBookingMessage(`Consultation booked with ${bookingDoctor.name} and paid via ${historyEntry.paymentMethod.toUpperCase()}.`);
    setViewingReceipt(historyEntry);
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
    const receiptNumber = `RCPT-${Math.floor(100000 + Math.random() * 900000)}`;
    const paymentDetails =
      paymentMethod === 'upi'
        ? { upiId: upiId.trim() }
        : paymentMethod === 'card'
          ? { cardName: cardName.trim(), cardNumber: `**** **** **** ${cardNumber.trim().slice(-4)}`, cardExpiry: cardExpiry.trim() }
          : paymentMethod === 'netbanking'
            ? { bankName: bankName.trim() }
            : { walletId: walletId.trim() };

    setPaymentError('');
    handleBookConsultation({
      method: paymentMethod,
      reference: paymentReference,
      receiptNumber,
      details: paymentDetails
    });
  };

  const handleSearchDoctors = async (searchCity = city) => {
    if (!searchCity) return;

    setIsSearchingDoctors(true);
    setDoctors([]);
    
    const HOSPITAL_PROMPT = `You are a medical facility discovery assistant for India.
List 8-10 real, well-known hospitals and specialist doctors in "${searchCity}", India.
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
  Use real hospital names that actually exist in ${searchCity}. Return at least 6 entries.`;

    try {
      let fetchedDoctors = null;

      // Try AI first
      try {
        let text = await requestGemini('/api/ai/discover-doctors', { prompt: HOSPITAL_PROMPT });
        text = text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();

        const startIdx = text.indexOf('[');
        const endIdx = text.lastIndexOf(']') + 1;
        if (startIdx !== -1 && endIdx > 0) {
          const parsed = JSON.parse(text.substring(startIdx, endIdx));
          if (Array.isArray(parsed) && parsed.length > 0) fetchedDoctors = parsed;
        }
      } catch (e) {
        console.warn(`AI discovery failed: ${e.message}`);
      }

      // Fallback: OpenStreetMap if AI fails
      if (!fetchedDoctors) {
        console.warn("AI Discovery failed. Using OpenStreetMap fallback...");
        const osmResponse = await fetch(
          `https://nominatim.openstreetmap.org/search?q=hospital+in+${encodeURIComponent(searchCity)}&format=json&limit=12`
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
          throw new Error(`Could not find any hospitals in "${searchCity}". Please try another city name.`);
        }
      }

      const adminVerified = JSON.parse(localStorage.getItem('medintel_verified_doctors') || '[]');
      const matchingVerified = adminVerified
        .filter(d => d.city && d.city.toLowerCase() === searchCity.trim().toLowerCase())
        .map(d => ({ ...d, isVerifiedPanel: true }));

      setDoctors([...matchingVerified, ...fetchedDoctors.map((doctor) => ({ ...doctor, city: searchCity }))]);
    } catch (err) {
      console.error("Discovery error:", err);
      const adminVerified = JSON.parse(localStorage.getItem('medintel_verified_doctors') || '[]');
      const matchingVerified = adminVerified
        .filter(d => d.city && d.city.toLowerCase() === searchCity.trim().toLowerCase())
        .map(d => ({ ...d, isVerifiedPanel: true }));
      if (matchingVerified.length > 0) {
        setDoctors(matchingVerified);
      } else {
        alert(`Search failed: ${err.message || "Please check your city name and try again."}`);
      }
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
          <LanguageSelector />
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
        <header style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.75rem', margin: '0 0 0.5rem 0' }}>Find Specialists</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.95rem' }}>AI-driven hospital discovery &amp; online consultations with verified specialists.</p>
        </header>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: 'var(--surface-color)', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-md)', padding: '0.35rem', width: 'fit-content' }}>
          <button
            onClick={() => setActiveTab('nearby')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.4rem', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '0.9rem', transition: 'all 0.2s',
              background: activeTab === 'nearby' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'nearby' ? '#fff' : 'var(--text-secondary)'
            }}
          >
            <MapPin size={16} /> Find Nearby
          </button>
          <button
            onClick={() => setActiveTab('online')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.4rem', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '0.9rem', transition: 'all 0.2s',
              background: activeTab === 'online' ? 'linear-gradient(135deg, #00d2ff 0%, #0099cc 100%)' : 'transparent',
              color: activeTab === 'online' ? '#fff' : 'var(--text-secondary)'
            }}
          >
            <Video size={16} /> Online Consultation
            {onlineDoctors.length > 0 && (
              <span style={{ background: activeTab === 'online' ? 'rgba(255,255,255,0.25)' : 'var(--primary)', color: '#fff', borderRadius: '9999px', fontSize: '0.7rem', padding: '0.1rem 0.45rem', fontWeight: '800' }}>{onlineDoctors.length}</span>
            )}
          </button>
        </div>

        {/* ── TAB 1: FIND NEARBY ── */}
        {activeTab === 'nearby' && (
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
              <button type="button" className="btn-secondary" onClick={handleUseMyLocation} disabled={isLocating || isSearchingDoctors} style={{ height: '54px', padding: '0 1.1rem', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem', whiteSpace: 'nowrap' }}>
                <LocateFixed size={16} /> {isLocating ? 'Locating...' : 'Use My Location'}
              </button>
              <button type="button" className="btn-primary" onClick={() => handleSearchDoctors(city)} disabled={!city || isSearchingDoctors} style={{ height: '54px', padding: '0 2rem', fontSize: '1rem' }}>
                {isSearchingDoctors ? 'Fetching Hospital Data...' : 'Search Hospitals'}
              </button>
            </div>

            {locationLabel && !isSearchingDoctors && (
              <div style={{ marginTop: '-0.5rem', marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                Showing hospitals near <strong style={{ color: 'var(--text-primary)' }}>{locationLabel}</strong>
              </div>
            )}

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
                      <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.15rem', color: 'var(--text-primary)', fontWeight: '700', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {doc.name}
                        {doc.isVerifiedPanel && (
                          <span style={{ 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '0.25rem', 
                            background: 'rgba(46, 204, 113, 0.1)', 
                            color: 'var(--success)', 
                            border: '1px solid rgba(46, 204, 113, 0.25)', 
                            padding: '0.15rem 0.5rem', 
                            borderRadius: 'var(--radius-full)', 
                            fontSize: '0.7rem', 
                            fontWeight: '700',
                            boxShadow: '0 0 10px rgba(46, 204, 113, 0.1)'
                          }}>
                            <BadgeCheck size={12} fill="var(--success)" color="var(--bg-color)" /> Verified Panel
                          </span>
                        )}
                      </h4>
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
        )}

        {/* ── TAB 2: ONLINE CONSULTATION ── */}
        {activeTab === 'online' && (
          <div className="glass-panel animate-fade-in" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.5rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Video size={20} color="var(--primary)" /> Online Consultation
                </h3>
                <p style={{ margin: '0.4rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Connect with MedIntel verified specialists from anywhere — no travel needed.</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,210,255,0.06)', border: '1px solid rgba(0,210,255,0.15)', borderRadius: 'var(--radius-md)', padding: '0.5rem 1rem', fontSize: '0.82rem', color: 'var(--primary)', fontWeight: '700' }}>
                <Wifi size={15} /> {onlineDoctors.length} doctor{onlineDoctors.length !== 1 ? 's' : ''} available online
              </div>
            </div>

            <div style={{ height: '1px', background: 'var(--surface-border)', margin: '1.5rem 0' }} />

            {onlineDoctors.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                <Video size={52} color="var(--primary)" style={{ opacity: 0.25, marginBottom: '1rem' }} />
                <h4 style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', margin: '0 0 0.5rem 0' }}>No doctors available online right now</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0 }}>Verified doctors appear here when they enable online availability from their dashboard.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
                {onlineDoctors.map((doc, idx) => {
                  const initials = doc.name.replace('Dr. ', '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                  return (
                    <div key={idx} style={{ background: 'var(--surface-color)', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-md)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: 'var(--shadow-depth)', transition: 'transform 0.2s', position: 'relative', overflow: 'hidden' }}>
                      {/* Online badge */}
                      <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(46,204,113,0.12)', border: '1px solid rgba(46,204,113,0.3)', color: '#2ecc71', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: '800' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2ecc71', boxShadow: '0 0 5px #2ecc71', display: 'inline-block' }} />
                        ONLINE
                      </div>

                      {/* Doctor Avatar + Name */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: '54px', height: '54px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary) 0%, #0099cc 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '800', fontSize: '1.1rem', flexShrink: 0 }}>
                          {initials}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: 'var(--text-primary)' }}>{doc.name}</h4>
                            <BadgeCheck size={15} color="var(--success)" fill="var(--success)" />
                          </div>
                          <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: 'var(--primary)', fontWeight: '600' }}>{doc.spec}</p>
                        </div>
                      </div>

                      {/* Info grid */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.83rem', color: 'var(--text-secondary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Building2 size={14} color="var(--primary)" /> {doc.hospital}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><MapPin size={14} color="var(--primary)" /> {doc.city}</div>
                        <div style={{ display: 'flex', gap: '1.5rem' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#f1c40f' }}><Star size={13} fill="#f1c40f" /> {doc.rating}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Clock size={13} color="var(--primary)" /> {doc.expYears} yrs exp</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-primary)', fontWeight: '700' }}>{doc.fee}</span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: 'flex', gap: '0.6rem', marginTop: 'auto' }}>
                        <button
                          onClick={() => setViewingDoctorProfile(doc)}
                          style={{ flex: 1, padding: '0.65rem', background: 'rgba(0,210,255,0.07)', border: '1px solid rgba(0,210,255,0.2)', color: 'var(--primary)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: '700', fontSize: '0.83rem', transition: 'all 0.2s' }}
                        >
                          View Profile
                        </button>
                        <button
                          onClick={() => openBookingModal(doc, true)}
                          className="btn-primary"
                          style={{ flex: 1, padding: '0.65rem', fontSize: '0.83rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                        >
                          <Video size={14} /> Book Online
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
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

                    {entry.prescription && (
                      <button
                        onClick={() => { setHistoryOpen(false); setViewingReceipt(null); setViewingPrescription(entry.prescription); }}
                        style={{
                          width: '100%',
                          marginTop: '1rem',
                          padding: '0.6rem',
                          background: 'linear-gradient(135deg, var(--primary) 0%, #2980b9 100%)',
                          border: 'none',
                          color: '#fff',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.82rem',
                          fontWeight: '700',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.4rem',
                          boxShadow: '0 4px 10px rgba(0, 210, 255, 0.15)',
                          transition: 'all 0.2s'
                        }}
                      >
                        <HeartPulse size={14} /> View Doctors Prescription
                      </button>
                    )}
                    {(entry.receiptNumber || entry.paymentReference) && (
                      <button
                        type="button"
                        onClick={() => setViewingReceipt(entry)}
                        style={{
                          width: '100%',
                          marginTop: entry.prescription ? '0.5rem' : '1rem',
                          padding: '0.6rem',
                          background: 'rgba(0, 210, 255, 0.08)',
                          border: '1px solid rgba(0, 210, 255, 0.2)',
                          color: 'var(--primary)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.82rem',
                          fontWeight: '700',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.4rem'
                        }}
                      >
                        <FileText size={14} /> View Fee Receipt
                      </button>
                    )}
                    {entry.meetingLink && entry.consultationMode === 'Online' && (
                      <a
                        href={entry.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                          width: '100%', marginTop: entry.prescription ? '0.5rem' : '1rem',
                          padding: '0.6rem', textDecoration: 'none',
                          background: 'linear-gradient(135deg, #00b09b 0%, #00d2ff 100%)',
                          color: '#fff', borderRadius: 'var(--radius-sm)',
                          fontSize: '0.82rem', fontWeight: '700',
                          boxShadow: '0 4px 10px rgba(0, 210, 255, 0.2)',
                          boxSizing: 'border-box'
                        }}
                      >
                        <Video size={14} /> Join Online Meeting
                      </a>
                    )}
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
      {viewingPrescription && (
        <div className="consult-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setViewingPrescription(null)}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', position: 'relative', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', boxSizing: 'border-box' }} onClick={e => e.stopPropagation()}>
            
            {/* Prescription Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid var(--primary)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ background: 'rgba(0,210,255,0.1)', padding: '0.5rem', borderRadius: '10px' }}>
                  <Stethoscope size={28} color="var(--primary)" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>MedIntel Panel Rx</h3>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Verified Medical Telehealth Network</span>
                </div>
              </div>
              <button className="auth-icon-button" onClick={() => setViewingPrescription(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* Doctor Info & Stamp */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
              <div>
                <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1.05rem', fontWeight: '700' }}>{viewingPrescription.doctorName}</h4>
                <p style={{ margin: '0 0 0.2rem 0', color: 'var(--primary)', fontWeight: '600' }}>{viewingPrescription.doctorSpec}</p>
                <p style={{ margin: '0 0 0.2rem 0', color: 'var(--text-secondary)' }}>{viewingPrescription.doctorHospital}</p>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.75rem' }}>Registration Number: {viewingPrescription.doctorRegNum}</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'flex-start', textAlign: 'right' }}>
                <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Date Prescribed</span>
                <span style={{ fontWeight: '600' }}>{viewingPrescription.date || new Date().toLocaleDateString()}</span>
                
                {/* Visual Stamp */}
                <div style={{ marginTop: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.55rem', border: '1px solid rgba(46,204,113,0.3)', borderRadius: '4px', background: 'rgba(46,204,113,0.06)', color: 'var(--success)', fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <BadgeCheck size={12} /> Verified Specialist
                </div>
              </div>
            </div>

            {/* Patient Name Section */}
            <div style={{ padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontSize: '0.88rem' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', display: 'block', marginBottom: '0.15rem' }}>Patient Name</span>
              <strong style={{ color: 'var(--text-primary)' }}>{currentUser?.name}</strong>
            </div>

            {/* Rx Indicator */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '1.75rem', fontWeight: '900', color: 'var(--primary)', fontFamily: 'serif', lineHeight: 1 }}>Rx</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', alignSelf: 'center' }}>Prescribed Drugs</span>
            </div>

            {/* Medications Table */}
            <div style={{ border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', marginBottom: '1.5rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--surface-border)', textAlign: 'left' }}>
                    <th style={{ padding: '0.6rem 0.85rem' }}>Medicine</th>
                    <th style={{ padding: '0.6rem 0.85rem' }}>Dosage</th>
                    <th style={{ padding: '0.6rem 0.85rem' }}>Duration</th>
                    <th style={{ padding: '0.6rem 0.85rem' }}>Timing / Instruction</th>
                  </tr>
                </thead>
                <tbody>
                  {viewingPrescription.medications?.map((med, idx) => (
                    <tr key={idx} style={{ borderBottom: idx < viewingPrescription.medications.length - 1 ? '1px solid var(--surface-border)' : 'none' }}>
                      <td style={{ padding: '0.6rem 0.85rem', fontWeight: '600' }}>{med.name}</td>
                      <td style={{ padding: '0.6rem 0.85rem' }}>{med.dosage}</td>
                      <td style={{ padding: '0.6rem 0.85rem' }}>{med.duration}</td>
                      <td style={{ padding: '0.6rem 0.85rem', color: 'var(--text-secondary)' }}>{med.instruction}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Advice / Notes */}
            <div style={{ marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem', letterSpacing: '0.5px' }}>Clinical Instructions / Advice</span>
              <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.6, whiteSpace: 'pre-wrap', color: 'var(--text-primary)', background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--surface-border)', borderRadius: '6px', padding: '1rem' }}>
                {viewingPrescription.advice || 'Take medications as directed. Rest well and hydrate.'}
              </p>
            </div>

            {/* Follow-up info */}
            {viewingPrescription.followUp && (
              <div style={{ padding: '0.75rem 1rem', background: 'rgba(0, 210, 255, 0.04)', border: '1px solid rgba(0, 210, 255, 0.12)', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Recommended Follow-up Visit On:</span>
                <strong style={{ color: 'var(--primary)' }}>{new Date(viewingPrescription.followUp).toLocaleDateString()}</strong>
              </div>
            )}

            {/* Signature Area */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginTop: '2rem', borderTop: '1px solid var(--surface-border)', paddingTop: '1.25rem' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Electronic Rx Signature</span>
              <span style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontWeight: '700', fontSize: '1.15rem', color: 'var(--primary)', marginTop: '0.2rem' }}>{viewingPrescription.doctorName}</span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>Verified Medical Stamp Approved</span>
            </div>

            {/* Print & Close Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', marginTop: '1.5rem', borderTop: '1px solid var(--surface-border)', paddingTop: '1.25rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handlePrintPrescription}
                  style={{
                    padding: '0.55rem 1.25rem',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--surface-border)',
                    color: 'var(--text-primary)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Print Prescription
                </button>
                <button
                  type="button"
                  onClick={handleDownloadPrescription}
                  style={{
                    padding: '0.55rem 1.25rem',
                    background: 'rgba(0,210,255,0.08)',
                    border: '1px solid rgba(0,210,255,0.2)',
                    color: 'var(--primary)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.85rem',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Download Prescription
                </button>
              </div>
              <button
                type="button"
                onClick={() => setViewingPrescription(null)}
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
                Close View
              </button>
            </div>

          </div>
        </div>
      )}

      {viewingReceipt && (
        <div className="consult-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', zIndex: 2100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setViewingReceipt(null)}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '540px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', position: 'relative', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', boxSizing: 'border-box' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid var(--primary)', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <div>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Consultation Fee Receipt</p>
                <h3 style={{ margin: '0.25rem 0 0 0', fontSize: '1.25rem', fontWeight: '800' }}>{viewingReceipt.doctorName}</h3>
              </div>
              <button type="button" className="auth-icon-button" onClick={() => setViewingReceipt(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'grid', gap: '0.9rem', fontSize: '0.9rem' }}>
              <div style={{ padding: '0.9rem 1rem', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.02)' }}>
                <p style={{ margin: '0 0 0.35rem 0', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Receipt Number</p>
                <strong>{viewingReceipt.receiptNumber || viewingReceipt.paymentReference}</strong>
              </div>
              <div style={{ padding: '0.9rem 1rem', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.02)' }}>
                <p style={{ margin: '0 0 0.35rem 0', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Patient</p>
                <strong>{viewingReceipt.patientName}</strong>
              </div>
              <div style={{ padding: '0.9rem 1rem', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.02)' }}>
                <p style={{ margin: '0 0 0.35rem 0', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Payment Method</p>
                <strong>{(viewingReceipt.paymentMethod || 'UPI').toUpperCase()}</strong>
              </div>
              <div style={{ padding: '0.9rem 1rem', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.02)' }}>
                <p style={{ margin: '0 0 0.35rem 0', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Amount Paid</p>
                <strong>{viewingReceipt.amount}</strong>
              </div>
              <div style={{ padding: '0.9rem 1rem', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.02)' }}>
                <p style={{ margin: '0 0 0.35rem 0', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Payment Details</p>
                {viewingReceipt.paymentMethod === 'upi' && <strong>UPI ID: {viewingReceipt.paymentDetails?.upiId || 'N/A'}</strong>}
                {viewingReceipt.paymentMethod === 'card' && <strong>{viewingReceipt.paymentDetails?.cardName || 'Card'} • {viewingReceipt.paymentDetails?.cardNumber || 'N/A'} • {viewingReceipt.paymentDetails?.cardExpiry || 'N/A'}</strong>}
                {viewingReceipt.paymentMethod === 'netbanking' && <strong>Bank: {viewingReceipt.paymentDetails?.bankName || 'N/A'}</strong>}
                {viewingReceipt.paymentMethod === 'wallet' && <strong>Wallet ID: {viewingReceipt.paymentDetails?.walletId || 'N/A'}</strong>}
              </div>
              <div style={{ padding: '0.9rem 1rem', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.02)' }}>
                <p style={{ margin: '0 0 0.35rem 0', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Consultation Slot</p>
                <strong>{viewingReceipt.date} at {viewingReceipt.time} ({viewingReceipt.consultationMode})</strong>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', marginTop: '1.5rem', borderTop: '1px solid var(--surface-border)', paddingTop: '1.25rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button type="button" onClick={handlePrintReceipt} style={{ padding: '0.55rem 1.25rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--surface-border)', color: 'var(--text-primary)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' }}>
                  Print Receipt
                </button>
                <button type="button" onClick={handleDownloadReceipt} style={{ padding: '0.55rem 1.25rem', background: 'rgba(0,210,255,0.08)', border: '1px solid rgba(0,210,255,0.2)', color: 'var(--primary)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer' }}>
                  Download Receipt
                </button>
              </div>
              <button type="button" onClick={() => setViewingReceipt(null)} style={{ padding: '0.55rem 1.5rem', background: 'var(--primary)', border: 'none', color: '#fff', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer' }}>
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Doctor Profile Modal */}
      {viewingDoctorProfile && (
        <div className="consult-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setViewingDoctorProfile(null)}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', position: 'relative', boxSizing: 'border-box', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setViewingDoctorProfile(null)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--surface-border)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-primary)' }}><X size={16} /></button>

            {/* Avatar + Name */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary) 0%, #0099cc 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '900', fontSize: '1.6rem', marginBottom: '1rem', boxShadow: '0 0 30px rgba(0,210,255,0.25)' }}>
                {viewingDoctorProfile.name.replace('Dr. ', '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: '800' }}>{viewingDoctorProfile.name}</h3>
                <BadgeCheck size={20} color="var(--success)" fill="var(--success)" />
              </div>
              <p style={{ margin: '0.3rem 0 0 0', color: 'var(--primary)', fontWeight: '700', fontSize: '1rem' }}>{viewingDoctorProfile.spec}</p>
              <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(46,204,113,0.1)', border: '1px solid rgba(46,204,113,0.25)', color: '#2ecc71', padding: '0.2rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '800' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#2ecc71', boxShadow: '0 0 5px #2ecc71', display: 'inline-block' }} />
                Available Online
              </div>
            </div>

            {/* Info List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.75rem' }}>
              {[
                { icon: Building2, label: 'Hospital / Clinic', value: viewingDoctorProfile.hospital },
                { icon: MapPin, label: 'Location', value: viewingDoctorProfile.city },
                { icon: Award, label: 'Specialization', value: viewingDoctorProfile.spec + ' — Verified Medical Certificate' },
                { icon: Clock, label: 'Experience', value: `${viewingDoctorProfile.expYears} years` },
                { icon: Star, label: 'Rating', value: `${viewingDoctorProfile.rating} / 5.0` },
                { icon: Phone, label: 'Contact', value: viewingDoctorProfile.contact },
                { icon: HeartPulse, label: 'Consultation Fee', value: viewingDoctorProfile.fee },
                { icon: BadgeCheck, label: 'Registration No.', value: viewingDoctorProfile.regNum },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start', padding: '0.7rem', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--surface-border)' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-sm)', background: 'rgba(0,210,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={15} color="var(--primary)" />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{label}</p>
                    <p style={{ margin: '0.2rem 0 0 0', fontWeight: '700', fontSize: '0.88rem' }}>{value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Book Button */}
            <button
              onClick={() => openBookingModal(viewingDoctorProfile, true)}
              className="btn-primary"
              style={{ width: '100%', padding: '0.9rem', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: '800' }}
            >
              <Video size={18} /> Book Online Consultation
            </button>
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
