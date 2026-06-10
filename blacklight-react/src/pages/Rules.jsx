import React from 'react';
import './Rules.css';

const Rules = () => {
  return (
    <div className="page-container fade-in rules-viewport">
      <section className="page-hero rules-hero">
        <h1 className="neon-text-cyan">📑 System Protocol</h1>
        <p className="sub-tag">Platform Rules, Compliance Guidelines, and Administrative Regulations.</p>
      </section>

      <section className="content-section rules-content">
        <div className="rules-layout-grid">
          
          <div className="rules-main-terms glass-panel">
            <div className="cyber-bracket top-left"></div>
            <div className="cyber-bracket top-right"></div>
            <div className="cyber-bracket bottom-left"></div>
            <div className="cyber-bracket bottom-right"></div>

            <div className="rules-section">
              <h2>01. General Code of Conduct</h2>
              <p>
                BLACKLIGHT is a gaming hub, AI research platform, and developer community. 
                All operatives are expected to conduct themselves with professional integrity. 
                Malicious attacks on other network members, including harassment, targeted security compromises, 
                or intentional system disruption, will result in immediate termination of the node account.
              </p>
            </div>

            <div className="rules-section warning-section">
              <h2>⚠️ 02. Administrative Surveillance & Safety Advisory</h2>
              <div className="warning-notice-box">
                <span className="notice-tag">IMPORTANT PROTOCOL WARNING</span>
                <p>
                  To maintain the safety and integrity of all operatives, users are hereby explicitly notified 
                  that the **Platform Administrator retains access and surveillance clearance over all network traffic**. 
                  This includes both multi-agent channels (**Group Chats**) and direct secure channels (**Private DMs**).
                </p>
                <p>
                  This access is strictly implemented for safety and community moderation:
                </p>
                <ul>
                  <li>Ensuring prompt moderation of offensive content or user harassment.</li>
                  <li>Preventing malicious sharing of malware or unauthorized corporate intellectual property.</li>
                  <li>Investigating safety reports filed by members.</li>
                </ul>
                <p>
                  By connecting your terminal to BLACKLIGHT, you acknowledge and agree to this security transparency policy. 
                  Operate securely and with respect for the safety of other developers.
                </p>
              </div>
            </div>

            <div className="rules-section">
              <h2>03. File Sharing Clearance</h2>
              <p>
                Our peer-to-peer file transfer system enables the sharing of code, graphics, and documentation. 
                While files are transferred directly via WebSockets without database storage, it is strictly forbidden 
                to upload malicious executables, copyright-infringing assets, or illicit media. Admins log transmission 
                metadata (such as filenames and sizes) to audit system security.
              </p>
            </div>

            <div className="rules-section">
              <h2>04. AI Interaction Protocol</h2>
              <p>
                The BlackLight AI Oracle is configured for advanced developer help and uncensored information mapping. 
                However, trying to jailbreak the model to generate illegal instructions or exploit external corporate 
                APIs is a violation of the network protocol and will trigger automated account suspension.
              </p>
            </div>

            <div className="rules-section">
              <h2>05. Web3 Cosmetics & Skins Clearance</h2>
              <p>
                Operatives can customize their profiles with virtual cosmetic skins. Standard skins like Neon Spectre 
                (green tag effect) and Cyber Phantom (cyan tag effect) are available for free. 
                However, the coveted <strong>LEGENDARY OPERATIVE</strong> skin (pulsing rainbow gradient tag and border effects) 
                requires direct clearance verification.
              </p>
              <p>
                To unlock the Legendary Operative clearance, operatives must perform a MetaMask transaction transferring 
                <strong>0.005 ETH</strong> directly to the platform developer's staging account at 
                <code>0x9A5A203102052965E9bc8b94c54bAA82ab3e16F7</code>. Once the transaction signature is validated by the system, 
                the skin token will be written to the database and activated on the profile. Purchases are final and 
                non-refundable under network protocols.
              </p>
            </div>
          </div>

          {/* Quick HUD checklist */}
          <div className="rules-checklist-hud glass-panel">
            <h3>Quick Checklist</h3>
            <div className="checklist-feed">
              <div className="check-item checked">
                <span className="box">✓</span>
                <span className="txt">Account Registration Active</span>
              </div>
              <div className="check-item checked">
                <span className="box">✓</span>
                <span className="txt">Security Protocols Accepted</span>
              </div>
              <div className="check-item checked">
                <span className="box">✓</span>
                <span className="txt">Surveillance Policy Confirmed</span>
              </div>
              <div className="check-item checked">
                <span className="box">✓</span>
                <span className="txt">Independent Dev Log Cleared</span>
              </div>
            </div>
            <div className="compliance-stamp">
              <span className="stamp-label">COMPLIANCE SIGN-OFF</span>
              <span className="stamp-hash">NODE-OK-2026.06</span>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
};

export default Rules;
