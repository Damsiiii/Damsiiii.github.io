// theme toggle
const themeToggle = document.getElementById('theme-toggle');
if (themeToggle) {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    themeToggle.textContent = '☀️';
    themeToggle.setAttribute('aria-label', 'Switch to light paper theme');
  } else {
    document.documentElement.removeAttribute('data-theme');
    themeToggle.textContent = '🌙';
    themeToggle.setAttribute('aria-label', 'Switch to dark chalkboard theme');
  }

  themeToggle.addEventListener('click', () => {
    themeToggle.classList.add('spin');
    setTimeout(() => themeToggle.classList.remove('spin'), 500);

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const nextTheme = isDark ? 'light' : 'dark';
    if (nextTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      themeToggle.textContent = '☀️';
      themeToggle.setAttribute('aria-label', 'Switch to light paper theme');
    } else {
      document.documentElement.removeAttribute('data-theme');
      themeToggle.textContent = '🌙';
      themeToggle.setAttribute('aria-label', 'Switch to dark chalkboard theme');
    }
    localStorage.setItem('theme', nextTheme);
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: nextTheme } }));
  });
}

// mobile nav
const toggle = document.getElementById('nav-toggle');
const navLinks = document.getElementById('nav-links');
if (toggle && navLinks) {
  toggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });
  navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    navLinks.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  }));
}

// reveal on scroll
const revealEls = document.querySelectorAll('.reveal');
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
}, { threshold: 0.12 });
revealEls.forEach(el => io.observe(el));

// knowledge-graph hero canvas
(function () {
  const canvas = document.getElementById('graph-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w, h, nodes;
  const labels = ['Python', 'AI/ML', 'AWS', 'SQL', 'MCP', 'Security', 'LLM', 'Cloud', 'Java', 'Data'];
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
    const count = w < 700 ? 18 : 32;
    nodes = Array.from({ length: count }, (_, i) => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.3 * devicePixelRatio, vy: (Math.random() - 0.5) * 0.3 * devicePixelRatio,
      r: (Math.random() * 2.5 + 1.8) * devicePixelRatio,
      label: i < labels.length ? labels[i] : null
    }));
  }
  function step() {
    ctx.clearRect(0, 0, w, h);
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const lineRgb = isDark ? '240, 235, 225' : '44, 40, 37';
    const particleColor = isDark ? '#ff7878' : '#d93838';
    const labelColor = isDark ? 'rgba(245, 240, 235, 0.98)' : 'rgba(28, 24, 22, 0.95)';

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
          const alpha = isDark ? (1 - d / maxD) * 0.45 : (1 - d / maxD) * 0.35;
          ctx.strokeStyle = `rgba(${lineRgb}, ${alpha})`;
          ctx.lineWidth = isDark ? 1.3 * devicePixelRatio : 1.2 * devicePixelRatio;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }

      // Connect to mouse cursor
      if (mouse.x !== null && mouse.y !== null) {
        const md = Math.hypot(nodes[i].x - mouse.x, nodes[i].y - mouse.y);
        const maxMouseD = 220 * devicePixelRatio;
        if (md < maxMouseD) {
          const mAlpha = isDark ? (1 - md / maxMouseD) * 0.7 : (1 - md / maxMouseD) * 0.55;
          ctx.strokeStyle = `rgba(${lineRgb}, ${mAlpha})`;
          ctx.lineWidth = 1.6 * devicePixelRatio;
          ctx.beginPath(); ctx.moveTo(nodes[i].x, nodes[i].y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        }
      }
    }
    ctx.font = `bold ${15 * devicePixelRatio}px 'Patrick Hand', cursive, sans-serif`;
    for (const n of nodes) {
      if (isDark) {
        ctx.shadowColor = 'rgba(255, 120, 120, 0.5)';
        ctx.shadowBlur = 6 * devicePixelRatio;
      } else {
        ctx.shadowColor = 'rgba(217, 56, 56, 0.3)';
        ctx.shadowBlur = 3 * devicePixelRatio;
      }
      ctx.fillStyle = particleColor;
      ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill();
      if (n.label) {
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.fillStyle = labelColor;
        ctx.fillText(n.label, n.x + 8 * devicePixelRatio, n.y + 5 * devicePixelRatio);
      }
    }
    if (!reduceMotion) requestAnimationFrame(step);
  }
  window.addEventListener('resize', () => { resize(); });
  init();
  step();
})();
