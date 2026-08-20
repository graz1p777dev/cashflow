const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));

// Карточки в сетке появляются по очереди, а не все разом — так группа читается
// как единая волна, а не мигает одновременно.
const staggerGroups = document.querySelectorAll('.skill-grid, .timeline, .review-grid, .game-list, .faq-list');
staggerGroups.forEach((group) => {
  [...group.children].forEach((child, index) => {
    if (child.classList.contains('reveal')) {
      child.style.transitionDelay = `${Math.min(index * 90, 360)}ms`;
    }
  });
});

// Числа на money-card считаются от нуля один раз, когда карточка появляется в кадре.
const countTargets = document.querySelectorAll('.money-card b');
const countObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    countObserver.unobserve(el);
    const match = el.textContent.match(/([+↑\s]*)([\d\s]+)/);
    if (!match) return;
    const prefix = match[1];
    const target = parseInt(match[2].replace(/\s/g, ''), 10);
    if (!target) return;
    const duration = 1100;
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      const value = Math.round(target * eased);
      el.textContent = `${prefix}${value.toLocaleString('ru-RU')}`;
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}, { threshold: 0.4 });
countTargets.forEach((el) => {
  if (/\d/.test(el.textContent)) countObserver.observe(el);
});

// Лёгкий параллакс декоративного круга на hero под курсором — только на десктопе
// и только если пользователь не просил уменьшить анимации.
const heroVisual = document.querySelector('.hero-visual');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (heroVisual && window.matchMedia('(hover: hover) and (min-width: 1001px)').matches && !prefersReducedMotion) {
  const hero = document.querySelector('.hero');
  hero.addEventListener('mousemove', (event) => {
    const rect = hero.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    heroVisual.style.transform = `translate(${x * 18}px, ${y * 18}px)`;
  });
  hero.addEventListener('mouseleave', () => {
    heroVisual.style.transform = 'translate(0, 0)';
  });
}

const tabContent = {
  beginners: ['01 / 04', 'Можно без подготовки', 'Если только начинаешь разбираться в финансах, игра даст понятную картину без сложных терминов.'],
  business: ['02 / 04', 'Проверь привычные решения', 'Посмотри на свои стратегии в условиях ограниченного капитала и быстро меняющихся обстоятельств.'],
  employees: ['03 / 04', 'Зарплата — не вся система', 'Пойми, почему одного высокого дохода может быть недостаточно и как активы меняют финансовый сценарий.'],
  couples: ['04 / 04', 'Увидьте разницу без спора', 'Сравните, как вы принимаете денежные решения, и обсудите это на нейтральном игровом поле.']
};

const tabPanel = document.querySelector('#tab-panel');
document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((item) => {
      item.classList.remove('active');
      item.setAttribute('aria-selected', 'false');
    });
    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');
    const [count, title, copy] = tabContent[tab.dataset.tab];
    tabPanel.innerHTML = `<span>${count}</span><h3>${title}</h3><p>${copy}</p>`;
  });
});

// Модалка брони есть только на главной — на странице правил её нет.
const modal = document.querySelector('#booking-modal');
if (modal) {
  const chosenGame = document.querySelector('#chosen-game');
  const bookingForm = document.querySelector('#booking-form');
  const successMessage = document.querySelector('.success-message');

  document.querySelectorAll('.book-button').forEach((button) => {
    button.addEventListener('click', () => {
      chosenGame.textContent = button.closest('.game-card').dataset.game;
      bookingForm.hidden = false;
      successMessage.hidden = true;
      modal.showModal();
    });
  });

  document.querySelector('.modal-close').addEventListener('click', () => modal.close());
  modal.addEventListener('click', (event) => {
    if (event.target === modal) modal.close();
  });

  bookingForm.addEventListener('submit', (event) => {
    event.preventDefault();
    bookingForm.hidden = true;
    successMessage.hidden = false;
  });
}

const header = document.querySelector('.header');
const menuButton = document.querySelector('.menu-button');
menuButton.addEventListener('click', () => {
  const isOpen = header.classList.toggle('menu-open');
  menuButton.setAttribute('aria-expanded', String(isOpen));
  menuButton.setAttribute('aria-label', isOpen ? 'Закрыть меню' : 'Открыть меню');
});

document.querySelectorAll('.nav a').forEach((link) => {
  link.addEventListener('click', () => {
    header.classList.remove('menu-open');
    menuButton.setAttribute('aria-expanded', 'false');
  });
});

document.querySelectorAll('.faq-list details').forEach((details) => {
  details.addEventListener('toggle', () => {
    if (!details.open) return;
    document.querySelectorAll('.faq-list details').forEach((other) => {
      if (other !== details) other.open = false;
    });
  });
});
