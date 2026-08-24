    // theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
        themeToggle.textContent = '🌙';
        themeToggle.setAttribute('aria-label', 'Switch to dark theme');
      } else {
        themeToggle.textContent = '☀️';
        themeToggle.setAttribute('aria-label', 'Switch to light theme');
      }

      themeToggle.addEventListener('click', () => {
        themeToggle.classList.add('spin');
        setTimeout(() => themeToggle.classList.remove('spin'), 500);

        const isLight = document.documentElement.getAttribute('data-theme') === 'light';
        const nextTheme = isLight ? 'dark' : 'light';
        if (nextTheme === 'light') {
          document.documentElement.setAttribute('data-theme', 'light');
          themeToggle.textContent = '🌙';
          themeToggle.setAttribute('aria-label', 'Switch to dark theme');
        } else {
          document.documentElement.removeAttribute('data-theme');
          themeToggle.textContent = '☀️';
          themeToggle.setAttribute('aria-label', 'Switch to light theme');
        }
        localStorage.setItem('theme', nextTheme);
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

      function resize() {
        w = canvas.width = canvas.offsetWidth * devicePixelRatio;
        h = canvas.height = canvas.offsetHeight * devicePixelRatio;
      }
      function init() {
        resize();
        const count = w < 700 ? 16 : 26;
        nodes = Array.from({ length: count }, (_, i) => ({
          x: Math.random() * w, y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.25 * devicePixelRatio, vy: (Math.random() - 0.5) * 0.25 * devicePixelRatio,
          r: (Math.random() * 2 + 1.5) * devicePixelRatio,
          label: i < labels.length ? labels[i] : null
        }));
      }
      function step() {
        ctx.clearRect(0, 0, w, h);
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
              ctx.strokeStyle = `rgba(226,165,61,${(1 - d / maxD) * 0.22})`;
              ctx.lineWidth = 1;
              ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
            }
          }
        }
        ctx.font = `${11 * devicePixelRatio}px 'JetBrains Mono', monospace`;
        for (const n of nodes) {
          ctx.fillStyle = 'rgba(95,179,163,0.85)';
          ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill();
          if (n.label) {
            ctx.fillStyle = 'rgba(246,243,236,0.4)';
            ctx.fillText(n.label, n.x + 8 * devicePixelRatio, n.y + 4 * devicePixelRatio);
          }
        }
        if (!reduceMotion) requestAnimationFrame(step);
      }
      window.addEventListener('resize', () => { resize(); });
      init();
      step();
    })();
