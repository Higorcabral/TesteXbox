/* =================================================================
   HIFERA · Canais de contato
   -----------------------------------------------------------------
   Ponto único de configuração de como falar com a Hifera. Todo canal
   novo (WhatsApp, LinkedIn, Instagram, endpoint de formulário) entra
   AQUI, no objeto CONFIG, e não espalhado pelo HTML.

   A regra que o arquivo segue: canal não configurado não aparece.
   Nada de botão de WhatsApp que abre uma conversa com número errado,
   nada de ícone de Instagram apontando para lugar nenhum. Enquanto
   CONFIG.whatsapp estiver vazio, o botão flutuante não é criado e os
   elementos marcados com data-canal="whatsapp" continuam escondidos.

   Como ligar o WhatsApp quando o número existir:
     1. preencha CONFIG.whatsapp com DDI+DDD+número, só dígitos
        (ex.: '5511987654321')
     2. só isso. Botão flutuante, CTA e rodapé passam a aparecer,
        e o formulário passa a enviar por lá em vez de por e-mail.

   Como ligar as redes sociais:
     preencha CONFIG.redes.linkedin / .instagram com a URL completa.

   Como trocar o formulário por envio de verdade (sem depender do
   cliente de e-mail da pessoa): preencha CONFIG.endpoint com a URL
   que recebe POST em JSON — uma Azure Function no mesmo Static Web
   App resolve. Vazio, o formulário cai no e-mail/WhatsApp.
   ================================================================= */
window.HiferaContato = (function () {
  'use strict';

  var CONFIG = {
    email: 'comercial@hifera.com.br',

    /* DDI + DDD + número, só dígitos. Vazio = canal desligado. */
    whatsapp: '',
    whatsappSaudacao: 'Olá! Vim pelo site da Hifera e queria conversar sobre um processo que dá trabalho aqui.',

    /* URL completa ou string vazia. Vazio = não aparece no rodapé. */
    redes: {
      linkedin: '',
      instagram: ''
    },

    /* POST em JSON. Vazio = formulário usa WhatsApp ou e-mail. */
    endpoint: ''
  };

  function digitos(v) { return String(v || '').replace(/\D/g, ''); }

  function temWhatsapp() { return digitos(CONFIG.whatsapp).length >= 10; }

  function linkWhatsapp(mensagem) {
    if (!temWhatsapp()) return '';
    var texto = mensagem || CONFIG.whatsappSaudacao;
    return 'https://wa.me/' + digitos(CONFIG.whatsapp) + '?text=' + encodeURIComponent(texto);
  }

  function linkEmail(assunto, corpo) {
    var url = 'mailto:' + CONFIG.email;
    var partes = [];
    if (assunto) partes.push('subject=' + encodeURIComponent(assunto));
    if (corpo) partes.push('body=' + encodeURIComponent(corpo));
    return partes.length ? url + '?' + partes.join('&') : url;
  }

  /* Só aceita http/https, para o dia em que alguém colar algo estranho
     na configuração sem perceber. */
  function urlSegura(u) {
    u = String(u || '').trim();
    return /^https?:\/\//i.test(u) ? u : '';
  }

  return {
    config: CONFIG,
    temWhatsapp: temWhatsapp,
    linkWhatsapp: linkWhatsapp,
    linkEmail: linkEmail,
    urlSegura: urlSegura
  };
})();

/* -----------------------------------------------------------------
   Aplicação na página
   ----------------------------------------------------------------- */
