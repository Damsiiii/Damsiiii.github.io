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
        const count = w < 700 ? 20 : 36;
        nodes = Array.from({ length: count }, (_, i) => ({
          x: Math.random() * w, y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.35 * devicePixelRatio,
          vy: (Math.random() - 0.5) * 0.35 * devicePixelRatio,
          r: (Math.random() * 2.5 + 1.5) * devicePixelRatio,
          label: i < labels.length ? labels[i] : null
        }));
      }
      function step() {
        ctx.clearRect(0, 0, w, h);
        const isLight = document.documentElement.getAttribute('data-theme') === 'light';
        const lineRgb = isLight ? '217, 119, 6' : '226, 165, 61';
        const particleColor = isLight ? 'rgba(13, 148, 136, 0.95)' : 'rgba(95, 179, 163, 0.9)';
        const labelColor = isLight ? 'rgba(28, 36, 52, 0.75)' : 'rgba(246, 243, 236, 0.55)';

        for (const n of nodes) {
          if (mouse.x !== null && mouse.y !== null) {
            const dx = mouse.x - n.x;
            const dy = mouse.y - n.y;
            const dist = Math.hypot(dx, dy);
            const pullRadius = 240 * devicePixelRatio;
            if (dist < pullRadius && dist > 1) {
              const force = (1 - dist / pullRadius) * 0.08 * devicePixelRatio;
              n.vx += (dx / dist) * force;
              n.vy += (dy / dist) * force;
            }
          }

          n.vx *= 0.98;
          n.vy *= 0.98;

          n.x += n.vx;
          n.y += n.vy;

          if (n.x < 0 || n.x > w) n.vx *= -1;
          if (n.y < 0 || n.y > h) n.vy *= -1;
        }

        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const a = nodes[i], b = nodes[j];
            const d = Math.hypot(a.x - b.x, a.y - b.y);
            const maxD = 180 * devicePixelRatio;
            if (d < maxD) {
              ctx.strokeStyle = `rgba(${lineRgb}, ${(1 - d / maxD) * 0.32})`;
              ctx.lineWidth = 1;
              ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
            }
          }

          if (mouse.x !== null && mouse.y !== null) {
            const md = Math.hypot(nodes[i].x - mouse.x, nodes[i].y - mouse.y);
            const maxMouseD = 240 * devicePixelRatio;
            if (md < maxMouseD) {
              ctx.strokeStyle = `rgba(${lineRgb}, ${(1 - md / maxMouseD) * 0.6})`;
              ctx.lineWidth = 1.4;
              ctx.beginPath(); ctx.moveTo(nodes[i].x, nodes[i].y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
            }
          }
        }

        if (mouse.x !== null && mouse.y !== null) {
          ctx.fillStyle = isLight ? 'rgba(217, 119, 6, 0.9)' : 'rgba(226, 165, 61, 0.9)';
          ctx.beginPath();
          ctx.arc(mouse.x, mouse.y, 5 * devicePixelRatio, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = isLight ? 'rgba(217, 119, 6, 0.25)' : 'rgba(226, 165, 61, 0.25)';
          ctx.beginPath();
          ctx.arc(mouse.x, mouse.y, 14 * devicePixelRatio, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.font = `${11 * devicePixelRatio}px 'JetBrains Mono', monospace`;
        for (const n of nodes) {
          ctx.fillStyle = particleColor;
          ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill();
          if (n.label) {
            ctx.fillStyle = labelColor;
            ctx.fillText(n.label, n.x + 8 * devicePixelRatio, n.y + 4 * devicePixelRatio);
          }
        }
        if (!reduceMotion) requestAnimationFrame(step);
      }
      window.addEventListener('resize', () => { resize(); });
      init();
      step();
    })();
