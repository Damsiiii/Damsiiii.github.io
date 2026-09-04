// theme toggle
const themeToggle = document.getElementById("theme-toggle");
if (themeToggle) {
  const savedTheme = localStorage.getItem("theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);
  if (savedTheme === "light") {
    themeToggle.textContent = "MODE / DARK";
    themeToggle.setAttribute("aria-label", "Switch to dark theme");
  } else {
    themeToggle.textContent = "MODE / LIGHT";
    themeToggle.setAttribute("aria-label", "Switch to light theme");
  }

  themeToggle.addEventListener("click", () => {
    themeToggle.classList.add("active");
    setTimeout(() => themeToggle.classList.remove("active"), 300);

    const isLight =
      document.documentElement.getAttribute("data-theme") === "light";
    const nextTheme = isLight ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", nextTheme);
    if (nextTheme === "light") {
      themeToggle.textContent = "MODE / DARK";
      themeToggle.setAttribute("aria-label", "Switch to dark theme");
    } else {
      themeToggle.textContent = "MODE / LIGHT";
      themeToggle.setAttribute("aria-label", "Switch to light theme");
    }
    localStorage.setItem("theme", nextTheme);
    window.dispatchEvent(
      new CustomEvent("themechange", { detail: { theme: nextTheme } }),
    );
  });
}

// Live Retro System Clock
function updateClock() {
  const clockEl = document.getElementById("system-clock");
  if (clockEl) {
    const now = new Date();
    clockEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
setInterval(updateClock, 1000);
updateClock();

// Start menu toggle
const startBtn = document.getElementById("start-menu-toggle");
if (startBtn) {
  startBtn.addEventListener("click", () => {
    const active = startBtn.classList.toggle("active");
    startBtn.setAttribute("aria-expanded", active ? "true" : "false");
  });
}

// mobile nav
const toggle = document.getElementById("nav-toggle");
const navLinks = document.getElementById("nav-links");
if (toggle && navLinks) {
  toggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");
    toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });
  navLinks.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
      navLinks.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    }),
  );
}

// reveal on scroll
const revealEls = document.querySelectorAll(".reveal");
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        io.unobserve(e.target);
      }
    });
  },
  { threshold: 0.12 },
);
revealEls.forEach((el) => io.observe(el));

