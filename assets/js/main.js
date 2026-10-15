// NT Design Engineering — site interactions
(function () {
  var EN = document.documentElement.lang === 'en';
  var T = EN
    ? { close: 'Close', prev: 'Previous', next: 'Next', name: 'Name', company: 'Company', phone: 'Phone', email: 'Email', type: 'Type of work', details: 'Details', subject: 'Quotation request - ' }
    : { close: 'ปิด', prev: 'ก่อนหน้า', next: 'ถัดไป', name: 'ชื่อ', company: 'บริษัท', phone: 'โทร', email: 'อีเมล', type: 'ประเภทงาน', details: 'รายละเอียด', subject: 'ขอใบเสนอราคา - ' };
  // Mobile menu
  var toggle = document.querySelector('.menu-toggle');
  var nav = document.querySelector('.nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open);
    });
    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { nav.classList.remove('open'); });
    });
  }

  // Home page: highlight the menu item for the section in view
  // (About / Services are same-page anchors, so the static "Home" highlight must follow the scroll)
  if (nav && document.getElementById('about')) {
    var homeLink = nav.querySelector('a[aria-current="page"]');
    var spy = [];
    document.querySelectorAll('main section[id]').forEach(function (sec) {
      var link = nav.querySelector('a[href$="#' + sec.id + '"], a[href="' + sec.id + '.html"]');
      spy.push({ sec: sec, link: link });
    });
    var current;
    function setActive(link) {
      if (link === current) return;
      nav.querySelectorAll('a[aria-current]').forEach(function (a) { a.removeAttribute('aria-current'); });
      if (link) link.setAttribute('aria-current', link === homeLink ? 'page' : 'location');
      current = link;
    }
    function onScroll() {
      var header = document.querySelector('.header');
      var line = (header ? header.offsetHeight : 0) + window.innerHeight * 0.3;
      var active = homeLink;
      spy.forEach(function (s) {
        if (s.sec.getBoundingClientRect().top <= line) active = s.link;
      });
      // at the very bottom, the last section (contact) is the one in view
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
        active = spy[spy.length - 1].link;
      }
      setActive(active);
    }
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(function () { ticking = false; onScroll(); }); }
    }, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();
  }

  // Reveal on scroll
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  // Count-up numbers
  var counters = document.querySelectorAll('[data-count]');
  function runCount(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    var start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / 1400, 1);
      el.firstChild.nodeValue = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if ('IntersectionObserver' in window) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { runCount(e.target); co.unobserve(e.target); }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { co.observe(el); });
  }

  // Project filters
  var filterBtns = document.querySelectorAll('.filters button');
  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      filterBtns.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      var f = btn.getAttribute('data-filter');
      document.querySelectorAll('.project').forEach(function (p) {
        var match = f === 'all' || (p.getAttribute('data-cat') || '').split(' ').indexOf(f) !== -1;
        p.classList.toggle('hidden', !match);
      });
    });
  });

  // Lightbox
  var zoomables = Array.prototype.slice.call(document.querySelectorAll('[data-zoom]'));
  if (zoomables.length) {
    var lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.innerHTML = '<button class="lb-close" aria-label="' + T.close + '">&times;</button>' +
      '<button class="lb-prev" aria-label="' + T.prev + '">&#8249;</button>' +
      '<img alt="">' +
      '<button class="lb-next" aria-label="' + T.next + '">&#8250;</button>' +
      '<div class="lb-caption"></div>';
    document.body.appendChild(lb);
    var lbImg = lb.querySelector('img');
    var lbCap = lb.querySelector('.lb-caption');
    var idx = 0;
    function visible() { return zoomables.filter(function (z) { return z.offsetParent !== null; }); }
    function show(i) {
      var list = visible();
      idx = (i + list.length) % list.length;
      var el = list[idx];
      var img = el.tagName === 'IMG' ? el : el.querySelector('img');
      lbImg.src = img.currentSrc || img.src;
      lbImg.alt = img.alt;
      lbCap.textContent = img.alt;
      lb.classList.add('open');
    }
    zoomables.forEach(function (z) {
      z.addEventListener('click', function () { show(visible().indexOf(z)); });
    });
    lb.querySelector('.lb-close').addEventListener('click', function () { lb.classList.remove('open'); });
    lb.querySelector('.lb-prev').addEventListener('click', function (e) { e.stopPropagation(); show(idx - 1); });
    lb.querySelector('.lb-next').addEventListener('click', function (e) { e.stopPropagation(); show(idx + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) lb.classList.remove('open'); });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') lb.classList.remove('open');
      if (e.key === 'ArrowLeft') show(idx - 1);
      if (e.key === 'ArrowRight') show(idx + 1);
    });
  }

  // Quote form -> opens the visitor's email app with the details filled in
  var form = document.getElementById('quote-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var d = new FormData(form);
      var body = T.name + ': ' + d.get('name') + '\n' + T.company + ': ' + d.get('company') +
        '\n' + T.phone + ': ' + d.get('phone') + '\n' + T.email + ': ' + d.get('email') +
        '\n' + T.type + ': ' + d.get('type') + '\n\n' + T.details + ':\n' + d.get('message');
      window.location.href = 'mailto:nt_designengineering2009@hotmail.com?subject=' +
        encodeURIComponent(T.subject + d.get('type')) + '&body=' + encodeURIComponent(body);
    });
  }

  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();
