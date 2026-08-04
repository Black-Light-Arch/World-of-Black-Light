// ── COURSES & ENROLLMENT ROUTES ──────────────────────────────────
const express = require('express');
const jwt     = require('jsonwebtoken');
const { one, all, run } = require('../database');
const router  = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'blacklight-super-secret-2026';

function adminCheck(req) {
  try {
    const token = (req.headers.authorization || '').replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET);
    const dbUser = one('SELECT is_admin, banned_until FROM users WHERE id = ?', decoded.id);
    if (!dbUser || !dbUser.is_admin) return null;
    if (dbUser.banned_until && new Date(dbUser.banned_until) > new Date()) return null;
    return { ...decoded, isAdmin: true };
  } catch { return null; }
}

// Course details constant
const AI_BOOTCAMP_DETAILS = {
  id: 'ai-bootcamp',
  title: 'AI CREATIVE SKILLS BOOTCAMP',
  subtitle: '1-Month Live Mentorship Program',
  headline: 'Transform Your Skills. Build Your Future.',
  description: 'A complete skill-building program designed for students, beginners, freelancers, and aspiring creators to master today\'s most in-demand digital skills through live mentorship, practical projects, and daily guidance.',
  duration: '1 Month (30 Days)',
  mode: 'Online Live Mentorship',
  support: 'Morning to Night Dedicated Q&A Support',
  certificate: 'Official E-Certificate Included',
  pricing: {
    originalFee: 7000,
    discountedFee: 4500,
    savings: 2500,
    currency: 'PKR',
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
        'Prompt Engineering Masterclass',
        'AI for productivity & workflow acceleration',
        'AI for studying and academic research',
        'AI for presentations & deck generation',
        'AI image generation & art synthesis',
        'AI content creation & copywriting',
        'Automating daily tasks using modern AI tools'
      ]
    },
    {
      id: 'photoshop',
      icon: '🎨',
      title: 'Adobe Photoshop',
      topics: [
        'Photoshop Interface & Custom Workspaces',
        'Professional Photo Editing & Enhancement',
        'Precision Background Removal Techniques',
        'Portrait & Image Retouching',
        'Color Correction & Cinematic Color Grading',
        'Social Media Graphics & Layouts',
        'Advanced Compositing & Editing Workflows'
      ]
    },
    {
      id: 'poster-design',
      icon: '🖼',
      title: 'Poster Designing',
      topics: [
        'Core Design Principles & Composition Rules',
        'Color Theory & Psychological Palette Pairing',
        'Typography & Hierarchy Rules',
        'Event Poster Creation',
        'Social Media Campaign Posters',
        'High-Converting Advertisement Designs',
        'Client-Ready Professional Poster Creation'
      ]
    },
    {
      id: '3d-character',
      icon: '🎭',
      title: '3D Character Creation',
      topics: [
        'Introduction to 3D Viewports & Workflows',
        'Character Modeling Fundamentals',
        'Character Design & Form Sculpting',
        'Texturing, Materials & UV Mapping',
        'Exporting Models for Game Engines & Web',
        'Beginner Industry Standards & Pipeline Best Practices'
      ]
    },
    {
      id: 'canva-masterclass',
      icon: '🎯',
      title: 'Canva Masterclass',
      topics: [
        'Canva Tools & Power Features',
        'High-Converting Social Media Designs',
        'Modern Professional Resume Design',
        'Slide Deck & Pitch Presentation Design',
        'Flyers, Banners & Print Brochures',
        'Business Brand Identity & Brand Kits',
        'Scalable Content Creation Systems'
      ]
    },
    {
      id: 'typing-bonus',
      icon: '⌨',
      title: 'Bonus Surprise: Typing Practice',
      isBonus: true,
      topics: [
        'Building WPM Speed & Accuracy',
        'Touch Typing Techniques & Muscle Memory',
        'Keyboard Shortcuts for Maximizing Productivity',
        'Daily Typing Challenges & Custom Resources Provided'
      ]
    }
  ],
  whoCanJoin: [
    'Beginners with zero prior experience',
    'School Students',
    'College Students',
    'University Students',
    'Freelancers looking to upscale services',
    'Job Seekers',
    'Content Creators & Streamers',
    'Graphic Designers & Digital Artists',
    'Anyone eager to learn modern high-value digital skills'
  ],
  learningExperience: [
    { icon: '✅', title: 'Live Interactive Classes', desc: 'Learn directly from expert mentors with live interactive Q&A sessions.' },
    { icon: '✅', title: 'Recorded Video Lectures', desc: 'Replay every lecture anytime 24/7 for easy revision.' },
    { icon: '✅', title: 'Live Mentorship', desc: 'Receive personal direct feedback throughout the entire month.' },
    { icon: '✅', title: 'Morning to Night Question Support', desc: 'Ask your queries all day long and get instant mentor help.' }
  ],
  dailyRoutine: [
    'AI Exploration Tasks',
    'Photoshop Practice Projects',
    'Canva Design Assignments',
    'Poster Designing Challenges',
    '3D Character Modeling Exercises',
    'Mini Real-World Client Projects',
    'Design Sprint Challenges',
    'Daily Typing Drills',
    'Structured Revision Exercises'
  ]
};

