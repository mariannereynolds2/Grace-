(() => {
  const WA = "2348033915483";
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* header state */
  const head = $(".site-head");
  const onScroll = () => head && head.classList.toggle("scrolled", scrollY > 8);
  addEventListener("scroll", onScroll, { passive: true }); onScroll();

  /* mobile menu */
  const menuBtn = $(".menu-btn");
  if (menuBtn) menuBtn.addEventListener("click", () => {
    const open = document.body.classList.toggle("menu-open");
    menuBtn.setAttribute("aria-expanded", open);
    $(".drawer").setAttribute("aria-hidden", !open);
  });

  /* page transition: bars drop, then navigate */
  document.addEventListener("click", e => {
    const a = e.target.closest("a[href]");
    if (!a || reduce || e.metaKey || e.ctrlKey || e.shiftKey || a.target || a.hasAttribute("download")) return;
    const href = a.getAttribute("href");
    if (/^(https?:|mailto:|tel:|#)/.test(href) || href.includes("#")) return;
    e.preventDefault();
    document.body.classList.add("leaving");
    setTimeout(() => { location.href = href; }, 560);
  });
  addEventListener("pageshow", ev => { if (ev.persisted) document.body.classList.remove("leaving", "menu-open"); });

  /* reveal on scroll (transform only — content is readable at rest) */
  if ("IntersectionObserver" in window && !reduce) {
    const io = new IntersectionObserver(es => es.forEach(en => {
      if (en.isIntersecting) { en.target.classList.remove("pre"); io.unobserve(en.target); }
    }), { rootMargin: "0px 0px -8% 0px" });
    $$(".rv").forEach(el => {
      if (el.getBoundingClientRect().top > innerHeight) { el.classList.add("pre"); io.observe(el); }
    });
  }

  /* scratch panel on the hero voucher */
  const cv = $("#foil");
  if (cv) {
    const ctx = cv.getContext("2d");
    let w, h, drawing = false, cleared = false;
    const paint = () => {
      const r = cv.getBoundingClientRect(), d = devicePixelRatio || 1;
      w = r.width; h = r.height; cv.width = w * d; cv.height = h * d; ctx.setTransform(d, 0, 0, d, 0, 0);
      const cs = getComputedStyle(document.documentElement);
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, cs.getPropertyValue("--foil-a")); g.addColorStop(.5, cs.getPropertyValue("--foil-b")); g.addColorStop(1, cs.getPropertyValue("--foil-a"));
      ctx.globalCompositeOperation = "source-over"; ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "rgba(14,20,48,.28)"; ctx.font = "500 10px 'Martian Mono', monospace";
      for (let y = 14; y < h; y += 16) for (let x = 8 - (y % 32 ? 0 : 20); x < w; x += 46) ctx.fillText("AG·CORE", x, y);
      ctx.globalCompositeOperation = "destination-out"; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.lineWidth = 30;
    };
    const scratchTo = (x, y, px, py) => { ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(x, y); ctx.stroke(); };
    const finish = () => { if (cleared) return; cleared = true; cv.style.transition = "opacity .5s"; cv.style.opacity = "0"; setTimeout(() => cv.remove(), 600); };
    paint();
    if (reduce) { cv.remove(); }
    else {
      /* auto-scratch: a zig-zag that reveals the line after the card lands */
      let t0 = null, last = null;
      const pts = []; for (let i = 0; i <= 10; i++) pts.push([w * (i / 10), i % 2 ? h * .82 : h * .18]);
      const run = ts => {
        if (cleared) return; t0 ??= ts; const p = Math.min(1, (ts - t0) / 1500);
        const f = p * (pts.length - 1), i = Math.floor(f), k = f - i;
        const a = pts[i], b = pts[Math.min(i + 1, pts.length - 1)];
        const cur = [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
        if (last) scratchTo(cur[0], cur[1], last[0], last[1]); last = cur;
        p < 1 ? requestAnimationFrame(run) : setTimeout(finish, 250);
      };
      setTimeout(() => requestAnimationFrame(run), 1100);
      let prev = null;
      const pos = e => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
      cv.addEventListener("pointerdown", e => { drawing = true; prev = pos(e); cv.setPointerCapture(e.pointerId); });
      cv.addEventListener("pointermove", e => { if (!drawing) return; const p = pos(e); scratchTo(p[0], p[1], prev[0], prev[1]); prev = p; });
      addEventListener("pointerup", () => { drawing = false; });
    }
  }

  /* copy buttons */
  $$("[data-copy]").forEach(b => b.addEventListener("click", () => {
    const v = b.dataset.copy, label = b.textContent;
    const ok = () => { b.classList.add("done"); b.textContent = "✓"; setTimeout(() => { b.classList.remove("done"); b.textContent = label; }, 1600); };
    if (navigator.clipboard) navigator.clipboard.writeText(v).then(ok).catch(() => sel(b));
    else sel(b);
  }));
  function sel(b) {
    const t = b.closest(".line-card")?.querySelector(".num"); if (!t) return;
    const r = document.createRange(); r.selectNodeContents(t); const s = getSelection(); s.removeAllRanges(); s.addRange(r);
  }

  /* ---------------- airtime & bills ---------------- */
  const tabs = $$('[role="tab"]');
  if (tabs.length) {
    const show = k => {
      if (!tabs.some(t => t.dataset.tab === k)) k = tabs[0].dataset.tab;
      tabs.forEach(t => {
        const on = t.dataset.tab === k; t.setAttribute("aria-selected", on); t.tabIndex = on ? 0 : -1;
        $("#p-" + t.dataset.tab).hidden = !on;
      });
    };
    tabs.forEach((t, i) => {
      t.addEventListener("click", () => { show(t.dataset.tab); history.replaceState(null, "", "#" + t.dataset.tab); });
      t.addEventListener("keydown", e => {
        const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0; if (!d) return;
        const n = tabs[(i + d + tabs.length) % tabs.length]; n.click(); n.focus();
      });
    });
    show(location.hash.slice(1));
    addEventListener("hashchange", () => show(location.hash.slice(1)));
  }

  $$(".oform").forEach(form => {
    const panel = form.closest(".tabpanel"), sum = panel && $(".bill-sum", panel);
    const vals = () => {
      const v = {};
      $$(".seg", form).forEach(s => { v[s.dataset.name] = $('[aria-pressed="true"]', s)?.dataset.v || ""; });
      $$("input, select", form).forEach(i => {
        let x = i.value.trim();
        if (i.dataset.kind === "phone" || i.dataset.kind === "digits") x = x.replace(/\D/g, "");
        if (i.dataset.kind === "amount") { const n = +x.replace(/[^\d]/g, ""); x = n ? n.toLocaleString("en-NG") : ""; }
        v[i.name] = x;
      });
      return v;
    };
    const fill = (tpl, v, dash) => tpl.replace(/\{(\w+)\}/g, (_, k) => v[k] || (k === "package" ? "Please help me choose" : dash));
    const update = () => {
      if (!sum) return; const v = vals();
      sum.innerHTML = `<b>${fill(form.dataset.title, v, "—")}</b><span>${fill(form.dataset.line, v, "—").replace(/^Please help me choose · /, "")}</span>`;
    };
    $$(".seg button", form).forEach(b => b.addEventListener("click", () => {
      $$("button", b.parentNode).forEach(x => x.setAttribute("aria-pressed", x === b)); update();
    }));
    $$(".chips[data-for] button", form).forEach(b => b.addEventListener("click", () => {
      const inp = $("#" + b.parentNode.dataset.for); inp.value = b.dataset.size;
      inp.closest(".field").classList.remove("bad");
      $$("button", b.parentNode).forEach(x => x.setAttribute("aria-pressed", x === b)); update();
    }));
    $$("input, select", form).forEach(i => i.addEventListener("input", () => { i.closest(".field").classList.remove("bad"); update(); }));
    form.addEventListener("submit", e => {
      e.preventDefault();
      for (const i of $$("input, select", form)) {
        const raw = i.value.trim(), d = raw.replace(/\D/g, "");
        const bad = (i.required && !raw)
          || (i.dataset.kind === "phone" && !/^(0\d{10}|234\d{10})$/.test(d))
          || (i.dataset.kind === "digits" && raw && d.length < 6)
          || (i.dataset.kind === "amount" && raw && !(+d > 0));
        if (bad) { const f = i.closest(".field"); f.classList.remove("bad"); void f.offsetWidth; f.classList.add("bad"); i.focus(); return; }
      }
      const msg = fill(form.dataset.tpl, vals(), "");
      const btn = $(".order-btn", form); btn.classList.remove("pulse"); void btn.offsetWidth; btn.classList.add("pulse");
      const a = document.createElement("a"); a.href = `https://wa.me/${WA}?text=${encodeURIComponent(msg)}`; a.target = "_blank"; a.rel = "noopener";
      document.body.appendChild(a); a.click(); a.remove();
    });
    update();
  });

  /* ---------------- plan finder ---------------- */
  const finder = $("#finder");
  if (!finder) return;
  const DATA = window.AG_PLANS || { mtn: [], airtel: [], glo: [] };
  const NETS = { mtn: { name: "MTN", c: "var(--mtn)" }, airtel: { name: "Airtel", c: "var(--airtel)" }, glo: { name: "Glo", c: "var(--glo)" } };
  const state = { net: "mtn", q: "", val: "any", sort: "featured" };
  try { const s = localStorage.getItem("ag-net"); if (s && NETS[s]) state.net = s; } catch (e) {}

  const list = $("#plans"), empty = $("#empty"), count = $("#count"), pill = $(".nets .pill");
  const phone = $("#phone"), phoneField = phone.closest(".field");

  const fmt = n => "₦" + Number(n).toLocaleString("en-NG");
  const days = d => d + (d === 1 ? " day" : " days");
  const toMB = s => { const m = String(s).match(/([\d.]+)\s*(TB|GB|MB)/i); if (!m) return 0; const n = +m[1]; return /TB/i.test(m[2]) ? n * 1048576 : /GB/i.test(m[2]) ? n * 1024 : n; };

  function setNet(n) {
    state.net = n;
    $$(".nets button").forEach((b, i) => {
      const on = b.dataset.net === n; b.setAttribute("aria-pressed", on);
      if (on) pill.style.transform = `translateX(calc(${i} * (100% + 6px)))`;
    });
    pill.style.setProperty("--netc", NETS[n].c);
    try { localStorage.setItem("ag-net", n); } catch (e) {}
    render(); if (typeof summary === "function") summary();
  }

  function render() {
    let rows = (DATA[state.net] || []).map((p, i) => ({ ...p, i, mb: p.mb ?? toMB(p.size) }));
    if (state.q) { const q = state.q.toLowerCase(); rows = rows.filter(p => `${p.size} ${days(p.validity)} ${p.price}`.toLowerCase().includes(q)); }
    if (state.val !== "any") rows = rows.filter(p => +p.validity === +state.val);
    const s = state.sort;
    rows.sort((a, b) => s === "low" ? a.price - b.price : s === "high" ? b.price - a.price : s === "big" ? b.mb - a.mb : (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || a.i - b.i);

    list.innerHTML = "";
    count.textContent = `${NETS[state.net].name} · ${rows.length}`;
    empty.hidden = rows.length > 0;
    rows.forEach((p, k) => {
      const el = document.createElement("article");
      el.className = "plan"; el.style.setProperty("--netc", NETS[state.net].c); el.style.animationDelay = Math.min(k * 45, 500) + "ms";
      el.innerHTML = `<div class="p-top"><div class="p-net"><span>${NETS[state.net].name}</span><span>${p.featured ? "★" : ""}</span></div>
        <div class="p-size">${p.size}</div><div class="p-val">${days(p.validity)}</div></div>
        <div class="p-bot"><div class="p-price">${fmt(p.price)}</div>
        <a class="btn wa" href="#" data-i="${p.i}">Chat on WhatsApp <span class="arr">→</span></a></div>`;
      list.appendChild(el);
    });
  }

  list.addEventListener("click", e => {
    const b = e.target.closest("a[data-i]"); if (!b) return;
    const num = phone.value.replace(/\D/g, "");
    if (!/^(0\d{10}|234\d{10})$/.test(num)) {
      e.preventDefault(); phoneField.classList.remove("bad"); void phoneField.offsetWidth; phoneField.classList.add("bad");
      phone.focus(); phone.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" }); return;
    }
    const p = DATA[state.net][+b.dataset.i];
    const msg = `Hello AG CORE, I want to buy ${NETS[state.net].name} ${p.size} data (${days(p.validity)}, ${fmt(p.price)}).\nNumber: ${num}`;
    b.href = `https://wa.me/${WA}?text=${encodeURIComponent(msg)}`; b.target = "_blank"; b.rel = "noopener";
  });
  phone.addEventListener("input", () => { phoneField.classList.remove("bad"); summary(); });

  /* quick order: network + number + size + validity -> WhatsApp */
  const sizeIn = $("#q"), sizeField = $("#size-field"), sum = $("#order-sum"), orderBtn = $("#order-btn");
  const cleanSize = v => v.replace(/\s+/g, "").toUpperCase().replace(/^(\d+(?:\.\d+)?)$/, "$1GB").replace(/GIGS?$|G$/, "GB");
  function summary() {
    const size = cleanSize(sizeIn.value), num = phone.value.replace(/\D/g, "");
    sum.style.setProperty("--netc", NETS[state.net].c);
    sum.innerHTML = `<b>${NETS[state.net].name} ${size || "—"}</b><span>${state.val === "any" ? "Any validity" : days(+state.val)} · ${num || "080•••••••••"}</span>`;
    $$(".chips button").forEach(b => b.setAttribute("aria-pressed", b.dataset.size === size));
  }
  const flag = f => { f.classList.remove("bad"); void f.offsetWidth; f.classList.add("bad"); };
  $$(".chips button").forEach(b => b.addEventListener("click", () => {
    sizeIn.value = b.dataset.size; sizeField.classList.remove("bad"); state.q = b.dataset.size; render(); summary();
  }));
  orderBtn.addEventListener("click", () => {
    const num = phone.value.replace(/\D/g, ""), size = cleanSize(sizeIn.value);
    const okNum = /^(0\d{10}|234\d{10})$/.test(num);
    if (!okNum) { flag(phoneField); phone.focus(); return; }
    if (!size) { flag(sizeField); sizeIn.focus(); return; }
    const v = state.val === "any" ? "" : ` (${days(+state.val)})`;
    const msg = `Hello AG CORE, I want to buy ${NETS[state.net].name} ${size} data${v}.\nNumber: ${num}`;
    orderBtn.classList.remove("pulse"); void orderBtn.offsetWidth; orderBtn.classList.add("pulse");
    const a = document.createElement("a"); a.href = `https://wa.me/${WA}?text=${encodeURIComponent(msg)}`; a.target = "_blank"; a.rel = "noopener";
    document.body.appendChild(a); a.click(); a.remove();
  });
  $$(".nets button").forEach(b => b.addEventListener("click", () => setNet(b.dataset.net)));
  $("#q").addEventListener("input", e => { state.q = e.target.value.trim(); sizeField.classList.remove("bad"); render(); summary(); });
  $("#val").addEventListener("change", e => { state.val = e.target.value; render(); summary(); });
  $("#sort").addEventListener("change", e => { state.sort = e.target.value; render(); });
  setNet(state.net);
})();
