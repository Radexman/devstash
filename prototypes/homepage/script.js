(() => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Year in footer
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Navbar opacity on scroll
  const nav = document.getElementById('nav');
  const onScroll = () => {
    if (window.scrollY > 8) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Scroll reveal
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !prefersReducedMotion) {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      }
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('in'));
  }

  // Pricing toggle
  const toggleOpts = document.querySelectorAll('.bt-opt');
  const amt = document.querySelector('.plan-featured .amt');
  const per = document.querySelector('.plan-featured .per');
  const yearlyNote = document.querySelector('[data-yearly-note]');
  const setPeriod = (period) => {
    toggleOpts.forEach((b) => {
      const active = b.dataset.period === period;
      b.classList.toggle('active', active);
      b.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    if (amt) amt.textContent = amt.dataset[`price${period === 'yearly' ? 'Yearly' : 'Monthly'}`];
    if (per) per.textContent = per.dataset[`per${period === 'yearly' ? 'Yearly' : 'Monthly'}`];
    if (yearlyNote) yearlyNote.hidden = period !== 'yearly';
  };
  toggleOpts.forEach((btn) => {
    btn.addEventListener('click', () => setPeriod(btn.dataset.period));
  });

  // Chaos icons
  const stage = document.getElementById('chaos');
  if (stage && !prefersReducedMotion) initChaos(stage);
  else if (stage) renderChaosStatic(stage);

  function initChaos(stage) {
    const icons = buildIcons();
    const rect = () => stage.getBoundingClientRect();
    let bounds = rect();

    const iconSize = 48;
    const state = icons.map((node, i) => {
      stage.appendChild(node);
      const x = Math.random() * (bounds.width - iconSize);
      const y = Math.random() * (bounds.height - iconSize);
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.35 + Math.random() * 0.45;
      return {
        node,
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        rot: (Math.random() * 30) - 15,
        vr: (Math.random() * 0.4) - 0.2,
        phase: Math.random() * Math.PI * 2,
      };
    });

    let mouse = { x: -9999, y: -9999, active: false };
    stage.addEventListener('mousemove', (e) => {
      const b = stage.getBoundingClientRect();
      mouse.x = e.clientX - b.left;
      mouse.y = e.clientY - b.top;
      mouse.active = true;
    });
    stage.addEventListener('mouseleave', () => { mouse.active = false; });

    const ro = new ResizeObserver(() => { bounds = rect(); });
    ro.observe(stage);

    const tick = (now) => {
      const w = bounds.width;
      const h = bounds.height;
      const t = now / 1000;

      for (const s of state) {
        // Mouse repel
        if (mouse.active) {
          const cx = s.x + iconSize / 2;
          const cy = s.y + iconSize / 2;
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

        // Speed cap + mild damping
        const sp = Math.hypot(s.vx, s.vy);
        const maxSp = 2.2;
        if (sp > maxSp) {
          s.vx = (s.vx / sp) * maxSp;
          s.vy = (s.vy / sp) * maxSp;
        }
        s.vx *= 0.995;
        s.vy *= 0.995;

        // Keep a minimum drift so icons don't stall
        const minSp = 0.2;
        const curSp = Math.hypot(s.vx, s.vy);
        if (curSp < minSp) {
          const a = Math.random() * Math.PI * 2;
          s.vx += Math.cos(a) * 0.05;
          s.vy += Math.sin(a) * 0.05;
        }

        s.x += s.vx;
        s.y += s.vy;
        s.rot += s.vr;

        // Bounce off walls
        if (s.x <= 0) { s.x = 0; s.vx = Math.abs(s.vx); }
        else if (s.x >= w - iconSize) { s.x = w - iconSize; s.vx = -Math.abs(s.vx); }
        if (s.y <= 0) { s.y = 0; s.vy = Math.abs(s.vy); }
        else if (s.y >= h - iconSize) { s.y = h - iconSize; s.vy = -Math.abs(s.vy); }

        const scale = 1 + Math.sin(t * 1.6 + s.phase) * 0.04;
        s.node.style.transform = `translate(${s.x.toFixed(1)}px, ${s.y.toFixed(1)}px) rotate(${s.rot.toFixed(1)}deg) scale(${scale.toFixed(3)})`;
      }

      requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }

  function renderChaosStatic(stage) {
    const icons = buildIcons();
    icons.forEach((node, i) => {
      const cols = 4;
      const col = i % cols;
      const row = Math.floor(i / cols);
      node.style.transform = `translate(${col * 64 + 16}px, ${row * 64 + 16}px)`;
      stage.appendChild(node);
    });
  }

  function buildIcons() {
    // Simplified monochrome brand/tool glyphs. Not actual logos.
    const defs = [
      { label: 'Notion',   svg: svgNotion,  color: '#ffffff' },
      { label: 'GitHub',   svg: svgGithub,  color: '#e7ebf3' },
      { label: 'Slack',    svg: svgSlack,   color: '#ec4899' },
      { label: 'VS Code',  svg: svgVSCode,  color: '#3b82f6' },
      { label: 'Tabs',     svg: svgTabs,    color: '#6366f1' },
      { label: 'Terminal', svg: svgTerminal,color: '#06b6d4' },
      { label: 'Text',     svg: svgFile,    color: '#64748b' },
      { label: 'Bookmark', svg: svgBookmark,color: '#f59e0b' },
    ];
    return defs.map((d) => {
      const el = document.createElement('div');
      el.className = 'chaos-icon';
      el.title = d.label;
      el.setAttribute('aria-label', d.label);
      el.style.color = d.color;
      el.innerHTML = d.svg();
      return el;
    });
  }

  // --- icon SVGs (simplified, monochrome, currentColor) ---
  function svgNotion() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5l3-2h11l2 2v14l-3 2H6l-2-2V5z"/><path d="M8 7v10"/><path d="M8 7l8 10"/><path d="M16 7v10"/></svg>`; }
  function svgGithub() { return `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.82.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02A9.58 9.58 0 0 1 12 6.8c.85 0 1.71.12 2.51.34 1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.33 4.69-4.56 4.94.36.31.68.92.68 1.86v2.75c0 .27.18.58.69.48A10 10 0 0 0 12 2z"/></svg>`; }
  function svgSlack() { return `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 14a2 2 0 1 1 0 4 2 2 0 0 1 0-4h2v2a2 2 0 1 1-2-2z"/><path d="M10 14a2 2 0 1 1 4 0v6a2 2 0 1 1-4 0v-6z"/><path d="M14 6a2 2 0 1 1 4 0 2 2 0 0 1-4 0V4a2 2 0 1 1 4 0v2z"/><path d="M10 4a2 2 0 1 1 0-4 2 2 0 0 1 0 4h2V2a2 2 0 1 1-2 2z"/></svg>`; }
  function svgVSCode() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3l4 2v14l-4 2-10-8 6-5-6-5 10-5z"/><path d="M7 7v10"/></svg>`; }
  function svgTabs() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 10h18"/><circle cx="6" cy="8" r=".5" fill="currentColor"/><circle cx="8" cy="8" r=".5" fill="currentColor"/><circle cx="10" cy="8" r=".5" fill="currentColor"/></svg>`; }
  function svgTerminal() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 10l3 2-3 2"/><path d="M12 16h5"/></svg>`; }
  function svgFile() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z"/><path d="M14 3v5h5"/><path d="M9 13h6"/><path d="M9 17h6"/></svg>`; }
  function svgBookmark() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12v18l-6-4-6 4V3z"/></svg>`; }
})();
