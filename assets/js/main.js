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
