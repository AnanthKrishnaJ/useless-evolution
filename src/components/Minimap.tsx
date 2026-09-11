import React, { useEffect, useRef } from 'react';
import { SimulationEngine } from '../simulation/Engine';

export default function Minimap({ engine, cameraRef }: { engine: SimulationEngine, cameraRef: React.MutableRefObject<{ x: number, y: number, zoom: number }> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDragging = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const scaleX = canvas.width / 1600;
      const scaleY = canvas.height / 1000;
      
      // Abstract Terrain Background
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Organic environmental zones
      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.beginPath();
      ctx.arc(400 * scaleX, 300 * scaleY, 250 * scaleX, 0, Math.PI * 2);
      ctx.arc(1100 * scaleX, 700 * scaleY, 350 * scaleX, 0, Math.PI * 2);
      ctx.fill();

      // Water zone
      ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
      ctx.beginPath();
      ctx.ellipse(300 * scaleX, 750 * scaleY, 200 * scaleX, 120 * scaleY, Math.PI / 6, 0, Math.PI * 2);
      ctx.fill();
      
      // Entities as faint specks
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      for (const e of engine.state.entities) {
         ctx.fillRect(e.x * scaleX, e.y * scaleY, 1, 1);
      }
      
      // Creature Population Density (Additive Blending)
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = 'rgba(239, 68, 68, 0.4)'; // Red density dots
      
      for (const c of engine.state.creatures) {
         // Tiny dots - overlapping creates heat/density map effect
         ctx.fillRect(c.x * scaleX, c.y * scaleY, 1.5, 1.5);
      }
      ctx.globalCompositeOperation = 'source-over'; // Reset blend mode
      
      // Viewport bounds
      const camera = cameraRef.current;
      const vw = canvas.width / camera.zoom;
      const vh = canvas.height / camera.zoom;
      const vx = (camera.x * scaleX) - (vw / 2);
      const vy = (camera.y * scaleY) - (vh / 2);
      
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 1;
      ctx.strokeRect(vx, vy, vw, vh);
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.fillRect(vx, vy, vw, vh);

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [engine]);

  const handleMouse = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.type === 'mousedown') isDragging.current = true;
    if (e.type === 'mouseup' || e.type === 'mouseleave') isDragging.current = false;
    
    if (e.type === 'mousedown' || (e.type === 'mousemove' && isDragging.current)) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect || !canvasRef.current) return;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const worldX = (x / rect.width) * 1600;
      const worldY = (y / rect.height) * 1000;
      cameraRef.current.x = worldX;
      cameraRef.current.y = worldY;
    }
  };

  return (
    <canvas onMouseDown={handleMouse} onMouseMove={handleMouse} onMouseUp={handleMouse} onMouseLeave={handleMouse} 
       ref={canvasRef} 
       width={144} 
       height={112} 
       className="w-full h-full object-cover"
    />
  );
}
