// ============================================
// Luxury / Editorial Interactive Scripts
// ============================================

// Theme toggle
const themeToggle = document.getElementById('theme-toggle');
if (themeToggle) {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    themeToggle.textContent = 'LIGHT';
    themeToggle.setAttribute('aria-label', 'Switch to light alabaster palette');
  } else {
    document.documentElement.removeAttribute('data-theme');
    themeToggle.textContent = 'DARK';
    themeToggle.setAttribute('aria-label', 'Switch to dark charcoal palette');
  }

  themeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const nextTheme = isDark ? 'light' : 'dark';
    if (nextTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      themeToggle.textContent = 'LIGHT';
      themeToggle.setAttribute('aria-label', 'Switch to light alabaster palette');
    } else {
      document.documentElement.removeAttribute('data-theme');
      themeToggle.textContent = 'DARK';
      themeToggle.setAttribute('aria-label', 'Switch to dark charcoal palette');
    }
    localStorage.setItem('theme', nextTheme);
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: nextTheme } }));
  });
}

// Mobile navigation
const toggle = document.getElementById('nav-toggle');
const navLinks = document.getElementById('nav-links');
if (toggle && navLinks) {
  toggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    toggle.textContent = isOpen ? '✕' : '☰';
  });
  navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    navLinks.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.textContent = '☰';
  }));
}

// Reveal on scroll (Editorial ease)
const revealEls = document.querySelectorAll('.reveal');
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('in');
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.1 });
revealEls.forEach(el => io.observe(el));

// Knowledge-graph hero canvas
(function () {
  const canvas = document.getElementById('graph-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w, h, nodes;
  const labels = ['Python', 'AI/ML', 'AWS', 'SQL', 'MCP', 'Security', 'LLM', 'Cloud', 'PySpark', 'RAG'];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let mouse = { x: null, y: null };
  window.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
      mouse.x = (e.clientX - rect.left) * devicePixelRatio;
      mouse.y = (e.clientY - rect.top) * devicePixelRatio;
    } else {
      mouse.x = null;
      mouse.y = null;
    }
  });
  window.addEventListener('mouseleave', () => {
    mouse.x = null;
    mouse.y = null;
  });

  function resize() {
    w = canvas.width = canvas.offsetWidth * devicePixelRatio;
    h = canvas.height = canvas.offsetHeight * devicePixelRatio;
  }
  function init() {
    resize();
    const count = w < 700 ? 18 : 28;
    nodes = Array.from({ length: count }, (_, i) => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.25 * devicePixelRatio,
      vy: (Math.random() - 0.5) * 0.25 * devicePixelRatio,
      r: (Math.random() * 2 + 1.5) * devicePixelRatio,
      label: i < labels.length ? labels[i] : null
    }));
  }
  function step() {
    ctx.clearRect(0, 0, w, h);
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const lineRgb = isDark ? '249, 248, 246' : '26, 26, 26';
    const particleColor = '#D4AF37'; // Metallic Gold
    const labelColor = isDark ? 'rgba(249, 248, 246, 0.85)' : 'rgba(26, 26, 26, 0.8)';

    for (const n of nodes) {
      n.x += n.vx; n.y += n.vy;
      if (n.x < 0 || n.x > w) n.vx *= -1;
      if (n.y < 0 || n.y > h) n.vy *= -1;
    }
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        const maxD = 180 * devicePixelRatio;
        if (d < maxD) {
          const alpha = (1 - d / maxD) * (isDark ? 0.2 : 0.12);
          ctx.strokeStyle = `rgba(${lineRgb}, ${alpha})`;
          ctx.lineWidth = 1 * devicePixelRatio;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }

      // Connect to mouse cursor
      if (mouse.x !== null && mouse.y !== null) {
        const md = Math.hypot(nodes[i].x - mouse.x, nodes[i].y - mouse.y);
        const maxMouseD = 200 * devicePixelRatio;
        if (md < maxMouseD) {
          const mAlpha = (1 - md / maxMouseD) * 0.35;
          ctx.strokeStyle = `rgba(212, 175, 55, ${mAlpha})`;
          ctx.lineWidth = 1.2 * devicePixelRatio;
          ctx.beginPath(); ctx.moveTo(nodes[i].x, nodes[i].y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        }
      }
    }

    ctx.font = `500 ${11 * devicePixelRatio}px 'Inter', sans-serif`;
    for (const n of nodes) {
      ctx.fillStyle = particleColor;
      ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill();
      if (n.label) {
        ctx.fillStyle = labelColor;
        ctx.fillText(n.label.toUpperCase(), n.x + 8 * devicePixelRatio, n.y + 4 * devicePixelRatio);
      }
    }
    if (!reduceMotion) requestAnimationFrame(step);
  }
  window.addEventListener('resize', () => { resize(); });
  init();
  step();
})();
