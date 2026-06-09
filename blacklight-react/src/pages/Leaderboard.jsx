import React, { useState, useEffect } from 'react';
import './Leaderboard.css';

const Leaderboard = () => {
  const [rankings, setRankings] = useState([]);
  const [gameFilter, setGameFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [animate, setAnimate] = useState(false);

  const fetchRankings = async (game = gameFilter) => {
    setLoading(true);
    setAnimate(false);
    const params = new URLSearchParams();
    if (game) params.set('game', game);

    try {
      const res = await fetch(`/api/leaderboard?${params}`);
      const data = await res.json();
      setRankings(data);
      
      // Trigger animations on next render tick
      setTimeout(() => {
        setAnimate(true);
      }, 100);

    } catch (err) {
      console.error('Could not load leaderboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRankings();
  }, [gameFilter]);

  // Extract Top 3 for the podium
  const top3 = rankings.slice(0, 3);
  // Rest of the ranks
  const tableData = rankings.slice(3);

  // Highest score to calculate percentage widths for bars
  const maxScore = rankings.length > 0 ? rankings[0].score : 1;

  // Podium order: 2nd place on left, 1st place in center, 3rd place on right
  const podiumOrder = [];
  if (top3[1]) podiumOrder.push({ ...top3[1], spot: 2 }); // 2nd Place
  if (top3[0]) podiumOrder.push({ ...top3[0], spot: 1 }); // 1st Place
  if (top3[2]) podiumOrder.push({ ...top3[2], spot: 3 }); // 3rd Place

  const spotBadges = {
    1: { label: '1st', medal: '🥇', class: 'gold' },
    2: { label: '2nd', medal: '🥈', class: 'silver' },
    3: { label: '3rd', medal: '🥉', class: 'bronze' }
  };

  return (
    <div className="page-container fade-in">
      <section className="page-hero">
        <h1>🏅 Leaderboard</h1>
        <p>The elite ranked by score — glory belongs to the brave</p>
      </section>

      {/* FILTER CONTROL */}
      <section className="lb-filter-section">
        <div className="lb-filter-inner glass-panel">
          <label htmlFor="lbGameFilter">Filter by Game:</label>
          <select 
            id="lbGameFilter" 
            value={gameFilter}
            onChange={(e) => setGameFilter(e.target.value)}
          >
            <option value="">All Games</option>
            <option value="Battle Royale">Battle Royale</option>
            <option value="FPS Arena">FPS Arena</option>
            <option value="Shadow Tactics">Shadow Tactics</option>
            <option value="Void Runner">Void Runner</option>
            <option value="Dark Siege">Dark Siege</option>
          </select>
        </div>
      </section>

      {/* PODIUM */}
      {!loading && podiumOrder.length > 0 && (
        <section className="podium-section">
          <div className="podium-wrap">
            {podiumOrder.map((player) => {
              const badge = spotBadges[player.spot];
              return (
                <div key={player.id} className={`podium-card podium-${badge.class}`}>
                  <div className="podium-avatar-wrap">
                    <div className="podium-avatar">{player.emoji || '👤'}</div>
                    <span className="podium-medal">{badge.medal}</span>
                  </div>
                  <h3>{player.gamer_tag}</h3>
                  <p className="podium-game">🎮 {player.game}</p>
                  
                  <div className="podium-pillar">
                    <span className="podium-spot-lbl">{badge.label}</span>
                    <span className="podium-score">{(player.score || 0).toLocaleString()} pts</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* RANKINGS TABLE */}
      <section className="lb-table-section">
        <div className="lb-table-wrap glass-panel">
          {loading ? (
            <div className="lb-loading">
              <div className="spinner"></div>
              <p>Loading rankings...</p>
            </div>
          ) : rankings.length === 0 ? (
            <p className="lb-empty-txt">No rankings recorded for this game category.</p>
          ) : (
            <table className="lb-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Player</th>
                  <th>Game</th>
                  <th>Rank</th>
                  <th>Score</th>
                  <th>W / L</th>
                  <th className="hide-mobile">Score Proportion</th>
                </tr>
              </thead>
              <tbody>
                {/* Render podium top 3 inline too if needed, or render just tableData. Let's render everything inside the table as list, so they are all visible, or follow legacy which showed tableData (ranks 4+) below. The legacy actually displayed everything starting from rank 4 (or all if top 3 was missing). Let's follow legacy and show ranks 4+ in the table. */}
                {rankings.map((p, index) => {
                  const rankNum = index + 1;
                  const pct = Math.max(2, (p.score / maxScore) * 100);

                  return (
                    <tr key={p.id} className={rankNum <= 3 ? `table-row-top rank-row-${rankNum}` : ''}>
                      <td>
                        <span className="rank-num-badge">
                          {rankNum <= 3 ? spotBadges[rankNum].medal : rankNum}
                        </span>
                      </td>
                      <td>
                        <div className="lb-player-cell">
                          <span className="lb-player-emoji">{p.emoji || '👤'}</span>
                          <div className="lb-player-names">
                            <span className="lb-player-tag">{p.gamer_tag}</span>
                            <span className="lb-player-fullname">{p.first_name} {p.last_name}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="lb-game-name">🎮 {p.game}</span>
                      </td>
                      <td>
                        <span className={`lb-rank-badge rank-${p.rank}`}>{p.rank}</span>
                      </td>
                      <td>
                        <strong className="lb-score-val">{(p.score || 0).toLocaleString()}</strong>
                      </td>
                      <td>
                        <span className="lb-wl-stats">{p.wins || 0}W / {p.losses || 0}L</span>
                      </td>
                      <td className="hide-mobile score-bar-cell">
                        <div className="lb-score-bar-bg">
                          <div 
                            className="lb-score-bar-fill"
                            style={{ width: animate ? `${pct}%` : '0%' }}
                          ></div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
};

export default Leaderboard;