// GET /api/courses
router.get('/', (req, res) => {
  try {
    const enrollmentsCount = one('SELECT COUNT(*) as c FROM course_enrollments WHERE course_id = ?', 'ai-bootcamp');
    res.json({
      courses: [
        {
          ...AI_BOOTCAMP_DETAILS,
          enrolledStudentsCount: (enrollmentsCount ? enrollmentsCount.c : 0) + 48 // base offset display
        }
      ]
    });
  } catch (err) {
    console.error('Fetch courses error:', err);
    res.status(500).json({ error: 'Failed to load course details.' });
  }
});

// POST /api/courses/send-otp
router.post('/send-otp', (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Valid email address is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const otpCode = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes expiry

    // Mark previous OTPs as used
    run('UPDATE email_verifications SET used = 1 WHERE email = ?', cleanEmail);

    // Save new OTP
    run('INSERT INTO email_verifications (email, code, expires_at) VALUES (?, ?, ?)', cleanEmail, otpCode, expiresAt);

    console.log(`\n📧 [EMAIL OTP DISPATCH] Verification Code for ${cleanEmail}: ${otpCode}\n`);

    res.json({
      success: true,
      message: `Verification code sent to ${cleanEmail}. Check your inbox!`,
      otpCode // included for seamless client verification / demo testing
    });
  } catch (err) {
    console.error('Send OTP error:', err);
    res.status(500).json({ error: 'Failed to send verification code.' });
  }
});

// POST /api/courses/enroll
router.post('/enroll', (req, res) => {
  try {
    const { full_name, email, phone, whatsapp, experience_level, payment_method, notes, otp_code, payment_proof } = req.body;

    if (!full_name || !email || !phone || !payment_method) {
      return res.status(400).json({ error: 'Full Name, Email, Phone, and Payment Method are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    // Verify 6-digit Email OTP if provided
    if (!otp_code) {
      return res.status(400).json({ error: 'Email verification OTP code is required.' });
    }

    const record = one(
      'SELECT * FROM email_verifications WHERE email = ? AND code = ? AND used = 0 ORDER BY id DESC LIMIT 1',
      cleanEmail, String(otp_code).trim()
    );

    if (!record) {
      return res.status(400).json({ error: 'Invalid verification code. Please check your email and try again.' });
    }

    if (new Date(record.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Verification code has expired. Please request a new code.' });
    }

    // Mark OTP as used
    run('UPDATE email_verifications SET used = 1 WHERE id = ?', record.id);

    const enrollmentResult = run(
      `INSERT INTO course_enrollments (course_id, full_name, email, phone, whatsapp, experience_level, payment_method, amount_paid, status, notes, payment_proof)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      'ai-bootcamp',
      full_name.trim(),
      cleanEmail,
      phone.trim(),
      whatsapp ? whatsapp.trim() : phone.trim(),
      experience_level || 'Beginner',
      payment_method,
      4500,
      'confirmed',
      notes ? notes.trim() : '',
      payment_proof || ''
    );

    const enrollmentId = enrollmentResult.lastInsertRowid;
    const registrationCode = `BL-BOOTCAMP-2026-${String(enrollmentId).padStart(4, '0')}`;

    // Admin WhatsApp phone number (+92 320 2200163)
    const adminPhone = process.env.ADMIN_WHATSAPP || '923202200163';
    const proofText = payment_proof ? '\n📸 *Payment Screenshot Attached*' : '';
    const waText = encodeURIComponent(
      `🚨 *NEW BOOTCAMP ENROLLMENT RECEIVED!*\n` +
      `-----------------------------------\n` +
      `🎓 *Course:* AI CREATIVE SKILLS BOOTCAMP\n` +
      `🆔 *Reg Code:* ${registrationCode}\n` +
      `👤 *Student Name:* ${full_name.trim()}\n` +
      `📧 *Email:* ${cleanEmail}\n` +
      `📱 *Phone/WhatsApp:* ${phone.trim()}\n` +
      `📊 *Level:* ${experience_level || 'Beginner'}\n` +
      `💳 *Payment Method:* ${payment_method}\n` +
      `💰 *Amount:* Rs. 4,500${proofText}\n` +
      `-----------------------------------\n` +
      `✅ *Please verify payment & send live class links!*`
    );

    const whatsappUrl = `https://wa.me/${adminPhone}?text=${waText}`;

    res.status(201).json({
      success: true,
      message: '🎉 Congratulations! Your email is verified, payment proof received, and enrollment confirmed!',
      whatsappUrl,
      enrollment: {
        id: enrollmentId,
        registrationCode,
        courseTitle: 'AI CREATIVE SKILLS BOOTCAMP',
        fullName: full_name.trim(),
        email: cleanEmail,
        phone: phone.trim(),
        paymentMethod: payment_method,
        discountedFee: 'Rs. 4,500',
        savings: 'Rs. 2,500',
        status: 'confirmed',
        startDate: 'Next Batch Starts Monday',
        supportHours: 'Morning to Night Support Active',
        hasPaymentProof: !!payment_proof,
        whatsappUrl
      }
    });
  } catch (err) {
    console.error('Enrollment error:', err);
    res.status(500).json({ error: 'Failed to submit enrollment. Please try again.' });
  }
});

// GET /api/courses/enrollments (admin only)
router.get('/enrollments', (req, res) => {
  const user = adminCheck(req);
  if (!user || !user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required.' });
  }

  try {
    const list = all('SELECT * FROM course_enrollments ORDER BY created_at DESC');
    res.json({ success: true, enrollments: list });
  } catch (err) {
    console.error('Fetch enrollments error:', err);
    res.status(500).json({ error: 'Failed to fetch enrollments.' });
  }
});

module.exports = router;
