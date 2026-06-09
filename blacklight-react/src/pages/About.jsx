import React, { useState } from 'react';
import './About.css';

const About = () => {
  const [customAmount, setCustomAmount] = useState('');
  const [status, setStatus] = useState({ text: '', type: '' }); // type: 'info' | 'success' | 'error'

  const DESTINATION_ADDRESS = '0x9A5A203102052965E9bc8b94c54bAA82ab3e16F7';

  const performDonation = async (amount) => {
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      setStatus({ text: '❌ Please enter a valid ETH amount.', type: 'error' });
      return;
    }

    const valueInWei = BigInt(Math.round(parseFloat(amount) * 1e18));
    const hexValue = '0x' + valueInWei.toString(16);

    // If MetaMask is not installed
    if (typeof window.ethereum === 'undefined') {
      setStatus({ text: '🔌 Redirecting to MetaMask app/send portal...', type: 'info' });
      setTimeout(() => {
        const deepLink = `https://metamask.app.link/send/${DESTINATION_ADDRESS}?value=${valueInWei.toString()}`;
        window.open(deepLink, '_blank');
      }, 1000);
      return;
    }

    try {
      setStatus({ text: '🔌 Connecting to MetaMask...', type: 'info' });
      
      // Request accounts
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const fromAccount = accounts[0];
      
      setStatus({ text: '⏳ Preparing transaction...', type: 'info' });
      
      const transactionParameters = {
        to: DESTINATION_ADDRESS,
        from: fromAccount,
        value: hexValue,
      };
      
      setStatus({ text: '✍️ Please confirm the transaction in MetaMask...', type: 'info' });
      
      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [transactionParameters],
      });
      
      setStatus({
        text: `✅ Submitted! Tx Hash: ${txHash.substring(0, 15)}...${txHash.substring(txHash.length - 8)}`,
        type: 'success'
      });
      setCustomAmount('');
    } catch (err) {
      setStatus({ text: `❌ Error: ${err.message || 'Transaction rejected'}`, type: 'error' });
    }
  };

  const handleQuickDonate = (amount) => {
    performDonation(amount);
  };

  const handleDonateCustom = (e) => {
    e.preventDefault();
    performDonation(customAmount);
  };

  return (
    <div className="page-container fade-in">
      <section className="page-hero">
        <h1>👁️ About</h1>
        <p>The studio behind the darkness</p>
      </section>

      <section className="content-section about-layout">
        <div className="about-grid">
          
          <div className="about-card glass-panel">
            <h2>Who We Are</h2>
            <span className="card-sub">World of BlackLight Studio</span>
            <p>
              World of BlackLight is an independent horror game studio dedicated to crafting
              psychological experiences that blur the line between player and story.
              We build worlds that breathe, watch, and remember.
            </p>
          </div>

          <div className="about-card glass-panel">
            <h2>Our Philosophy</h2>
            <span className="card-sub">Design Direction</span>
            <p>
              We believe fear is most powerful when it is quiet. Our games are built around
              atmosphere, implication, and presence &mdash; not shock. The darkness in our worlds
              is earned through design, not forced through spectacle.
            </p>
          </div>

          <div className="about-card glass-panel">
            <h2>Current Project</h2>
            <span className="card-sub">In Development</span>
            <p>
              <em>The One Who&rsquo;s Watching</em> is our debut title &mdash; a first-person
              psychological horror experience set in an abandoned hospital where something
              has been waiting long before you arrived.
            </p>
          </div>

          <div className="about-card glass-panel">
            <h2>Contact</h2>
            <span className="card-sub">Reach Out</span>
            <p>
              For press inquiries, collaborations, or general questions, reach us at{' '}
              <a href="mailto:studio@worldofblacklight.com" className="email-link">
                studio@worldofblacklight.com
              </a>
            </p>
          </div>

          {/* METAMASK WIDGET */}
          <div className="about-card donation-card glass-panel col-span-2">
            <h2>Support Our Development</h2>
            <span className="card-sub">MetaMask Contributions</span>
            <p>
              We are a fully independent studio. If you'd like to support our craft, all contributions
              go directly toward development and keeping the servers running. Please note that all payments
              are processed as donations.
            </p>

            <div className="donation-widget">
              <div className="widget-row">
                <span className="widget-label">Quick Donate</span>
                <div className="quick-donate-grid">
                  <button type="button" className="quick-donate-btn" onClick={() => handleQuickDonate(0.005)}>0.005 ETH</button>
                  <button type="button" className="quick-donate-btn" onClick={() => handleQuickDonate(0.01)}>0.01 ETH</button>
                  <button type="button" className="quick-donate-btn" onClick={() => handleQuickDonate(0.05)}>0.05 ETH</button>
                </div>
              </div>

              <form className="custom-donate-form" onSubmit={handleDonateCustom}>
                <span className="widget-label">Or Custom Amount</span>
                <div className="custom-donate-row">
                  <input 
                    type="number" 
                    step="0.001" 
                    min="0.0001" 
                    placeholder="Amount in ETH (e.g. 0.02)" 
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="custom-amount-input"
                  />
                  <button type="submit" className="btn-primary donate-submit-btn">
                    Donate with MetaMask
                  </button>
                </div>
              </form>

              {status.text && (
                <div className={`donation-status-box status-${status.type}`}>
                  {status.text}
                </div>
              )}
            </div>
          </div>

        </div>
      </section>
    </div>
  );
};

export default About;