// knowledge-graph hero canvas
(function () {
  const canvas = document.getElementById("graph-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let w, h, nodes;
  const labels = [
    "Python",
    "AI/ML",
    "AWS",
    "SQL",
    "MCP",
    "Security",
    "LLM",
    "Cloud",
    "Java",
    "Data",
  ];
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  let mouse = { x: null, y: null };
  window.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    if (
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom
    ) {
      mouse.x = (e.clientX - rect.left) * devicePixelRatio;
      mouse.y = (e.clientY - rect.top) * devicePixelRatio;
    } else {
      mouse.x = null;
      mouse.y = null;
    }
  });
  window.addEventListener("mouseleave", () => {
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
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.35 * devicePixelRatio,
      vy: (Math.random() - 0.5) * 0.35 * devicePixelRatio,
      r: (Math.random() * 2.5 + 1.5) * devicePixelRatio,
      label: i < labels.length ? labels[i] : null,
    }));
  }
  function step() {
    ctx.clearRect(0, 0, w, h);
    const isLight =
      document.documentElement.getAttribute("data-theme") === "light";
    const lineRgb = isLight ? "0, 0, 128" : "72, 149, 239";
    const particleColor = isLight
      ? "rgba(0, 128, 128, 0.95)"
      : "rgba(160, 174, 192, 0.9)";
    const labelColor = isLight
      ? "rgba(0, 0, 0, 0.85)"
      : "rgba(240, 244, 248, 0.85)";

    for (const n of nodes) {
      n.x += n.vx;
      n.y += n.vy;

      if (n.x < 0 || n.x > w) n.vx *= -1;
      if (n.y < 0 || n.y > h) n.vy *= -1;
    }

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i],
          b = nodes[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        const maxD = 180 * devicePixelRatio;
        if (d < maxD) {
          ctx.strokeStyle = `rgba(${lineRgb}, ${(1 - d / maxD) * 0.32})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      if (mouse.x !== null && mouse.y !== null) {
        const md = Math.hypot(nodes[i].x - mouse.x, nodes[i].y - mouse.y);
        const maxMouseD = 240 * devicePixelRatio;
        if (md < maxMouseD) {
          ctx.strokeStyle = `rgba(${lineRgb}, ${(1 - md / maxMouseD) * 0.6})`;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
      }
    }

    if (mouse.x !== null && mouse.y !== null) {
      ctx.fillStyle = isLight
        ? "rgba(0, 0, 128, 0.9)"
        : "rgba(72, 149, 239, 0.9)";
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, 5 * devicePixelRatio, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = isLight
        ? "rgba(0, 0, 128, 0.25)"
        : "rgba(72, 149, 239, 0.25)";
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, 14 * devicePixelRatio, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.font = `${11 * devicePixelRatio}px 'Share Tech Mono', monospace`;
    for (const n of nodes) {
      ctx.fillStyle = particleColor;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fill();
      if (n.label) {
        ctx.fillStyle = labelColor;
        ctx.fillText(
          n.label,
          n.x + 8 * devicePixelRatio,
          n.y + 4 * devicePixelRatio,
        );
      }
    }
    if (!reduceMotion) requestAnimationFrame(step);
  }
  window.addEventListener("resize", () => {
    resize();
  });
  init();
  step();
})();

// Terminal Snake Game (C:\GAMES\SNAKE.EXE)
(function () {
  const canvas = document.getElementById("snake-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const scoreEl = document.getElementById("snake-score-val");
  const highScoreEl = document.getElementById("snake-high-score-val");
  const startBtn = document.getElementById("snake-start-btn");
  const overlay = document.getElementById("snake-overlay");
  const statusEl = document.getElementById("snake-status-text");

  const GRID_SIZE = 20;
  const COLS = canvas.width / GRID_SIZE; // 20
  const ROWS = canvas.height / GRID_SIZE; // 15

  let snake = [];
  let food = { x: 0, y: 0 };
  let dir = { x: 1, y: 0 };
  let nextDir = { x: 1, y: 0 };
  let score = 0;
  let highScore = parseInt(localStorage.getItem("snake_high_score") || "0", 10);
  let gameLoopId = null;
  let isRunning = false;

  highScoreEl.textContent = String(highScore).padStart(4, "0");

  function resetGame() {
    snake = [
      { x: 5, y: 7 },
      { x: 4, y: 7 },
      { x: 3, y: 7 },
    ];
    dir = { x: 1, y: 0 };
    nextDir = { x: 1, y: 0 };
    score = 0;
    scoreEl.textContent = "0000";
    spawnFood();
  }

  function spawnFood() {
    while (true) {
      const fx = Math.floor(Math.random() * COLS);
      const fy = Math.floor(Math.random() * ROWS);
      if (!snake.some((segment) => segment.x === fx && segment.y === fy)) {
        food = { x: fx, y: fy };
        break;
      }
    }
  }

  function startGame() {
    resetGame();
    isRunning = true;
    overlay.classList.add("hidden");
    if (statusEl) statusEl.textContent = "STATUS: RUNNING";
    if (gameLoopId) clearInterval(gameLoopId);
    gameLoopId = setInterval(tick, 120);
  }

  function gameOver() {
    isRunning = false;
    clearInterval(gameLoopId);
    if (score > highScore) {
      highScore = score;
      localStorage.setItem("snake_high_score", String(highScore));
      highScoreEl.textContent = String(highScore).padStart(4, "0");
    }
    if (statusEl) statusEl.textContent = "STATUS: GAME OVER";
    overlay.innerHTML = `
      <div class="snake-overlay-msg">
        <h3>GAME OVER</h3>
        <p>FINAL SCORE: ${score}</p>
        <p>Press <strong>START</strong> or <strong>SPACE</strong> to Play Again</p>
      </div>
    `;
    overlay.classList.remove("hidden");
  }

  function tick() {
    dir = nextDir;
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

    // Wall collision
    if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
      gameOver();
      return;
    }

    // Self collision
    if (snake.some((seg) => seg.x === head.x && seg.y === head.y)) {
      gameOver();
      return;
    }

    snake.unshift(head);

    // Eat food
    if (head.x === food.x && head.y === food.y) {
      score += 10;
      scoreEl.textContent = String(score).padStart(4, "0");
      spawnFood();
    } else {
      snake.pop();
    }

    draw();
  }

  function draw() {
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw CRT grid lines (subtle retro terminal feel)
    ctx.strokeStyle = "#001a00";
    ctx.lineWidth = 1;
    for (let x = 0; x <= canvas.width; x += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw Food
    ctx.fillStyle = "#ffaa00";
    ctx.shadowColor = "#ffaa00";
    ctx.shadowBlur = 8;
    ctx.fillRect(
      food.x * GRID_SIZE + 2,
      food.y * GRID_SIZE + 2,
      GRID_SIZE - 4,
      GRID_SIZE - 4
    );

    // Draw Snake
    ctx.shadowColor = "#00ff00";
    ctx.shadowBlur = 6;
    snake.forEach((seg, i) => {
      ctx.fillStyle = i === 0 ? "#00ff66" : "#00cc44";
      ctx.fillRect(
        seg.x * GRID_SIZE + 1,
        seg.y * GRID_SIZE + 1,
        GRID_SIZE - 2,
        GRID_SIZE - 2
      );
    });

    // Reset shadow
    ctx.shadowBlur = 0;
  }

  if (startBtn) {
    startBtn.addEventListener("click", () => {
      startGame();
    });
  }

  window.addEventListener("keydown", (e) => {
    // Space or Enter to start when paused/gameover
    if ((e.code === "Space" || e.code === "Enter") && !isRunning) {
      const windowSection = document.getElementById("snake-game-window");
      if (windowSection) {
        const rect = windowSection.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          e.preventDefault();
          startGame();
          return;
        }
      }
    }

    if (!isRunning) return;

    const keys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "KeyW", "KeyS", "KeyA", "KeyD"];
    if (keys.includes(e.code)) {
      e.preventDefault();
    }

    if ((e.code === "ArrowUp" || e.code === "KeyW") && dir.y === 0) {
      nextDir = { x: 0, y: -1 };
    } else if ((e.code === "ArrowDown" || e.code === "KeyS") && dir.y === 0) {
      nextDir = { x: 0, y: 1 };
    } else if ((e.code === "ArrowLeft" || e.code === "KeyA") && dir.x === 0) {
      nextDir = { x: -1, y: 0 };
    } else if ((e.code === "ArrowRight" || e.code === "KeyD") && dir.x === 0) {
      nextDir = { x: 1, y: 0 };
    }
  });

  // Initial render on canvas
  draw();
})();
