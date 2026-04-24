'use client';

import { useEffect, useRef } from 'react';
import { CHAOS_ICONS } from './chaos-icons';

const ICON_SIZE = 48;

export function ChaosStage() {
  const stageRef = useRef<HTMLDivElement>(null);
  const iconRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      iconRefs.current.forEach((el, i) => {
        if (!el) return;
        const col = i % 4;
        const row = Math.floor(i / 4);
        el.style.transform = `translate(${col * 64 + 16}px, ${row * 64 + 16}px)`;
      });
      return;
    }

    let bounds = stage.getBoundingClientRect();
    const state = iconRefs.current
      .map((node) => {
        if (!node) return null;
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.35 + Math.random() * 0.45;
        return {
          node,
          x: Math.random() * (bounds.width - ICON_SIZE),
          y: Math.random() * (bounds.height - ICON_SIZE),
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          rot: Math.random() * 30 - 15,
          vr: Math.random() * 0.4 - 0.2,
          phase: Math.random() * Math.PI * 2,
        };
      })
      .filter((s): s is NonNullable<typeof s> => s !== null);

    const mouse = { x: -9999, y: -9999, active: false };
    const onMove = (e: MouseEvent) => {
      const b = stage.getBoundingClientRect();
      mouse.x = e.clientX - b.left;
      mouse.y = e.clientY - b.top;
      mouse.active = true;
    };
    const onLeave = () => { mouse.active = false; };
    stage.addEventListener('mousemove', onMove);
    stage.addEventListener('mouseleave', onLeave);

    const ro = new ResizeObserver(() => { bounds = stage.getBoundingClientRect(); });
    ro.observe(stage);

    let raf = 0;
    const tick = (now: number) => {
      const w = bounds.width;
      const h = bounds.height;
      const t = now / 1000;

      for (const s of state) {
        if (mouse.active) {
          const cx = s.x + ICON_SIZE / 2;
          const cy = s.y + ICON_SIZE / 2;
          const dx = cx - mouse.x;
          const dy = cy - mouse.y;
          const d2 = dx * dx + dy * dy;
          const R = 120;
          if (d2 < R * R && d2 > 0.01) {
            const d = Math.sqrt(d2);
            const force = (1 - d / R) * 0.9;
            s.vx += (dx / d) * force;
            s.vy += (dy / d) * force;
          }
        }

        const sp = Math.hypot(s.vx, s.vy);
        const maxSp = 2.2;
        if (sp > maxSp) {
          s.vx = (s.vx / sp) * maxSp;
          s.vy = (s.vy / sp) * maxSp;
        }
        s.vx *= 0.995;
        s.vy *= 0.995;

        const minSp = 0.2;
        if (Math.hypot(s.vx, s.vy) < minSp) {
          const a = Math.random() * Math.PI * 2;
          s.vx += Math.cos(a) * 0.05;
          s.vy += Math.sin(a) * 0.05;
        }

        s.x += s.vx;
        s.y += s.vy;
        s.rot += s.vr;

        if (s.x <= 0) { s.x = 0; s.vx = Math.abs(s.vx); }
        else if (s.x >= w - ICON_SIZE) { s.x = w - ICON_SIZE; s.vx = -Math.abs(s.vx); }
        if (s.y <= 0) { s.y = 0; s.vy = Math.abs(s.vy); }
        else if (s.y >= h - ICON_SIZE) { s.y = h - ICON_SIZE; s.vy = -Math.abs(s.vy); }

        const scale = 1 + Math.sin(t * 1.6 + s.phase) * 0.04;
        s.node.style.transform = `translate(${s.x.toFixed(1)}px, ${s.y.toFixed(1)}px) rotate(${s.rot.toFixed(1)}deg) scale(${scale.toFixed(3)})`;
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      stage.removeEventListener('mousemove', onMove);
      stage.removeEventListener('mouseleave', onLeave);
      ro.disconnect();
    };
  }, []);

  return (
    <div
      ref={stageRef}
      className="relative h-60 w-full overflow-hidden rounded-lg border border-border/60 bg-background/40"
    >
      {CHAOS_ICONS.map((icon, i) => (
        <div
          key={icon.label}
          ref={(el) => { iconRefs.current[i] = el; }}
          aria-label={icon.label}
          className="pointer-events-none absolute left-0 top-0 grid size-12 place-items-center rounded-md bg-card/70 ring-1 ring-border/60 [&_svg]:size-6"
          style={{ color: icon.color, willChange: 'transform' }}
        >
          {icon.svg}
        </div>
      ))}
    </div>
  );
}
