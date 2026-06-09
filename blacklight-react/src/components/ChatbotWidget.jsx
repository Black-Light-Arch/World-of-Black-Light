import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Auth } from '../services/auth';
import { Send, X, Bot, Headset } from 'lucide-react';
import './ChatbotWidget.css';

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeMode, setActiveMode] = useState('ai');
  const [unreadCount, setUnreadCount] = useState(0);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState([]);
  const [aiHistory, setAiHistory] = useState([]);

  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  const botSvg = (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="var(--primary)" style={{ display: 'block' }}>
      <path d="M12 2c1.1 0 2 .9 2 2v1c3.87 0 7 3.13 7 7v7c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2v-7c0-3.87 3.13-7 7-7V4c0-1.1 .9-2 2-2zM9 13c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm6 0c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm-6 4H7v2h2v-2zm8 0h-2v2h2v-2z" />
    </svg>
  );

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  useEffect(() => {
    // Add default greeting
    if (messages.length === 0) {
      setMessages([
        {
          id: 'greet',
          sender: 'bot',
          content: getGreeting(),
          timestamp: new Date()
        }
      ]);
    }
  }, []);

  function getGreeting() {
    const hour = new Date().getHours();
    const time = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
    const session = Auth.getSession();
    const name = session ? `, ${session.firstName || session.username}` : '';
    return `Good ${time}${name}. I am the BlackLight AI — your guide through the darkness. Ask me about our games, stories, the studio, or how to reach us.`;
  }

  const togglePanel = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setUnreadCount(0);
    }
  };

  const handleSend = async () => {
    const text = inputMessage.trim();
    if (!text || isTyping) return;

    setInputMessage('');
    
    // Add user message
    const userMsgId = 'user-' + Date.now();
    const userMsg = {
      id: userMsgId,
      sender: 'user',
      content: text,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setAiHistory(prev => [...prev, { role: 'user', content: text }]);

    setIsTyping(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: aiHistory.slice(-8) })
      });
      const data = await res.json();
      const reply = data.reply || 'The shadows offer no answer...';
      
      const botMsg = {
        id: 'bot-' + Date.now(),
        sender: 'bot',
        content: reply,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMsg]);
      setAiHistory(prev => [...prev, { role: 'assistant', content: reply }]);

      if (!isOpen) {
        setUnreadCount(prev => prev + 1);
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        id: 'error-' + Date.now(),
        sender: 'system',
        content: 'Connection lost. Try again.',
        timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSupportConnect = () => {
    if (!Auth.isLoggedIn()) {
      setMessages(prev => [...prev, {
        id: 'auth-err-' + Date.now(),
        sender: 'system',
        content: '⚠ You must login first to use Live Support.',
        timestamp: new Date()
      }]);
      return;
    }
    setIsOpen(false);
    navigate('/chat?support=1');
  };

  const renderMessageContent = (content) => {
    if (content.startsWith('IMAGE:')) {
      const url = content.replace('IMAGE:', '').trim();
      return (
        <img 
          src={url} 
          alt="Generated illustration" 
          style={{ maxWidth: '100%', borderRadius: '8px', cursor: 'pointer', display: 'block', marginTop: '4px' }} 
          onClick={() => window.open(url)}
        />
      );
    }
    return content;
  };

  return (
    <div id="bl-chatbot-btn-wrap">
      {unreadCount > 0 && <div id="bl-unread-badge">{unreadCount}</div>}
      <button id="bl-chatbot-btn" onClick={togglePanel} title="Ask BlackLight AI">
        {isOpen ? <span style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '1.2rem' }}>✕</span> : botSvg}
      </button>

      {isOpen && (
        <div id="bl-chatbot-panel">
          {/* Header */}
          <div className="bl-chat-header">
            <div className={`bl-chat-header-icon ${activeMode === 'support' ? 'support-mode' : ''}`}>
              {activeMode === 'ai' ? '🤖' : '🎧'}
            </div>
            <div className="bl-chat-header-text">
              <div className={`bl-chat-header-name ${activeMode === 'support' ? 'support-mode' : ''}`}>
                {activeMode === 'ai' ? 'BLACKLIGHT AI' : 'LIVE SUPPORT'}
              </div>
              <div className="bl-chat-header-sub">
                {activeMode === 'ai' ? 'Studio assistant' : 'Connect with our team'}
              </div>
            </div>
            <div className="bl-chat-header-actions">
              <button className="bl-hdr-btn" onClick={() => { setIsOpen(false); navigate('/chat'); }} title="Open full chat">⛶</button>
              <button className="bl-hdr-btn" onClick={() => setIsOpen(false)} title="Close">✕</button>
            </div>
          </div>

          {/* Mode Tabs */}
          <div className="bl-mode-tabs">
            <button 
              className={`bl-mode-tab ${activeMode === 'ai' ? 'active' : ''}`}
              onClick={() => setActiveMode('ai')}
            >
              <Bot size={13} /> AI Guide
            </button>
            <button 
              className={`bl-mode-tab ${activeMode === 'support' ? 'active support' : ''}`}
              onClick={() => setActiveMode('support')}
            >
              <Headset size={13} /> Support
            </button>
          </div>

          {/* Messages List */}
          <div className="bl-chat-msgs">
            {activeMode === 'ai' ? (
              <>
                {messages.map((m) => (
                  <div key={m.id} className={`bl-msg ${m.sender === 'user' ? 'user' : m.sender === 'system' ? 'system' : 'bot'}`}>
                    {m.sender !== 'user' && m.sender !== 'system' && (
                      <div className="bl-msg-avatar">🤖</div>
                    )}
                    <div className="bl-msg-bubble">
                      {renderMessageContent(m.content)}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="bl-msg bot">
                    <div className="bl-msg-avatar">🤖</div>
                    <div className="bl-typing">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div className="bl-msg system-ok">
                  <div className="bl-msg-bubble">🔒 Secure channel ready</div>
                </div>
                <div className="bl-msg bot">
                  <div className="bl-msg-avatar">🎧</div>
                  <div className="bl-msg-bubble" style={{ background: '#0a1020', border: '1px solid rgba(68,136,255,0.2)', color: '#88bbff' }}>
                    Need help from a real person? Click the button below to initiate a private conversation with our admin support team.
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          {activeMode === 'ai' ? (
            <div className="bl-chat-footer">
              <textarea 
                className="bl-chat-input"
                placeholder="Ask about BlackLight..."
                rows={1}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <button className="bl-send-btn" onClick={handleSend}>
                <Send size={14} />
              </button>
            </div>
          ) : (
            <div className="bl-support-cta">
              <div className="bl-support-cta-title">💬 CHAT WITH THE ADMINS</div>
              <button className="bl-support-open-btn" onClick={handleSupportConnect}>
                <span>🔗</span> Open Private Support Chat
              </button>
            </div>
          )}

          <div className="bl-chat-banner">
            Full Messaging Panel → <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => { setIsOpen(false); navigate('/chat'); }}>Open Chat</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatbotWidget;
