import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="app-footer">
      <div className="app-footer-links">
        <Link to="/players">Players</Link>
        <Link to="/tournaments">Tournaments</Link>
        <Link to="/leaderboard">Leaderboard</Link>
        <Link to="/contact">Contact</Link>
      </div>
      <p>&copy; {new Date().getFullYear()} World of BlackLight — All rights reserved.</p>
    </footer>
  );
};

export default Footer;
