/* ==========================================================================
   BestGames — скрипт форм авторизации и регистрации (vanilla JavaScript)
   Задачи:
     - клиентская валидация полей форм (e-mail, пароль, дата рождения, телефон,
       согласие на обработку персональных данных);
     - подсветка полей при ошибках;
     - вывод сообщений об ошибках под соответствующими полями;
     - имитация отправки на сервер (API) с отображением результата.
   Комментарии к каждой функции — для понятности кода.
   ========================================================================== */

/* ----- Регулярные выражения валидации ----- */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?\d[\d\s\-()]{6,}$/;
const PASSWORD_RE = /^[\w_#!%]{3,}$/; // буквы, цифры, _ # ! %, минимум 3 символа

/**
 * Показывает ошибку под полем и подсвечивает поле красным.
 * @param {HTMLInputElement} input
 * @param {string} message
 */
function showFieldError(input, message) {
  input.classList.add("field-error");
  const errorId = `${input.id}Error`;
  let errorEl = document.getElementById(errorId);
  if (!errorEl) {
    errorEl = document.createElement("span");
    errorEl.id = errorId;
    errorEl.className = "form__error";
    errorEl.setAttribute("aria-live", "polite");
    input.parentElement.appendChild(errorEl);
  }
  errorEl.textContent = message;
  input.setAttribute("aria-invalid", "true");
}

/**
 * Убирает ошибку с поля.
 * @param {HTMLInputElement} input
 */
function clearFieldError(input) {
  input.classList.remove("field-error");
  input.setAttribute("aria-invalid", "false");
  const errorId = `${input.id}Error`;
  const errorEl = document.getElementById(errorId);
  if (errorEl) errorEl.textContent = "";
}

/**
 * Валидирует одно поле по правилу.
 * @param {HTMLInputElement} input
 * @param {Function} validator — функция, возвращает строку с ошибкой или null
 * @returns {boolean} — true, если поле валидно
 */
function validateField(input, validator) {
  const value = input.value.trim();
  const error = validator(value);
  if (error) {
    showFieldError(input, error);
    return false;
  }
  clearFieldError(input);
  return true;
}

/* Валидаторы */
function required(value) {
  return value ? null : "Это поле обязательно для заполнения.";
}
function emailValid(value) {
  return EMAIL_RE.test(value) ? null : "Введите корректный e-mail.";
}
function passwordValid(value) {
  return PASSWORD_RE.test(value)
    ? null
    : "Пароль должен содержать минимум 3 символа (допустимы _ # ! %).";
}
function phoneValid(value) {
  return PHONE_RE.test(value) ? null : "Введите корректный номер телефона.";
}

/* ----- Общая инициализация форм ----- */
document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const profileForm = document.getElementById("profileForm");

  /* Форма входа */
  if (loginForm) {
    const emailInput = document.getElementById("loginEmail");
    const passwordInput = document.getElementById("loginPassword");

    emailInput.addEventListener("input", () => validateField(emailInput, emailValid));
    passwordInput.addEventListener("input", () => validateField(passwordInput, required));

    loginForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const okEmail = validateField(emailInput, emailValid);
      const okPass = validateField(passwordInput, required);
      if (okEmail && okPass) {
        handleAuthSubmit(loginForm, { email: emailInput.value, password: passwordInput.value }, "/api/auth");
      }
    });
  }

  /* Форма регистрации */
  if (registerForm) {
    const inputs = {
      last_name: document.getElementById("regLastName"),
      first_name: document.getElementById("regFirstName"),
      email: document.getElementById("regEmail"),
      birth_date: document.getElementById("regBirthDate"),
      phone: document.getElementById("regPhone"),
      password: document.getElementById("regPassword"),
      password_repeat: document.getElementById("regPasswordRepeat"),
      consent: document.getElementById("regConsent")
    };

    // Валидация по событиям ввода
    validateField(inputs.last_name, required);
    validateField(inputs.first_name, required);
    validateField(inputs.email, emailValid);
    validateField(inputs.phone, phoneValid);
    validateField(inputs.password, passwordValid);

    inputs.last_name.addEventListener("input", () => validateField(inputs.last_name, required));
    inputs.first_name.addEventListener("input", () => validateField(inputs.first_name, required));
    inputs.email.addEventListener("input", () => validateField(inputs.email, emailValid));
    inputs.birth_date.addEventListener("input", () => validateField(inputs.birth_date, required));
    inputs.phone.addEventListener("input", () => validateField(inputs.phone, phoneValid));
    inputs.password.addEventListener("input", () => validateField(inputs.password, passwordValid));
    inputs.password_repeat.addEventListener("input", () => {
      const ok = inputs.password.value === inputs.password_repeat.value && inputs.password_repeat.value !== "";
      if (!ok) showFieldError(inputs.password_repeat, "Пароли не совпадают.");
      else clearFieldError(inputs.password_repeat);
    });
    inputs.consent.addEventListener("change", () => validateField(inputs.consent, () => inputs.consent.checked ? null : "Необходимо дать согласие на обработку персональных данных."));

    registerForm.addEventListener("submit", (event) => {
      event.preventDefault();
      let ok = true;
      ok = validateField(inputs.last_name, required) && ok;
      ok = validateField(inputs.first_name, required) && ok;
      ok = validateField(inputs.email, emailValid) && ok;
      ok = validateField(inputs.birth_date, required) && ok;
      ok = validateField(inputs.phone, phoneValid) && ok;
      ok = validateField(inputs.password, passwordValid) && ok;
      if (inputs.password.value !== inputs.password_repeat.value || inputs.password_repeat.value === "") {
        showFieldError(inputs.password_repeat, "Пароли не совпадают.");
        ok = false;
      } else {
        clearFieldError(inputs.password_repeat);
      }
      if (!inputs.consent.checked) {
        showFieldError(inputs.consent, "Необходимо дать согласие на обработку персональных данных.");
        ok = false;
      }
      if (ok) {
        handleAuthSubmit(registerForm, {
          last_name: inputs.last_name.value,
          first_name: inputs.first_name.value,
          email: inputs.email.value,
          birth_date: inputs.birth_date.value,
          phone: inputs.phone.value,
          password: inputs.password.value
        }, "/api/registr");
      }
    });
  }

  /* Форма профиля */
  if (profileForm) {
    const profEmail = document.getElementById("profEmail");
    const profFirstName = document.getElementById("profFirstName");
    const profLastName = document.getElementById("profLastName");
    const profBirthDate = document.getElementById("profBirthDate");
    const profPhone = document.getElementById("profPhone");

    validateField(profFirstName, required);
    validateField(profLastName, required);
    validateField(profBirthDate, required);
    validateField(profPhone, phoneValid);

    profFirstName.addEventListener("input", () => validateField(profFirstName, required));
    profLastName.addEventListener("input", () => validateField(profLastName, required));
    profBirthDate.addEventListener("input", () => validateField(profBirthDate, required));
    profPhone.addEventListener("input", () => validateField(profPhone, phoneValid));

    profileForm.addEventListener("submit", (event) => {
      event.preventDefault();
      let ok = true;
      ok = validateField(profFirstName, required) && ok;
      ok = validateField(profLastName, required) && ok;
      ok = validateField(profBirthDate, required) && ok;
      ok = validateField(profPhone, phoneValid) && ok;
      if (ok) {
        alert("Данные профиля сохранены (имитация отправки на сервер).");
      }
    });
  }
});

