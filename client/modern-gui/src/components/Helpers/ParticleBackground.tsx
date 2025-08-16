import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  color: string;
}

interface ParticleProps {
  zIndex?: number;
  particleCount?: number;
  particleColor?: string;
  backgroundColor?: string;
}

const ParticleBackground: React.FC<ParticleProps> = ({
  zIndex = 50,
  particleCount = 50,
  particleColor = 'rgba(200, 200, 255, 0.7)',
  backgroundColor = 'white'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesArray = useRef<Particle[]>([]);
  const animationFrameId = useRef<number>();

  // Using the particleColor and particleCount from props

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const setCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);

    const createParticles = (count: number, color: string) => {
      particlesArray.current = [];
      for (let i = 0; i < count; i++) {
        particlesArray.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: Math.random() * 1 - 0.5, // -0.5 to 0.5
          vy: Math.random() * 1 - 0.5, // -0.5 to 0.5
          radius: Math.random() * 2 + 1, // 1 to 3
          alpha: Math.random() * 0.5 + 0.2, // 0.2 to 0.7
          color: color,
        });
      }
    };

    createParticles(particleCount, particleColor);

    const animateParticles = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesArray.current.forEach(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Boundary checks (wrap around)
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = particle.alpha;
        ctx.fill();
      });
      ctx.globalAlpha = 1; // Reset global alpha

      animationFrameId.current = requestAnimationFrame(animateParticles);
    };

    animateParticles();

    return () => {
      window.removeEventListener('resize', setCanvasSize);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: zIndex, // Position it just behind the modal overlay (which is z-50)
        pointerEvents: 'none', // Make sure it doesn't interfere with clicks
        backgroundColor: backgroundColor
      }}
    />
  );
};

export default ParticleBackground;
