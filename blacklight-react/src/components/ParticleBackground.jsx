import React, { useEffect, useRef } from 'react';

const ParticleBackground = () => {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let particles = [];
    const particleCount = 80;
    const focalLength = 300;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e) => {
      // Normalize mouse coordinates to range [-0.5, 0.5] relative to screen size
      mouseRef.current.targetX = (e.clientX - window.innerWidth / 2) / window.innerWidth;
      mouseRef.current.targetY = (e.clientY - window.innerHeight / 2) / window.innerHeight;
    };

    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('mousemove', handleMouseMove);
    resizeCanvas();

    // Initialize particles with 3D positions (x, y, z)
    // x: [-window.innerWidth, window.innerWidth]
    // y: [-window.innerHeight, window.innerHeight]
    // z: [0, 800]
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * window.innerWidth * 2 - window.innerWidth,
        y: Math.random() * window.innerHeight * 2 - window.innerHeight,
        z: Math.random() * 800,
        radius: Math.random() * 2 + 1,
        speedZ: Math.random() * 0.5 + 0.1, // movement speed forward
        opacity: Math.random() * 0.6 + 0.2
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Smooth mouse interpolation
      const mouse = mouseRef.current;
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Parallax focal offset based on mouse position
      const offsetX = mouse.x * 200;
      const offsetY = mouse.y * 200;

      // Get current theme color from CSS variable
      const primaryColor = getComputedStyle(document.body).getPropertyValue('--primary').trim() || '#9F73FF';
      let r = 159, g = 115, b = 255;
      if (primaryColor.startsWith('#')) {
        r = parseInt(primaryColor.slice(1, 3), 16);
        g = parseInt(primaryColor.slice(3, 5), 16);
        b = parseInt(primaryColor.slice(5, 7), 16);
      }

      // Draw projected particles
      const projected = [];

      particles.forEach((p) => {
        // Move particle towards the viewer
        p.z -= p.speedZ;
        if (p.z <= 0) {
          p.z = 800; // Reset particle back to depth
          p.x = Math.random() * window.innerWidth * 2 - window.innerWidth;
          p.y = Math.random() * window.innerHeight * 2 - window.innerHeight;
        }

        // Apply 3D perspective scale
        const scale = focalLength / (focalLength + p.z);
        const projX = centerX + p.x * scale - offsetX * (p.z / 800);
        const projY = centerY + p.y * scale - offsetY * (p.z / 800);
        const projR = p.radius * scale * 2.5;

        // Skip particles out of viewport bounds
        if (projX >= 0 && projX <= canvas.width && projY >= 0 && projY <= canvas.height) {
          projected.push({ x: projX, y: projY, z: p.z, r: projR, opacity: p.opacity * scale });
          
          ctx.beginPath();
          ctx.arc(projX, projY, projR, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.opacity * scale})`;
          ctx.fill();
        }
      });

      // Draw interactive network web connecting projected points
      ctx.lineWidth = 0.5;
      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const dx = projected[i].x - projected[j].x;
          const dy = projected[i].y - projected[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 110) {
            const alpha = (1 - distance / 110) * 0.15 * Math.min(projected[i].opacity, projected[j].opacity);
            ctx.beginPath();
            ctx.moveTo(projected[i].x, projected[i].y);
            ctx.lineTo(projected[j].x, projected[j].y);
            ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas id="particles-canvas" ref={canvasRef} />;
};

export default ParticleBackground;
