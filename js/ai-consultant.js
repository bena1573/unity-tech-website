/**
 * Unity Tech AI Business Consultant — frontend widget controller.
 *
 * Talks to a real backend (ai-backend/) that streams responses from an
 * LLM grounded via RAG in Unity Tech's actual content. If that backend
 * isn't reachable (not deployed yet, network error, etc), this widget
 * automatically falls back to a small rule-based responder so the site
 * never shows a broken feature — the fallback is clearly labeled as such.
 *
 * Architecture: plain JS, but organized as small single-purpose functions
 * ("components") rather than one giant blob, so it's easy to port to
 * React later if you introduce a build step — see README for notes.
 */

// ======================================================================
// CONFIG — point this at your deployed backend (see ai-backend/README.md)
// ======================================================================
const AI_BACKEND_URL = 'http://localhost:8787/api';
const AI_BACKEND_TIMEOUT_MS = 6000; // how long to wait before falling back

(function () {
  const panel = document.getElementById('aiPanel');
  const toggleBtn = document.getElementById('aiToggle');
  if (!panel || !toggleBtn) return;

  const body = document.getElementById('aiBody');
  const typingEl = document.getElementById('aiTyping');
  const form = document.getElementById('aiForm');
  const input = document.getElementById('aiInput');
  const closeBtn = document.getElementById('aiClose');
  const expandBtn = document.getElementById('aiExpand');
  const clearBtn = document.getElementById('aiClear');
  const voiceOutBtn = document.getElementById('aiVoiceOut');
  const micBtn = document.getElementById('aiMicBtn');
  const attachBtn = document.getElementById('aiAttachBtn');
  const fileInput = document.getElementById('aiFileInput');
  const attachmentsBar = document.getElementById('aiAttachments');
  const quickBar = document.getElementById('aiQuick');
  const statusEl = document.getElementById('aiStatus');

  // ---------------------------------------------------------------
  // State
  // ---------------------------------------------------------------
  const STORAGE_KEY = 'unityTechAIChat_v1';
  let history = loadHistory();          // [{role, content}]
  let pendingFiles = [];                // [{name, type, size, textContent?, dataUrl?}]
  let voiceOutEnabled = false;
  let backendAvailable = null;          // null = unknown, true/false once checked
  let conversationId = getConversationId();
  let recognizer = null;                // SpeechRecognition instance
  let isStreaming = false;

  function loadHistory() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (_) { return []; }
  }
  function saveHistory() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(-30))); } catch (_) {}
  }
  function getConversationId() {
    let id = sessionStorage.getItem('unityTechAIConvId');
    if (!id) {
      id = 'conv_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem('unityTechAIConvId', id);
    }
    return id;
  }

  // ---------------------------------------------------------------
  // Markdown + syntax highlighting rendering (with safe fallbacks if
  // marked.js / Prism haven't finished loading yet from the CDN)
  // ---------------------------------------------------------------
  function renderMarkdown(text) {
    let html;
    if (window.marked) {
      try {
        html = window.marked.parse(text, { breaks: true });
      } catch (_) { /* fall through to plain text */ }
    }
    if (html === undefined) {
      const escaped = text.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
      html = escaped.replace(/\n/g, '<br>');
    }
    // Sanitize before it ever touches innerHTML — the LLM's output isn't
    // fully trusted content (prompt injection from tool results, etc),
    // so this is defense in depth even though our own backend is careful.
    if (window.DOMPurify) {
      try { return window.DOMPurify.sanitize(html); } catch (_) { /* fall through */ }
    }
    return html;
  }

  function highlightCodeBlocks(container) {
    if (window.Prism) {
      container.querySelectorAll('pre code').forEach(block => {
        try { window.Prism.highlightElement(block); } catch (_) {}
      });
    }
  }

  // ---------------------------------------------------------------
  // Message rendering
  // ---------------------------------------------------------------
  function scrollToBottom() {
    body.scrollTop = body.scrollHeight;
  }

  function addMessageEl(role, initialText, opts = {}) {
    const wrap = document.createElement('div');
    wrap.className = 'ai-msg ' + (role === 'user' ? 'user' : 'bot') + (opts.offline ? ' offline' : '');
    const content = document.createElement('div');
    content.className = 'ai-msg-content';
    if (role === 'user') {
      content.textContent = initialText;
    } else {
      content.innerHTML = renderMarkdown(initialText || '');
    }
    wrap.appendChild(content);

    if (opts.badge) {
      const badge = document.createElement('div');
      badge.className = 'ai-msg-badge';
      badge.textContent = opts.badge;
      wrap.appendChild(badge);
    }

    body.appendChild(wrap);
    scrollToBottom();
    return content; // return the content element so callers can stream into it
  }

  function renderLinkChip(href, label) {
    const a = document.createElement('a');
    a.href = href;
    a.className = 'ai-link-chip';
    a.textContent = label + ' →';
    body.appendChild(a);
    scrollToBottom();
  }

  function setTyping(on) {
    typingEl.classList.toggle('show', !!on);
    if (on) scrollToBottom();
  }

  // ---------------------------------------------------------------
  // Voice output (speech synthesis)
  // ---------------------------------------------------------------
  function speak(text) {
    if (!voiceOutEnabled || !('speechSynthesis' in window)) return;
    try {
      const plain = text.replace(/[#*`_>[\]()]/g, '').replace(/\n+/g, '. ');
      const utter = new SpeechSynthesisUtterance(plain.slice(0, 600));
      utter.rate = 1.02;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utter);
    } catch (_) {}
  }

  // ---------------------------------------------------------------
  // Voice input (Web Speech API) — feature detected, hidden if unsupported
  // ---------------------------------------------------------------
  function setupVoiceInput() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      micBtn.style.display = 'none';
      return;
    }
    recognizer = new SpeechRecognition();
    recognizer.continuous = false;
    recognizer.interimResults = true;
    recognizer.lang = 'en-US';

    recognizer.addEventListener('start', () => micBtn.classList.add('listening'));
    recognizer.addEventListener('end', () => micBtn.classList.remove('listening'));
    recognizer.addEventListener('result', (e) => {
      let transcript = '';
      for (let i = 0; i < e.results.length; i++) transcript += e.results[i][0].transcript;
      input.value = transcript;
    });
    recognizer.addEventListener('error', () => micBtn.classList.remove('listening'));

    micBtn.addEventListener('click', () => {
      if (micBtn.classList.contains('listening')) {
        recognizer.stop();
      } else {
        try { recognizer.start(); } catch (_) {}
      }
    });
  }

  // ---------------------------------------------------------------
  // File / image upload
  // ---------------------------------------------------------------
  function renderAttachmentsBar() {
    attachmentsBar.innerHTML = '';
    pendingFiles.forEach((f, idx) => {
      const chip = document.createElement('div');
      chip.className = 'ai-file-chip';
      chip.innerHTML = `<span>${f.type.startsWith('image/') ? '🖼️' : '📄'} ${f.name}</span>`;
      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.textContent = '×';
      removeBtn.addEventListener('click', () => { pendingFiles.splice(idx, 1); renderAttachmentsBar(); });
      chip.appendChild(removeBtn);
      attachmentsBar.appendChild(chip);
    });
  }

  attachBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', async () => {
    const files = Array.from(fileInput.files || []).slice(0, 3);
    for (const file of files) {
      const entry = { name: file.name, type: file.type || 'application/octet-stream', size: file.size };
      if (file.type.startsWith('image/')) {
        entry.dataUrl = await readAsDataURL(file);
      } else if (file.size < 200000) {
        entry.textContent = await readAsText(file);
      }
      pendingFiles.push(entry);
    }
    fileInput.value = '';
    renderAttachmentsBar();
  });
  function readAsDataURL(file) {
    return new Promise(resolve => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = () => resolve(null);
      r.readAsDataURL(file);
    });
  }
  function readAsText(file) {
    return new Promise(resolve => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = () => resolve(null);
      r.readAsText(file);
    });
  }

  // ---------------------------------------------------------------
  // Rule-based offline fallback (used only if the real backend is
  // unreachable — e.g. not deployed yet). Clearly labeled in the UI.
  // ---------------------------------------------------------------
  const OFFLINE_REPLIES = [
    { keys: ['service', 'offer', 'what do you'], text: "We build websites, mobile apps, AI solutions, cloud systems, video editing, and brand identity. Want me to open our Services page?", link: ['services.html', 'See services'] },
    { keys: ['price', 'pricing', 'cost', 'how much', 'quote'], text: "Pricing depends on scope — our Web Development plans start at **Birr 9,999/month**. You can also build a custom quote instantly on our Pricing page.", link: ['pricing.html', 'Build a quote'] },
    { keys: ['time', 'timeline', 'long', 'deliver'], text: "Most web projects ship in 4–8 weeks; mobile and AI projects usually run 8–14 weeks depending on scope." },
    { keys: ['portfolio', 'project', 'example', 'work'], text: "We've shipped e-commerce rebuilds, AI copilots, fitness apps, and more. Take a look at our Work page for full case studies.", link: ['projects.html', 'View our work'] },
    { keys: ['recommend', 'which', 'suggest'], text: "Tell me a bit about what you're building — website, app, or something else — and I can point you to the right service.", link: ['contact.html', 'Book a consultation'] },
    { keys: ['book', 'call', 'consult', 'meeting', 'human', 'talk to'], text: "You can book a free 30-minute consultation, or reach the team directly at **hello@unitytech.io**.", link: ['contact.html', 'Go to Contact'] },
    { keys: ['faq', 'question'], text: "Check the FAQ section on our Contact page for quick answers to common questions.", link: ['contact.html#faq', 'View FAQ'] },
    { keys: ['contact', 'email', 'phone', 'reach'], text: "You can reach us at hello@unitytech.io or through the contact form — we reply within one business day.", link: ['contact.html', 'Contact us'] }
  ];

  function offlineRespond(msg) {
    const lower = msg.toLowerCase();
    const match = OFFLINE_REPLIES.find(r => r.keys.some(k => lower.includes(k)));
    return match || { text: "I'm running in offline mode right now and don't have a great answer for that. Want me to open the contact form so our team can help directly?", link: ['contact.html', 'Contact us'] };
  }

  async function checkBackendHealth() {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 2500);
      const res = await fetch(AI_BACKEND_URL + '/health', { signal: ctrl.signal });
      clearTimeout(t);
      backendAvailable = res.ok;
    } catch (_) {
      backendAvailable = false;
    }
    updateStatusLabel();
  }

  function updateStatusLabel(mode) {
    if (mode === 'rate-limited') {
      statusEl.textContent = 'Sending too fast — one moment...';
      statusEl.classList.add('offline');
    } else if (backendAvailable === false) {
      statusEl.textContent = 'Offline mode (demo answers)';
      statusEl.classList.add('offline');
    } else {
      statusEl.textContent = 'Grounded in our real services & pricing';
      statusEl.classList.remove('offline');
    }
  }

  // ---------------------------------------------------------------
  // Sending a message: try the real streaming backend first, fall
  // back to the offline responder if it's unavailable.
  // ---------------------------------------------------------------
  async function sendMessage(text) {
    if (!text.trim() || isStreaming) return;
    addMessageEl('user', text);
    history.push({ role: 'user', content: text });
    saveHistory();
    input.value = '';
    const filesForThisTurn = pendingFiles;
    pendingFiles = [];
    renderAttachmentsBar();

    if (backendAvailable === null) await checkBackendHealth();

    if (backendAvailable) {
      await streamFromBackend(text, filesForThisTurn);
    } else {
      setTyping(true);
      setTimeout(() => {
        setTyping(false);
        const { text: replyText, link } = offlineRespond(text);
        const el = addMessageEl('bot', replyText, { badge: 'Offline mode' });
        highlightCodeBlocks(el.parentElement);
        if (link) renderLinkChip(link[0], link[1]);
        history.push({ role: 'assistant', content: replyText });
        saveHistory();
        speak(replyText);
      }, 500);
    }
  }

  async function streamFromBackend(text, files) {
    isStreaming = true;
    setTyping(true);
    let contentEl = null;
    let fullText = '';

    // Note: file contents are attached as extra context in the message text
    // itself for now (simple + works with any provider). See ai-backend
    // README for how to wire true multimodal/file understanding server-side.
    let messageForModel = text;
    if (files && files.length) {
      const fileNotes = files.map(f => f.textContent
        ? `\n\n[Attached file: ${f.name}]\n${f.textContent.slice(0, 3000)}`
        : `\n\n[Attached image: ${f.name} — describe what you can infer from context; vision analysis requires a vision-capable model on the backend]`
      ).join('');
      messageForModel = text + fileNotes;
    }

    const payloadMessages = [...history.slice(0, -1), { role: 'user', content: messageForModel }];

    try {
      const ctrl = new AbortController();
      const timeout = setTimeout(() => ctrl.abort(), 30000);
      const res = await fetch(AI_BACKEND_URL + '/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: payloadMessages, conversationId }),
        signal: ctrl.signal
      });
      clearTimeout(timeout);

      if (res.status === 429) {
        setTyping(false);
        updateStatusLabel('rate-limited');
        let msg = "You're sending messages a little fast — give it about a minute and try again.";
        try { const body = await res.json(); if (body && body.error) msg = body.error; } catch (_) {}
        addMessageEl('bot', msg, { badge: 'Rate limited' });
        setTimeout(() => updateStatusLabel(), 4000);
        return;
      }

      if (!res.ok || !res.body) throw new Error('Backend responded with ' + res.status);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split('\n\n');
        buffer = chunks.pop();
        for (const chunk of chunks) {
          const lines = chunk.split('\n');
          const eventLine = lines.find(l => l.startsWith('event: '));
          const dataLine = lines.find(l => l.startsWith('data: '));
          if (!eventLine || !dataLine) continue;
          const eventName = eventLine.slice(7).trim();
          let data;
          try { data = JSON.parse(dataLine.slice(6)); } catch (_) { continue; }

          if (eventName === 'token') {
            if (!contentEl) {
              setTyping(false);
              contentEl = addMessageEl('bot', '');
            }
            fullText += data.text;
            contentEl.innerHTML = renderMarkdown(fullText);
            highlightCodeBlocks(contentEl.parentElement);
            scrollToBottom();
          } else if (eventName === 'error') {
            setTyping(false);
            if (!contentEl) contentEl = addMessageEl('bot', '');
            contentEl.innerHTML = renderMarkdown(data.message || 'Something went wrong.');
          }
        }
      }

      if (fullText) {
        history.push({ role: 'assistant', content: fullText });
        saveHistory();
        speak(fullText);
      }
    } catch (err) {
      setTyping(false);
      backendAvailable = false;
      updateStatusLabel();
      const { text: replyText, link } = offlineRespond(text);
      const el = addMessageEl('bot', replyText, { badge: 'Offline mode' });
      if (link) renderLinkChip(link[0], link[1]);
      history.push({ role: 'assistant', content: replyText });
      saveHistory();
    } finally {
      isStreaming = false;
      setTyping(false);
    }
  }

  // ---------------------------------------------------------------
  // Panel open/close/expand/clear
  // ---------------------------------------------------------------
  function openPanel() {
    panel.classList.add('open');
    panel.setAttribute('aria-hidden', 'false');
    if (history.length === 0) {
      const greeting = "Hi! I'm the Unity Tech AI Consultant. Tell me what you're trying to build — a website, app, or something else — and I'll help you scope it, ballpark pricing, and point you to the right service.";
      addMessageEl('bot', greeting);
      history.push({ role: 'assistant', content: greeting });
      saveHistory();
    } else {
      // Replay saved history into the DOM
      body.innerHTML = '';
      history.forEach(m => {
        const el = addMessageEl(m.role === 'user' ? 'user' : 'bot', m.content);
        if (m.role !== 'user') highlightCodeBlocks(el.parentElement);
      });
    }
    if (backendAvailable === null) checkBackendHealth();
    setTimeout(() => input.focus(), 300);
  }

  function closePanel() {
    panel.classList.remove('open', 'fullscreen');
    panel.setAttribute('aria-hidden', 'true');
    expandBtn.innerHTML = '&#10530;';
    toggleBtn.focus();
  }

  toggleBtn.addEventListener('click', openPanel);
  closeBtn.addEventListener('click', closePanel);
  panel.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePanel();
  });
  expandBtn.addEventListener('click', () => {
    panel.classList.toggle('fullscreen');
    expandBtn.innerHTML = panel.classList.contains('fullscreen') ? '&#10531;' : '&#10530;';
  });
  clearBtn.addEventListener('click', () => {
    history = [];
    saveHistory();
    sessionStorage.removeItem('unityTechAIConvId');
    conversationId = getConversationId();
    body.innerHTML = '';
    const greeting = "New conversation started. What would you like to know about Unity Tech?";
    addMessageEl('bot', greeting);
    history.push({ role: 'assistant', content: greeting });
    saveHistory();
  });
  voiceOutBtn.addEventListener('click', () => {
    voiceOutEnabled = !voiceOutEnabled;
    voiceOutBtn.classList.toggle('active', voiceOutEnabled);
    if (!voiceOutEnabled && 'speechSynthesis' in window) window.speechSynthesis.cancel();
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    sendMessage(input.value);
  });
  if (quickBar) {
    quickBar.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => sendMessage(btn.dataset.q || btn.textContent));
    });
  }

  setupVoiceInput();
  updateStatusLabel();
})();
