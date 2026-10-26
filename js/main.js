/* ==========================================================================
   BestGames — основной скрипт интерфейса (vanilla JavaScript)
   Задачи:
     - мобильное бургер-меню;
     - работа слайдера новинок (автопрокрутка, индикаторы, кнопки);
     - переключение темы (тёмная/светлая) с сохранением в localStorage;
     - отрисовка списка игр в профиле и админ-панели;
     - обработка формы добавления игры в админ-панели.
   Код 작성 с комментариями к каждой функции для удобства чтения.
   ========================================================================== */

/* ----- Данные игр (источник для каталога и админ-панели) ----- */
const GAMES = [
  { id: 1, title: "Cyber Nexus 2077", genre: "Экшен", developer: "Neon Studio", price: 2999, rating: 4.8, image: "img/games/game1.svg" },
  { id: 2, title: "Star Drift", genre: "Гонки", developer: "Orbit Games", price: 1799, rating: 4.5, image: "img/games/game2.svg" },
  { id: 3, title: "Realm of Magic", genre: "RPG", developer: "Arcane Labs", price: 2499, rating: 4.9, image: "img/games/game3.svg" },
  { id: 4, title: "Speed Rivals", genre: "Гонки", developer: "Turbo Wheels", price: 1999, rating: 4.3, image: "img/games/game4.svg" },
  { id: 5, title: "Shadow Assassin", genre: "Экшен", developer: "Silent Corp", price: 2199, rating: 4.6, image: "img/games/game5.svg" },
  { id: 6, title: "Pixel Dungeon", genre: "Инди", developer: "8-Bit Team", price: 799, rating: 4.1, image: "img/games/game6.svg" }
];

/* ----- Мобильное бургер-меню ----- */
const burger = document.querySelector(".burger");
const mobileNav = document.querySelector(".mobile-nav");

if (burger && mobileNav) {
  const menuId = burger.getAttribute("aria-controls");
  const menuEl = document.getElementById(menuId);

  /**
   * Переключает видимость мобильного меню.
   * Обновляет aria-expanded у кнопки и атрибут hidden у меню.
   */
  function toggleMobileMenu() {
    const isExpanded = burger.getAttribute("aria-expanded") === "true";
    burger.setAttribute("aria-expanded", String(!isExpanded));
    if (menuEl) {
      if (isExpanded) {
        menuEl.setAttribute("hidden", "");
      } else {
        menuEl.removeAttribute("hidden");
      }
    }
  }

  burger.addEventListener("click", toggleMobileMenu);

  // Закрываем меню при клике на ссылку (улучшение UX на мобильных)
  mobileNav.querySelectorAll("a").forEach((anchor) => {
    anchor.addEventListener("click", () => {
      burger.setAttribute("aria-expanded", "false");
      if (menuEl) menuEl.setAttribute("hidden", "");
    });
  });
}

/* ----- Слайдер новинок ----- */
const sliderTrack = document.querySelector(".slider__track");
const sliderSlides = document.querySelectorAll(".slider__slide");
const indicators = document.querySelectorAll(".slider__indicator");
const btnPrev = document.querySelector(".slider__btn-prev");
const btnNext = document.querySelector(".slider__btn-next");

let currentSlide = 0;
let slideInterval = null;
const SLIDE_COUNT = sliderSlides.length;
const AUTOPLAY_DELAY = 4000;

/**
 * Показывает слайд по индексу: обновляет прокрутку трека,
 * активный индикатор и атрибуты aria.
 * @param {number} index — индекс слайда (0-based)
 */
function showSlide(index) {
  if (SLIDE_COUNT === 0) return;
  // Циклическая навигация
  currentSlide = (index + SLIDE_COUNT) % SLIDE_COUNT;

  if (sliderTrack) {
    const slideWidth = sliderSlides[currentSlide].offsetWidth;
    // Смещаем трек так, чтобы нужный слайд был в начале (для scroll-snap)
    sliderTrack.scrollTo({ left: slideWidth * currentSlide, behavior: "smooth" });
  }

  // Обновляем индикаторы
  indicators.forEach((ind, i) => {
    const active = i === currentSlide;
    ind.classList.toggle("slider__indicator--active", active);
    ind.setAttribute("aria-current", active ? "true" : "false");
  });
}

/**
 * Включает автопрокрутку слайдера каждые AUTOPLAY_DELAY мс.
 */
function startAutoplay() {
  if (slideInterval) clearInterval(slideInterval);
  slideInterval = setInterval(() => showSlide(currentSlide + 1), AUTOPLAY_DELAY);
}

/**
 * Останавливает автопрокрутку (например, при взаимодействии пользователя).
 */
function stopAutoplay() {
  if (slideInterval) {
    clearInterval(slideInterval);
    slideInterval = null;
  }
}

if (sliderTrack && SLIDE_COUNT > 0) {
  // Инициализация первого слайда
  showSlide(0);
  startAutoplay();

  // Клики по индикаторам
  indicators.forEach((ind, i) => {
    ind.addEventListener("click", () => {
      showSlide(i);
      stopAutoplay();
      startAutoplay();
    });
  });

  // Кнопки навигации
  if (btnPrev) btnPrev.addEventListener("click", () => { showSlide(currentSlide - 1); stopAutoplay(); startAutoplay(); });
  if (btnNext) btnNext.addEventListener("click", () => { showSlide(currentSlide + 1); stopAutoplay(); startAutoplay(); });

  // Останавливаем автопрокрутку при наведении на слайдер
  const sliderEl = document.querySelector(".slider");
  if (sliderEl) {
    sliderEl.addEventListener("mouseenter", stopAutoplay);
    sliderEl.addEventListener("mouseleave", startAutoplay);
  }
}

