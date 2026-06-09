import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Auth } from '../services/auth';
import { getSocket } from '../services/socket';
import './AuthPages.css';

const Signup = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);

  const [errors, setErrors] = useState({});
  const [emailMsg, setEmailMsg] = useState({ text: '', type: '' });
  const [confirmMsg, setConfirmMsg] = useState('');
  const [formMsg, setFormMsg] = useState({ text: '', type: '' });
  
  const navigate = useNavigate();

  const emojiList = ['👁️', '💀', '🌑', '👤', '🎮', '🔮', '☠️', '🐺', '🕷️', '🧿', '🌿', '🔥'];

  // Email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Real-time email validation
  useEffect(() => {
    if (!email) {
      setEmailMsg({ text: '', type: '' });
      return;
    }
    if (emailRegex.test(email.trim())) {
      setEmailMsg({ text: '✓ Valid Email', type: 'valid' });
    } else {
      setEmailMsg({ text: '✗ Invalid Email Format', type: 'invalid' });
    }
  }, [email]);

  // Real-time confirm password check
  useEffect(() => {
    if (!confirmPassword) {
      setConfirmMsg('');
      return;
    }
    if (confirmPassword !== password) {
      setConfirmMsg('✗ Passwords do not match');
    } else {
      setConfirmMsg('✓ Passwords match');
    }
  }, [confirmPassword, password]);

  // Password strength calculator
  const calcStrength = (pwd) => {
    let s = 0;
    if (pwd.length >= 8) s++;
    if (/[A-Z]/.test(pwd)) s++;
    if (/[a-z]/.test(pwd)) s++;
    if (/[0-9]/.test(pwd)) s++;
    if (/[^A-Za-z0-9]/.test(pwd)) s++;
    return s;
  };

  const strengthScore = calcStrength(password);
  const strengthColors = ['', '#dc3030', '#e07030', '#d4b800', '#50c878', '#9F73FF'];
  const strengthWidths = ['0%', '20%', '40%', '60%', '80%', '100%'];

  const checklistMet = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setErrors({});
    setFormMsg({ text: '', type: '' });

    let newErrors = {};
    let valid = true;

    if (!firstName.trim()) {
      newErrors.firstName = '✗ First name is required';
      valid = false;
    }
    if (!lastName.trim()) {
      newErrors.lastName = '✗ Last name is required';
      valid = false;
    }

    const ageVal = parseInt(age, 10);
    if (!age.trim()) {
      newErrors.age = '✗ Age is required';
      valid = false;
    } else if (isNaN(ageVal) || ageVal < 13 || ageVal > 120) {
      newErrors.age = '✗ Valid age (13–120)';
      valid = false;
    }

    if (!email.trim()) {
      newErrors.email = '✗ Email is required';
      valid = false;
    } else if (!emailRegex.test(email.trim())) {
      newErrors.email = '✗ Invalid Email Format';
      valid = false;
    }

    if (calcStrength(password) < 5) {
      newErrors.password = '✗ Password must meet all criteria';
      valid = false;
    }

    if (confirmPassword !== password) {
      newErrors.confirmPassword = '✗ Passwords do not match';
      valid = false;
    }

    if (!selectedEmoji) {
      newErrors.emoji = '✗ Choose a profile icon';
      valid = false;
    }

    if (!valid) {
      setErrors(newErrors);
      return;
    }

    // Auto-generate username from names
    const generatedUsername = (firstName.trim() + lastName.trim())
      .toLowerCase()
      .replace(/\s+/g, '')
      .substring(0, 20);

    setFormMsg({ text: 'Creating account...', type: 'info' });

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: generatedUsername,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          password: password,
          age: ageVal,
          emoji: selectedEmoji
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Server error during registration');
      }

      Auth.saveSession(data.token, data.user);
      
      const socket = getSocket();
      if (socket) {
        socket.emit('authenticate', { token: data.token });
      }

      setFormMsg({ text: `✓ Welcome, ${data.user.username}. Entering the dark...`, type: 'success' });
      
      setTimeout(() => {
        navigate('/');
      }, 1500);

    } catch (err) {
      setFormMsg({ text: `✗ ${err.message}`, type: 'error' });
    }
  };

  return (
    <div className="page-container auth-page signup-container fade-in">
      <div className="auth-box glass-panel glow-hover signup-box">
        <h2>Sign Up</h2>
        <p className="auth-sub">Create operative profile</p>

        <form onSubmit={handleSignup} noValidate>
          <div className="form-row-2">
            <div className="input-group">
              <label htmlFor="firstName">First Name *</label>
              <input 
                type="text" 
                id="firstName" 
                placeholder="e.g. Aydan"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={errors.firstName ? 'invalid' : ''}
                required
              />
              {errors.firstName && <small className="error-msg">{errors.firstName}</small>}
            </div>
            <div className="input-group">
              <label htmlFor="lastName">Last Name *</label>
              <input 
                type="text" 
                id="lastName" 
                placeholder="e.g. Miller"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={errors.lastName ? 'invalid' : ''}
                required
              />
              {errors.lastName && <small className="error-msg">{errors.lastName}</small>}
            </div>
          </div>

          <div className="form-row-2">
            <div className="input-group">
              <label htmlFor="age">Age *</label>
              <input 
                type="number" 
                id="age" 
                placeholder="e.g. 21"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className={errors.age ? 'invalid' : ''}
                required
              />
              {errors.age && <small className="error-msg">{errors.age}</small>}
            </div>
            <div className="input-group">
              <label htmlFor="email">Email *</label>
              <input 
                type="email" 
                id="email" 
                placeholder="e.g. aydan@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={errors.email ? 'invalid' : ''}
                required
              />
              {emailMsg.text && (
                <small className={emailMsg.type === 'valid' ? 'valid-msg' : 'error-msg'}>
                  {emailMsg.text}
                </small>
              )}
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="password">Password *</label>
            <div className="password-input-wrap">
              <input 
                type={passwordVisible ? 'text' : 'password'} 
                id="password" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={errors.password ? 'invalid' : ''}
                required
              />
              <button 
                type="button" 
                className="pwd-toggle-btn"
                onClick={() => setPasswordVisible(!passwordVisible)}
              >
                {passwordVisible ? '👁️' : '🙈'}
              </button>
            </div>
            {password.length > 0 && (
              <div className="pwd-strength-bar">
                <div 
                  className="pwd-strength-fill"
                  style={{
                    width: strengthWidths[strengthScore],
                    background: strengthColors[strengthScore]
                  }}
                ></div>
              </div>
            )}
            
            {password.length > 0 && (
              <ul className="pwd-checklist visible">
                <li className={checklistMet.length ? 'met' : ''}>8+ Characters</li>
                <li className={checklistMet.upper ? 'met' : ''}>Uppercase Letter (A-Z)</li>
                <li className={checklistMet.lower ? 'met' : ''}>Lowercase Letter (a-z)</li>
                <li className={checklistMet.number ? 'met' : ''}>Number (0-9)</li>
                <li className={checklistMet.special ? 'met' : ''}>Special Character (!@#$...)</li>
              </ul>
            )}
          </div>

          <div className="input-group">
            <label htmlFor="confirmPassword">Confirm Password *</label>
            <div className="password-input-wrap">
              <input 
                type={confirmVisible ? 'text' : 'password'} 
                id="confirmPassword" 
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={errors.confirmPassword ? 'invalid' : ''}
                required
              />
              <button 
                type="button" 
                className="pwd-toggle-btn"
                onClick={() => setConfirmVisible(!confirmVisible)}
              >
                {confirmVisible ? '👁️' : '🙈'}
              </button>
            </div>
            {confirmMsg && (
              <small className={confirmMsg.startsWith('✓') ? 'valid-msg' : 'error-msg'}>
                {confirmMsg}
              </small>
            )}
          </div>

          <div className="input-group">
            <label>Choose Operative Icon *</label>
            <div className="emoji-grid">
              {emojiList.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className={`emoji-option ${selectedEmoji === emoji ? 'selected' : ''}`}
                  onClick={() => setSelectedEmoji(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
            {errors.emoji && <small className="error-msg">{errors.emoji}</small>}
          </div>

          <button type="submit" className="btn-primary auth-submit-btn">
            Create Account
          </button>

          {formMsg.text && (
            <p className={`auth-response status-${formMsg.type}`}>
              {formMsg.text}
            </p>
          )}

          <div className="auth-footer-txt">
            Already have an account? <Link to="/login">Sign In</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;
