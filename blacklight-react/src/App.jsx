import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Auth } from './services/auth';

// Layout components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ParticleBackground from './components/ParticleBackground';
import ChatbotWidget from './components/ChatbotWidget';

// Page components
import Home from './pages/Home';
import Games from './pages/Games';
import Stories from './pages/Stories';
import DevLog from './pages/DevLog';
import About from './pages/About';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Players from './pages/Players';
import Tournaments from './pages/Tournaments';
import Leaderboard from './pages/Leaderboard';
import Contact from './pages/Contact';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import Chat from './pages/Chat';
import Donation from './pages/Donation';
import Rules from './pages/Rules';

// Global Scroll Reset
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

// Theme Initializer
const ThemeInitializer = () => {
  useEffect(() => {
    const session = Auth.getSession();
    if (session && session.theme) {
      document.body.className = `theme-${session.theme}`;
    } else {
      document.body.className = 'theme-purple';
    }
  }, []);
  return null;
};

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <ThemeInitializer />
      
      {/* Dynamic particles background canvas */}
      <ParticleBackground />

      <div className="app-main-layout-wrapper">
        {/* Navigation Bar */}
        <Navbar />

        {/* Dynamic SPA Viewports */}
        <main style={{ minHeight: 'calc(100vh - 140px)' }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/games" element={<Games />} />
            <Route path="/stories" element={<Stories />} />
            <Route path="/devlog" element={<DevLog />} />
            <Route path="/about" element={<About />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/players" element={<Players />} />
            <Route path="/tournaments" element={<Tournaments />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/donation" element={<Donation />} />
            <Route path="/rules" element={<Rules />} />
          </Routes>
        </main>

        {/* Global Chatbot Floating Assistant */}
        <ChatbotWidget />

        {/* Footer */}
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
