import React, { useEffect, useRef } from 'react';
import { SimulationEngine } from '../simulation/Engine';
import { Creature } from '../types';

// Base Octahedron definitions
const baseOctaVerts = [
  [0, 1, 0], [1, 0, 0], [0, 0, 1], [-1, 0, 0], [0, 0, -1], [0, -1, 0]
];
const baseOctaFaces = [
  [0, 2, 1], [0, 1, 4], [0, 4, 3], [0, 3, 2],
  [5, 1, 2], [5, 4, 1], [5, 3, 4], [5, 2, 3]
];

// Base Sphere (Icosahedron) definitions
const t = (1.0 + Math.sqrt(5.0)) / 2.0;
const baseSphereVerts = [
  [-1,  t,  0], [ 1,  t,  0], [-1, -t,  0], [ 1, -t,  0],
  [ 0, -1,  t], [ 0,  1,  t], [ 0, -1, -t], [ 0,  1, -t],
  [ t,  0, -1], [ t,  0,  1], [-t,  0, -1], [-t,  0,  1]
].map(v => {
  const len = Math.hypot(v[0], v[1], v[2]);
  return [v[0]/len, v[1]/len, v[2]/len];
});
const baseSphereFaces = [
  [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
  [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
  [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
  [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]
];

// Subdivide mesh to create more complex geometry
function subdivide(verts: number[][], faces: number[][], normalize: boolean = true): { verts: number[][], faces: number[][] } {
  const newVerts = [...verts];
  const newFaces: number[][] = [];
  const midPointCache = new Map<string, number>();

  function getMidPoint(p1: number, p2: number) {
    const key = p1 < p2 ? `${p1}-${p2}` : `${p2}-${p1}`;
    if (midPointCache.has(key)) return midPointCache.get(key)!;
    
    const v1 = verts[p1];
    const v2 = verts[p2];
    const x = (v1[0] + v2[0]) / 2;
    const y = (v1[1] + v2[1]) / 2;
    const z = (v1[2] + v2[2]) / 2;
    const newIdx = newVerts.length;
    if (normalize) {
      const len = Math.hypot(x, y, z);
      newVerts.push([x/len, y/len, z/len]);
    } else {
      newVerts.push([x, y, z]);
    }
    midPointCache.set(key, newIdx);
    return newIdx;
  }

  for (const f of faces) {
    const a = getMidPoint(f[0], f[1]);
    const b = getMidPoint(f[1], f[2]);
    const c = getMidPoint(f[2], f[0]);

    newFaces.push([f[0], a, c]);
    newFaces.push([f[1], b, a]);
    newFaces.push([f[2], c, b]);
    newFaces.push([a, b, c]);
  }

  return { verts: newVerts, faces: newFaces };
}

// Generate complex meshes once
const complexOcta = subdivide(baseOctaVerts, baseOctaFaces, false);
const complexSphere = subdivide(baseSphereVerts, baseSphereFaces, true);

const hexToRgb = (hex: string) => {
   let h = hex.replace('#', '');
   if (h.length === 3) h = h.split('').map(c => c+c).join('');
   return {
      r: parseInt(h.substring(0,2), 16) || 255,
      g: parseInt(h.substring(2,4), 16) || 255,
      b: parseInt(h.substring(4,6), 16) || 255
   };
};

// Cache parsed colors for smooth performance with many entities
const colorCache = new Map<string, {r: number, g: number, b: number}>();
const getRgb = (hex: string) => {
    if (colorCache.has(hex)) return colorCache.get(hex)!;
    const rgb = hexToRgb(hex);
    colorCache.set(hex, rgb);
    return rgb;
};

const lerpAngle = (a: number, b: number, t: number) => {
    const delta = ((b - a + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    return a + delta * t;
};

interface CanvasRendererProps {
  engine: SimulationEngine;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  cameraRef: React.MutableRefObject<{ x: number, y: number, zoom: number }>;
}

export default function CanvasRenderer({ engine, selectedId, onSelect, cameraRef }: CanvasRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const yawMap = useRef<Map<string, number>>(new Map());
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const landscapeRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    // Generate lush organic 3D nature landscape
    const bg = document.createElement('canvas');
    bg.width = 1600;
    bg.height = 1000;
    const bCtx = bg.getContext('2d');
    if (bCtx) {
       // Rich green gradient base
       const grad = bCtx.createRadialGradient(800, 500, 200, 800, 500, 1200);
       grad.addColorStop(0, '#22c55e'); // lush center
       grad.addColorStop(1, '#14532d'); // dark edges
       bCtx.fillStyle = grad;
       bCtx.fillRect(0, 0, 1600, 1000);
       
       // Soft rolling hills (lighter patches)
       bCtx.fillStyle = 'rgba(74, 222, 128, 0.15)';
       for(let i = 0; i < 25; i++) {
           bCtx.beginPath();
           bCtx.ellipse(Math.random()*1600, Math.random()*1000, 200+Math.random()*200, 100+Math.random()*150, Math.random()*Math.PI, 0, Math.PI*2);
           bCtx.fill();
       }

       // Organic Lakes with depth
       for(let i=0; i<12; i++) {
           const lx = Math.random()*1600;
           const ly = Math.random()*1000;
           const lrx = 70+Math.random()*100;
           const lry = 40+Math.random()*60;
           
           // Water shadow / shore
           bCtx.fillStyle = 'rgba(0, 0, 0, 0.2)';
           bCtx.beginPath();
           bCtx.ellipse(lx, ly + 5, lrx, lry, 0, 0, Math.PI*2);
           bCtx.fill();

           // Water gradient
           const waterGrad = bCtx.createRadialGradient(lx, ly, 0, lx, ly, lrx);
           waterGrad.addColorStop(0, '#38bdf8');
           waterGrad.addColorStop(1, '#0284c7');
           bCtx.fillStyle = waterGrad;
           bCtx.beginPath();
           bCtx.ellipse(lx, ly, lrx, lry, 0, 0, Math.PI*2);
           bCtx.fill();
           
           // Water edge highlight
           bCtx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
           bCtx.lineWidth = 2;
           bCtx.stroke();
       }

       // 3D Pine Trees
       const drawTree = (x: number, y: number) => {
           // Shadow
           bCtx.fillStyle = 'rgba(0,0,0,0.3)';
           bCtx.beginPath(); bCtx.ellipse(x, y + 4, 12, 6, 0, 0, Math.PI*2); bCtx.fill();
           
           // Trunk
           bCtx.fillStyle = '#78350f';
           bCtx.fillRect(x - 2, y - 10, 4, 10);
           
           // Leaves (3 overlapping cones)
           const drawCone = (cy: number, w: number, h: number, c1: string, c2: string) => {
               const treeGrad = bCtx.createLinearGradient(x - w, cy - h, x + w, cy);
               treeGrad.addColorStop(0, c1);
               treeGrad.addColorStop(1, c2);
               bCtx.fillStyle = treeGrad;
               bCtx.beginPath();
               bCtx.moveTo(x, cy - h);
               bCtx.lineTo(x + w, cy);
               bCtx.lineTo(x - w, cy);
               bCtx.fill();
           };
           drawCone(y - 5, 14, 16, '#22c55e', '#14532d');
           drawCone(y - 12, 11, 14, '#4ade80', '#166534');
           drawCone(y - 19, 8, 12, '#86efac', '#15803d');
       };

       for(let i=0; i<40; i++) {
          const fx = Math.random()*1600;
          const fy = Math.random()*1000;
          for(let j=0; j<8; j++) {
             drawTree(fx + (Math.random()-0.5)*150, fy + (Math.random()-0.5)*150);
          }
       }

       // Organic 3D Rocks
       for(let i=0; i<35; i++) {
           const rx = Math.random()*1600;
           const ry = Math.random()*1000;
           const size = 8 + Math.random()*12;
           
           // Shadow
           bCtx.fillStyle = 'rgba(0,0,0,0.4)';
           bCtx.beginPath(); bCtx.ellipse(rx, ry + size/2, size*1.2, size*0.6, 0, 0, Math.PI*2); bCtx.fill();
           
           // Base Rock
           bCtx.fillStyle = '#475569';
           bCtx.beginPath();
           bCtx.arc(rx, ry, size, Math.PI, 0);
           bCtx.bezierCurveTo(rx + size, ry + size/2, rx - size, ry + size/2, rx - size, ry);
           bCtx.fill();
           
           // Rock Highlight
           bCtx.fillStyle = '#94a3b8';
           bCtx.beginPath();
           bCtx.arc(rx - size*0.2, ry - size*0.2, size*0.5, 0, Math.PI*2);
           bCtx.fill();
       }
    }
    landscapeRef.current = bg;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      const state = engine.state;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const camera = cameraRef.current;
      
      if (selectedId && !isDragging.current) {
         const selected = state.creatures.find(c => c.id === selectedId);
         if (selected) {
            camera.x += (selected.x - camera.x) * 0.08;
            camera.y += (selected.y - camera.y) * 0.08;
         }
      }
      
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      const baseScale = Math.min(canvas.width / 1600, canvas.height / 1000);
      ctx.scale(baseScale * camera.zoom, baseScale * camera.zoom);
      ctx.translate(-camera.x, -camera.y);
      
      // Draw map base
      if (landscapeRef.current) {
         ctx.drawImage(landscapeRef.current, 0, 0);
      } else {
         ctx.fillStyle = '#0a0f12';
         ctx.fillRect(0, 0, 1600, 1000);
      }
      
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
      ctx.lineWidth = 6;
      ctx.strokeRect(0, 0, 1600, 1000);
      
      const getRadius = (sizeGene: number) => 3 + (sizeGene / 100) * 9;
      const now = Date.now();
      
      const drawDetails = camera.zoom > 1.0;
      
      for (const e of state.entities) {
        if (e.type === 'food') {
          // Food as an organic shaded berry
          ctx.fillStyle = 'rgba(0,0,0,0.3)';
          ctx.beginPath(); ctx.ellipse(e.x, e.y+4, 4, 2, 0, 0, Math.PI*2); ctx.fill();
          
          const foodGrad = ctx.createRadialGradient(e.x-1, e.y-3, 0, e.x, e.y-2, 5);
          foodGrad.addColorStop(0, '#fca5a5');
          foodGrad.addColorStop(1, '#991b1b');
          ctx.fillStyle = foodGrad;
          ctx.beginPath(); ctx.arc(e.x, e.y - 2, 4, 0, Math.PI * 2); ctx.fill();
          
          // Little leaf on top
          ctx.fillStyle = '#4ade80';
          ctx.beginPath(); ctx.ellipse(e.x, e.y - 6, 2, 1, Math.PI/4, 0, Math.PI*2); ctx.fill();
        } else if (e.type === 'rock') {
          // Natural smooth rock
          ctx.fillStyle = 'rgba(0,0,0,0.4)';
          ctx.beginPath(); ctx.ellipse(e.x, e.y+3, 8, 4, 0, 0, Math.PI*2); ctx.fill();
          
          const rockGrad = ctx.createRadialGradient(e.x-2, e.y-3, 0, e.x, e.y-1, 10);
          rockGrad.addColorStop(0, '#94a3b8');
          rockGrad.addColorStop(1, '#334155');
          ctx.fillStyle = rockGrad;
          ctx.beginPath(); 
          ctx.ellipse(e.x, e.y-1, 8, 5, 0, 0, Math.PI*2); 
          ctx.fill();
        } else if (e.type === 'meat') {
          // Meat as a rounded organic chunk
          ctx.fillStyle = 'rgba(0,0,0,0.4)';
          ctx.beginPath(); ctx.ellipse(e.x, e.y+3, 6, 3, 0, 0, Math.PI*2); ctx.fill();
          
          const meatGrad = ctx.createRadialGradient(e.x-1, e.y-2, 0, e.x, e.y, 6);
          meatGrad.addColorStop(0, '#fca5a5');
          meatGrad.addColorStop(1, '#7f1d1d');
          ctx.fillStyle = meatGrad;
          ctx.beginPath(); ctx.ellipse(e.x, e.y-1, 6, 4, Math.PI/6, 0, Math.PI * 2); ctx.fill();
          
          // Bone piece
          ctx.fillStyle = '#f8fafc';
          ctx.beginPath(); ctx.ellipse(e.x + 3, e.y - 4, 3, 1.5, -Math.PI/6, 0, Math.PI*2); ctx.fill();
        }
      }
      
      if (drawDetails) {
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        for (const c of state.creatures) {
           let r = getRadius(c.genes.size);
           const isMoving = c.action === 'moving' || Math.abs(c.vx) > 0.1 || Math.abs(c.vy) > 0.1;
           const seed = c.id.charCodeAt(0) + c.id.charCodeAt(c.id.length-1);
           let bounceOffset = 0;
           
           if (c.action === 'isDying') {
               const progress = c.actionTimer / 20;
               r *= progress;
               ctx.globalAlpha = progress;
           } else {
               ctx.globalAlpha = 1;
           }

           if (isMoving) {
              const walkSpeed = 200 - (c.genes.speed || 50);
              bounceOffset = -Math.abs(Math.sin(now / walkSpeed + seed)) * 3;
           }
           ctx.beginPath();
           const shadowScale = Math.max(0.4, 1 - (Math.abs(bounceOffset) / 10));
           ctx.ellipse(c.x, c.y + r + 2, r * shadowScale, (r/2) * shadowScale, 0, 0, Math.PI*2);
           ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      for (const c of state.creatures) {
        ctx.save();
        ctx.translate(c.x, c.y);
        
        if (c.action === 'isDying') {
            const progress = Math.max(0, c.actionTimer / 20);
            ctx.scale(progress, progress);
            ctx.globalAlpha = progress;
        }

        const isSelected = c.id === selectedId;
        const r = getRadius(c.genes.size);
        const seed = c.id.charCodeAt(0) + c.id.charCodeAt(c.id.length-1);
        
        if (drawDetails || isSelected) {
          const isMoving = c.action === 'moving' || Math.abs(c.vx) > 0.1 || Math.abs(c.vy) > 0.1;
          
          let bounceOffset = 0; let rotation = 0; let scaleY = 1;

          if (isMoving) {
              const walkSpeed = 200 - (c.genes.speed || 50);
              bounceOffset = -Math.abs(Math.sin(now / walkSpeed + seed)) * 3;
              rotation = (c.vx * 0.05);
          } else {
              scaleY = 1 + Math.sin(now / 400 + seed) * 0.08;
          }

          if (isSelected) {
             ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'; ctx.lineWidth = 1;
             ctx.beginPath(); ctx.arc(0, 0, c.genes.vision, 0, Math.PI * 2); ctx.stroke();
             ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]);
             ctx.beginPath(); ctx.arc(0, 0, r + 6, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
          }

          const targetYaw = Math.hypot(c.vx, c.vy) > 0.05 ? Math.atan2(c.vx, -c.vy) : (yawMap.current.get(c.id) || 0);
          const currentYaw = lerpAngle(yawMap.current.get(c.id) || 0, targetYaw, 0.15);
          yawMap.current.set(c.id, currentYaw);

          const cosY = Math.cos(currentYaw), sinY = Math.sin(currentYaw);
          const pitch = (Math.hypot(c.vx, c.vy) > 0.05 ? 0.2 : 0) + (bounceOffset * 0.02);
          const cosP = Math.cos(pitch), sinP = Math.sin(pitch);
          const roll = rotation;
          const cosR = Math.cos(roll), sinR = Math.sin(roll);

          const shapeX = 0.5 + (c.genes.speed / 50);
          const shapeY_base = 0.5 + (c.genes.lifespan / 100);
          const shapeZ = 0.5 + (c.genes.vision / 50);
          const maxShape = Math.max(shapeX, shapeY_base, shapeZ) || 1;
          const scaleShapeX = shapeX / maxShape;
          const scaleShapeY = shapeY_base / maxShape;
          const scaleShapeZ = shapeZ / maxShape;

          const transform3D = (x: number, y: number, z: number) => {
              x *= scaleShapeX;
              y *= scaleShapeY;
              z *= scaleShapeZ;
              y *= scaleY; 
              
              let y2 = y * cosP - z * sinP;
              let z2 = y * sinP + z * cosP;
              let x2 = x;

              let x3 = x2 * cosY - z2 * sinY;
              let z3 = x2 * sinY + z2 * cosY;
              let y3 = y2;
              
              let x4 = x3 * cosR - y3 * sinR;
              let y4 = x3 * sinR + y3 * cosR;
              let z4 = z3;

              return { 
                  px: x4 * r, 
                  py: y4 * r - z4 * r * 0.4 + bounceOffset,
                  pz: z4 * r
              };
          };

          const renderQueue: any[] = [];
          const originalColor = getRgb(c.genes.color);
          
          // Map traits (speed and curiosity/vision) to unique color palettes dynamically
          const speedFactor = Math.min(100, c.genes.speed) / 100;
          const curiosityFactor = Math.min(100, c.genes.vision) / 100;
          
          // Speed shifts hue towards warm (Red/Orange), Curiosity shifts towards cool (Blue/Purple)
          const rBase = Math.min(255, originalColor.r + (255 - originalColor.r) * speedFactor * 0.75);
          const gBase = Math.min(255, originalColor.g * (1 - speedFactor * 0.3) + 120 * speedFactor);
          const bBase = Math.min(255, originalColor.b + (255 - originalColor.b) * curiosityFactor * 0.85);
          
          const isOctahedron = c.genes.energyEfficiency < 50;
          const verts = isOctahedron ? complexOcta.verts : complexSphere.verts;
          const faces = isOctahedron ? complexOcta.faces : complexSphere.faces;

          const projVerts = verts.map(v => transform3D(v[0], v[1], v[2]));
          
          // Screen-space light direction (Top-Left-Front)
          let lx = -0.3, ly = -0.8, lz = -0.5;
          const lLen = Math.hypot(lx, ly, lz);
          lx /= lLen; ly /= lLen; lz /= lLen;

          for (const f of faces) {
              const p0 = projVerts[f[0]];
              const p1 = projVerts[f[1]];
              const p2 = projVerts[f[2]];
              
              const v1x = p1.px - p0.px, v1y = p1.py - p0.py, v1z = p1.pz - p0.pz;
              const v2x = p2.px - p0.px, v2y = p2.py - p0.py, v2z = p2.pz - p0.pz;
              
              let nx = v1y * v2z - v1z * v2y;
              let ny = v1z * v2x - v1x * v2z;
              let nz = v1x * v2y - v1y * v2x;
              
              // Backface culling: skips rendering geometry facing away from the camera
              // Z points towards the camera, so nz < 0 is facing away.
              if (nz < 0) continue;
              
              const len = Math.hypot(nx, ny, nz);
              if (len > 0) { nx /= len; ny /= len; nz /= len; }

              const dot = nx * lx + ny * ly + nz * lz;
              const depth = (p0.pz + p1.pz + p2.pz) / 3;
              
              renderQueue.push({ type: 'face', p0, p1, p2, dot, depth });
          }

          const eye1 = transform3D(-0.35, -0.2, 0.85);
          renderQueue.push({ type: 'eye', p0: eye1, depth: eye1.pz + 5, isRight: false });
          const eye2 = transform3D(0.35, -0.2, 0.85);
          renderQueue.push({ type: 'eye', p0: eye2, depth: eye2.pz + 5, isRight: true });

          // Draw deeper items first
          renderQueue.sort((a, b) => a.depth - b.depth);

          for (const item of renderQueue) {
              if (item.type === 'face') {
                  const ambient = 0.25;
                  const diffuse = Math.max(0, item.dot) * 0.65;
                  const specular = Math.pow(Math.max(0, item.dot), 4) * 0.3; // Shiny specular highlight
                  
                  // Dynamic depth shading: darkens faces further back
                  const depthFactor = Math.max(0.4, Math.min(1.0, 1.2 - (item.depth / (r * 3))));
                  const intensity = (ambient + diffuse + specular) * depthFactor;
                  
                  const rC = Math.min(255, Math.floor(rBase * intensity + specular * 60));
                  const gC = Math.min(255, Math.floor(gBase * intensity + specular * 60));
                  const bC = Math.min(255, Math.floor(bBase * intensity + specular * 60));
                  
                  ctx.fillStyle = `rgb(${rC},${gC},${bC})`;
                  
                  const edgeR = Math.floor(rBase * ambient * 0.6 * depthFactor);
                  const edgeG = Math.floor(gBase * ambient * 0.6 * depthFactor);
                  const edgeB = Math.floor(bBase * ambient * 0.6 * depthFactor);
                  ctx.strokeStyle = `rgba(${edgeR},${edgeG},${edgeB},0.9)`; 
                  
                  ctx.lineWidth = 1.0; ctx.lineJoin = 'round';
                  ctx.beginPath(); ctx.moveTo(item.p0.px, item.p0.py); ctx.lineTo(item.p1.px, item.p1.py); ctx.lineTo(item.p2.px, item.p2.py); ctx.closePath();
                  ctx.fill(); ctx.stroke();
              } else if (item.type === 'eye') {
                  const blink = (Math.floor(now / 150) + seed) % 40 < 2;
                  
                  ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
                  ctx.beginPath(); ctx.ellipse(item.p0.px + (item.isRight ? 1 : -1) * r/8, item.p0.py + r/3.5, r/4, r/6, 0, 0, Math.PI*2); ctx.fill();

                  if (blink) {
                      ctx.strokeStyle = '#1e293b';
                      ctx.lineWidth = 1.5;
                      ctx.beginPath(); ctx.moveTo(item.p0.px - r/3.5, item.p0.py); ctx.lineTo(item.p0.px + r/3.5, item.p0.py); ctx.stroke();
                  } else {
                      ctx.fillStyle = 'white';
                      ctx.beginPath(); ctx.arc(item.p0.px, item.p0.py, r/2.8, 0, Math.PI*2); ctx.fill();
                      
                      ctx.fillStyle = '#0f172a';
                      ctx.beginPath(); ctx.arc(item.p0.px + (c.vx > 0 ? 0.5 : -0.5), item.p0.py + (c.vy > 0 ? 0.5 : -0.5), r/4, 0, Math.PI*2); ctx.fill();
                      
                      ctx.fillStyle = 'white';
                      ctx.beginPath(); ctx.arc(item.p0.px - r/8, item.p0.py - r/8, r/10, 0, Math.PI*2); ctx.fill();
                      ctx.beginPath(); ctx.arc(item.p0.px + r/12, item.p0.py + r/12, r/18, 0, Math.PI*2); ctx.fill();
                  }
              }
          }
          
          if (state.activeUselessEffect === 'hat-day') {
             const top = transform3D(0, -0.9, 0);
             ctx.fillStyle = '#b45309'; ctx.fillRect(top.px - r*0.6, top.py - 6, r*1.2, 6); ctx.fillRect(top.px - r*1.2, top.py, r*2.4, 2);
          }
          
          const textPos = transform3D(0, -1.2, 0);
          if (c.action === 'sleeping') {
             ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.font = 'bold 12px monospace'; ctx.fillText('Zzz', textPos.px, textPos.py - 5);
          } else if (c.action === 'mating') {
             ctx.fillStyle = '#ec4899'; ctx.font = '14px Arial'; ctx.fillText('❤️', textPos.px - 7, textPos.py - 5);
          }
        } else {
          ctx.fillStyle = c.genes.color;
          ctx.beginPath(); ctx.arc(0, 0, Math.max(r * 0.8, 1.5), 0, Math.PI * 2); ctx.fill();
        }

        ctx.restore();
      }

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [engine, selectedId]);
  
  const getPointerWorldPos = (e: React.MouseEvent<HTMLCanvasElement> | React.WheelEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || !canvasRef.current) return null;
    
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    const px = mx * scaleX;
    const py = my * scaleY;
    
    const camera = cameraRef.current;
    const baseScale = Math.min(canvasRef.current.width / 1600, canvasRef.current.height / 1000);
    const zoomScale = baseScale * camera.zoom;
    
    const worldX = (px - canvasRef.current.width / 2) / zoomScale + camera.x;
    const worldY = (py - canvasRef.current.height / 2) / zoomScale + camera.y;
    
    return { worldX, worldY, px, py };
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
     const pos = getPointerWorldPos(e);
     if (!pos) return;
     
     const zoomFactor = 1.1;
     const newZoom = e.deltaY < 0 ? cameraRef.current.zoom * zoomFactor : cameraRef.current.zoom / zoomFactor;
     const clampedZoom = Math.max(0.5, Math.min(newZoom, 5));
     
     cameraRef.current.zoom = clampedZoom;
  };
  
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDragging.current = true;
    lastMouse.current = { x: e.clientX, y: e.clientY };
  };
  
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging.current || !canvasRef.current) return;
    
    const dx = e.clientX - lastMouse.current.x;
    const dy = e.clientY - lastMouse.current.y;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    
    const baseScale = Math.min(canvasRef.current.width / 1600, canvasRef.current.height / 1000);
    const zoomScale = baseScale * cameraRef.current.zoom;
    
    cameraRef.current.x -= (dx * scaleX) / zoomScale;
    cameraRef.current.y -= (dy * scaleY) / zoomScale;
    
    cameraRef.current.x = Math.max(0, Math.min(cameraRef.current.x, 1600));
    cameraRef.current.y = Math.max(0, Math.min(cameraRef.current.y, 1000));
    
    lastMouse.current = { x: e.clientX, y: e.clientY };
  };
  
  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
     const pos = getPointerWorldPos(e);
     if (!pos) return;
     
     let found: Creature | null = null;
     let minDist = Infinity;
     for(const c of engine.state.creatures) {
        const d = Math.hypot(c.x - pos.worldX, c.y - pos.worldY);
        if (d < (c.genes.size/2) + 15 && d < minDist) {
           minDist = d;
           found = c;
        }
     }
     onSelect(found ? found.id : null);
  };

  return (
    <canvas 
      ref={canvasRef}
      width={1200} 
      height={800} 
      onClick={handleClick}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className="w-full h-full object-cover bg-transparent cursor-crosshair"
    />
  );
}
