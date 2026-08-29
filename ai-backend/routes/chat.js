const express = require('express');
const router = express.Router();
const { buildContext } = require('../lib/rag');
const { buildSystemPrompt } = require('../lib/prompt');
const { streamChat } = require('../lib/llm');
const logger = require('../lib/logger');

router.post('/chat', async (req, res) => {
  const { messages, conversationId } = req.body || {};

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required' });
  }
  if (messages.length > 40) {
    return res.status(400).json({ error: 'conversation too long for this endpoint' });
  }
  const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
  if (!lastUserMessage || typeof lastUserMessage.content !== 'string' || lastUserMessage.content.length > 4000) {
    return res.status(400).json({ error: 'invalid last user message' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const send = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const { context, docs } = buildContext(lastUserMessage.content, 5);
    const systemPrompt = buildSystemPrompt(context);

    const cleanMessages = messages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({ role: m.role, content: String(m.content).slice(0, 4000) }));

    logger.info('chat_request', { conversationId, messageCount: cleanMessages.length, matchedSources: docs.map(d => d.id) });

    const fullText = await streamChat({
      systemPrompt,
      messages: cleanMessages,
      onToken: (chunk) => send('token', { text: chunk })
    });

    send('done', { sources: docs.map(d => ({ id: d.id, title: d.title, type: d.type })), fullText });
    res.end();
  } catch (err) {
    logger.error('chat_error', { error: err.message });
    send('error', { message: 'The AI consultant hit a snag. Please try again, or reach us directly at hello@unitytech.io.' });
    res.end();
  }
});

module.exports = router;
