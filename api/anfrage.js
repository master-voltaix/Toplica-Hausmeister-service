// Serverless-Funktion (Vercel): nimmt Formularanfragen entgegen und verschickt sie per Resend.
// Benötigte Umgebungsvariable: RESEND_API_KEY
// Optional: MAIL_TO (Empfänger), MAIL_FROM (Absender auf einer bei Resend verifizierten Domain)

const MAIL_TO = process.env.MAIL_TO || 'info@toplicabau.de';
const MAIL_FROM = process.env.MAIL_FROM || 'Toplica Management Website <anfragen@quick-bill.de>';

const FELDER = [
  ['name', 'Name', 120],
  ['telefon', 'Telefon', 40],
  ['email', 'E-Mail', 160],
  ['ort', 'PLZ / Ort', 120],
  ['leistung', 'Leistung', 80],
  ['nachricht', 'Nachricht', 4000],
];
const FORMULARE = { hero: 'Angebotsformular oben', kontakt: 'Kontaktformular', rueckruf: 'Rückruf-Bitte' };

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sauber = (wert, max) => String(wert ?? '').replace(/\r/g, '').trim().slice(0, max);

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Nur POST erlaubt.' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = null; }
  }
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ ok: false, error: 'Ungültige Anfrage.' });
  }

  // Honeypot: Bots füllen das unsichtbare Feld aus – still annehmen, nichts senden.
  if (sauber(body.website, 200)) return res.status(200).json({ ok: true });

  const daten = {};
  for (const [key, , max] of FELDER) daten[key] = sauber(body[key] ?? (key === 'telefon' ? body.rueckruf : ''), max);
  const formular = FORMULARE[sauber(body.formular, 20)] || 'Formular';

  if (!daten.telefon && !daten.email) {
    return res.status(400).json({ ok: false, error: 'Bitte Telefonnummer oder E-Mail angeben.' });
  }
  if (daten.telefon && !/^[0-9+()\/\s.-]{5,40}$/.test(daten.telefon)) {
    return res.status(400).json({ ok: false, error: 'Bitte eine gültige Telefonnummer angeben.' });
  }
  const mailOk = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(daten.email);
  if (daten.email && !mailOk) {
    return res.status(400).json({ ok: false, error: 'Bitte eine gültige E-Mail-Adresse angeben.' });
  }

  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY fehlt');
    return res.status(500).json({ ok: false, error: 'Versand ist nicht eingerichtet.' });
  }

  const zeilen = FELDER.filter(([key]) => daten[key]).map(([key, label]) => [label, daten[key]]);
  const betreff = `Neue Anfrage: ${daten.leistung || formular}${daten.name ? ' – ' + daten.name : ''}`.replace(/\n/g, ' ');
  const text = `${formular} auf der Website\n\n` + zeilen.map(([l, w]) => `${l}: ${w}`).join('\n');
  const html = `<h2 style="font-family:sans-serif;color:#143c03">Neue Anfrage über die Website</h2>
<p style="font-family:sans-serif;color:#515c47">${esc(formular)}</p>
<table style="font-family:sans-serif;border-collapse:collapse">${zeilen.map(([l, w]) =>
    `<tr><td style="padding:6px 16px 6px 0;color:#515c47;vertical-align:top">${esc(l)}</td><td style="padding:6px 0;color:#10200a"><b>${esc(w).replace(/\n/g, '<br>')}</b></td></tr>`).join('')}</table>`;

  try {
    const antwort = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: MAIL_FROM, to: [MAIL_TO], subject: betreff, text, html, ...(mailOk ? { reply_to: daten.email } : {}) }),
    });
    if (!antwort.ok) {
      console.error('Resend-Fehler', antwort.status, await antwort.text());
      return res.status(502).json({ ok: false, error: 'E-Mail konnte nicht gesendet werden.' });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Resend nicht erreichbar', err);
    return res.status(502).json({ ok: false, error: 'E-Mail konnte nicht gesendet werden.' });
  }
};
