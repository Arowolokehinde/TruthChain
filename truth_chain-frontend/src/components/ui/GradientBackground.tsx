import React, { useEffect, useRef } from 'react';

interface GradientBackgroundProps {
  children: React.ReactNode;
}

interface Logo {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
}

const GradientBackground: React.FC<GradientBackgroundProps> = ({ children }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas to full window size
    const handleResize = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();
    
    // Create floating logos
    const logos: Logo[] = [];
    for (let i = 0; i < 15; i++) {
      logos.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 30 + 10,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5,
        opacity: Math.random() * 0.3 + 0.1
      });
    }
    
    // Animation function
    const animate = () => {
      if (!canvas || !ctx) return;
      
      // Create gradient background
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#0f172a'); // Dark blue
      gradient.addColorStop(0.5, '#1e293b'); // Slate blue
      gradient.addColorStop(1, '#0f766e'); // Teal

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw floating chain link icons
      logos.forEach(logo => {
        ctx.beginPath();
        ctx.globalAlpha = logo.opacity;
        
        // Draw a simple chain link symbol
        const size = logo.size;
        const x = logo.x;
        const y = logo.y;
        
        // First circle of chain link
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = size / 10;
        ctx.arc(x - size / 4, y, size / 2, 0, Math.PI * 2);
        ctx.stroke();
        
        // Second circle of chain link
        ctx.beginPath();
        ctx.arc(x + size / 4, y, size / 2, 0, Math.PI * 2);
        ctx.stroke();
        
        // Move the logos
        logo.x += logo.speedX;
        logo.y += logo.speedY;
        
        // Bounce off edges
        if (logo.x < 0 || logo.x > canvas.width) logo.speedX *= -1;
        if (logo.y < 0 || logo.y > canvas.height) logo.speedY *= -1;
      });
      
      ctx.globalAlpha = 1;
      requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <canvas 
        ref={canvasRef} 
        className="absolute top-0 left-0 w-full h-full -z-10"
      />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default GradientBackground;