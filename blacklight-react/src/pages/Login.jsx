import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Auth } from '../services/auth';
import { getSocket } from '../services/socket';
import './AuthPages.css';

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [errors, setErrors] = useState({ identifier: '', password: '' });
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });
    setErrors({ identifier: '', password: '' });

    let valid = true;
    let newErrors = { identifier: '', password: '' };

    if (!identifier.trim()) {
      newErrors.identifier = '✗ Username or email is required';
      valid = false;
    }
    if (!password) {
      newErrors.password = '✗ Password is required';
      valid = false;
    }

    if (!valid) {
      setErrors(newErrors);
      return;
    }

    setMessage({ text: 'Authenticating...', type: 'info' });

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: identifier.trim(), password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Invalid credentials');
      }

      // Save token and user in local storage
      Auth.saveSession(data.token, data.user);
      
      // Update body theme class immediately if saved in user theme
      if (data.user.theme) {
        document.body.className = `theme-${data.user.theme}`;
      }

      // Connect socket
      const socket = getSocket();
      if (socket) {
        socket.emit('authenticate', { token: data.token });
      }

      setMessage({ text: `✓ Welcome back, ${data.user.username}. Entering the dark...`, type: 'success' });
      
      setTimeout(() => {
        navigate('/');
      }, 1200);

    } catch (err) {
      setMessage({ text: `✗ ${err.message}`, type: 'error' });
    }
  };

  return (
    <div className="page-container auth-page fade-in">
      <div className="auth-box glass-panel glow-hover">
        <h2>Sign In</h2>
        <p className="auth-sub">Enter the Void</p>

        <form onSubmit={handleLogin} noValidate>
          <div className="input-group">
            <label htmlFor="loginEmail">Username or Email *</label>
            <input 
              type="text" 
              id="loginEmail" 
              placeholder="e.g. shadowblade"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className={errors.identifier ? 'invalid' : ''}
              required
            />
            {errors.identifier && <small className="error-msg">{errors.identifier}</small>}
          </div>

          <div className="input-group">
            <label htmlFor="loginPassword">Password *</label>
            <div className="password-input-wrap">
              <input 
                type={passwordVisible ? 'text' : 'password'} 
                id="loginPassword" 
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
            {errors.password && <small className="error-msg">{errors.password}</small>}
          </div>

          <button type="submit" className="btn-primary auth-submit-btn">
            Login
          </button>

          {message.text && (
            <p className={`auth-response status-${message.type}`}>
              {message.text}
            </p>
          )}

          <div className="auth-footer-txt">
            Don't have an account? <Link to="/signup">Create Account</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
