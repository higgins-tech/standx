/* StandX recreation — main.js (vanilla JS) */
(function () {
  'use strict';

  /* ------------------------------------------------------------------
     Responsive nav (slides down from the top, contains Claim Airdrop)
     ------------------------------------------------------------------ */
  var header = document.getElementById('siteHeader');
  var burger = document.getElementById('burger');
  var menu = document.getElementById('mobileMenu');
  var burgerIcon = burger.querySelector('i');
  var DESKTOP = window.matchMedia('(min-width: 1024px)');

  function syncMenuTop() {
    var bottom = header.getBoundingClientRect().bottom;
    menu.style.setProperty('--menu-top', Math.max(bottom, 0) + 'px');
  }

  function setMenu(open) {
    if (open) {
      window.scrollTo({ top: 0 });
      syncMenuTop();
    }
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', String(!open));
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    burgerIcon.className = open ? 'ri-close-line' : 'ri-menu-line';
    document.body.classList.toggle('menu-open', open);
  }

  burger.addEventListener('click', function () {
    setMenu(!menu.classList.contains('is-open'));
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setMenu(false);
  });
  menu.addEventListener('click', function (e) {
    var a = e.target.closest('a');
    if (a && a.getAttribute('href').charAt(0) === '#') setMenu(false);
  });
  window.addEventListener('resize', function () {
    if (DESKTOP.matches) setMenu(false);
    else if (menu.classList.contains('is-open')) syncMenuTop();
  });

  /* ------------------------------------------------------------------
     Swap / Mint widget
     ------------------------------------------------------------------ */
  var TOKENS = {
    USDT: { icon: '<img src="img/usdt.png" alt="">' },
    USDC: { icon: '<img src="img/usdc.png" alt="">' },
    DUSD: { icon: '<img src="img/standxicon.png" alt="">' }
  };
  var SWAP_RATE = 1.00028256;   // USD stable -> DUSD (matches the reference: 50 -> 50.014128)
  var APY = 1.01;               // SIP-3 APY, %

  var state = { mode: 'swap', from: 'USDT', to: 'DUSD' };

  var amountIn = document.getElementById('amountIn');
  var amountOut = document.getElementById('amountOut');
  var estYield = document.getElementById('estYield');
  var priceImpact = document.getElementById('priceImpact');
  var selects = document.querySelectorAll('.token-select');

  function rate() {
    if (state.mode === 'mint') return state.to === 'DUSD' ? 1 : 1;
    if (state.to === 'DUSD' && state.from !== 'DUSD') return SWAP_RATE;
    if (state.from === 'DUSD' && state.to !== 'DUSD') return 1 / SWAP_RATE;
    return 1;
  }

  function fmtOut(v) {
    if (!isFinite(v) || v <= 0) return '0';
    return v.toFixed(6);
  }

  function render() {
    selects.forEach(function (sel) {
      var key = state[sel.dataset.side];
      sel.querySelector('.token-name').textContent = key;
      sel.querySelector('.token-btn .token-icon').innerHTML = TOKENS[key].icon;
    });

    var amt = parseFloat(amountIn.value);
    if (isNaN(amt)) amt = 0;
    var out = amt * rate();
    amountOut.textContent = fmtOut(out);

    var dusd = state.to === 'DUSD' ? out : (state.from === 'DUSD' ? amt : 0);
    estYield.textContent = '$' + (Math.round(dusd * APY) / 100).toFixed(2);
    priceImpact.textContent = state.mode === 'mint' ? '0.00%' : (rate() === 1 ? '0.00%' : '0.01%');
  }

  // numeric-only input
  amountIn.addEventListener('input', function () {
    var v = amountIn.value.replace(/[^0-9.]/g, '');
    var i = v.indexOf('.');
    if (i !== -1) v = v.slice(0, i + 1) + v.slice(i + 1).replace(/\./g, '');
    amountIn.value = v;
    render();
  });

  // token dropdowns
  function closeMenus() {
    selects.forEach(function (sel) {
      sel.querySelector('.token-menu').hidden = true;
      sel.querySelector('.token-btn').setAttribute('aria-expanded', 'false');
    });
  }
  selects.forEach(function (sel) {
    var btn = sel.querySelector('.token-btn');
    var list = sel.querySelector('.token-menu');
    var side = sel.dataset.side;

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var willOpen = list.hidden;
      closeMenus();
      if (!willOpen) return;
      list.innerHTML = '';
      Object.keys(TOKENS).forEach(function (key) {
        var li = document.createElement('li');
        li.setAttribute('role', 'option');
        li.setAttribute('aria-selected', String(state[side] === key));
        li.innerHTML = '<span class="token-icon">' + TOKENS[key].icon + '</span>' + key;
        li.addEventListener('click', function () {
          var other = side === 'from' ? 'to' : 'from';
          if (state[other] === key) state[other] = state[side]; // keep the pair distinct
          state[side] = key;
          closeMenus();
          render();
        });
        list.appendChild(li);
      });
      list.hidden = false;
      btn.setAttribute('aria-expanded', 'true');
    });
  });
  document.addEventListener('click', closeMenus);

  // flip direction
  document.getElementById('flip').addEventListener('click', function () {
    var t = state.from; state.from = state.to; state.to = t;
    var cur = parseFloat(amountOut.textContent);
    if (cur > 0) amountIn.value = String(parseFloat(cur.toFixed(6)));
    render();
  });

  // mint / swap tabs
  document.querySelectorAll('.tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      state.mode = tab.dataset.tab;
      document.querySelectorAll('.tab').forEach(function (t) {
        var on = t === tab;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', String(on));
      });
      render();
    });
  });

  // refresh balance icon
  document.querySelectorAll('.refresh').forEach(function (b) {
    b.addEventListener('click', function () {
      b.classList.remove('spin'); void b.offsetWidth; b.classList.add('spin');
    });
  });

  // settings
  var st = document.getElementById('settingsToggle');
  var sp = document.getElementById('settingsPanel');
  st.addEventListener('click', function () {
    var open = sp.hidden;
    sp.hidden = !open;
    st.setAttribute('aria-expanded', String(open));
  });
  document.querySelectorAll('.slip').forEach(function (s) {
    s.addEventListener('click', function () {
      document.querySelectorAll('.slip').forEach(function (x) { x.classList.toggle('is-active', x === s); });
    });
  });

  render();

  /* ------------------------------------------------------------------
     SIP-2 dotted position-yield chart (canvas)
     ------------------------------------------------------------------ */
  var cv = document.getElementById('posChart');
  function drawChart() {
    if (!cv) return;
    var dpr = window.devicePixelRatio || 1;
    var w = cv.clientWidth, h = cv.clientHeight;
    if (!w || !h) return;
    cv.width = w * dpr; cv.height = h * dpr;
    var ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    var step = 6, dot = 2.4;
    var cols = Math.floor(w / step), rows = Math.floor(h / step);
    var seed = 7;
    function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }

    for (var i = 0; i < cols; i++) {
      var p = i / cols;
      var level = Math.min(rows, Math.round(rows * (0.12 + 0.55 * Math.pow(p, 0.8) * (0.55 + rnd() * 0.45))));
      for (var j = 0; j < rows; j++) {
        var x = i * step + step / 2, y = h - (j + 0.5) * step;
        if (j < level && p > 0.04) {
          ctx.fillStyle = 'rgba(0,200,100,' + (0.95 - (j / rows) * 0.55) + ')';
        } else {
          ctx.fillStyle = 'rgba(0,0,0,' + (0.05 * (1 - j / rows) + 0.015) + ')';
        }
        ctx.fillRect(x - dot / 2, y - dot / 2, dot, dot);
      }
    }
  }
  drawChart();
  if (window.ResizeObserver && cv) new ResizeObserver(drawChart).observe(cv);
  else window.addEventListener('resize', drawChart);

  /* ------------------------------------------------------------------
     Revenue cycle — yellow trail flowing into the DUSD program
     ------------------------------------------------------------------ */
  var grid = document.getElementById('cycleGrid');
  if (grid) {
    var MOBILE = window.matchMedia('(max-width: 700px)');
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var cells = [], raf = null, t0 = 0;
    var gateway = grid.querySelector('[data-node="gateway"]');

    function pathFor(mobile) {
      var p = [], c, r;
      if (mobile) {                         // account -> down -> left into program
        for (r = 3; r <= 9; r++) p.push([6, r]);
        for (c = 5; c >= 3; c--) p.push([c, 9]);
      } else {                              // account -> right -> down into program
        for (c = 4; c <= 12; c++) p.push([c, 6]);
        for (r = 7; r <= 11; r++) p.push([12, r]);
      }
      return p;
    }

    function build() {
      cells.forEach(function (el) { el.remove(); });
      cells = pathFor(MOBILE.matches).map(function (pt) {
        var el = document.createElement('div');
        el.className = 'trail';
        el.style.gridColumn = String(pt[0] + 1);
        el.style.gridRow = String(pt[1] + 1);
        grid.insertBefore(el, grid.firstChild);
        return el;
      });
      if (reduce) paint(cells.length + 2);
    }

    var TAIL = 8;
    function paint(head) {
      cells.forEach(function (el, i) {
        var d = head - i;
        var a = d < 0 || d > TAIL ? 0 : 1 - d / TAIL;
        el.style.background = a ? 'rgba(250,204,21,' + (a * 0.95).toFixed(3) + ')' : 'transparent';
      });
    }

    function tick(ts) {
      if (!t0) t0 = ts;
      var len = cells.length;
      var span = len + TAIL + 6;
      var head = ((ts - t0) / 1000 * 7) % span;
      paint(head);
      if (gateway) gateway.classList.toggle('is-lit', head > 2 && head < len * 0.6);
      raf = requestAnimationFrame(tick);
    }

    build();
    if (!reduce) {
      // only animate while the section is on screen
      var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (en) {
        if (en[0].isIntersecting) { if (!raf) raf = requestAnimationFrame(tick); }
        else if (raf) { cancelAnimationFrame(raf); raf = null; t0 = 0; }
      }) : null;
      if (io) io.observe(grid); else raf = requestAnimationFrame(tick);
    }
    (MOBILE.addEventListener ? MOBILE.addEventListener('change', build) : MOBILE.addListener(build));
  }
})();
