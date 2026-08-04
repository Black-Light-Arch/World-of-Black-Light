import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Auth } from '../services/auth';
import { Menu, X, LogOut, Sun, Moon, Languages } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [session, setSession] = useState(Auth.getSession());
  const [isLightMode, setIsLightMode] = useState(() => {
    return localStorage.getItem('blacklight_color_mode') === 'light';
  });
  const [currentLang, setCurrentLang] = useState(() => {
    return localStorage.getItem('blacklight_app_lang') || 'en';
  });
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setSession(Auth.getSession());
  }, [location]);

  useEffect(() => {
    if (isLightMode) {
      document.body.classList.add('light-mode');
      localStorage.setItem('blacklight_color_mode', 'light');
    } else {
      document.body.classList.remove('light-mode');
      localStorage.setItem('blacklight_color_mode', 'dark');
    }
  }, [isLightMode]);

  const toggleLightMode = () => {
    setIsLightMode(!isLightMode);
  };

  const toggleLanguage = () => {
    const nextLang = currentLang === 'en' ? 'ur' : 'en';
    setCurrentLang(nextLang);
    localStorage.setItem('blacklight_app_lang', nextLang);
    window.dispatchEvent(new CustomEvent('language_change', { detail: nextLang }));
  };

  const handleLogout = () => {
    Auth.logout();
    setSession(null);
    setIsOpen(false);
    navigate('/login');
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Courses', path: '/courses' },
    { name: 'Chat', path: '/chat' },
    { name: 'Games', path: '/games' },
    { name: 'Players', path: '/players' },
    { name: 'Rules', path: '/rules' },
    { name: 'Donate', path: '/donation', specialClass: 'nav-donate-green' },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const isLearningArea = location.pathname.startsWith('/courses') || location.pathname.startsWith('/bootcamp');

  return (
    <>
      <header className="navbar-header">
        <Link to="/" className="nav-logo" onClick={() => setIsOpen(false)}>
          {isLearningArea ? (
            <img 
              src="/assets/images/createskill_academy_logo.png" 
              alt="CreateSkill Academy" 
              style={{ height: '42px', width: 'auto', display: 'block' }}
            />
          ) : (
            'BlackLight'
          )}
        </Link>

        {/* Desktop Links */}
        <nav className="navbar-links">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className={`${isActive(link.path) ? 'active' : ''} ${link.specialClass || ''}`}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Desktop Auth & Controls */}
        <div className="nav-auth-section">
          {/* Language Switcher (EN / UR) */}
          <button 
            onClick={toggleLanguage}
            className="nav-logout-icon-btn"
            title="Switch Language (English / اردو)"
            style={{ marginRight: '6px', display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(0,229,255,0.1)', padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(0,229,255,0.3)' }}
          >
            <Languages size={15} color="#00e5ff" />
            <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#00e5ff' }}>
              {currentLang === 'en' ? 'EN | اردو' : 'اردو | EN'}
            </span>
          </button>

          {/* Light / Dark Mode Toggle */}
          <button 
            onClick={toggleLightMode} 
            className="nav-logout-icon-btn" 
            title={isLightMode ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            style={{ marginRight: '8px' }}
          >
            {isLightMode ? <Moon size={18} color="#7c3aed" /> : <Sun size={18} color="#ffaa00" />}
          </button>

          {session ? (
            <>
              <Link to="/profile" className="nav-profile-badge" title="Profile">
                <span className="nav-profile-emoji">{session.emoji || '👁️'}</span>
                <span className="nav-profile-name">{session.firstName}</span>
              </Link>
              <button onClick={handleLogout} className="nav-logout-icon-btn" title="Logout">
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <>
              <Link to="/signup" className="btn-secondary" style={{ padding: '6px 16px', fontSize: '0.65rem' }}>Sign Up</Link>
              <Link to="/login" className="btn-primary" style={{ padding: '6px 16px', fontSize: '0.65rem' }}>Login</Link>
            </>
          )}
        </div>

        {/* Mobile Toggle */}
        <button className="mobile-nav-toggle" onClick={() => setIsOpen(!isOpen)} aria-label="Toggle menu">
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Mobile Drawer */}
      <nav className={`mobile-menu-drawer ${isOpen ? 'open' : ''}`}>
        {navLinks.map((link) => (
          <Link
            key={link.name}
            to={link.path}
            className={`${isActive(link.path) ? 'active' : ''} ${link.specialClass || ''}`}
            onClick={() => setIsOpen(false)}
          >
            {link.name}
          </Link>
        ))}

        <div className="mobile-auth-footer">
          {session ? (
            <>
              <Link to="/profile" className="nav-profile-badge" style={{ justifyContent: 'center' }} onClick={() => setIsOpen(false)}>
                <span className="nav-profile-emoji" style={{ marginRight: '6px' }}>{session.emoji || '👁️'}</span>
                Your Profile ({session.firstName})
              </Link>
              <button onClick={handleLogout} className="btn-primary" style={{ width: '100%', fontSize: '0.7rem' }}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-primary" style={{ textAlign: 'center', fontSize: '0.7rem' }} onClick={() => setIsOpen(false)}>
                Login
              </Link>
              <Link to="/signup" className="btn-secondary" style={{ textAlign: 'center', fontSize: '0.7rem' }} onClick={() => setIsOpen(false)}>
                Sign Up
              </Link>
            </>
          )}
        </div>
      </nav>
    </>
  );
};

export default Navbar;
