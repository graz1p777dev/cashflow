// Страница «Правила игры»: активный пункт оглавления при скролле + ИИ-чат по правилам.
(function () {
  'use strict';

  // ---- Оглавление: подсветка раздела, который сейчас читают ----
  const tocList = document.getElementById('toc-list');
  const sections = document.querySelectorAll('.rules-content section[id]');
  if (tocList && sections.length) {
    const tocLinks = new Map();
    tocList.querySelectorAll('li').forEach((li) => {
      const a = li.querySelector('a');
      if (a) tocLinks.set(a.getAttribute('href').slice(1), li);
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const li = tocLinks.get(entry.target.id);
          if (!li) return;
          if (entry.isIntersecting) {
            tocList.querySelectorAll('li.active').forEach((el) => el.classList.remove('active'));
            li.classList.add('active');
          }
        });
      },
      { rootMargin: '-15% 0px -70% 0px', threshold: 0 }
    );
    sections.forEach((s) => observer.observe(s));
  }

  // ---- ИИ-чат ----
  const fab = document.getElementById('chat-fab');
  const panel = document.getElementById('chat-panel');
  const closeBtn = document.getElementById('chat-close');
  const messagesEl = document.getElementById('chat-messages');
  const suggestionsEl = document.getElementById('chat-suggestions');
  const form = document.getElementById('chat-form');
  const input = document.getElementById('chat-input');
  if (!fab || !panel || !form) return;

  let history = [];
  let busy = false;

  function openChat() {
    panel.hidden = false;
    fab.setAttribute('aria-expanded', 'true');
    fab.hidden = true;
    input.focus();
  }
  function closeChat() {
    panel.hidden = true;
    fab.setAttribute('aria-expanded', 'false');
    fab.hidden = false;
  }
  fab.addEventListener('click', openChat);
  closeBtn.addEventListener('click', closeChat);

  // Простая разметка: **жирный** и переносы строк — без полноценного markdown-парсера,
  // ответы модели короткие, большего не нужно.
  function renderText(text) {
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const bold = escaped.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
    return bold.replace(/\n/g, '<br>');
  }

  function addMessage(role, text) {
    const div = document.createElement('div');
    div.className = 'chat-msg ' + (role === 'user' ? 'chat-msg-user' : role === 'error' ? 'chat-msg-error' : 'chat-msg-bot');
    div.innerHTML = renderText(text);
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return div;
  }

  function showTyping() {
    const div = document.createElement('div');
    div.className = 'chat-typing';
    div.id = 'chat-typing';
    div.innerHTML = '<span></span><span></span><span></span>';
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }
  function hideTyping() {
    document.getElementById('chat-typing')?.remove();
  }

  async function ask(message) {
    if (busy || !message.trim()) return;
    busy = true;
    input.disabled = true;
    form.querySelector('button').disabled = true;
    suggestionsEl.style.display = 'none';

    addMessage('user', message);
    showTyping();

    try {
      const res = await fetch('/api/ask-rules', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message, history }),
      });
      const data = await res.json().catch(() => ({}));
      hideTyping();

      if (!res.ok || !data.reply) {
        const map = {
          not_configured: 'Чат временно недоступен — обратитесь к организаторам.',
          message_too_long: 'Слишком длинный вопрос — сформулируй короче.',
          timeout: 'Не дождались ответа, попробуй ещё раз.',
        };
        addMessage('error', map[data.error] || 'Не получилось ответить. Попробуй ещё раз через минуту.');
        return;
      }

      addMessage('bot', data.reply);
      history.push({ role: 'user', content: message });
      history.push({ role: 'assistant', content: data.reply });
      if (history.length > 16) history = history.slice(-16);
    } catch {
      hideTyping();
      addMessage('error', 'Нет связи с сервером. Проверь интернет и попробуй снова.');
    } finally {
      busy = false;
      input.disabled = false;
      form.querySelector('button').disabled = false;
      input.focus();
    }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = input.value;
    input.value = '';
    ask(message);
  });

  suggestionsEl?.querySelectorAll('button').forEach((btn) => {
    btn.addEventListener('click', () => ask(btn.textContent));
  });
})();
