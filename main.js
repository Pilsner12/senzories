// Senzories — scroll reveal, nav, parallax, form handlers
(function () {
  // -------- nav background on scroll --------
  const nav = document.querySelector('.nav');
  const onScroll = () => {
    if (window.scrollY > 24) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // -------- reveal on scroll --------
  const reveals = Array.from(document.querySelectorAll('.reveal'));
  const reveal = (el) => el.classList.add('in');
  const showInView = () => {
    for (let i = reveals.length - 1; i >= 0; i--) {
      const el = reveals[i];
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.95 && r.bottom > -10) {
        reveal(el);
        reveals.splice(i, 1);
      }
    }
  };

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { reveal(e.target); io.unobserve(e.target); }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });
    reveals.forEach((el) => io.observe(el));

    // Reveal in-view content immediately & synchronously (script is at end of
    // body, so layout is ready). This does NOT depend on rAF/timers/IO, which
    // can be throttled in background/preview iframes.
    showInView();
    // Reveal more as the user scrolls (belt-and-braces alongside IO).
    window.addEventListener('scroll', showInView, { passive: true });
    window.addEventListener('load', showInView);
    requestAnimationFrame(showInView);
    [120, 400, 800, 1400].forEach((t) => setTimeout(showInView, t));
    // Final safety: never let anything stay permanently hidden, even if CSS
    // transitions are paused (some background/embedded rendering contexts).
    setTimeout(() => document.querySelectorAll('.reveal').forEach((el) => {
      el.style.transition = 'none';
      reveal(el);
    }), 2000);
  } else {
    document.querySelectorAll('.reveal').forEach(reveal);
  }

  // -------- subtle parallax on hero leaves & floats --------
  const parallaxEls = document.querySelectorAll('[data-par]');
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      parallaxEls.forEach((el) => {
        const s = parseFloat(el.getAttribute('data-par')) || 0.1;
        el.style.transform = `translateY(${y * s}px) ${el.dataset.rot || ''}`;
      });
      ticking = false;
    });
  }, { passive: true });

  // -------- mobile menu (simple anchor scroll, burger toggles a sheet) --------
  const burger = document.querySelector('.nav-burger');
  if (burger) {
    burger.addEventListener('click', () => {
      document.querySelector('#kontakt')?.scrollIntoView({ behavior: 'smooth' });
    });
  }

  // -------- contact form -> mailto --------
  const TO = 'pohankao@gmail.com';
  const cf = document.querySelector('#contactForm');
  if (cf) {
    cf.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const fd = new FormData(cf);
      const name = (fd.get('name') || '').toString();
      const email = (fd.get('email') || '').toString();
      const msg = (fd.get('message') || '').toString();
      const subject = encodeURIComponent('Dotaz ze Senzories webu — ' + name);
      const body = encodeURIComponent(`Jméno: ${name}\nEmail: ${email}\n\n${msg}`);
      window.location.href = `mailto:${TO}?subject=${subject}&body=${body}`;
      const ok = cf.querySelector('.form-ok');
      if (ok) ok.style.display = 'block';
    });
  }

  // -------- hero newsletter signup -> Netlify Forms --------
  const sf = document.querySelector('#heroSignupForm');
  if (sf) {
    sf.addEventListener('submit', (ev) => {
      ev.preventDefault();
      fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(new FormData(sf)).toString() })
        .finally(() => {
          sf.style.display = 'none';
          const ok = document.querySelector('#heroSignupOk');
          if (ok) ok.style.display = 'block';
        });
    });
  }

  // -------- catalog form -> mailto (leave email for catalog) --------
  const kf = document.querySelector('#catalogForm');
  if (kf) {
    kf.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const email = (new FormData(kf).get('cemail') || '').toString();
      const subject = encodeURIComponent('Žádost o katalog Senzories');
      const body = encodeURIComponent(`Dobrý den,\nmám zájem o katalog Senzories.\nMůj kontaktní email: ${email}\n\nDěkuji!`);
      window.location.href = `mailto:${TO}?subject=${subject}&body=${body}`;
      const ok = kf.querySelector('.cat-ok');
      if (ok) ok.style.display = 'block';
    });
  }
})();
