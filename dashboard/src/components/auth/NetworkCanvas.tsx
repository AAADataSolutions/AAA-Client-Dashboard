'use client';

import React, { useEffect, useRef } from 'react';

interface Node {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  vx: number;
  vy: number;
  radius: number;
  phase: number;
  pulseSpeed: number;
}

interface Edge {
  source: number;
  target: number;
}

interface PulsePacket {
  edgeIndex: number;
  progress: number;
  speed: number;
  color: string;
}

export const NetworkCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 600);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 700);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
      initNetwork();
    };

    window.addEventListener('resize', handleResize);

    // Initial base nodes distributed across the panel (relative coordinates)
    const rawNodes = [
      { rx: 0.12, ry: 0.26 },
      { rx: 0.42, ry: 0.12 },
      { rx: 0.70, ry: 0.38 },
      { rx: 0.28, ry: 0.62 },
      { rx: 0.62, ry: 0.78 },
      { rx: 0.90, ry: 0.18 },
      { rx: 0.86, ry: 0.68 },
      { rx: 0.08, ry: 0.84 },
      { rx: 0.48, ry: 0.45 },
    ];

    const edges: Edge[] = [
      { source: 0, target: 1 },
      { source: 1, target: 2 },
      { source: 0, target: 3 },
      { source: 3, target: 4 },
      { source: 2, target: 4 },
      { source: 1, target: 5 },
      { source: 2, target: 6 },
      { source: 4, target: 6 },
      { source: 3, target: 7 },
      { source: 0, target: 8 },
      { source: 8, target: 2 },
      { source: 8, target: 4 },
    ];

    let nodes: Node[] = [];
    let packets: PulsePacket[] = [];

    const initNetwork = () => {
      nodes = rawNodes.map((n, i) => {
        const x = n.rx * width;
        const y = n.ry * height;
        return {
          x,
          y,
          baseX: x,
          baseY: y,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          radius: 3.5,
          phase: i * 0.8,
          pulseSpeed: 0.03 + Math.random() * 0.02,
        };
      });

      // Pulse packets flowing along connections
      packets = edges.map((_, i) => ({
        edgeIndex: i,
        progress: Math.random(),
        speed: 0.003 + Math.random() * 0.003,
        color: i % 2 === 0 ? '#5fe0d0' : '#4c7cf3',
      }));
    };

    initNetwork();

    let tick = 0;

    const render = () => {
      tick += 1;
      ctx.clearRect(0, 0, width, height);

      // Subtle ambient node drifting
      nodes.forEach((node) => {
        node.phase += node.pulseSpeed;
        node.x = node.baseX + Math.sin(node.phase * 0.7) * 14;
        node.y = node.baseY + Math.cos(node.phase * 0.5) * 14;
      });

      // 1. Draw Network Connections (Lines)
      ctx.lineWidth = 1;
      edges.forEach(({ source, target }) => {
        const s = nodes[source];
        const t = nodes[target];
        if (!s || !t) return;

        const grad = ctx.createLinearGradient(s.x, s.y, t.x, t.y);
        grad.addColorStop(0, 'rgba(76, 124, 243, 0.22)');
        grad.addColorStop(0.5, 'rgba(33, 40, 51, 0.65)');
        grad.addColorStop(1, 'rgba(95, 224, 208, 0.22)');

        ctx.strokeStyle = grad;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(t.x, t.y);
        ctx.stroke();
      });

      // 2. Draw Pulse Packets traveling on lines
      packets.forEach((pkt) => {
        pkt.progress += pkt.speed;
        if (pkt.progress > 1) {
          pkt.progress = 0;
        }

        const edge = edges[pkt.edgeIndex];
        const s = nodes[edge.source];
        const t = nodes[edge.target];
        if (!s || !t) return;

        const px = s.x + (t.x - s.x) * pkt.progress;
        const py = s.y + (t.y - s.y) * pkt.progress;

        // Glowing packet dot
        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = pkt.color;
        ctx.shadowColor = pkt.color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // 3. Draw Nodes and Halo Glows
      nodes.forEach((node) => {
        const pulse = 0.5 + 0.5 * Math.sin(node.phase);

        // Outer ambient glow ring
        ctx.beginPath();
        ctx.arc(node.x, node.y, 12 + pulse * 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(76, 124, 243, 0.08)';
        ctx.fill();

        // Node circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius + pulse * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = '#4c7cf3';
        ctx.shadowColor = '#5fe0d0';
        ctx.shadowBlur = 6 * pulse;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Core bright center
        ctx.beginPath();
        ctx.arc(node.x, node.y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = '#e8ecf2';
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none opacity-80"
      style={{
        maskImage: 'radial-gradient(ellipse 70% 60% at 50% 45%, black 40%, transparent 80%)',
        WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 45%, black 40%, transparent 80%)',
      }}
      aria-hidden="true"
    />
  );
};
