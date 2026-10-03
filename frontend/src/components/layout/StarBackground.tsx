import React, { useEffect, useRef } from 'react';

export const StarBackground: React.FC<{ isWorkspace?: boolean }> = ({ isWorkspace = false }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particle count: reduced in workspace mode for clean readability
    const numStars = isWorkspace ? 70 : 160;
    const stars = Array.from({ length: numStars }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * (isWorkspace ? 1.2 : 1.8) + 0.3,
      speedX: (Math.random() - 0.5) * 0.15,
      speedY: (Math.random() - 0.5) * 0.15,
      alpha: Math.random() * 0.7 + 0.3,
      alphaSpeed: (Math.random() - 0.5) * 0.015,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw faint purple nebula glow gradients
      const gradient = ctx.createRadialGradient(
        width * 0.5, height * 0.3, 50,
        width * 0.5, height * 0.3, width * 0.6
      );
      gradient.addColorStop(0, 'rgba(123, 44, 191, 0.08)');
      gradient.addColorStop(0.5, 'rgba(58, 12, 163, 0.04)');
      gradient.addColorStop(1, 'rgba(3, 0, 20, 0)');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Draw and update star particles
      stars.forEach((star) => {
        star.x += star.speedX;
        star.y += star.speedY;

        if (star.x < 0) star.x = width;
        if (star.x > width) star.x = 0;
        if (star.y < 0) star.y = height;
        if (star.y > height) star.y = 0;

        star.alpha += star.alphaSpeed;
        if (star.alpha <= 0.2 || star.alpha >= 0.95) {
          star.alphaSpeed = -star.alphaSpeed;
        }

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(220, 225, 255, ${star.alpha * (isWorkspace ? 0.45 : 0.85)})`;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isWorkspace]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: isWorkspace ? 0.6 : 1 }}
    />
  );
};
