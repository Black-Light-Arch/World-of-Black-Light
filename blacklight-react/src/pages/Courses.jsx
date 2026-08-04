import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Clock, Award, Trophy, Users, Search, 
  ArrowRight, BookOpen, Download, CreditCard, X, 
  CheckCircle, ShieldCheck, Flame, Gift, Video, Calendar,
  HelpCircle, ChevronRight, Zap
} from 'lucide-react';
import './Courses.css';

const Courses = () => {
  // Course Data State
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Enrollment Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSyllabusModalOpen, setIsSyllabusModalOpen] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    whatsapp: '',
    experience_level: 'Beginner',
    payment_method: 'JazzCash',
    notes: ''
  });
  
  const [enrollStep, setEnrollStep] = useState(1); // 1: Details, 2: OTP
  const [otpCode, setOtpCode] = useState('');
  const [otpSentMsg, setOtpSentMsg] = useState('');
  const [paymentProof, setPaymentProof] = useState('');
  const [proofFileName, setProofFileName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [enrollmentSuccess, setEnrollmentSuccess] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setErrorMessage('File size is too large (max 10MB).');
        return;
      }
      setProofFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentProof(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Auto-fill logged-in user details if available, but open for guest users too
  useEffect(() => {
    fetch('/api/courses')
      .then(res => res.json())
      .then(data => {
        if (data.courses && data.courses.length > 0) {
          setCourse(data.courses[0]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load courses from API:', err);
        setLoading(false);
      });

    // Check if user is logged in to prefill form
    const session = Auth.getSession();
    if (session) {
      setFormData(prev => ({
        ...prev,
        full_name: `${session.firstName || ''} ${session.lastName || ''}`.trim() || prev.full_name,
        email: session.email || prev.email
      }));
    }
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSendOtp = (e) => {
    e.preventDefault();
    if (!formData.full_name || !formData.email || !formData.phone || !formData.payment_method) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    fetch('/api/courses/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: formData.email, full_name: formData.full_name })
    })
      .then(res => res.json())
      .then(data => {
        setSubmitting(false);
        if (data.success) {
          setEnrollStep(2);
          setOtpSentMsg(data.message);
          if (data.otpCode) {
            setOtpSentMsg(`Code sent to ${formData.email}! (Verification Code: ${data.otpCode})`);
          }
        } else {
          setErrorMessage(data.error || 'Failed to send verification code.');
        }
      })
      .catch(() => {
        setSubmitting(false);
        setErrorMessage('Network error while sending verification code.');
      });
  };

  const handleEnrollSubmit = (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length !== 6) {
      setErrorMessage('Please enter the valid 6-digit verification code.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    fetch('/api/courses/enroll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formData, otp_code: otpCode.trim(), payment_proof: paymentProof })
    })
      .then(res => res.json())
      .then(data => {
        setSubmitting(false);
        if (data.success) {
          setEnrollmentSuccess(data.enrollment);
          // Auto-trigger WhatsApp notification send to Admin (+92 320 2200163)!
          if (data.whatsappUrl || data.enrollment?.whatsappUrl) {
            const url = data.whatsappUrl || data.enrollment.whatsappUrl;
            window.open(url, '_blank');
          }
        } else {
          setErrorMessage(data.error || 'Failed to submit enrollment.');
        }
      })
      .catch(err => {
        setSubmitting(false);
        setErrorMessage('Network error. Please try again.');
      });
  };

  // Static fallback metadata in case backend is loading/offline
  const activeCourse = course || {
    id: 'ai-bootcamp',
    title: 'AI CREATIVE SKILLS BOOTCAMP',
    subtitle: '1-Month Live Mentorship Program',
    headline: 'Transform Your Skills. Build Your Future.',
    description: "A complete skill-building program designed for students, beginners, freelancers, and aspiring creators to master today's most in-demand digital skills through live mentorship, practical projects, and daily guidance.",
    duration: '1 Month (30 Days)',
    mode: 'Online Live Mentorship',
    support: 'Morning to Night Support',
    certificate: 'E-Certificate Included',
    pricing: {
      formattedOriginal: 'Rs. 7,000',
      formattedDiscounted: 'Rs. 4,500',
      formattedSavings: 'Save Rs. 2,500'
    },
    cashPrizes: [
      { rank: '1st Place', prize: 'Rs. 5,000', icon: '🥇' },
      { rank: '2nd Place', prize: 'Rs. 3,000', icon: '🥈' },
      { rank: '3rd Place', prize: 'Rs. 1,000', icon: '🥉' }
    ],
    modules: [
      {
        id: 'ai-automation',
        icon: '🤖',
        title: 'AI Automation',
        topics: [
          'Introduction to Artificial Intelligence',
          'Understanding how AI works',
          'Prompt Engineering',
          'AI for productivity',
          'AI for studying and research',
          'AI for presentations',
          'AI image generation',
          'AI content creation',
          'Automating daily tasks using AI tools'
        ]
      },
      {
        id: 'photoshop',
        icon: '🎨',
        title: 'Adobe Photoshop',
        topics: [
          'Photoshop Interface',
          'Photo Editing',
          'Background Removal',
          'Image Retouching',
          'Color Correction',
          'Social Media Designs',
          'Professional Editing Techniques'
        ]
      },
      {
        id: 'poster-design',
        icon: '🖼',
        title: 'Poster Designing',
        topics: [
          'Design Principles',
          'Color Theory',
          'Typography',
          'Event Posters',
          'Social Media Posters',
          'Advertisement Designs',
          'Professional Poster Creation'
        ]
      },
      {
        id: '3d-character',
        icon: '🎭',
        title: '3D Character Creation',
        topics: [
          'Introduction to 3D',
          'Character Modeling Basics',
          'Character Design Workflow',
          'Texturing',
          'Exporting Models',
          'Beginner Industry Practices'
        ]
      },
      {
        id: 'canva-masterclass',
        icon: '🎯',
        title: 'Canva Masterclass',
        topics: [
          'Canva Basics',
          'Social Media Designs',
          'Resume Design',
          'Presentation Design',
          'Flyers & Brochures',
          'Business Branding',
          'Content Creation'
        ]
      },
      {
        id: 'typing-bonus',
        icon: '⌨',
        title: 'Bonus Surprise: Typing Practice',
        isBonus: true,
        topics: [
          'Typing Speed Improvement',
          'Typing Accuracy Building',
          'Productivity & Keyboard Efficiency',
          'Daily Typing Practice Resources Provided'
        ]
      }
    ],
    whoCanJoin: [
      'Beginners',
      'School Students',
      'College Students',
      'University Students',
      'Freelancers',
      'Job Seekers',
      'Content Creators',
      'Graphic Designers',
      'Anyone interested in modern digital skills'
    ],
    learningExperience: [
      { icon: '✅', title: 'Live Interactive Classes', desc: 'Learn directly from the instructor with live sessions.' },
      { icon: '✅', title: 'Recorded Video Lectures', desc: 'Replay every lecture anytime for revision.' },
      { icon: '✅', title: 'Live Mentorship', desc: 'Receive personal guidance throughout the entire course.' },
      { icon: '✅', title: 'Morning to Night Question Support', desc: 'Ask your questions throughout the day and receive assistance whenever needed.' }
    ],
    dailyRoutine: [
      'AI Exploration Tasks',
      'Photoshop Practice',
      'Canva Assignments',
      'Poster Designing',
      '3D Character Practice',
      'Mini Projects',
      'Design Challenges',
      'Typing Practice',
      'Revision Exercises'
    ]
  };

  // Filter modules based on tab or search
  const filteredModules = activeCourse.modules.filter(mod => {
    const matchesTab = activeTab === 'all' || mod.id === activeTab;
    const matchesSearch = searchQuery === '' || 
      mod.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mod.topics.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTab && matchesSearch;
  });

  return (
    <div className="page-container courses-page fade-in">
      {/* PROMO TOPBAR */}
      <div className="courses-promo-topbar">
        <span className="courses-promo-tag">⚡ LIMITED TIME OFFER</span>
        <span>Enroll today in <strong>AI Creative Skills Bootcamp</strong> & Save <strong>Rs. 2,500</strong>!</span>
        <span className="countdown-pill">🔥 Seats Closing Soon</span>
      </div>

      <div className="content-section">
        {/* HERO BOOTCAMP CARD */}
        <div className="bootcamp-hero-card">
          <div className="bootcamp-hero-content">
            <div className="bootcamp-badge-row">
              <span className="badge-live-mentorship">
                <Sparkles size={14} /> 1-MONTH LIVE MENTORSHIP
              </span>
              <span className="badge-certified">
                <Award size={14} /> OFFICIAL E-CERTIFICATE
              </span>
            </div>

            <h1 className="bootcamp-title">{activeCourse.title}</h1>
            <h3 className="bootcamp-subtitle">{activeCourse.headline}</h3>
            <p className="bootcamp-desc">{activeCourse.description}</p>

            {/* PRICING HERO BOX */}
            <div className="pricing-hero-box">
              <div>
                <div className="price-strike">Original Fee: {activeCourse.pricing?.formattedOriginal || 'Rs. 7,000'}</div>
                <div className="price-current">{activeCourse.pricing?.formattedDiscounted || 'Rs. 4,500'}</div>
              </div>
              <div className="price-save-badge">
                🎉 {activeCourse.pricing?.formattedSavings || 'Save Rs. 2,500'}
              </div>
            </div>

            {/* HERO CTA BUTTONS */}
            <div className="hero-actions-row">
              <button className="btn-primary btn-enroll-now" onClick={() => setIsModalOpen(true)}>
                🚀 ENROLL NOW &rarr;
              </button>
              <button className="btn-secondary btn-syllabus" onClick={() => setIsSyllabusModalOpen(true)}>
                <BookOpen size={16} style={{ marginRight: 6 }} /> View Full Syllabus
              </button>
            </div>
          </div>

          <div className="bootcamp-hero-media">
            <img 
              src="/assets/images/courses/ai_bootcamp_hero.png" 
              alt="AI Creative Skills Bootcamp" 
              className="bootcamp-hero-img"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/assets/images/screenshots/game1.jpg';
              }}
            />
            <div className="bootcamp-media-overlay"></div>
            
            <div className="hero-stats-badge">
              <div className="stat-icon">🏆</div>
              <div className="stat-info">
                <h4>Cash Prizes Included</h4>
                <p>Rs. 5,000 • Rs. 3,000 • Rs. 1,000</p>
              </div>
            </div>
          </div>
        </div>

        {/* QUICK SPECS SUMMARY CARDS */}
        <div className="course-specs-grid">
          <div className="spec-card glass-panel glow-hover">
            <div className="spec-icon">📅</div>
            <h3>Duration</h3>
            <p>{activeCourse.duration}</p>
          </div>
          <div className="spec-card glass-panel glow-hover">
            <div className="spec-icon">🌐</div>
            <h3>Learning Mode</h3>
            <p>{activeCourse.mode}</p>
          </div>
          <div className="spec-card glass-panel glow-hover">
            <div className="spec-icon">💬</div>
            <h3>Q&A Support</h3>
            <p>{activeCourse.support}</p>
          </div>
          <div className="spec-card glass-panel glow-hover">
            <div className="spec-icon">📜</div>
            <h3>Certification</h3>
            <p>{activeCourse.certificate}</p>
          </div>
        </div>

        {/* WHAT YOU'LL LEARN - CURRICULUM SECTION */}
        <div className="curriculum-container">
          <div className="section-header-box">
            <h2>📚 What You'll Learn</h2>
            <p>Master 6 high-demand skill modules with practical real-world exercises and mentor feedback.</p>
          </div>

          {/* SEARCH & TABS NAV */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 15 }}>
            <div className="curriculum-tabs-nav">
              <button 
                className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                ⚡ All Modules (6)
              </button>
              {activeCourse.modules.map(mod => (
                <button
                  key={mod.id}
                  className={`tab-btn ${mod.isBonus ? 'bonus-tab' : ''} ${activeTab === mod.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(mod.id)}
                >
                  <span>{mod.icon}</span> {mod.title}
                </button>
              ))}
            </div>

            {/* SEARCH BOX */}
            <div style={{ position: 'relative', minWidth: 240 }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: '#888' }} />
              <input 
                type="text" 
                placeholder="Search topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="enroll-input"
                style={{ paddingLeft: 38, fontSize: '0.85rem' }}
              />
            </div>
          </div>

          {/* MODULE CARDS */}
          {filteredModules.map((mod) => (
            <div key={mod.id} className="curriculum-module-card glass-panel glow-hover fade-in">
              <div className="module-header">
                <div className="module-title-wrap">
                  <span className="module-icon-large">{mod.icon}</span>
                  <div>
                    <h3>{mod.title}</h3>
                    {mod.isBonus && <span className="courses-promo-tag" style={{ marginTop: 4, display: 'inline-block' }}>🎁 Bonus Lecture</span>}
                  </div>
                </div>
                <span className="module-topic-count">{mod.topics.length} Key Lessons</span>
              </div>

              <div className="topics-grid">
                {mod.topics.map((topic, idx) => (
                  <div key={idx} className="topic-item">
                    <span className="topic-bullet">✦</span>
                    <span>{topic}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* LEARNING EXPERIENCE */}
        <div className="section-header-box">
          <h2>🎓 Learning Experience</h2>
          <p>Designed to give you seamless, flexible, and fully supported learning every step of the way.</p>
        </div>

        <div className="learning-exp-grid">
          {activeCourse.learningExperience.map((item, idx) => (
            <div key={idx} className="exp-card glass-panel">
              <div className="exp-icon">{item.icon}</div>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </div>
          ))}
        </div>

        {/* DAILY LEARNING ROUTINE */}
        <div className="routine-timeline-box glass-panel glow-hover">
          <div className="section-header-box" style={{ marginBottom: 20 }}>
            <h2>📖 Daily Learning Routine</h2>
            <p>Consistency leads to mastery! Even on non-lecture days, keep growing through structured daily activities.</p>
          </div>

          <div className="routine-grid">
            {activeCourse.dailyRoutine.map((activity, idx) => (
              <div key={idx} className="routine-chip">
                <span className="routine-chip-icon">⚡</span>
                <span>{activity}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CASH PRIZES COMPETITION SHOWCASE */}
        <div className="prizes-section glow-hover">
          <div className="prizes-header">
            <h2>🏆 Competition & Cash Prizes</h2>
            <p style={{ color: '#eaeaea', fontSize: '1.05rem' }}>
              Outstanding students will be rewarded at the end of the bootcamp based on performance!
            </p>
          </div>

          <div className="prizes-cards-wrapper">
            <div className="prize-card gold">
              <div className="prize-trophy">🥇</div>
              <div className="prize-rank">1ST PLACE</div>
              <div className="prize-amount">Rs. 5,000</div>
            </div>
            <div className="prize-card silver">
              <div className="prize-trophy">🥈</div>
              <div className="prize-rank">2ND PLACE</div>
              <div className="prize-amount">Rs. 3,000</div>
            </div>
            <div className="prize-card bronze">
              <div className="prize-trophy">🥉</div>
              <div className="prize-rank">3RD PLACE</div>
              <div className="prize-amount">Rs. 1,000</div>
            </div>
          </div>

          <div className="prize-criteria-box">
            <h4>Evaluated On</h4>
            <div className="criteria-pills">
              <span className="criteria-pill">✓ Attendance</span>
              <span className="criteria-pill">✓ Daily Tasks</span>
              <span className="criteria-pill">✓ Consistency</span>
              <span className="criteria-pill">✓ Creativity</span>
              <span className="criteria-pill">✓ Final Challenge Project</span>
            </div>
          </div>
        </div>

        {/* WHO CAN JOIN */}
        <div className="section-header-box">
          <h2>👥 Who Can Join?</h2>
          <p>This program is tailored for anyone looking to build high-value digital skills from scratch. <strong>No prior experience required!</strong></p>
        </div>

        <div className="audience-grid">
          {activeCourse.whoCanJoin.map((person, idx) => (
            <div key={idx} className="audience-card">
              <span style={{ color: '#00e5ff' }}>✔</span>
              <span>{person}</span>
            </div>
          ))}
        </div>

        {/* INVESTMENT SUMMARY TABLE */}
        <div className="section-header-box">
          <h2>📦 Investment in Your Future</h2>
          <p>Transparent summary of everything included in your enrollment.</p>
        </div>

        <div className="table-wrapper">
          <table className="investment-table">
            <thead>
              <tr>
                <th>Feature</th>
                <th>Bootcamp Details</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Duration</strong></td>
                <td>1 Month (30 Days)</td>
              </tr>
              <tr>
                <td><strong>Learning Mode</strong></td>
                <td>Online Live Mentorship</td>
              </tr>
              <tr>
                <td><strong>Original Fee</strong></td>
                <td><span style={{ textDecoration: 'line-through', color: '#888' }}>Rs. 7,000</span></td>
              </tr>
              <tr>
                <td><strong>Discounted Fee</strong></td>
                <td><strong style={{ color: '#00e5ff', fontSize: '1.1rem' }}>Rs. 4,500</strong></td>
              </tr>
              <tr>
                <td><strong>Discount Savings</strong></td>
                <td><span style={{ color: '#ffaa00', fontWeight: 600 }}>Save Rs. 2,500</span></td>
              </tr>
              <tr>
                <td><strong>Support</strong></td>
                <td>Morning to Night Dedicated Mentorship</td>
              </tr>
              <tr>
                <td><strong>Live Classes & Video Replays</strong></td>
                <td>✔ Included</td>
              </tr>
              <tr>
                <td><strong>Daily Tasks & Final Project</strong></td>
                <td>✔ Included</td>
              </tr>
              <tr>
                <td><strong>Official E-Certificate</strong></td>
                <td>✔ Included</td>
              </tr>
              <tr>
                <td><strong>Cash Prizes</strong></td>
                <td>Rs. 5,000 • Rs. 3,000 • Rs. 1,000</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* CALL TO ACTION BANNER */}
        <div className="cta-bottom-banner">
          <h2>🚀 ENROLL NOW!</h2>
          <p><strong>Learn. Practice. Create. Grow.</strong></p>
          <p style={{ color: '#aaa', fontSize: '0.95rem', marginBottom: 30 }}>
            Turn your creativity into real-world skills and begin your journey toward freelancing, content creation, and digital success.
            <br /><strong style={{ color: '#ffaa00' }}>Limited Seats Available!</strong>
          </p>

          <button className="btn-primary btn-enroll-now" onClick={() => setIsModalOpen(true)}>
            GET STARTED NOW &mdash; RS. 4,500
          </button>
        </div>
      </div>

      {/* ENROLLMENT MODAL */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content-card">
            <button className="modal-close-btn" onClick={() => { setIsModalOpen(false); setEnrollmentSuccess(null); }}>
              <X size={18} />
            </button>

            {enrollmentSuccess ? (
              <div className="receipt-box fade-in">
                <div style={{ fontSize: '3rem', marginBottom: 10 }}>🎉</div>
                <h3>Enrollment Confirmed!</h3>
                <p>Welcome to <strong>AI CREATIVE SKILLS BOOTCAMP</strong></p>

                <div className="receipt-code-badge">
                  {enrollmentSuccess.registrationCode}
                </div>

                <div style={{ textAlign: 'left', background: 'rgba(0,0,0,0.5)', padding: 15, borderRadius: 8, margin: '15px 0', fontSize: '0.9rem', lineHeight: 1.6 }}>
                  <div><strong>Student Name:</strong> {enrollmentSuccess.fullName}</div>
                  <div><strong>Email:</strong> {enrollmentSuccess.email}</div>
                  <div><strong>Phone:</strong> {enrollmentSuccess.phone}</div>
                  <div><strong>Payment Method:</strong> {enrollmentSuccess.paymentMethod}</div>
                  <div><strong>Total Fee:</strong> {enrollmentSuccess.discountedFee} (Saved {enrollmentSuccess.savings})</div>
                  <div><strong>Status:</strong> <span style={{ color: '#00e5ff', fontWeight: 600 }}>Active / Verified</span></div>
                </div>

                <p style={{ fontSize: '0.85rem', color: '#aaa', marginBottom: 15 }}>
                  A confirmation SMS & WhatsApp message with live class join links is being dispatched. Click below if WhatsApp didn't open automatically:
                </p>

                {(enrollmentSuccess.whatsappUrl || true) && (
                  <a
                    href={enrollmentSuccess.whatsappUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary"
                    style={{
                      background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                      boxShadow: '0 0 20px rgba(37, 211, 102, 0.4)',
                      width: '100%',
                      marginBottom: 10,
                      textAlign: 'center',
                      fontSize: '0.85rem',
                      display: 'block'
                    }}
                  >
                    💬 SEND REGISTRATION DETAILS ON WHATSAPP &rarr;
                  </a>
                )}

                <button className="btn-secondary" style={{ width: '100%', fontSize: '0.75rem' }} onClick={() => setIsModalOpen(false)}>
                  Close
                </button>
              </div>
            ) : enrollStep === 1 ? (
              <form onSubmit={handleSendOtp}>
                <div className="modal-header">
                  <h3>Enroll in Bootcamp</h3>
                  <p>AI Creative Skills Bootcamp &mdash; <strong>Rs. 4,500</strong> (Save Rs. 2,500)</p>
                </div>

                {errorMessage && (
                  <div style={{ background: 'rgba(255,51,51,0.2)', border: '1px solid #ff3333', color: '#ff3333', padding: 10, borderRadius: 6, marginBottom: 15, fontSize: '0.85rem' }}>
                    {errorMessage}
                  </div>
                )}

                <div className="enroll-form-group">
                  <label>Full Name *</label>
                  <input 
                    type="text" 
                    name="full_name" 
                    required 
                    placeholder="e.g. Alex Storm"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    className="enroll-input"
                  />
                </div>

                <div className="enroll-form-group">
                  <label>Email Address * (Verification Code Will Be Sent Here)</label>
                  <input 
                    type="email" 
                    name="email" 
                    required 
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="enroll-input"
                  />
                </div>

                <div className="enroll-form-group">
                  <label>Phone / WhatsApp Number *</label>
                  <input 
                    type="text" 
                    name="phone" 
                    required 
                    placeholder="+92 320 2200163"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="enroll-input"
                  />
                </div>

                <div className="enroll-form-group">
                  <label>Experience Level</label>
                  <select 
                    name="experience_level"
                    value={formData.experience_level}
                    onChange={handleInputChange}
                    className="enroll-input"
                    style={{ background: '#111', color: '#fff' }}
                  >
                    <option value="Absolute Beginner">Absolute Beginner (No prior experience)</option>
                    <option value="Intermediate">Intermediate (Some basic skills)</option>
                    <option value="Freelancer/Creator">Freelancer / Creator</option>
                  </select>
                </div>

                <div className="enroll-form-group">
                  <label>Select Payment Method *</label>
                  <div className="payment-methods-grid">
                    {['JazzCash', 'EasyPaisa', 'Bank Transfer', 'Crypto (ETH/USDT)'].map(method => (
                      <button
                        type="button"
                        key={method}
                        className={`payment-option-btn ${formData.payment_method === method ? 'selected' : ''}`}
                        onClick={() => setFormData({ ...formData, payment_method: method })}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                {/* OFFICIAL PAYMENT ACCOUNT DETAILS BOX */}
                <div style={{ background: 'rgba(255, 170, 0, 0.08)', border: '1px solid #ffaa00', padding: 15, borderRadius: 10, marginBottom: 18, fontSize: '0.85rem', lineHeight: 1.6 }}>
                  <div style={{ color: '#ffaa00', fontWeight: 700, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    💳 Official Payment Transfer Account Details (Rs. 4,500):
                  </div>
                  {formData.payment_method === 'JazzCash' && (
                    <div>
                      <div><strong>Account Type:</strong> JazzCash</div>
                      <div><strong>Account Title:</strong> CreateSkill Academy</div>
                      <div><strong>Account / Mobile #:</strong> <span style={{ color: '#00e5ff', fontWeight: 700, fontSize: '1rem' }}>0320 2200163</span></div>
                    </div>
                  )}
                  {formData.payment_method === 'EasyPaisa' && (
                    <div>
                      <div><strong>Account Type:</strong> EasyPaisa</div>
                      <div><strong>Account Title:</strong> CreateSkill Academy</div>
                      <div><strong>Account / Mobile #:</strong> <span style={{ color: '#00e5ff', fontWeight: 700, fontSize: '1rem' }}>0320 2200163</span></div>
                    </div>
                  )}
                  {formData.payment_method === 'Bank Transfer' && (
                    <div>
                      <div><strong>Bank Name:</strong> Meezan Bank / HBL</div>
                      <div><strong>Account Title:</strong> CreateSkill Academy</div>
                      <div><strong>IBAN / Acc #:</strong> <span style={{ color: '#00e5ff', fontWeight: 700, fontSize: '1rem' }}>0320 2200163</span></div>
                    </div>
                  )}
                  {formData.payment_method === 'Crypto (ETH/USDT)' && (
                    <div>
                      <div><strong>Network:</strong> USDT (TRC20) / ETH</div>
                      <div><strong>Wallet Address:</strong> <span style={{ color: '#00e5ff', fontSize: '0.8rem', fontFamily: 'monospace' }}>0x923202200163CreateSkillAcademyWallet</span></div>
                    </div>
                  )}
                </div>

                {/* PAYMENT PROOF SCREENSHOT UPLOAD */}
                <div className="enroll-form-group">
                  <label>📸 Upload Payment Receipt / Screenshot (Optional / Recommended)</label>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="enroll-input"
                    style={{ padding: '8px', cursor: 'pointer' }}
                  />
                  {proofFileName && (
                    <div style={{ color: '#00e5ff', fontSize: '0.8rem', marginTop: 4, fontWeight: 600 }}>
                      ✓ File Attached: {proofFileName}
                    </div>
                  )}
                  {paymentProof && (
                    <div style={{ marginTop: 8 }}>
                      <img src={paymentProof} alt="Payment Receipt Preview" style={{ maxHeight: 90, borderRadius: 6, border: '1px solid #00e5ff' }} />
                    </div>
                  )}
                </div>

                <button 
                  type="submit" 
                  className="btn-primary" 
                  style={{ width: '100%', padding: '14px', marginTop: 15, fontSize: '0.85rem' }}
                  disabled={submitting}
                >
                  {submitting ? 'Sending Verification Code...' : 'SEND VERIFICATION CODE & CONTINUE &rarr;'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleEnrollSubmit}>
                <div className="modal-header">
                  <h3>📧 Verify Email Address</h3>
                  <p>Step 2 of 2: Enter the 6-digit verification code sent to <strong>{formData.email}</strong></p>
                </div>

                {otpSentMsg && (
                  <div style={{ background: 'rgba(0,229,255,0.1)', border: '1px solid #00e5ff', color: '#00e5ff', padding: 12, borderRadius: 8, marginBottom: 15, fontSize: '0.85rem', lineHeight: 1.5 }}>
                    {otpSentMsg}
                  </div>
                )}

                {errorMessage && (
                  <div style={{ background: 'rgba(255,51,51,0.2)', border: '1px solid #ff3333', color: '#ff3333', padding: 10, borderRadius: 6, marginBottom: 15, fontSize: '0.85rem' }}>
                    {errorMessage}
                  </div>
                )}

                <div className="enroll-form-group">
                  <label>6-Digit Verification Code *</label>
                  <input 
                    type="text" 
                    maxLength="6"
                    required 
                    placeholder="e.g. 849201"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="enroll-input"
                    style={{ fontSize: '1.4rem', letterSpacing: '6px', textAlign: 'center', fontWeight: 'bold' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                  <button 
                    type="button" 
                    className="btn-secondary" 
                    style={{ flex: 1, fontSize: '0.75rem' }}
                    onClick={() => { setEnrollStep(1); setErrorMessage(''); }}
                  >
                    ← Back / Edit
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary" 
                    style={{ flex: 2, padding: '14px', fontSize: '0.85rem' }}
                    disabled={submitting}
                  >
                    {submitting ? 'Verifying...' : 'VERIFY CODE & ENROLL &rarr;'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* SYLLABUS PRINT / VIEW MODAL */}
      {isSyllabusModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content-card" style={{ maxWidth: 750 }}>
            <button className="modal-close-btn" onClick={() => setIsSyllabusModalOpen(false)}>
              <X size={18} />
            </button>

            <div className="modal-header">
              <h3>📄 Official Bootcamp Syllabus</h3>
              <p>AI CREATIVE SKILLS BOOTCAMP &mdash; 1-Month Live Mentorship</p>
            </div>

            <div style={{ textAlign: 'left', lineHeight: 1.7, fontSize: '0.95rem', color: '#ddd', maxHeight: '60vh', overflowY: 'auto', paddingRight: 10 }}>
              <h4>📌 Overview</h4>
              <p>This 30-day intensive live mentorship equips students, creators, and freelancers with modern AI tools, photo editing, graphic design, 3D modeling, and branding skills.</p>

              <h4 style={{ marginTop: 20, color: '#00e5ff' }}>🛠 Modules Included</h4>
              <ul style={{ paddingLeft: 20 }}>
                <li><strong>1. AI Automation:</strong> Intro to AI, Prompt Engineering, AI for productivity, research, presentations, image & content generation, task automation.</li>
                <li><strong>2. Adobe Photoshop:</strong> Interface, Editing, Background Removal, Retouching, Color Grading, Social Media Designs.</li>
                <li><strong>3. Poster Designing:</strong> Principles, Color Theory, Typography, Event & Social Media Posters, Ad Designs.</li>
                <li><strong>4. 3D Character Creation:</strong> 3D Basics, Sculpting, Texturing, Exporting Models, Pipeline best practices.</li>
                <li><strong>5. Canva Masterclass:</strong> Social Media graphics, Resumes, Presentations, Flyers, Branding identity.</li>
                <li><strong>6. Bonus Typing Practice:</strong> Speed, Accuracy, Productivity Drills.</li>
              </ul>

              <h4 style={{ marginTop: 20, color: '#ffaa00' }}>🏆 Rewards & Certification</h4>
              <p>E-Certificate issued upon completion. Cash Prizes: 🥇 Rs. 5,000 | 🥈 Rs. 3,000 | 🥉 Rs. 1,000.</p>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 25 }}>
              <button className="btn-primary" style={{ flex: 1 }} onClick={() => { setIsSyllabusModalOpen(false); setIsModalOpen(true); }}>
                Enroll Now (Rs. 4,500)
              </button>
              <button className="btn-secondary" onClick={() => window.print()}>
                <Download size={14} style={{ marginRight: 6 }} /> Print / Save PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Courses;
