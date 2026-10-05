// Navigation
const nav = document.querySelector('.nav');
const links = document.querySelector('.nav-links');
const burger = document.querySelector('.burger');
window.addEventListener('scroll', () => nav.classList.toggle('scrolled', window.scrollY > 20), { passive: true });
burger.addEventListener('click', () => {
  const open = links.classList.toggle('open');
  burger.setAttribute('aria-expanded', open);
});
links.addEventListener('click', e => { if (e.target.tagName === 'A') links.classList.remove('open'); });

// Accordions
document.querySelectorAll('.acc').forEach(acc => {
  acc.addEventListener('click', e => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const item = btn.parentElement;
    const wasOpen = item.classList.contains('open');
    acc.querySelectorAll('.acc-item').forEach(i => {
      i.classList.remove('open');
      i.querySelector('button').setAttribute('aria-expanded', 'false');
    });
    if (!wasOpen) {
      item.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
    }
  });
});

// Scroll reveal
const io = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

// Conversion-Tracking: Ereignisse für Google Tag Manager / Google Ads
window.dataLayer = window.dataLayer || [];
const track = (event, data = {}) => window.dataLayer.push({ event, ...data });
document.addEventListener('click', e => {
  const a = e.target.closest('a');
  if (!a) return;
  if (a.href.startsWith('tel:')) track('phone_click');
  else if (a.href.includes('wa.me')) track('whatsapp_click');
});

// Leistung aus Karte / Abo im Kontaktformular vorauswählen
document.querySelectorAll('.service .btn, [data-service]').forEach(btn => {
  btn.addEventListener('click', () => {
    const name = btn.dataset.service || btn.closest('.service').querySelector('h3').textContent.trim();
    const select = document.getElementById('f-leistung');
    const opt = [...select.options].find(o => o.textContent.trim() === name);
    if (opt) select.value = opt.value;
  });
});

// Formulare (Demo: kein Versand, nur Bestätigung + Tracking-Ereignis)
document.querySelectorAll('form[data-demo]').forEach(form => {
  form.addEventListener('submit', e => {
    e.preventDefault();
    track('lead_form_submit', { form: form.dataset.formName });
    form.closest('[data-form-wrap]').classList.add('sent');
    form.reset();
  });
});

document.getElementById('year').textContent = new Date().getFullYear();

// ---- Zusätzliche Animationen (aus, wenn der Besucher reduzierte Bewegung eingestellt hat)
if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const esc = t => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');

  // Überschriften wortweise einblenden
  document.querySelectorAll('.hero h1, main h2, .callback h2').forEach(h => {
    if (h.closest('.hero-form')) return;
    const text = h.textContent.trim();
    h.setAttribute('aria-label', text);
    h.innerHTML = text.split(/\s+/)
      .map((w, i) => `<span class="w" aria-hidden="true"><span style="--i:${i}">${esc(w)}</span></span>`).join(' ');
    h.classList.add('split');
    io.observe(h);
  });

  // Zweispaltige Bereiche von links und rechts
  document.querySelectorAll('.clients, .about, .contact').forEach(grid => {
    grid.children[0].classList.add('from-left');
    grid.children[1].classList.add('from-right');
  });

  // Gruppen nacheinander einblenden
  const stagger = (selector, step = 70, extra = '') => document.querySelectorAll(selector).forEach(group => {
    [...group.children].forEach((child, i) => {
      child.classList.add('reveal');
      if (extra) child.classList.add(extra);
      child.style.setProperty('--d', `${(i * step) / 1000}s`);
      io.observe(child);
    });
  });
  stagger('.logo-grid');
  stagger('.checks');
  stagger('.hero-checks', 110);
  stagger('.acc');
  stagger('.contact-cards');
  stagger('.areas', 50);
  stagger('.rating-stats', 90);
  stagger('.plan ul', 60);
  stagger('.office ul', 80);
  stagger('.stats-grid', 120, 'pop');

  // Zahlen hochzählen
  const counters = new IntersectionObserver(entries => entries.forEach(en => {
    if (!en.isIntersecting) return;
    counters.unobserve(en.target);
    const el = en.target;
    const m = el.textContent.trim().match(/^(\d+)(?:,(\d+))?(.*)$/);
    if (!m) return;
    const decimals = m[2] ? m[2].length : 0;
    const target = parseFloat(m[1] + (m[2] ? '.' + m[2] : ''));
    const start = performance.now();
    const tick = now => {
      const p = Math.min((now - start) / 1600, 1);
      const value = target * (1 - Math.pow(1 - p, 3));
      el.textContent = value.toFixed(decimals).replace('.', ',') + m[3];
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }), { threshold: 0.6 });
  document.querySelectorAll('.stat b, .rating-stats b, .location-foot b').forEach(el => counters.observe(el));

  // Parallax + Scroll-Fortschritt
  const progress = document.body.appendChild(Object.assign(document.createElement('div'), { className: 'progress' }));
  const heroBg = document.querySelector('.hero-bg');
  const layers = [[document.querySelector('.location-banner img'), 0.12, 60], [document.querySelector('.stats-card > img'), 0.08, 45]];
  let queued = false;
  const onScroll = () => {
    queued = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.scale = `${max > 0 ? scrollY / max : 0} 1`;
    heroBg.style.translate = `0 ${Math.min(scrollY * 0.2, heroBg.parentElement.offsetHeight * 0.12)}px`;
    layers.forEach(([el, speed, limit]) => {
      const r = el.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      const delta = (r.top + r.height / 2 - innerHeight / 2) * -speed;
      el.style.translate = `0 ${Math.max(-limit, Math.min(limit, delta))}px`;
    });
  };
  addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();
}
