const express = require('express');
const router = express.Router();
const { saveLead } = require('../lib/leads');
const logger = require('../lib/logger');

router.post('/lead', (req, res) => {
  const body = req.body || {};
  if (!body.email && !body.phone) {
    return res.status(400).json({ error: 'At least an email or phone number is required to save a lead.' });
  }
  try {
    const record = saveLead(body);
    logger.info('lead_captured', { conversationId: body.conversationId, hasEmail: !!body.email });
    res.json({ ok: true, lead: record });
  } catch (err) {
    logger.error('lead_error', { error: err.message });
    res.status(500).json({ error: 'Could not save lead right now.' });
  }
});

module.exports = router;
