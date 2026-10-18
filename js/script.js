/* =========================================================
   Portafolio · Jonathan Steven Guamán Maza
   - Tema claro / oscuro con localStorage
   - Menú móvil accesible
   - Sistema de misiones: 5 × 20 XP = 100 XP
   - Barras de progreso animadas (IntersectionObserver)
   - Validación del formulario de contacto
   ========================================================= */
(function () {
  'use strict';

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* =======================================================
     1. TEMA CLARO / OSCURO
     ======================================================= */
  const THEME_KEY = 'jg-theme';
  const root = document.documentElement;
  const themeToggle = $('#themeToggle');

  function applyTheme(theme, persist) {
    root.setAttribute('data-theme', theme);

    if (persist) {
      try { localStorage.setItem(THEME_KEY, theme); } catch (e) {}
    }

    if (themeToggle) {
      const isDark = theme === 'dark';
      themeToggle.setAttribute('aria-pressed', String(isDark));
      themeToggle.setAttribute('aria-label', isDark ? 'Activar modo claro' : 'Activar modo oscuro');

      const label = $('#themeToggleLabel');
      if (label) label.textContent = isDark ? 'Modo claro' : 'Modo oscuro';
    }

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#080d1a' : '#f4f6fb');
  }

  // Sincroniza la UI con el tema ya aplicado por el script inline del <head>
  applyTheme(root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light', false);

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next, true);
    });
  }

  /* =======================================================
     2. MENÚ MÓVIL
     ======================================================= */
  const navToggle = $('#navToggle');
  const nav = $('#primary-nav');

  function closeNav() {
    if (!navToggle || !nav) return;
    navToggle.setAttribute('aria-expanded', 'false');
    nav.classList.remove('is-open');
  }

  if (navToggle && nav) {
    navToggle.addEventListener('click', () => {
      const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!isOpen));
      nav.classList.toggle('is-open', !isOpen);
    });

    nav.addEventListener('click', (e) => {
      if (e.target.closest('a')) closeNav();
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.site-header')) closeNav();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeNav();
    });
  }

  /* =======================================================
     3. TOAST (feedback inmediato)
     ======================================================= */
  let toastTimer = null;

  function showToast(message) {
    const toast = $('#toast');
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add('is-visible');

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2800);
  }

  /* =======================================================
     4. SISTEMA DE MISIONES (5 × 20 XP = 100 XP)
     ======================================================= */
  const XP_KEY = 'jg-missions';

  const MISSIONS = [
    { id: 'quien-soy',   label: 'Conocer a Jonathan en “Quién soy”',      xp: 20 },
    { id: 'experiencia', label: 'Revisar la experiencia en Ludolab',      xp: 20 },
    { id: 'proyectos',   label: 'Explorar el portafolio de proyectos',    xp: 20 },
    { id: 'github',      label: 'Abrir un repositorio en GitHub',         xp: 20 },
    { id: 'contacto',    label: 'Visitar la página de contacto',          xp: 20 }
  ];

  const TOTAL_XP = MISSIONS.reduce((acc, m) => acc + m.xp, 0); // 100

  function loadDone() {
    try {
      const raw = localStorage.getItem(XP_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(arr)) return [];
      return arr.filter((id) => MISSIONS.some((m) => m.id === id));
    } catch (e) {
      return [];
    }
  }

  function saveDone(list) {
    try { localStorage.setItem(XP_KEY, JSON.stringify(list)); } catch (e) {}
  }

  function getXP(done) {
    return MISSIONS.filter((m) => done.includes(m.id))
                   .reduce((acc, m) => acc + m.xp, 0);
  }

  /* --- Render de la lista de misiones (se pinta en todos los contenedores) --- */
  function renderMissions() {
    const done = loadDone();

    $$('[data-mission-list]').forEach((list) => {
      list.innerHTML = '';

      MISSIONS.forEach((mission) => {
        const isDone = done.includes(mission.id);

        const li = document.createElement('li');
        li.className = 'mission' + (isDone ? ' mission--done' : '');

        li.innerHTML =
          '<span class="mission__status" aria-hidden="true">' + (isDone ? '✔' : '○') + '</span>' +
          '<span class="mission__label">' + mission.label + '</span>' +
          '<span class="mission__xp">+' + mission.xp + ' XP</span>' +
          '<span class="sr-only">' + (isDone ? ' — completada' : ' — pendiente') + '</span>';

        list.appendChild(li);
      });
    });
  }

  /* --- Sincroniza XP y barras en toda la página --- */
  function updateXP() {
    const done = loadDone();
    const xp = getXP(done);
    const percent = Math.round((xp / TOTAL_XP) * 100);

    $$('[data-xp-text]').forEach((el) => { el.textContent = xp; });

    $$('[data-xp-bar]').forEach((el) => {
      el.style.width = percent + '%';
    });

    $$('[data-xp-progress]').forEach((el) => {
      el.setAttribute('aria-valuenow', String(percent));
    });

    $$('[data-missions-text]').forEach((el) => {
      el.textContent = done.length + '/' + MISSIONS.length;
    });

    $$('[data-level-text]').forEach((el) => {
      el.textContent = xp >= TOTAL_XP ? 'Perfil completo ✓' : 'Perfil en progreso';
    });
  }

  function refreshAll() {
    renderMissions();
    updateXP();
  }

  /* --- Completar una misión --- */
  function completeMission(id) {
    const mission = MISSIONS.find((m) => m.id === id);
    if (!mission) return;

    const done = loadDone();
    if (done.includes(id)) return; // ya completada: no duplicar XP

    done.push(id);
    saveDone(done);

    refreshAll();
    showToast('+' + mission.xp + ' XP · ' + mission.label);

    if (done.length === MISSIONS.length) {
      setTimeout(() => showToast('🏆 ¡100 XP! Perfil completo'), 1200);
    }
  }

  /* --- Misión automática según la página actual --- */
  const currentPage = document.body.dataset.page;
  if (currentPage && MISSIONS.some((m) => m.id === currentPage)) {
    completeMission(currentPage);
  }

  /* --- Misión por clic (repositorios de GitHub) --- */
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-complete-mission]');
    if (trigger) completeMission(trigger.dataset.completeMission);
  });

  /* --- Botón reiniciar progreso --- */
  const resetBtn = $('#resetProgress');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      saveDone([]);
      refreshAll();
      showToast('Progreso reiniciado · 0 XP');
    });
  }

  /* --- Panel del HUD --- */
  const hudToggle = $('#hudToggle');
  const hudPanel = $('#hudPanel');

  if (hudToggle && hudPanel) {
    hudToggle.addEventListener('click', () => {
      const isOpen = hudToggle.getAttribute('aria-expanded') === 'true';
      hudToggle.setAttribute('aria-expanded', String(!isOpen));
      hudPanel.hidden = isOpen;
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !hudPanel.hidden) {
        hudToggle.setAttribute('aria-expanded', 'false');
        hudPanel.hidden = true;
        hudToggle.focus();
      }
    });
  }

  /* =======================================================
     5. BARRAS DE PROGRESO ANIMADAS
     ======================================================= */
  function animateStaticBars() {
    const bars = $$('.progress__bar[data-progress]');
    if (!bars.length) return;

    const setBar = (bar) => {
      const value = Math.min(100, Math.max(0, Number(bar.dataset.progress) || 0));
      bar.style.width = value + '%';
    };

    if (!('IntersectionObserver' in window) || prefersReduced) {
      bars.forEach(setBar);
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setBar(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.25 });

    bars.forEach((bar) => observer.observe(bar));
  }

  /* =======================================================
     6. FORMULARIO DE CONTACTO
     ======================================================= */
  const form = $('#contactForm');

  if (form) {
    const RULES = [
      {
        id: 'nombre',
        errorId: 'error-nombre',
        message: 'Escribe tu nombre (mínimo 3 caracteres).',
        isValid: (v) => v.trim().length >= 3
      },
      {
        id: 'correo',
        errorId: 'error-correo',
        message: 'Escribe un correo electrónico válido.',
        isValid: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())
      },
      {
        id: 'mensaje',
        errorId: 'error-mensaje',
        message: 'Cuéntame un poco más (mínimo 10 caracteres).',
        isValid: (v) => v.trim().length >= 10
      }
    ];

    function setError(rule, hasError) {
      const input = document.getElementById(rule.id);
      const error = document.getElementById(rule.errorId);
      const field = input ? input.closest('.field') : null;

      if (input) input.setAttribute('aria-invalid', String(hasError));
      if (field) field.classList.toggle('field--error', hasError);

      if (error) {
        error.textContent = hasError ? rule.message : '';
        error.hidden = !hasError;
      }
    }

    RULES.forEach((rule) => {
      const input = document.getElementById(rule.id);
      if (!input) return;
      input.addEventListener('input', () => {
        if (input.getAttribute('aria-invalid') === 'true' && rule.isValid(input.value)) {
          setError(rule, false);
        }
      });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      let firstInvalid = null;

      RULES.forEach((rule) => {
        const input = document.getElementById(rule.id);
        if (!input) return;

        const hasError = !rule.isValid(input.value);
        setError(rule, hasError);

        if (hasError && !firstInvalid) firstInvalid = input;
      });

      const ok = $('#formOk');

      if (firstInvalid) {
        if (ok) ok.hidden = true;
        firstInvalid.focus();
        showToast('Revisa los campos marcados');
        return;
      }

      if (ok) {
        ok.textContent = '✔ Mensaje validado correctamente. Este formulario es demostrativo: para contacto directo usa GitHub o LinkedIn.';
        ok.hidden = false;
      }

      showToast('✔ Mensaje validado correctamente');
      form.reset();
      RULES.forEach((rule) => setError(rule, false));
    });
  }

  /* =======================================================
     7. ARRANQUE
     ======================================================= */
  refreshAll();
  animateStaticBars();

  // Sincroniza el progreso si se modifica en otra pestaña
  window.addEventListener('storage', (e) => {
    if (e.key === XP_KEY) refreshAll();
    if (e.key === THEME_KEY && e.newValue) applyTheme(e.newValue, false);
  });
})();