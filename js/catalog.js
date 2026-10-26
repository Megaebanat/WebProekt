/* ==========================================================================
   BestGames — скрипт страницы каталога игр
   Задачи:
     - хранит каталог игр (источник данных);
     - отрисовывает карточки игр в сетке;
     - фильтрует игры по выбранному жанру (кнопки-фильтры);
     - подсказка обновляется в зависимости от активного фильтра.
   Каждая функция прокомментирована.
   ========================================================================== */

/* Источник данных каталога. В реальном проекте данные приходят из API (/api/courses или /api/games). */
const CATALOG_GAMES = [
  { id: 1, title: "Cyber Nexus 2077", genre: "Экшен", developer: "Neon Studio", price: 2999, rating: 4.8, image: "img/games/game1.svg" },
  { id: 2, title: "Star Drift", genre: "Гонки", developer: "Orbit Games", price: 1799, rating: 4.5, image: "img/games/game2.svg" },
  { id: 3, title: "Realm of Magic", genre: "RPG", developer: "Arcane Labs", price: 2499, rating: 4.9, image: "img/games/game3.svg" },
  { id: 4, title: "Speed Rivals", genre: "Гонки", developer: "Turbo Wheels", price: 1999, rating: 4.3, image: "img/games/game4.svg" },
  { id: 5, title: "Shadow Assassin", genre: "Экшен", developer: "Silent Corp", price: 2199, rating: 4.6, image: "img/games/game5.svg" },
  { id: 6, title: "Pixel Dungeon", genre: "Инди", developer: "8-Bit Team", price: 799, rating: 4.1, image: "img/games/game6.svg" }
];

const gridMain = document.getElementById("catalogGrid");
const gridLight = document.getElementById("catalogGridLight");
const filterButtons = document.querySelectorAll(".filter-btn");
const filterHint = document.getElementById("filterHint");

let activeGenre = "all";

/**
 * Экранирует HTML для безопасной вставки пользовательских/данных строк.
 * @param {string} text
 * @returns {string}
 */
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Форматирует цену с разделителем тысяч.
 * @param {number} price
 * @returns {string}
 */
function formatPrice(price) {
  return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

/**
 * Рисует одну карточку игры.
 * @param {object} game
 * @returns {string} HTML-разметка карточки
 */
function renderCard(game) {
  const stars = Math.round(game.rating || 0);
  const starsHtml = Array.from({ length: 5 }, (_, i) =>
    `<span style="color:${i < stars ? "#fbbf24" : "#475569"};">&#9733;</span>`
  ).join("");

  return `
    <li class="card">
      <img src="${escapeHtml(game.image)}" alt="Обложка игры ${escapeHtml(game.title)}" class="card__img" loading="lazy">
      <div class="card__body">
        <div class="card__meta">${escapeHtml(game.genre)} &bull; ${escapeHtml(game.developer)}</div>
        <h3 class="card__title">${escapeHtml(game.title)}</h3>
        <div style="font-size:0.9rem;color:#94a3b8;margin:0.25rem 0;">${starsHtml} ${game.rating}</div>
        <p class="card__price">${formatPrice(game.price)} ₽</p>
        <a href="#" class="card__btn btn btn--outline link">Подробнее</a>
      </div>
    </li>
  `;
}

/**
 * Отрисовывает сетку карточек в указанном контейнере.
 * @param {string|null} genre — жанр для фильтрации ("all" — все)
 * @param {HTMLElement} container — DOM-элемент списка
 */
function renderCatalog(genre, container) {
  if (!container) return;
  const filtered = genre === "all"
    ? CATALOG_GAMES
    : CATALOG_GAMES.filter((g) => g.genre.toLowerCase() === genre.toLowerCase());
  container.innerHTML = filtered.map(renderCard).join("");
  if (filtered.length === 0) {
    container.innerHTML = '<li style="color:#94a3b8;font-style:italic;grid-column:1/-1;">Игр данного жанра не найдено.</li>';
  }
}

/**
 * Инициализирует каталог: рендер всех игр и навешивает обработчики на кнопки фильтров.
 */
function initCatalog() {
  renderCatalog(activeGenre, gridMain);
  renderCatalog(activeGenre, gridLight);

  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      // Переключаем активную кнопку
      filterButtons.forEach((b) => b.classList.remove("filter-btn--active"));
      btn.classList.add("filter-btn--active");

      activeGenre = btn.getAttribute("data-genre") || "all";
      renderCatalog(activeGenre, gridMain);
      renderCatalog(activeGenre, gridLight);

      // Подсказка
      if (activeGenre === "all") {
        filterHint.textContent = "Показаны все игры. Нажмите на жанр для фильтрации.";
      } else {
        filterHint.textContent = `Показаны игры жанра "${btn.textContent.trim()}".`;
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", initCatalog);
