import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Auth } from '../services/auth';
import { Menu, X, LogOut, MessageSquare } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [session, setSession] = useState(Auth.getSession());
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setSession(Auth.getSession());
  }, [location]);

  const handleLogout = () => {
    Auth.logout();
    setSession(null);
    setIsOpen(false);
    navigate('/login');
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Chat', path: '/chat' },
    { name: 'Games', path: '/games' },
    { name: 'Players', path: '/players' },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <header className="navbar-header">
        <Link to="/" className="nav-logo" onClick={() => setIsOpen(false)}>
          BlackLight
        </Link>

        {/* Desktop Links */}
        <nav className="navbar-links">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className={isActive(link.path) ? 'active' : ''}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Desktop Auth */}
        <div className="nav-auth-section">
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
            className={isActive(link.path) ? 'active' : ''}
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
