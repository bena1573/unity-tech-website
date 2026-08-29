/**
 * Provider-agnostic LLM client.
 * Set LLM_PROVIDER=anthropic (default) or LLM_PROVIDER=openai in .env
 * Set the matching API key: ANTHROPIC_API_KEY or OPENAI_API_KEY
 * Both providers support streaming; onToken(chunk) is called as text arrives.
 */

const PROVIDER = process.env.LLM_PROVIDER || 'anthropic';

async function streamAnthropic({ systemPrompt, messages, onToken }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('Missing ANTHROPIC_API_KEY in environment');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: process.env.LLM_MODEL || 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages,
      stream: true
    })
  });

  if (!res.ok || !res.body) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Anthropic API error ${res.status}: ${errText}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop();
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const payload = line.slice(6).trim();
      if (!payload || payload === '[DONE]') continue;
      try {
        const evt = JSON.parse(payload);
        if (evt.type === 'content_block_delta' && evt.delta && evt.delta.text) {
          fullText += evt.delta.text;
          onToken(evt.delta.text);
        }
      } catch (_) {}
    }
  }
  return fullText;
}

async function streamOpenAI({ systemPrompt, messages, onToken }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('Missing OPENAI_API_KEY in environment');

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: process.env.LLM_MODEL || 'gpt-4o-mini',
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      stream: true
    })
  });

  if (!res.ok || !res.body) {
    const errText = await res.text().catch(() => '');
    throw new Error(`OpenAI API error ${res.status}: ${errText}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop();
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const payload = line.slice(6).trim();
      if (!payload || payload === '[DONE]') continue;
      try {
        const evt = JSON.parse(payload);
        const delta = evt.choices?.[0]?.delta?.content;
        if (delta) { fullText += delta; onToken(delta); }
      } catch (_) {}
    }
  }
  return fullText;
}

async function streamChat({ systemPrompt, messages, onToken }) {
  if (PROVIDER === 'openai') return streamOpenAI({ systemPrompt, messages, onToken });
  return streamAnthropic({ systemPrompt, messages, onToken });
}

module.exports = { streamChat, PROVIDER };
