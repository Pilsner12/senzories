// Senzories — scroll reveal, nav, parallax, form handlers
(function () {
  // -------- section id → clean URL slug mapping --------
  const slugMap = { domov: '/', filozofie: '/filozofie', proc: '/proc', produkty: '/produkty', pribeh: '/pribeh', instagram: '/instagram', kontakt: '/kontakt' };
  const idFromSlug = Object.fromEntries(Object.entries(slugMap).map(([id, slug]) => [slug, id]));

  // on click: smooth scroll + pushState to clean URL
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href').slice(1);
    const target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth' });
    const slug = slugMap[id] || '/';
    history.pushState({ section: id }, '', slug);
  });

  // on load: if URL is /kontakt etc., scroll to that section instantly
  const initSlug = location.pathname.replace(/\/$/, '') || '/';
  const initId = idFromSlug[initSlug];
  if (initId) {
    const initEl = document.getElementById(initId);
    if (initEl) setTimeout(() => initEl.scrollIntoView(), 80);
  }

  // -------- sticky CTA bar --------
  const stickyBar = document.getElementById('stickyBar');
  const hero = document.getElementById('domov');
  if (stickyBar && hero) {
    const stickyIO = new IntersectionObserver(([e]) => {
      stickyBar.classList.toggle('visible', !e.isIntersecting);
      stickyBar.setAttribute('aria-hidden', String(e.isIntersecting));
    }, { threshold: 0.1 });
    stickyIO.observe(hero);
  }
  const sbf = document.getElementById('stickyBarForm');
  if (sbf) {
    sbf.addEventListener('submit', (ev) => {
      ev.preventDefault();
      fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(new FormData(sbf)).toString() })
        .finally(() => {
          sbf.style.display = 'none';
          const ok = document.getElementById('stickyBarOk');
          if (ok) ok.style.display = 'block';
        });
    });
  }

  // -------- testimonials infinite scroll — duplicate cards --------
  const track = document.getElementById('testiTrack');
  if (track) {
    const clone = track.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    track.parentElement.appendChild(clone);
  }

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

  // -------- mobile menu --------
  const burger = document.querySelector('.nav-burger');
  const mobileNav = document.querySelector('#navMobile');
  const closeMobile = () => {
    burger?.classList.remove('open');
    mobileNav?.classList.remove('open');
    burger?.setAttribute('aria-expanded', 'false');
  };
  if (burger && mobileNav) {
    burger.addEventListener('click', () => {
      const isOpen = mobileNav.classList.toggle('open');
      burger.classList.toggle('open', isOpen);
      burger.setAttribute('aria-expanded', String(isOpen));
    });
    mobileNav.querySelectorAll('a').forEach((a) => a.addEventListener('click', closeMobile));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMobile(); });
  }

  // -------- active nav link on scroll + pushState URL update --------
  const sections = Array.from(document.querySelectorAll('section[id], header[id]'));
  const navAnchors = Array.from(document.querySelectorAll('.nav-links a[href^="#"]'));
  const setActive = (id) => {
    navAnchors.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + id));
    const slug = slugMap[id] || '/';
    if (location.pathname !== slug) history.replaceState({ section: id }, '', slug);
  };
  if ('IntersectionObserver' in window && navAnchors.length) {
    const navIO = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); });
    }, { rootMargin: '-40% 0px -55% 0px' });
    sections.forEach((s) => navIO.observe(s));
  }

  // -------- contact form -> Netlify Forms --------
  const cf = document.querySelector('#contactForm');
  if (cf) {
    cf.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const btn = cf.querySelector('button[type="submit"]');
      if (btn) { btn.disabled = true; btn.textContent = 'Odesílám…'; }
      fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(new FormData(cf)).toString()
      })
        .then(() => {
          cf.innerHTML = '<div class="form-success"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="40" height="40"><path d="M5 12l4 4 10-10"/></svg><h3>Zpráva odeslána!</h3><p>Děkujeme, ozveme se do 24 hodin.</p></div>';
        })
        .catch(() => {
          if (btn) { btn.disabled = false; btn.textContent = 'Odeslat zprávu'; }
          alert('Nepodařilo se odeslat zprávu. Zkuste to prosím znovu.');
        });
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
          if (typeof gtag !== 'undefined') gtag('event', 'generate_lead', { event_category: 'hero' });
        });
    });
  }

  // -------- sticky bar newsletter -> GA4 event --------
  const sbfOrig = document.getElementById('stickyBarForm');
  if (sbfOrig) {
    sbfOrig.addEventListener('submit', () => {
      if (typeof gtag !== 'undefined') gtag('event', 'generate_lead', { event_category: 'sticky_bar' });
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
