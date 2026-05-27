// ── Clean Cleanom live chat widget ────────────────────────────────────────────
(function () {
  const MAX_MESSAGES = 12; // per session
  let chatOpen = false;
  let history = []; // { role, content }
  let msgCount = 0;
  let sending = false;

  const panel  = document.getElementById('cc-panel');
  const btn    = document.getElementById('cc-btn');
  const badge  = document.getElementById('cc-badge');
  const hint   = document.getElementById('cc-hint');
  const msgs   = document.getElementById('cc-messages');
  const input  = document.getElementById('cc-input');
  const sendBtn = document.getElementById('cc-send');

  // ── Open / close ────────────────────────────────────────────────────────────
  function toggleChat() {
    chatOpen = !chatOpen;
    panel.classList.toggle('cc-open', chatOpen);
    btn.classList.toggle('cc-open', chatOpen);
    badge.classList.add('cc-hidden');
    hint.classList.add('cc-hidden');
    if (chatOpen) { scrollBottom(); input.focus(); }
  }

  document.getElementById('cc-btn-wrap').addEventListener('click', toggleChat);
  document.getElementById('cc-close').addEventListener('click', toggleChat);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  function scrollBottom() {
    setTimeout(() => { msgs.scrollTop = msgs.scrollHeight; }, 50);
  }

  function addBotMsg(text) {
    const row = document.createElement('div');
    row.className = 'cc-msg-bot';
    row.innerHTML = `<div class="cc-msg-bot-avatar">🌿</div><div class="cc-msg-bot-bubble">${escHtml(text).replace(/\n/g, '<br>')}</div>`;
    msgs.appendChild(row);
    scrollBottom();
  }

  function addUserMsg(text) {
    const row = document.createElement('div');
    row.className = 'cc-msg-user';
    row.innerHTML = `<div class="cc-msg-user-bubble">${escHtml(text)}</div>`;
    msgs.appendChild(row);
    scrollBottom();
  }

  function showTyping() {
    const row = document.createElement('div');
    row.className = 'cc-typing';
    row.id = 'cc-typing';
    row.innerHTML = `<div class="cc-typing-avatar">🌿</div><div class="cc-typing-bubble"><div class="cc-typing-dot"></div><div class="cc-typing-dot"></div><div class="cc-typing-dot"></div></div>`;
    msgs.appendChild(row);
    scrollBottom();
  }

  function removeTyping() {
    const t = document.getElementById('cc-typing');
    if (t) t.remove();
  }

  function showQuickReplies(items) {
    const row = document.createElement('div');
    row.className = 'cc-quick-replies';
    row.innerHTML = items.map(i =>
      `<button class="cc-qr-btn" data-text="${escAttr(i)}">${escHtml(i)}</button>`
    ).join('');
    row.querySelectorAll('.cc-qr-btn').forEach(b => {
      b.addEventListener('click', () => {
        row.querySelectorAll('.cc-qr-btn').forEach(x => x.disabled = true);
        sendUserMessage(b.dataset.text);
      });
    });
    msgs.appendChild(row);
    scrollBottom();
  }

  function showLimitNote() {
    const n = document.createElement('p');
    n.className = 'cc-limit-note';
    n.textContent = 'Чтобы продолжить, напишите нам напрямую: @clcleanrs в Telegram';
    msgs.appendChild(n);
    input.disabled = true;
    sendBtn.disabled = true;
    scrollBottom();
  }

  function escHtml(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
  function escAttr(s) {
    return String(s).replace(/"/g,'&quot;');
  }

  // ── Send message ─────────────────────────────────────────────────────────────
  async function sendUserMessage(text) {
    text = text.trim();
    if (!text || sending) return;

    msgCount++;
    addUserMsg(text);
    input.value = '';

    history.push({ role: 'user', content: text });
    sending = true;
    sendBtn.disabled = true;
    showTyping();

    try {
      const res = await fetch('/.netlify/functions/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      });

      removeTyping();

      if (!res.ok) throw new Error('API error');

      const data = await res.json();
      const reply = data.text || 'Извините, произошла ошибка. Напишите нам в Telegram @clcleanrs';

      history.push({ role: 'assistant', content: reply });
      addBotMsg(reply);

      if (msgCount >= MAX_MESSAGES) {
        showLimitNote();
      }
    } catch {
      removeTyping();
      addBotMsg('Произошла ошибка. Напишите нам напрямую в Telegram @clcleanrs');
    } finally {
      sending = false;
      if (msgCount < MAX_MESSAGES) sendBtn.disabled = false;
    }
  }

  sendBtn.addEventListener('click', () => sendUserMessage(input.value));
  input.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) sendUserMessage(input.value); });

  // ── Welcome message with quick replies ───────────────────────────────────────
  function initWelcome() {
    msgs.innerHTML = '<div class="cc-msg-time">Сегодня</div>';
    setTimeout(() => {
      addBotMsg(t('chat_welcome'));
      setTimeout(() => {
        showQuickReplies([t('chat_qr_order'), t('chat_qr_prices'), t('chat_qr_question')]);
      }, 200);
    }, 400);
  }

  initWelcome();

  // Re-init chat on language change if no user messages yet
  const _origSetLang = window.setLang;
  window.setLang = function(lang) {
    _origSetLang(lang);
    if (msgCount === 0) initWelcome();
  };

})();
