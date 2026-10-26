-- ============================================================================
-- sql/schema.sql — структура базы данных BestGames (MySQL)
--
-- Все таблицы приведены к 3-й нормальной форме (3 НФ):
--   1 НФ — атомарные значения, нет повторяющихся групп;
--   2 НФ — все неключевые атрибуты зависят от всего первичного ключа;
--   3 НФ — нет транзитивных зависимостей (промежуточные сущности вынесены).
--
-- Применить:  mysql -u bestgames_user -p bestgames < sql/schema.sql
-- ============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------
-- Таблица users — зарегистрированные пользователи
-- -----------------------------------------------------
DROP TABLE IF EXISTS users;
CREATE TABLE users (
    id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
    email       VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,   -- хеш пароля (password_hash / PASSWORD_DEFAULT)
    last_name   VARCHAR(100) NOT NULL,
    first_name  VARCHAR(100) NOT NULL,
    birth_date  DATE NULL,
    phone       VARCHAR(30) NULL,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Таблица games — каталог видеоигр
-- -----------------------------------------------------
DROP TABLE IF EXISTS games;
CREATE TABLE games (
    id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
    title       VARCHAR(255) NOT NULL,
    genre       VARCHAR(100) NOT NULL,
    developer   VARCHAR(255) NOT NULL,
    description TEXT NULL,
    price       DECIMAL(10,2) UNSIGNED NOT NULL DEFAULT 0.00,
    image       VARCHAR(500) NULL,            -- путь/ссылка на изображение (mp4/mp3/img)
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_games_genre (genre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Таблица orders — заказы / покупки пользователей
-- -----------------------------------------------------
DROP TABLE IF EXISTS orders;
CREATE TABLE orders (
    id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id         INT UNSIGNED NOT NULL,
    payment_status  ENUM('pending','success','failed') NOT NULL DEFAULT 'pending',
    total_amount    DECIMAL(12,2) UNSIGNED NOT NULL DEFAULT 0.00,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY fk_orders_user (user_id),
    CONSTRAINT fk_orders_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Таблица order_items — позиции заказа (игра + цена на момент покупки)
-- -----------------------------------------------------
DROP TABLE IF EXISTS order_items;
CREATE TABLE order_items (
    id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
    order_id    INT UNSIGNED NOT NULL,
    game_id     INT UNSIGNED NOT NULL,
    price       DECIMAL(10,2) UNSIGNED NOT NULL DEFAULT 0.00,
    PRIMARY KEY (id),
    KEY fk_order_items_order (order_id),
    KEY fk_order_items_game (game_id),
    CONSTRAINT fk_order_items_order
        FOREIGN KEY (order_id) REFERENCES orders(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_order_items_game
        FOREIGN KEY (game_id) REFERENCES games(id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- Пример заполнения (можно раскомментировать для первичного наполнения):
/*
INSERT INTO games (title, genre, developer, description, price, image) VALUES
('Cyber Nexus 2077', 'Экшен', 'Neon Studio', 'Киберпанк-экшен в открытом мире.', 2999.00, 'img/games/game1.svg'),
('Star Drift', 'Гонки', 'Orbit Games', 'Космические гонки на выживание.', 1799.00, 'img/games/game2.svg'),
('Realm of Magic', 'RPG', 'Arcane Labs', 'Магический мир с открытым исследованием.', 2499.00, 'img/games/game3.svg');
*/

-- ============================================================================
-- Конец схемы
-- ============================================================================
