import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Auth } from '../services/auth';
import { getSocket } from '../services/socket';
import { Play, Users, Send, ShieldAlert, Award } from 'lucide-react';
import './Games.css';

const Games = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [session] = useState(Auth.getSession());
  const token = Auth.getToken();

  // Selected sub-tab: 'dev-logs', 'maze', 'raycaster'
  const [activeTab, setActiveTab] = useState('dev-logs');
  const [friends, setFriends] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);

  // Socket
  const socketRef = useRef(null);

  // Read URL query parameter for game launch invitation
  useEffect(() => {
    const launchMode = searchParams.get('mode');
    if (launchMode) {
      if (launchMode.toLowerCase() === 'maze runner') {
        setActiveTab('maze');
      } else if (launchMode.toLowerCase() === '3d corridor') {
        setActiveTab('raycaster');
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (!Auth.isLoggedIn()) {
      navigate('/login');
      return;
    }
    
    // Load friends
    loadFriends();

    // Socket.io for online lists
    const socket = getSocket();
    if (socket) {
      socketRef.current = socket;
      socket.emit('authenticate', { token });
      
      socket.on('online_users', (users) => {
        setOnlineUsers(users.filter(u => u !== session?.username));
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.off('online_users');
      }
    };
  }, [navigate]);

  const loadFriends = async () => {
    try {
      const res = await fetch('/api/friends', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFriends(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendInvite = async (friendUsername, gameName) => {
    if (!socketRef.current) return;
    const sorted = [session.username, friendUsername].sort();
    const roomName = `private:${sorted[0]}:${sorted[1]}`;

    // Join room on socket and send invite
    socketRef.current.emit('join_room', { room: roomName });
    socketRef.current.emit('send_message', {
      room: roomName,
      content: `⚔️ GAME_INVITE:${gameName}`
    });
    alert(`⚔️ Invitation to join ${gameName} dispatched to @${friendUsername} via DMs!`);
  };

  const handleAddFriend = async (targetUsername) => {
    try {
      const res = await fetch('/api/friends/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ username: targetUsername })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert(`✅ Contact Decrypt request dispatched to @${targetUsername}!`);
      if (socketRef.current) {
        socketRef.current.emit('friend_request', { from: session.username, fromEmoji: session.emoji });
      }
      loadFriends();
    } catch (err) {
      alert(err.message);
    }
  };

  // 1. MAZE RUNNER GAME ENGINE
  const MazeRunner = () => {
    const canvasRef = useRef(null);
    const [gameState, setGameState] = useState('idle'); // idle, playing, won, lost
    const [timeLeft, setTimeLeft] = useState(30);
    const timerRef = useRef(null);

    // Hardcoded high-fidelity maze grid (1 = Wall, 0 = Path, S = Start, E = End)
    const mazeGrid = [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
      [1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1],
      [1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1],
      [1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
      [1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1],
      [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1],
      [1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1],
      [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1],
      [1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1],
      [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ];

    const playerPos = useRef({ x: 1, y: 1 });
    const targetPos = { x: 13, y: 13 };

    const startTimer = () => {
      setTimeLeft(30);
      setGameState('playing');
      playerPos.current = { x: 1, y: 1 };
      
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setGameState('lost');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    };

    const handleKeyDown = (e) => {
      if (gameState !== 'playing') return;
      const { x, y } = playerPos.current;
      let nx = x;
      let ny = y;

      if (e.key === 'w' || e.key === 'ArrowUp') ny--;
      if (e.key === 's' || e.key === 'ArrowDown') ny++;
      if (e.key === 'a' || e.key === 'ArrowLeft') nx--;
      if (e.key === 'd' || e.key === 'ArrowRight') nx++;

      // Collision checks
      if (mazeGrid[ny] && mazeGrid[ny][nx] === 0) {
        playerPos.current = { x: nx, y: ny };
        
        // Win condition
        if (nx === targetPos.x && ny === targetPos.y) {
          clearInterval(timerRef.current);
          setGameState('won');
        }
      }
    };

    useEffect(() => {
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }, [gameState]);

    // Canvas drawing
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const cellSize = canvas.width / 15;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw maze grid
      for (let y = 0; y < 15; y++) {
        for (let x = 0; x < 15; x++) {
          if (mazeGrid[y][x] === 1) {
            ctx.fillStyle = '#111827';
            ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
            ctx.strokeStyle = '#1F2937';
            ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
          } else {
            ctx.fillStyle = '#030712';
            ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
          }
        }
      }

      // Draw escape portal
      ctx.fillStyle = '#10B981';
      ctx.beginPath();
      ctx.arc(targetPos.x * cellSize + cellSize/2, targetPos.y * cellSize + cellSize/2, cellSize/3, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#10B981';

      // Draw player hacker node
      ctx.fillStyle = '#8B5CF6';
      ctx.shadowColor = '#8B5CF6';
      ctx.beginPath();
      ctx.arc(playerPos.current.x * cellSize + cellSize/2, playerPos.current.y * cellSize + cellSize/2, cellSize/3.5, 0, Math.PI * 2);
      ctx.fill();
      
      // Reset shadow
      ctx.shadowBlur = 0;

    }, [gameState, playerPos.current]);

    return (
      <div className="game-card glass-panel">
        <div className="game-header">
          <h3>Simulation: Maze Decryptor</h3>
          <span className="game-timer font-mono">TIMER: {timeLeft}s</span>
        </div>
        <div className="canvas-wrapper">
          <canvas ref={canvasRef} width={450} height={450} className="game-canvas" />
          {gameState !== 'playing' && (
            <div className="canvas-overlay">
              {gameState === 'idle' && (
                <>
                  <h4>Grid Node Scrambled</h4>
                  <p>Decrypt the maze by finding the green escape core.</p>
                  <button className="btn-primary start-btn" onClick={startTimer}>Launch Decryptor</button>
                </>
              )}
              {gameState === 'won' && (
                <>
                  <h4 style={{ color: '#10B981' }}>✓ Decryption Successful</h4>
                  <p>You extracted the clearance tokens in time!</p>
                  <button className="btn-primary start-btn" onClick={startTimer}>Simulate Again</button>
                </>
              )}
              {gameState === 'lost' && (
                <>
                  <h4 style={{ color: '#EF4444' }}>⚡ Node Termination</h4>
                  <p>Signal packet timeout. The gateway closed.</p>
                  <button className="btn-primary start-btn" onClick={startTimer}>Retry Node Link</button>
                </>
              )}
            </div>
          )}
        </div>
        <p className="game-controls">Controls: Use **WASD** or **Arrow Keys** to steer the purple packet to the green gate.</p>
      </div>
    );
  };

  // 2. 3D FIRST PERSON RAYCASTER GAME ENGINE
  const Raycaster3D = () => {
    const canvasRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const requestRef = useRef(null);

    // Grid map (1 = Wall, 0 = Corridor)
    const map = [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 1, 0, 0, 1],
      [1, 0, 1, 1, 0, 0, 1, 0, 0, 1],
      [1, 0, 1, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 1, 1, 1, 0, 0, 1],
      [1, 0, 1, 0, 1, 0, 1, 0, 0, 1],
      [1, 0, 1, 0, 1, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ];

    // Player position
    const player = useRef({
      x: 1.5,
      y: 1.5,
      angle: 0 // angle in radians
    });

    const keys = useRef({});

    const handleKeyDown = (e) => { keys.current[e.key] = true; };
    const handleKeyUp = (e) => { keys.current[e.key] = false; };

    useEffect(() => {
      if (isPlaying) {
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
      }
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
      };
    }, [isPlaying]);

    const runRaycaster = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');

      const width = canvas.width;
      const height = canvas.height;

      // Update Player positioning based on keys
      const speed = 0.04;
      const rotSpeed = 0.03;
      const p = player.current;

      if (keys.current['w'] || keys.current['ArrowUp']) {
        const nx = p.x + Math.cos(p.angle) * speed;
        const ny = p.y + Math.sin(p.angle) * speed;
        if (map[Math.floor(ny)][Math.floor(p.x)] === 0) p.y = ny;
        if (map[Math.floor(p.y)][Math.floor(nx)] === 0) p.x = nx;
      }
      if (keys.current['s'] || keys.current['ArrowDown']) {
        const nx = p.x - Math.cos(p.angle) * speed;
        const ny = p.y - Math.sin(p.angle) * speed;
        if (map[Math.floor(ny)][Math.floor(p.x)] === 0) p.y = ny;
        if (map[Math.floor(p.y)][Math.floor(nx)] === 0) p.x = nx;
      }
      if (keys.current['a'] || keys.current['ArrowLeft'] || keys.current['ArrowLeft']) {
        p.angle -= rotSpeed;
      }
      if (keys.current['d'] || keys.current['ArrowRight']) {
        p.angle += rotSpeed;
      }

      // Drawing background (Sky and Floor)
      ctx.fillStyle = '#06060c'; // Ceiling
      ctx.fillRect(0, 0, width, height / 2);
      ctx.fillStyle = '#0d0d1a'; // Floor
      ctx.fillRect(0, height / 2, width, height / 2);

      // Raycasting algorithm
      const fov = Math.PI / 3; // 60 degrees
      const numRays = width;
      const halfFov = fov / 2;
      const stepAngle = fov / numRays;

      for (let i = 0; i < numRays; i++) {
        const rayAngle = p.angle - halfFov + i * stepAngle;
        let dist = 0;
        let hitWall = false;

        const sin = Math.sin(rayAngle);
        const cos = Math.cos(rayAngle);

        while (!hitWall && dist < 16) {
          dist += 0.05;
          const checkX = Math.floor(p.x + cos * dist);
          const checkY = Math.floor(p.y + sin * dist);

          if (map[checkY] && map[checkY][checkX] === 1) {
            hitWall = true;
          }
        }

        // Correct fish-eye distortion
        const corrDist = dist * Math.cos(rayAngle - p.angle);
        const wallHeight = Math.min(height, (height / corrDist));

        // Shade coloring based on wall distance (closer = bright cyan/purple)
        const intensity = Math.max(0, 255 - corrDist * 20);
        
        ctx.strokeStyle = `rgb(0, ${Math.floor(intensity * 0.9)}, ${Math.floor(intensity)})`;
        ctx.beginPath();
        ctx.moveTo(i, (height - wallHeight) / 2);
        ctx.lineTo(i, (height + wallHeight) / 2);
        ctx.stroke();
      }

      // Draw tactical HUD mini-map overlay
      const miniSize = 80;
      const miniCell = miniSize / 10;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(10, 10, miniSize, miniSize);
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.3)';
      ctx.strokeRect(10, 10, miniSize, miniSize);

      for (let y = 0; y < 10; y++) {
        for (let x = 0; x < 10; x++) {
          if (map[y][x] === 1) {
            ctx.fillStyle = 'rgba(0, 229, 255, 0.2)';
            ctx.fillRect(10 + x * miniCell, 10 + y * miniCell, miniCell, miniCell);
          }
        }
      }

      // Draw player indicator in mini-map
      ctx.fillStyle = '#8B5CF6';
      ctx.beginPath();
      ctx.arc(10 + p.x * miniCell, 10 + p.y * miniCell, 2, 0, Math.PI * 2);
      ctx.fill();

      // Field of view vector line
      ctx.strokeStyle = '#00E5FF';
      ctx.beginPath();
      ctx.moveTo(10 + p.x * miniCell, 10 + p.y * miniCell);
      ctx.lineTo(
        10 + p.x * miniCell + Math.cos(p.angle) * 8,
        10 + p.y * miniCell + Math.sin(p.angle) * 8
      );
      ctx.stroke();

      if (isPlaying) {
        requestRef.current = requestAnimationFrame(runRaycaster);
      }
    };

    useEffect(() => {
      if (isPlaying) {
        requestRef.current = requestAnimationFrame(runRaycaster);
      }
      return () => cancelAnimationFrame(requestRef.current);
    }, [isPlaying]);

    return (
      <div className="game-card glass-panel">
        <div className="game-header">
          <h3>Simulation: Hacker Corridor 3D</h3>
          <span className="game-timer font-mono">STATUS: DEPLOYED</span>
        </div>
        <div className="canvas-wrapper">
          <canvas ref={canvasRef} width={450} height={300} className="game-canvas" />
          {!isPlaying && (
            <div className="canvas-overlay">
              <h4>Corridor Grid Matrix</h4>
              <p>Explore the 3D grid layout corridor structures.</p>
              <button className="btn-primary start-btn" onClick={() => setIsPlaying(true)}>Boot Terminal 3D</button>
            </div>
          )}
        </div>
        <p className="game-controls">Controls: Move with **W/S** and rotate/steer direction with **A/D** (or Left/Right Arrows).</p>
      </div>
    );
  };

  // Static games data
  const staticGamesList = [
    {
      id: 'watching',
      title: "The One Who's Watching",
      tagline: "Psychological Horror Experience",
      coverImg: "/assets/images/screenshots/game1.jpg",
      description: [
        "A quiet town filled with strange frequencies. Explore the streets under the watch of an omnipresent digital eye."
      ],
      features: [
        "Unreal Engine 5 assets",
        "Spatial audio algorithms",
        "MetaMask cosmetic synchronization"
      ]
    }
  ];

  return (
    <div className="page-container fade-in games-viewport">
      <section className="page-hero games-hero">
        <h1 className="neon-text-violet">⚔️ Game Arena</h1>
        <p className="sub-tag">Play cyber simulations, coordinate with operatives, and unlock premium upgrades.</p>
      </section>

      <section className="content-section games-content">
        <div className="games-tab-navigation">
          <button className={`games-tab-btn ${activeTab === 'dev-logs' ? 'active' : ''}`} onClick={() => setActiveTab('dev-logs')}>Dev Logs</button>
          <button className={`games-tab-btn ${activeTab === 'maze' ? 'active' : ''}`} onClick={() => setActiveTab('maze')}>Maze Runner</button>
          <button className={`games-tab-btn ${activeTab === 'raycaster' ? 'active' : ''}`} onClick={() => setActiveTab('raycaster')}>3D Corridor</button>
        </div>

        <div className="games-grid-main">
          
          {/* Main game board */}
          <div className="games-main-board">
            {activeTab === 'dev-logs' && (
              <div className="games-details-log glass-panel">
                <div className="game-banner-cover">
                  <img src={staticGamesList[0].coverImg} alt={staticGamesList[0].title} />
                  <div className="banner-title-overlay">
                    <h2>{staticGamesList[0].title}</h2>
                    <p className="details-tagline">{staticGamesList[0].tagline}</p>
                  </div>
                </div>
                <div className="games-desc-text">
                  <p>{staticGamesList[0].description[0]}</p>
                  <h3>Key Features</h3>
                  <ul>
                    {staticGamesList[0].features.map((f, i) => <li key={i}>💠 {f}</li>)}
                  </ul>
                </div>
              </div>
            )}
            {activeTab === 'maze' && <MazeRunner />}
            {activeTab === 'raycaster' && <Raycaster3D />}
          </div>

          {/* Social HUD sidebar */}
          <aside className="games-social-hud glass-panel">
            <h3>Invite Operatives</h3>
            <div className="friends-invite-list">
              {friends.length === 0 ? (
                <p className="empty-txt">No active links found.</p>
              ) : (
                friends.map((f) => (
                  <div key={f.friend_username} className="hud-social-row">
                    <span className="emoji">{f.emoji || '👤'}</span>
                    <span className="username">@{f.friend_username}</span>
                    {activeTab !== 'dev-logs' ? (
                      <button 
                        className="invite-btn"
                        onClick={() => handleSendInvite(f.friend_username, activeTab === 'maze' ? 'Maze Runner' : '3D Corridor')}
                      >
                        Invite
                      </button>
                    ) : (
                      <span className="status-label">Offline</span>
                    )}
                  </div>
                ))
              )}
            </div>

            <h3 style={{ marginTop: '24px' }}>Active Sockets (Add Friends)</h3>
            <div className="online-add-list">
              {onlineUsers.length === 0 ? (
                <p className="empty-txt">No unlinked nodes detected.</p>
              ) : (
                onlineUsers.map((u) => {
                  const isFriend = friends.some(f => f.friend_username === u);
                  return (
                    <div key={u} className="hud-social-row">
                      <span className="username">@{u}</span>
                      {!isFriend ? (
                        <button className="add-btn" onClick={() => handleAddFriend(u)}>Add</button>
                      ) : (
                        <span className="status-label green">Linked</span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </aside>

        </div>
      </section>
    </div>
  );
};

export default Games;
