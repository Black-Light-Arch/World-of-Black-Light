import React, { useState } from 'react';
import './Donation.css';

const Donation = () => {
  const [customAmount, setCustomAmount] = useState('');
  const [status, setStatus] = useState({ text: '', type: '' }); // type: 'info' | 'success' | 'error'
  const [txHistory, setTxHistory] = useState([]);

  const DESTINATION_ADDRESS = '0x9A5A203102052965E9bc8b94c54bAA82ab3e16F7';

  const performDonation = async (amount) => {
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      setStatus({ text: '❌ Invalid quantity of ETH specified.', type: 'error' });
      return;
    }

    const valueInWei = BigInt(Math.round(parseFloat(amount) * 1e18));
    const hexValue = '0x' + valueInWei.toString(16);

    // Check MetaMask installation
    if (typeof window.ethereum === 'undefined') {
      setStatus({ text: '🔌 Metamask node not detected. Redirecting to mobile/web portal...', type: 'info' });
      setTimeout(() => {
        const deepLink = `https://metamask.app.link/send/${DESTINATION_ADDRESS}?value=${valueInWei.toString()}`;
        window.open(deepLink, '_blank');
      }, 1500);
      return;
    }

    try {
      setStatus({ text: '📡 Initializing handshake with MetaMask...', type: 'info' });
      
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const fromAccount = accounts[0];
      
      setStatus({ text: '⏳ Staging gas parameters and transaction envelope...', type: 'info' });
      
      const transactionParameters = {
        to: DESTINATION_ADDRESS,
        from: fromAccount,
        value: hexValue,
      };
      
      setStatus({ text: '✍️ Awaiting cryptographic signature in MetaMask...', type: 'info' });
      
      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [transactionParameters],
      });
      
      setStatus({
        text: '🎉 Transaction signed and broadcasted successfully!',
        type: 'success'
      });

      // Add to local terminal log
      setTxHistory(prev => [
        { hash: txHash, amount, time: new Date().toLocaleTimeString() },
        ...prev
      ]);
      
      setCustomAmount('');
    } catch (err) {
      setStatus({ text: `⚠️ Error: ${err.message || 'Signature rejected by node'}`, type: 'error' });
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
    <div className="page-container fade-in donation-viewport">
      <section className="page-hero donate-hero">
        <h1 className="neon-text-green">⚡ Funding Gate</h1>
        <p className="sub-tag">Direct smart-contract contributions to support the BLACKLIGHT initiative.</p>
      </section>

      <section className="content-section donation-content">
        <div className="donation-grid-layout">
          
          {/* Main card */}
          <div className="donation-main-card glass-panel">
            <div className="cyber-corner top-left"></div>
            <div className="cyber-corner top-right"></div>
            <div className="cyber-corner bottom-left"></div>
            <div className="cyber-corner bottom-right"></div>

            <h2 className="card-header">Initialize Node Support</h2>
            <p className="card-desc">
              We are a decentralized community of game developers, tech-anarchists, and cyber-operatives. 
              Linking your MetaMask wallet sends donations directly to our staging wallet on the Ethereum network.
            </p>

            <div className="donation-widget-box">
              <div className="quick-presets-section">
                <span className="section-label">SELECT PROTOCOL PRESET</span>
                <div className="preset-buttons-grid">
                  <button type="button" className="preset-btn" onClick={() => handleQuickDonate(0.005)}>
                    <span>0.005 ETH</span>
                    <span className="usd-approx">~$15.00</span>
                  </button>
                  <button type="button" className="preset-btn" onClick={() => handleQuickDonate(0.01)}>
                    <span>0.01 ETH</span>
                    <span className="usd-approx">~$30.00</span>
                  </button>
                  <button type="button" className="preset-btn" onClick={() => handleQuickDonate(0.05)}>
                    <span>0.05 ETH</span>
                    <span className="usd-approx">~$150.00</span>
                  </button>
                </div>
              </div>

              <form className="custom-input-form" onSubmit={handleDonateCustom}>
                <span className="section-label">OR SPECIFY CUSTOM NODE FEED</span>
                <div className="custom-donate-row-input">
                  <div className="amount-input-wrap">
                    <input 
                      type="number" 
                      step="0.001" 
                      min="0.0001" 
                      placeholder="0.02" 
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      className="amount-eth-input"
                    />
                    <span className="input-currency-suffix">ETH</span>
                  </div>
                  <button type="submit" className="metamask-submit-btn">
                    Connect & Submit
                  </button>
                </div>
              </form>

              {status.text && (
                <div className={`terminal-log-box status-${status.type}`}>
                  <span className="prompt-indicator">&gt;</span>
                  <p className="log-text">{status.text}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Info panels */}
          <div className="donation-info-sidebar">
            <div className="donation-status-hud glass-panel">
              <h3>Gateway Status</h3>
              <div className="hud-metric">
                <span className="label">Destination Wallet:</span>
                <span className="val hash-string" title={DESTINATION_ADDRESS}>
                  {DESTINATION_ADDRESS.substring(0, 8)}...{DESTINATION_ADDRESS.substring(DESTINATION_ADDRESS.length - 8)}
                </span>
              </div>
              <div className="hud-metric">
                <span className="label">Network Node:</span>
                <span className="val status-online">ACTIVE</span>
              </div>
              <div className="hud-metric">
                <span className="label">Clearing Gateway:</span>
                <span className="val font-mono">METAMASK Web3</span>
              </div>
            </div>

            <div className="donation-console-logs glass-panel">
              <h3>Broadcasting Ledger</h3>
              <div className="log-feed">
                {txHistory.length === 0 ? (
                  <p className="empty-log">Awaiting outgoing transmissions...</p>
                ) : (
                  txHistory.map((tx, idx) => (
                    <div key={idx} className="tx-log-item">
                      <span className="time">[{tx.time}]</span>
                      <span className="msg">Sent {tx.amount} ETH</span>
                      <a href={`https://etherscan.io/tx/${tx.hash}`} target="_blank" rel="noopener noreferrer" className="hash-link">
                        Link: {tx.hash.substring(0, 10)}...
                      </a>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
};

export default Donation;