/* ----- Переключение темы (тёмная/светлая) ----- */
const themeToggle = document.getElementById("themeToggle");
const body = document.body;
const THEME_KEY = "bestgames-theme";
const THEME_LIGHT = "theme-light";
const THEME_DARK = ""; // отсутствие класса = тёмная тема по умолчанию

/**
 * Применяет выбранную тему к телу документа и обновляет кнопку.
 * @param {string} theme — "light" или "dark"
 */
function applyTheme(theme) {
  if (theme === "light") {
    body.classList.add(THEME_LIGHT);
    if (themeToggle) themeToggle.textContent = "Сменить тему на тёмную";
  } else {
    body.classList.remove(THEME_LIGHT);
    if (themeToggle) themeToggle.textContent = "Сменить тему на светлую";
  }
  localStorage.setItem(THEME_KEY, theme);
}

/**
 * Инициализирует тему: берёт из localStorage, иначе тёмная по умолчанию.
 */
function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  applyTheme(saved === "light" ? "light" : "dark");
}

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const isLight = body.classList.contains(THEME_LIGHT);
    applyTheme(isLight ? "dark" : "light");
  });
}
initTheme();

/* ----- Профиль: история покупок ----- */
const purchasesList = document.getElementById("purchasesList");

const PURCHASES = [
  { game: "Cyber Nexus 2077", date: "14.10.2026", price: "2 999 ₽", status: "success" },
  { game: "Realm of Magic", date: "05.09.2026", price: "2 499 ₽", status: "success" },
  { game: "Pixel Dungeon", date: "20.08.2026", price: "799 ₽", status: "success" }
];

/**
 * Отрисовывает историю покупок в личном кабинете.
 * Если покупок нет — показывает текст-заглушку.
 */
function renderPurchases() {
  if (!purchasesList) return;
  if (PURCHASES.length === 0) {
    purchasesList.innerHTML = '<p class="purchases-list__empty">У вас пока нет покупок. Перейдите в каталог, чтобы выбрать игру.</p>';
    return;
  }
  purchasesList.innerHTML = PURCHASES.map((p) => `
    <div class="purchase-item" style="display:flex;justify-content:space-between;align-items:center;padding:0.75rem 1rem;border:1px solid #334155;border-radius:8px;background:#0f172a;">
      <div>
        <div style="font-weight:700;color:#f8fafc;">${escapeHtml(p.game)}</div>
        <div style="font-size:0.85rem;color:#94a3b8;">${p.date} &bull; ${p.price}</div>
      </div>
      <span style="font-size:0.8rem;padding:2px 8px;border-radius:4px;background:#166534;color:#bbf7d0;">Оплачено</span>
    </div>
  `).join("");
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

renderPurchases();

/* ----- Админ-панель: список игр ----- */
const adminGamesList = document.getElementById("adminGamesList");

/**
 * Отрисовывает список игр в админ-панели (превью каталога).
 * Каждая игра — строка с названием, жанром, ценой и статусом.
 */
function renderAdminGames() {
  if (!adminGamesList) return;
  if (GAMES.length === 0) {
    adminGamesList.innerHTML = '<li style="color:#94a3b8;font-style:italic;">Каталог пуст.</li>';
    return;
  }
  adminGamesList.innerHTML = GAMES.map((g) => `
    <li style="display:flex;justify-content:space-between;align-items:center;padding:0.75rem 1rem;border:1px solid #334155;border-radius:8px;background:#0f172a;">
      <div>
        <div style="font-weight:700;color:#f8fafc;">${escapeHtml(g.title)}</div>
        <div style="font-size:0.85rem;color:#94a3b8;">${g.genre} &bull; ${g.developer} &bull; ${g.price} ₽</div>
      </div>
      <span style="font-size:0.8rem;padding:2px 8px;border-radius:4px;background:#334155;color:#cbd5e1;">ID ${g.id}</span>
    </li>
  `).join("");
}

renderAdminGames();

/* ----- Админ-панель: форма добавления игры ----- */
const addGameForm = document.getElementById("addGameForm");
const adminMessage = document.getElementById("adminMessage");

if (addGameForm && adminMessage) {
  /**
   * Показывает сообщение результата операции в админ-панели.
   * @param {string} text — текст сообщения
   * @param {string} type — "success" или "error"
   */
  function showAdminMessage(text, type) {
    adminMessage.textContent = text;
    adminMessage.className = `admin-message admin-message--${type}`;
    adminMessage.hidden = false;
    setTimeout(() => { adminMessage.hidden = true; }, 5000);
  }

  addGameForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(addGameForm);
    const title = formData.get("title") || "";
    const genre = formData.get("genre") || "";
    const developer = formData.get("developer") || "";
    const description = formData.get("description") || "";
    const price = Number(formData.get("price")) || 0;
    const image = formData.get("image") || "";

    // Простая валидация на стороне клиента
    if (!title || !genre || !developer || !description || !image) {
      showAdminMessage("Заполните все обязательные поля.", "error");
      return;
    }
    if (price <= 0) {
      showAdminMessage("Стоимость должна быть больше 0.", "error");
      return;
    }

    const newGame = {
      id: GAMES.length ? Math.max(...GAMES.map((g) => g.id)) + 1 : 1,
      title, genre, developer, price, image
    };
    GAMES.push(newGame);
    renderAdminGames();
    addGameForm.reset();
    showAdminMessage(`Игра "${escapeHtml(title)}" добавлена в каталог.`, "success");
  });
}
