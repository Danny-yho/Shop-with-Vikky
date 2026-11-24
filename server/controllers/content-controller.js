const db = require('../db');

async function submitContact(req, res) {
  const contact = await db.one(
    'INSERT INTO contacts (name, email, subject, message) VALUES ($1, $2, $3, $4) RETURNING id',
    [req.body.name, req.body.email, req.body.subject, req.body.message]
  );
  res.status(201).json({ message: 'Your message has been received', id: contact.id });
}

async function subscribe(req, res) {
  await db.query('INSERT INTO newsletter_subscribers (email) VALUES ($1) ON CONFLICT (email) DO NOTHING', [req.body.email]);
  res.status(201).json({ message: 'Thanks for subscribing' });
}

module.exports = { submitContact, subscribe };