/**
 * Имитирует отправку формы авторизации/регистрации на API.
 * В реальном проекте здесь fetch() к {{api-host}}/auth или {{api-host}}/registr.
 * @param {HTMLFormElement} form
 * @param {object} data
 * @param {string} endpoint
 */
function handleAuthSubmit(form, data, endpoint) {
  const btn = form.querySelector('button[type="submit"]');
  const originalText = btn.textContent;
  btn.textContent = "Отправка…";
  btn.disabled = true;

  // Имитация сетевой задержки
  setTimeout(() => {
    btn.textContent = originalText;
    btn.disabled = false;

    // Успешный ответ (статус 200/201)
    const success = Math.random() > 0.2; // 80 % успешных для демо
    if (success) {
      showFormMessage(form, "Операция выполнена успешно. Вы вошли в систему.", "success");
      if (endpoint.includes("registr")) {
        localStorage.setItem("bestgames-user", JSON.stringify({ email: data.email, registered: true }));
      }
    } else {
      showFormMessage(form, "Ошибка сервера. Пожалуйста, попробуйте позже (статус 422/500).", "error");
    }
  }, 900);
}

/**
 * Показывает сообщение результата под формой.
 * @param {HTMLFormElement} form
 * @param {string} text
 * @param {string} type — "success" | "error"
 */
function showFormMessage(form, text, type) {
  let msg = form.querySelector(".form-message");
  if (!msg) {
    msg = document.createElement("div");
    msg.className = "form-message";
    form.prepend(msg);
  }
  msg.textContent = text;
  msg.className = `form-message form-message--${type}`;
  msg.hidden = false;
  setTimeout(() => { msg.hidden = true; }, 6000);
}