(function () {
  'use strict';

  var C = window.HiferaContato;

  function pronto(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  /* --- WhatsApp: liga os pontos marcados no HTML ------------------ */
  function ligarWhatsapp() {
    var alvos = document.querySelectorAll('[data-canal="whatsapp"]');
    if (!C.temWhatsapp()) return;           /* segue escondido */

    Array.prototype.forEach.call(alvos, function (el) {
      el.setAttribute('href', C.linkWhatsapp(el.getAttribute('data-mensagem') || ''));
      el.removeAttribute('hidden');
    });

    criarBotaoFlutuante();
  }

  function criarBotaoFlutuante() {
    if (document.querySelector('.zap-float')) return;

    var a = document.createElement('a');
    a.className = 'zap-float';
    a.href = C.linkWhatsapp();
    a.target = '_blank';
    a.rel = 'noopener';
    a.setAttribute('aria-label', 'Falar com a Hifera no WhatsApp');
    a.innerHTML =
      '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
      '<path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.86 9.86 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.24 8.24 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.19 8.19 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.15.16-.29.18-.54.06-.25-.13-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.44.13-.15.17-.25.25-.41.09-.17.04-.31-.02-.43-.06-.13-.56-1.35-.77-1.84-.2-.48-.4-.42-.55-.43h-.47c-.16 0-.43.06-.65.31-.23.24-.86.84-.86 2.05s.88 2.38 1 2.54c.13.17 1.74 2.65 4.2 3.72.59.25 1.05.4 1.4.52.59.19 1.12.16 1.55.1.47-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.1-.23-.16-.48-.28Z"/>' +
      '</svg>' +
      '<span>WhatsApp</span>';
    document.body.appendChild(a);
  }

  /* --- Redes sociais: só entra a que tiver URL -------------------- */
  function ligarRedes() {
    var lista = document.querySelector('[data-redes]');
    if (!lista) return;

    var icones = {
      linkedin: '<path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm7 0h3.8v1.7h.05c.53-.95 1.83-1.95 3.77-1.95 4.03 0 4.78 2.5 4.78 5.76V21h-4v-5.6c0-1.34-.03-3.06-1.9-3.06-1.9 0-2.2 1.45-2.2 2.96V21h-4V9Z"/>',
      instagram: '<path d="M12 2.2c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.16-.42-.36-1.06-.41-2.23C2.21 15.58 2.2 15.2 2.2 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.21 8.8 2.2 12 2.2Zm0 1.8c-3.15 0-3.5.01-4.74.07-.9.04-1.39.19-1.71.32-.43.17-.74.37-1.06.69-.32.32-.52.63-.69 1.06-.13.32-.28.81-.32 1.71C3.42 8.5 3.4 8.85 3.4 12s.02 3.5.08 4.74c.4.9.19 1.39.32 1.71.17.43.37.74.69 1.06.32.32.63.52 1.06.69.32.13.81.28 1.71.32 1.24.06 1.59.08 4.74.08s3.5-.02 4.74-.08c.9-.04 1.39-.19 1.71-.32.43-.17.74-.37 1.06-.69.32-.32.52-.63.69-1.06.13-.32.28-.81.32-1.71.06-1.24.08-1.59.08-4.74s-.02-3.5-.08-4.74c-.04-.9-.19-1.39-.32-1.71a2.86 2.86 0 0 0-.69-1.06 2.86 2.86 0 0 0-1.06-.69c-.32-.13-.81-.28-1.71-.32C15.5 4.01 15.15 4 12 4Zm0 3.06a4.94 4.94 0 1 1 0 9.88 4.94 4.94 0 0 1 0-9.88Zm0 1.8a3.14 3.14 0 1 0 0 6.28 3.14 3.14 0 0 0 0-6.28Zm5.15-3.2a1.15 1.15 0 1 1 0 2.3 1.15 1.15 0 0 1 0-2.3Z"/>'
    };

    var rotulos = { linkedin: 'LinkedIn da Hifera', instagram: 'Instagram da Hifera' };
    var algum = false;

    /* Monta por DOM em vez de innerHTML com a URL interpolada: a URL vem
       de configuração, mas configuração também se digita errado. */
    lista.textContent = '';
    Object.keys(icones).forEach(function (rede) {
      var url = C.urlSegura(C.config.redes[rede]);
      if (!url) return;

      var a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener me';
      a.setAttribute('aria-label', rotulos[rede] || rede);
      a.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' + icones[rede] + '</svg>';
      lista.appendChild(a);
      algum = true;
    });

    if (!algum) return;                      /* nenhuma rede: some */
    lista.removeAttribute('hidden');
  }

  /* --- Formulário do CTA final ----------------------------------- */
  function ligarFormulario() {
    var form = document.getElementById('form-contato');
    if (!form) return;

    var aviso = form.querySelector('[data-aviso]');

    function dizer(texto, tipo) {
      if (!aviso) return;
      aviso.textContent = texto;
      aviso.className = 'form-aviso' + (tipo ? ' is-' + tipo : '');
    }

    /* Deixa claro para onde a mensagem vai antes de a pessoa escrever. */
    var destino = form.querySelector('[data-destino]');
    if (destino) {
      destino.textContent = C.temWhatsapp()
        ? 'Abre o WhatsApp com o texto pronto.'
        : 'Abre seu e-mail com a mensagem pronta para ' + C.config.email + '.';
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var dados = {
        nome:    (form.elements.nome.value || '').trim(),
        empresa: (form.elements.empresa.value || '').trim(),
        retorno: (form.elements.retorno.value || '').trim(),
        recado:  (form.elements.recado.value || '').trim()
      };

      if (!dados.nome || !dados.retorno || !dados.recado) {
        dizer('Faltou nome, contato ou o que está atrapalhando.', 'erro');
        return;
      }

      var corpo =
        'Nome: ' + dados.nome + '\n' +
        (dados.empresa ? 'Empresa: ' + dados.empresa + '\n' : '') +
        'Melhor contato: ' + dados.retorno + '\n\n' +
        'O que atrapalha:\n' + dados.recado + '\n';

      if (C.config.endpoint) {
        enviarPorEndpoint(dados, corpo, dizer, form);
        return;
      }

      if (C.temWhatsapp()) {
        window.open(C.linkWhatsapp(corpo), '_blank', 'noopener');
        dizer('Abrimos o WhatsApp com a mensagem pronta. É só enviar.', 'ok');
        return;
      }

      window.location.href = C.linkEmail('Contato pelo site — ' + dados.nome, corpo);
      dizer('Abrimos seu e-mail com a mensagem pronta. É só enviar.', 'ok');
    });
  }

  function enviarPorEndpoint(dados, corpo, dizer, form) {
    dizer('Enviando…', '');
    fetch(C.config.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    })
      .then(function (r) {
        if (!r.ok) throw new Error('resposta ' + r.status);
        form.reset();
        dizer('Recebido. Retorno em até 24h úteis.', 'ok');
      })
      .catch(function () {
        /* Não perde a mensagem que a pessoa acabou de escrever. */
        window.location.href = C.linkEmail('Contato pelo site — ' + dados.nome, corpo);
        dizer('O envio automático falhou, então abrimos seu e-mail com o texto pronto.', 'erro');
      });
  }

  pronto(function () {
    ligarWhatsapp();
    ligarRedes();
    ligarFormulario();
  });
})();
