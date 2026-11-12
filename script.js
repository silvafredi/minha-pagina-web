(function () {
  'use strict';

  document.documentElement.classList.add('js');

  // Ano atual no rodapé
  var yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  // ------------------------------------------------------------------
  // Animação ao rolar (Intersection Observer)
  // ------------------------------------------------------------------
  var revealEls = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    // Pequeno atraso escalonado dentro de cada grupo de irmãos
    revealEls.forEach(function (el) {
      var siblings = el.parentElement ? el.parentElement.children : [];
      var index = Array.prototype.indexOf.call(siblings, el);
      el.style.setProperty('--delay', (Math.max(index, 0) * 80) + 'ms');
      observer.observe(el);
    });
  } else {
    // Navegadores antigos: mostra tudo sem animação
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  // ------------------------------------------------------------------
  // Copiar e-mail com feedback visual
  // ------------------------------------------------------------------
  var copyBtn = document.getElementById('copy-email');
  var copyStatus = document.getElementById('copy-status');

  function fallbackCopy(text) {
    var textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    var ok = false;
    try {
      ok = document.execCommand('copy');
    } catch (err) {
      ok = false;
    }
    document.body.removeChild(textarea);
    return ok;
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(function () { return true; }, function () {
        return fallbackCopy(text);
      });
    }
    return Promise.resolve(fallbackCopy(text));
  }

  if (copyBtn) {
    var originalLabel = copyBtn.textContent;
    var resetTimer = null;

    copyBtn.addEventListener('click', function () {
      var email = copyBtn.getAttribute('data-email');

      copyText(email).then(function (ok) {
        if (resetTimer) { clearTimeout(resetTimer); }

        if (ok) {
          copyBtn.textContent = 'E-mail copiado!';
          copyBtn.classList.add('is-copied');
          if (copyStatus) { copyStatus.textContent = 'Endereço copiado para a área de transferência.'; }
        } else {
          copyBtn.textContent = 'Não foi possível copiar';
          if (copyStatus) { copyStatus.textContent = 'Copie manualmente: ' + email; }
        }

        resetTimer = setTimeout(function () {
          copyBtn.textContent = originalLabel;
          copyBtn.classList.remove('is-copied');
          if (copyStatus) { copyStatus.textContent = ''; }
        }, 2500);
      });
    });
  }

  // ------------------------------------------------------------------
  // Formulário de contato com validação
  // ------------------------------------------------------------------
  var form = document.getElementById('contact-form');
  var formStatus = document.getElementById('form-status');
  var EMAIL_CONTACT = 'silva.fredi@gmail.com';
  // Formato: texto@dominio.extensão (sem espaços, com ao menos um ponto no domínio)
  var EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function setFieldError(fieldId, message) {
    var input = document.getElementById(fieldId);
    var errorEl = document.getElementById(fieldId + '-error');
    var wrapper = input.closest('.field');

    if (message) {
      wrapper.classList.add('has-error');
      errorEl.textContent = message;
      input.setAttribute('aria-invalid', 'true');
    } else {
      wrapper.classList.remove('has-error');
      errorEl.textContent = '';
      input.removeAttribute('aria-invalid');
    }
  }

  function validateField(fieldId) {
    var value = document.getElementById(fieldId).value.trim();

    if (fieldId === 'name') {
      if (!value) { return 'Informe seu nome.'; }
      if (value.length < 2) { return 'O nome deve ter pelo menos 2 caracteres.'; }
    }

    if (fieldId === 'email') {
      if (!value) { return 'Informe seu e-mail.'; }
      if (!EMAIL_REGEX.test(value)) { return 'Informe um e-mail válido (ex.: nome@dominio.com).'; }
    }

    if (fieldId === 'message') {
      if (!value) { return 'Escreva uma mensagem.'; }
      if (value.length < 10) { return 'A mensagem deve ter pelo menos 10 caracteres.'; }
    }

    return '';
  }

  if (form) {
    var fieldIds = ['name', 'email', 'message'];

    // Valida ao sair do campo (se já houve tentativa de envio ou o campo foi preenchido)
    fieldIds.forEach(function (id) {
      var input = document.getElementById(id);
      input.addEventListener('blur', function () {
        if (input.value.trim() !== '' || form.dataset.submitted === 'true') {
          setFieldError(id, validateField(id));
        }
      });
      input.addEventListener('input', function () {
        if (input.closest('.field').classList.contains('has-error')) {
          setFieldError(id, validateField(id));
        }
      });
    });

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      form.dataset.submitted = 'true';

      var firstInvalid = null;
      var valid = true;

      fieldIds.forEach(function (id) {
        var message = validateField(id);
        setFieldError(id, message);
        if (message) {
          valid = false;
          if (!firstInvalid) { firstInvalid = document.getElementById(id); }
        }
      });

      if (!valid) {
        formStatus.textContent = 'Corrija os campos destacados para enviar.';
        formStatus.className = 'form-status is-error';
        firstInvalid.focus();
        return;
      }

      var name = document.getElementById('name').value.trim();
      var email = document.getElementById('email').value.trim();
      var message = document.getElementById('message').value.trim();

      // Sem backend (site estático): abre o aplicativo de e-mail com a mensagem pronta
      var subject = 'Contato pelo site - ' + name;
      var body = message + '\n\n---\nNome: ' + name + '\nE-mail: ' + email;
      var mailto = 'mailto:' + EMAIL_CONTACT +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(body);

      window.location.href = mailto;

      formStatus.textContent = 'Abrindo seu aplicativo de e-mail com a mensagem pronta...';
      formStatus.className = 'form-status is-success';
    });
  }
})();
