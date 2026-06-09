import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Auth } from '../services/auth';
import './Tournaments.css';

const Tournaments = () => {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(Auth.getSession());

  // Modal registration state
  const [showModal, setShowModal] = useState(false);
  const [currentTournament, setCurrentTournament] = useState(null);
  const [step, setStep] = useState(1);

  // Step 1 fields
  const [teamName, setTeamName] = useState('');
  const [email, setEmail] = useState('');
  const [agree, setAgree] = useState(false);
  const [step1Errors, setStep1Errors] = useState({});

  // Step 2 fields
  const [cardholder, setCardholder] = useState('');
  const [cardNum, setCardNum] = useState('');
  const [cardBrand, setCardBrand] = useState('💳');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [step2Errors, setStep2Errors] = useState({});
  const [processingPayment, setProcessingPayment] = useState(false);

  // Success date display
  const [successDate, setSuccessDate] = useState('');

  const loadTournaments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tournaments');
      const data = await res.json();
      setTournaments(data);
    } catch (err) {
      console.error('Could not load tournaments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTournaments();
    setSession(Auth.getSession());
  }, []);

  const openRegModal = (t) => {
    if (!Auth.isLoggedIn()) {
      // Show login warning deep in page container or scroll down, but here we can show standard alert or redirect
      alert('Authentication required: You must be signed in to register for tournaments.');
      window.location.href = '/login';
      return;
    }
    setCurrentTournament(t);
    setTeamName('');
    setEmail(session?.email || '');
    setAgree(false);
    setStep1Errors({});
    
    setCardholder('');
    setCardNum('');
    setCardBrand('💳');
    setExpiry('');
    setCvv('');
    setStep2Errors({});
    setProcessingPayment(false);

    setStep(1);
    setShowModal(true);
  };

  const handleStep1Submit = (e) => {
    e.preventDefault();
    setStep1Errors({});
    let errors = {};
    let valid = true;

    if (!teamName.trim()) {
      errors.teamName = 'Team/player name is required.';
      valid = false;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Valid email is required.';
      valid = false;
    }
    if (!agree) {
      errors.agree = 'You must agree to the rules.';
      valid = false;
    }

    if (!valid) {
      setStep1Errors(errors);
      return;
    }
    setStep(2);
  };

  const handleCardNumberChange = (e) => {
    let val = e.target.value.replace(/\D/g, '').substring(0, 16);
    setCardNum(val.replace(/(.{4})/g, '$1 ').trim());
    
    if (val.startsWith('4')) setCardBrand('Visa 💳');
    else if (val.startsWith('5')) setCardBrand('Mastercard 💳');
    else if (val.startsWith('3')) setCardBrand('Amex 💳');
    else setCardBrand('💳');
  };

  const handleExpiryChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length >= 2) {
      val = val.substring(0, 2) + '/' + val.substring(2, 4);
    }
    setExpiry(val);
  };

  const handleStep2Submit = async (e) => {
    e.preventDefault();
    setStep2Errors({});
    let errors = {};
    let valid = true;

    if (!cardholder.trim()) {
      errors.cardholder = 'Cardholder name is required.';
      valid = false;
    }
    const rawCardNum = cardNum.replace(/\s/g, '');
    if (rawCardNum.length !== 16 || !/^\d+$/.test(rawCardNum)) {
      errors.cardNum = 'Enter a valid 16-digit card number.';
      valid = false;
    }
    if (!/^\d{2}\/\d{2}$/.test(expiry)) {
      errors.expiry = 'Format: MM/YY.';
      valid = false;
    } else {
      const parts = expiry.split('/');
      const m = parseInt(parts[0], 10);
      if (m < 1 || m > 12) {
        errors.expiry = 'Month must be 01-12.';
        valid = false;
      }
    }
    if (cvv.length < 3) {
      errors.cvv = 'Enter 3-4 digit CVV.';
      valid = false;
    }

    if (!valid) {
      setStep2Errors(errors);
      return;
    }

    setProcessingPayment(true);
    // Simulate transaction processing
    await new Promise((resolve) => setTimeout(resolve, 1500));

    try {
      const token = Auth.getToken();
      const res = await fetch(`/api/tournaments/${currentTournament.id}/register`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ teamName: teamName.trim() })
      });
      const data = await res.json();
      if (!res.ok) {
        setProcessingPayment(false);
        setStep2Errors({ cardholder: data.error || 'Registration failed.' });
        return;
      }

      setSuccessDate(new Date(currentTournament.start_date).toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
      }));
      setStep(3);
      loadTournaments();
    } catch (err) {
      setProcessingPayment(false);
      setStep2Errors({ cardholder: 'Server error. Please try again.' });
    }
  };

  return (
    <div className="page-container fade-in">
      <section className="page-hero">
        <h1>🏆 Tournaments</h1>
        <p>Register, compete, and claim your place in the Hall of Shadows</p>
      </section>

      <section className="content-section">
        <h2 className="section-title">Active Tournaments</h2>
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading tournaments...</p>
          </div>
        ) : tournaments.length === 0 ? (
          <p className="no-tournaments-txt">No active tournaments listed at this time.</p>
        ) : (
          <div className="tournament-grid">
            {tournaments.map((t) => {
              const registered = t.registered_count || t.current_slots || 0;
              const pct = Math.min(100, (registered / t.max_slots) * 100);
              const isClosed = t.status === 'closed' || registered >= t.max_slots;
              const fmtDate = new Date(t.start_date).toLocaleDateString('en-US', { 
                month: 'short', day: 'numeric', year: 'numeric' 
              });

              return (
                <div key={t.id} className="tournament-card glass-panel">
                  <span className={`t-status-badge t-status-${t.status}`}>
                    {t.status.toUpperCase()}
                  </span>
                  <h2>{t.name}</h2>
                  <p className="t-game-tag">🎮 {t.game}</p>
                  <p className="t-desc">{t.description}</p>
                  
                  <div className="t-meta-grid">
                    <div className="t-meta-item">
                      <span className="tm-label">Prize Pool</span>
                      <span className="tm-val t-prize">{t.prize_pool}</span>
                    </div>
                    <div className="t-meta-item">
                      <span className="tm-label">Entry Fee</span>
                      <span className="tm-val">{t.entry_fee === 0 ? 'FREE' : '$' + t.entry_fee}</span>
                    </div>
                    <div className="t-meta-item">
                      <span className="tm-label">Start Date</span>
                      <span className="tm-val">{fmtDate}</span>
                    </div>
                    <div className="t-meta-item">
                      <span className="tm-label">Slots</span>
                      <span className="tm-val">{registered}/{t.max_slots}</span>
                    </div>
                  </div>

                  <div className="t-slots-bar">
                    <div className="t-slots-fill" style={{ width: `${pct}%` }}></div>
                  </div>
                  <p className="t-slots-text">{t.max_slots - registered} slots remaining</p>
                  
                  <button 
                    className="btn-register btn-primary" 
                    disabled={isClosed} 
                    onClick={() => openRegModal(t)}
                  >
                    {isClosed ? '🔒 Closed' : '⚔️ Register Now'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* REGISTRATION MODAL */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box tournament-modal glass-panel" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>

            <div className="modal-header-top">
              <div className="trophy-icon">🏆</div>
              <h2>{currentTournament?.name}</h2>
              <p className="modal-game-badge">🎮 {currentTournament?.game}</p>
            </div>

            <div className="reg-info-row">
              <div className="reg-info-item">
                <span className="reg-label">Prize Pool</span>
                <span className="reg-value gold">{currentTournament?.prize_pool}</span>
              </div>
              <div className="reg-info-item">
                <span className="reg-label">Entry Fee</span>
                <span className="reg-value">{currentTournament?.entry_fee === 0 ? 'FREE' : '$' + currentTournament?.entry_fee}</span>
              </div>
              <div className="reg-info-item">
                <span className="reg-label">Slots Left</span>
                <span className="reg-value">{currentTournament?.max_slots - (currentTournament?.registered_count || currentTournament?.current_slots || 0)}</span>
              </div>
              <div className="reg-info-item">
                <span className="reg-label">Start Date</span>
                <span className="reg-value">
                  {new Date(currentTournament?.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            </div>

            {/* STEP 1: Details */}
            {step === 1 && (
              <div className="reg-step">
                <h3>Step 1 &mdash; Registration Details</h3>
                <form onSubmit={handleStep1Submit} noValidate>
                  <div className="input-group">
                    <label htmlFor="regTeamName">Team / Player Name *</label>
                    <input 
                      type="text" 
                      id="regTeamName" 
                      placeholder="Enter your team or solo handle" 
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      className={step1Errors.teamName ? 'invalid' : ''}
                      required
                    />
                    {step1Errors.teamName && <small className="error">{step1Errors.teamName}</small>}
                  </div>

                  <div className="input-group">
                    <label htmlFor="regEmail">Contact Email *</label>
                    <input 
                      type="email" 
                      id="regEmail" 
                      placeholder="your@email.com" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={step1Errors.email ? 'invalid' : ''}
                      required
                    />
                    {step1Errors.email && <small className="error">{step1Errors.email}</small>}
                  </div>

                  <div className="input-group rules-agreement">
                    <label htmlFor="regAgree" className="agree-checkbox-lbl">
                      <input 
                        type="checkbox" 
                        id="regAgree" 
                        checked={agree}
                        onChange={(e) => setAgree(e.target.checked)}
                      />
                      <span>I agree to the tournament rules and code of conduct</span>
                    </label>
                    {step1Errors.agree && <small className="error">{step1Errors.agree}</small>}
                  </div>

                  <button type="submit" className="btn-submit">
                    Continue to Payment &rarr;
                  </button>
                </form>
              </div>
            )}

            {/* STEP 2: Payment */}
            {step === 2 && (
              <div className="reg-step">
                <h3>Step 2 &mdash; Secure Payment</h3>
                <div className="payment-secure-badge">🔒 256-bit SSL Encrypted</div>
                
                <form onSubmit={handleStep2Submit} noValidate>
                  <div className="input-group">
                    <label htmlFor="cardName">Cardholder Name *</label>
                    <input 
                      type="text" 
                      id="cardName" 
                      placeholder="Name on card" 
                      value={cardholder}
                      onChange={(e) => setCardholder(e.target.value)}
                      className={step2Errors.cardholder ? 'invalid' : ''}
                      required
                    />
                    {step2Errors.cardholder && <small className="error">{step2Errors.cardholder}</small>}
                  </div>

                  <div className="input-group">
                    <label htmlFor="cardNumber">Card Number *</label>
                    <div className="card-input-wrap">
                      <input 
                        type="text" 
                        id="cardNumber" 
                        placeholder="1234 5678 9012 3456" 
                        value={cardNum}
                        onChange={handleCardNumberChange}
                        className={step2Errors.cardNum ? 'invalid' : ''}
                        maxLength="19"
                        required
                      />
                      <span className="card-brand-tag">{cardBrand}</span>
                    </div>
                    {step2Errors.cardNum && <small className="error">{step2Errors.cardNum}</small>}
                  </div>

                  <div className="card-expiry-cvv-row">
                    <div className="input-group">
                      <label htmlFor="cardExpiry">Expiry *</label>
                      <input 
                        type="text" 
                        id="cardExpiry" 
                        placeholder="MM/YY" 
                        value={expiry}
                        onChange={handleExpiryChange}
                        maxLength="5"
                        className={step2Errors.expiry ? 'invalid' : ''}
                        required
                      />
                      {step2Errors.expiry && <small className="error">{step2Errors.expiry}</small>}
                    </div>

                    <div className="input-group">
                      <label htmlFor="cardCVV">CVV *</label>
                      <input 
                        type="text" 
                        id="cardCVV" 
                        placeholder="•••" 
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').substring(0, 4))}
                        maxLength="4"
                        className={step2Errors.cvv ? 'invalid' : ''}
                        required
                      />
                      {step2Errors.cvv && <small className="error">{step2Errors.cvv}</small>}
                    </div>
                  </div>

                  <div className="payment-amount-box">
                    <span>Total Due</span>
                    <span className="amount-value">
                      {currentTournament?.entry_fee === 0 ? 'FREE' : '$' + currentTournament?.entry_fee}
                    </span>
                  </div>

                  <button type="submit" className="btn-submit btn-pay" disabled={processingPayment}>
                    {processingPayment ? '⏳ Processing...' : 'Pay & Register'}
                  </button>
                  <button type="button" className="btn-back-link" onClick={() => setStep(1)} disabled={processingPayment}>
                    &larr; Back to details
                  </button>
                </form>
              </div>
            )}

            {/* STEP 3: Success */}
            {step === 3 && (
              <div className="reg-step success-step-view">
                <div className="success-animation-icon">✓</div>
                <h2>Registered!</h2>
                <p>You have successfully registered for <strong>{currentTournament?.name}</strong></p>
                
                <div className="success-details-card">
                  <p>📧 Confirmation sent to: <strong>{email}</strong></p>
                  <p>📅 Match starts: <strong>{successDate}</strong></p>
                </div>

                <button className="btn-submit" onClick={() => setShowModal(false)}>
                  Close Terminal
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Tournaments;
