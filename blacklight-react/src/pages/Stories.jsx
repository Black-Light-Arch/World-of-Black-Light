import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Auth } from '../services/auth';
import './Stories.css';

const Stories = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(Auth.isLoggedIn());
  const [selectedStory, setSelectedStory] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    setIsLoggedIn(Auth.isLoggedIn());
  }, []);

  const storiesList = [
    {
      id: 'watcher',
      fileNumber: 'File 001',
      title: "THE ONE WHO WATCHES",
      subtitle: "Archive Entry — First Recorded Incident",
      coverImg: "/assets/images/covers/story1.jpg",
      glowColor: "rgba(94,23,235,0.3)",
      content: [
        "The first reports came quietly.",
        "Streetlights flickered at exactly 3:17 AM. Dogs refused to bark at empty corners. CCTV footage showed frames that no one remembered recording. And then people started saying the same thing: 'I feel like someone is standing behind me.' But when they turn — nothing is there.",
        "It began in a small town no map cared about. Nothing extraordinary. Nothing important. Until the power outages started. Not full blackouts. Just glitches — like reality blinking.",
        "Lights hum longer than they should. Shadows stretch in directions that ignore physics. Mirrors seem slightly delayed. And sometimes… they don't mimic you at all.",
        "A teenager named Aydan is the first to document it properly. He notices something no one else does: the pattern.",
        "The flickers happen only when no one is looking. Like something moves freely only when unseen. So he sets up cameras. Old camcorders. Motion detectors. Light sensors. But every recording has gaps. Gaps exactly 2.8 seconds long. Always 2.8 seconds. As if something edits reality itself.",
        "Then one night, Aydan forgets to turn off his bedroom camera.",
        "At 3:17 AM, the frame corrupts. White noise fills the room. His body rises slowly from the bed. Not naturally. Like something unfamiliar is learning how gravity works. His eyes open. Completely black. And he turns directly toward the camera. He smiles.",
        "The next morning, Aydan remembers none of it. But the footage doesn't lie. Frame 8129 shows something standing behind him. Too tall. Limbs slightly too long. Its face blurred — not by camera fault, but by something intentional. As if clarity itself refuses to describe it.",
        "The recordings stop after that night. Not because they broke. But because every device in the house melts internally. Circuits fused. Batteries corroded. No fire. No heat. Just… failure.",
        "Then the whispers start spreading online. Other towns. Other cameras. Same time. 3:17 AM. Same glitch length. 2.8 seconds missing.",
        "People start calling it: 'The Watcher.' Because whatever it is — it doesn't attack. It doesn't chase. It doesn't scream. It just watches. Studying. Waiting. Learning how we behave when we think we are alone.",
        "The disturbing part? The glitch duration is shrinking. 2.8 seconds became 2.3. Then 1.7. Then 0.9. Something is getting faster. Or better.",
        "Aydan disappears three weeks later. No signs of forced entry. No struggle. But in his room, written faintly on the wall in dust: 'You're looking at the wrong direction.'",
        "And ever since that day, there's been an uncomfortable feeling spreading worldwide. Not fear. Not paranoia. Something quieter. More primal. The instinct you get when your body senses a predator before your mind does. The feeling that the darkness isn't empty. That it's observing. Waiting for you to blink. Waiting for you to feel safe. Because the moment you do… The 2.8 seconds might be yours.",
        "This is the first archived incident recorded under: World of BlackLight. More files remain classified."
      ]
    },
    {
      id: 'signal',
      fileNumber: 'File 002',
      title: "SIGNAL BELOW ZERO",
      subtitle: "Archive Entry 02 — Deep-Sea Anomaly Record",
      coverImg: "/assets/images/covers/story2.jpg",
      glowColor: "rgba(0,150,200,0.3)",
      content: [
        "The deep-sea research station Nereus-12 was never meant to be manned long-term. It was designed for 6-month rotations. Six scientists. Depth: 4,900 meters below sea level. No windows. No natural light. No night or day. Just steel walls. Water pressure. And darkness pressing from every direction.",
        "The first anomaly was audio. A low rhythmic pulse began broadcasting through every communication channel. Submarine frequency. Too structured to be tectonic. Too clean to be natural. It repeated every 12 minutes. A pattern resembling Morse — but wrong.",
        "Engineers tried to trace it. The source was always detected as 'below station.' Which was impossible. There is no 'below' at that depth. Only ocean floor.",
        "On week 11, crew member Dr. Hara stops sleeping. She claims the pulses are responding to their conversations. Not in language. In timing. When they whisper, it pulses softer. When they argue, it intensifies. When one crew member cries, it stops completely. As if listening.",
        "Then the cameras malfunction. Every corridor feed shows condensation forming on interior walls — from the inside. Water droplets gathering as though something cold walks past. But the temperature remains stable. No leaks. No cracks.",
        "They send a rover downward. It descends 40 meters beneath the station, drilling toward where the signal should originate. The video feed turns to static at exactly 117 meters below.",
        "Before cutting, one clear frame is transmitted. The ocean floor is not flat. It is carved. Spirals. Massive geometric formations too large to be natural erosion. And in the center — a dark vertical line. Not a trench. A seam. Like something has been split open before.",
        "The pulse stops the same day. Station systems shut down simultaneously. Not damaged. Simply turned off. Internal logs show manual shutdown commands were executed. Signed by Dr. Hara. She denies touching anything.",
        "When questioned, she replies calmly: 'It reached zero.' No one knows what that means.",
        "Nereus-12 was decommissioned quietly. No public explanation. Satellite imagery later revealed something impossible: the ocean surface above the station ripples in perfect circles every 12 minutes. No storms. No ships. Just circular waves expanding outward. As if something deep below is breathing.",
        "File Status: ⚠️ Active monitoring required."
      ]
    },
    {
      id: 'city',
      fileNumber: 'File 003',
      title: "THE CITY WITHOUT SHADOWS",
      subtitle: "Archive Entry 03 — Dimensional Inversion Event",
      coverImg: "/assets/images/covers/story3.jpg",
      glowColor: "rgba(140,80,200,0.3)",
      content: [
        "The phenomenon was first noticed during a solar eclipse. Not because of the darkness. Because of what was missing. Shadows.",
        "For 4 minutes and 21 seconds, nothing cast one. Buildings stood under blocked sunlight. Cars, people, trees — all without silhouettes. As if light existed but refused to project depth.",
        "The city reported dizziness and nausea. Many described feeling 'flat.' Like something dimensional had shifted.",
        "Photographers rushed to capture images. Every photo taken during that window came out overexposed — white silhouettes where shadows should define shape. Except for one.",
        "A street-level shot taken by a tourist. It shows something different. Instead of shadows beneath people… dark forms stand behind them. Not attached. Not mimicking. Just positioned.",
        "After the eclipse ended, shadows returned. But inconsistently. Some citizens reported noticing their shadows move slightly out of sync. A half-second delay. A tilt of the head not mirrored. A wave of an arm unacknowledged. Most dismissed it as imagination.",
        "Until the disappearances.",
        "Eleven residents vanished over six weeks. No traces. No crime evidence. But security footage reveals a disturbing pattern: before each disappearance, the person's shadow becomes more defined than their body. Sharper. Darker. Almost dimensional. Then, in the final recorded frame — the person flickers. And only the shadow remains. Still standing. Solid. Like it has mass.",
        "A child survivor described it best. When asked what she saw before her father disappeared, she said: 'His shadow stepped forward.'",
        "The city attempted a complete blackout for one night. Power grid shutdown. No artificial lighting. They believed without light, shadows would not exist.",
        "At midnight, emergency calls flooded in. Reports of dark figures moving independently through streets. Not attached to anything. Formless yet upright. By morning, 37 more were gone. This time, no shadows anywhere. Even under sunlight.",
        "The city now exists under a strange rule: nothing casts one. Scientists cannot explain it.",
        "World of BlackLight classifies it as: Dimensional inversion event. Probability of spread: Unknown."
      ]
    }
  ];

  if (!isLoggedIn) {
    return (
      <div className="page-container fade-in">
        <section className="page-hero">
          <h1>🔒 Restricted Archive</h1>
          <p>This terminal requires security clearance</p>
        </section>

        <section className="content-section login-gate-wrapper">
          <div className="login-gate glass-panel glow-hover">
            <div className="login-gate-icon">📁</div>
            <h2>Classified Archive</h2>
            <p>These files contain restricted logs of studio findings. You must be a registered BlackLight member to access this database.</p>
            <div className="gate-actions">
              <Link to="/login" className="btn-primary">Sign In</Link>
              <Link to="/signup" className="btn-secondary">Create Account</Link>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (selectedStory) {
    return (
      <div className="page-container fade-in">
        <section className="story-header" style={{ textShadow: `0 0 10px ${selectedStory.glowColor}` }}>
          <img 
            src={selectedStory.coverImg} 
            alt={selectedStory.title} 
            className="story-header-img"
            style={{ borderColor: selectedStory.glowColor }} 
          />
          <h1>{selectedStory.title}</h1>
          <p className="story-meta-badge">{selectedStory.fileNumber} &mdash; {selectedStory.subtitle}</p>
        </section>

        <section className="content-section story-reading-body">
          <div className="story-content-box glass-panel">
            {selectedStory.content.map((paragraph, idx) => (
              <p key={idx} className="story-paragraph">{paragraph}</p>
            ))}
          </div>
          <div className="story-nav-back">
            <button className="btn-secondary" onClick={() => setSelectedStory(null)}>
              &larr; Return to Archive
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="page-container fade-in">
      <section className="page-hero">
        <h1>📁 Classified Archive</h1>
        <p>Restricted data vaults for registered operatives only</p>
      </section>

      <section className="content-section">
        <div className="stories-grid-layout">
          {storiesList.map((story) => (
            <div 
              key={story.id} 
              className="story-tile-card glass-panel glow-hover"
              onClick={() => setSelectedStory(story)}
            >
              <div className="story-tile-img-wrap">
                <img src={story.coverImg} alt={story.title} />
              </div>
              <div className="story-tile-details">
                <span className="story-number-tag">{story.fileNumber}</span>
                <h3>{story.title}</h3>
                <p className="story-teaser-txt">Click to decrypt report files &rarr;</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Stories;
