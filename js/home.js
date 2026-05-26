document.addEventListener('DOMContentLoaded', function () {
  if (!document.body.classList.contains('page-home')) return;

  initBanner();
  initPartners();
  initStats();
  initHomeNews();
});

function initCarousel(opts) {
  var slides = opts.slides;
  var prevBtn = opts.prevBtn;
  var nextBtn = opts.nextBtn;
  var dots = opts.dots;
  var onChange = opts.onChange;
  var index = 0;
  var timer = opts.autoplayMs;

  if (!slides.length) return null;

  function show(i) {
    index = (i + slides.length) % slides.length;
    slides.forEach(function (slide, n) {
      var active = n === index;
      slide.classList.toggle('is-active', active);
      slide.hidden = !active;
    });
    if (dots) {
      dots.forEach(function (dot, n) {
        var active = n === index;
        dot.classList.toggle('is-active', active);
        dot.setAttribute('aria-selected', active ? 'true' : 'false');
      });
    }
    if (onChange) onChange(slides[index], index);
  }

  function next() { show(index + 1); }
  function prev() { show(index - 1); }

  if (prevBtn) prevBtn.addEventListener('click', prev);
  if (nextBtn) nextBtn.addEventListener('click', next);

  if (dots) {
    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        var i = parseInt(dot.getAttribute('data-index'), 10);
        if (!isNaN(i)) show(i);
      });
    });
  }

  var intervalId;
  function startAutoplay() {
    if (!timer) return;
    stopAutoplay();
    intervalId = window.setInterval(next, timer);
  }
  function stopAutoplay() {
    if (intervalId) window.clearInterval(intervalId);
  }

  if (opts.root) {
    opts.root.addEventListener('mouseenter', stopAutoplay);
    opts.root.addEventListener('mouseleave', startAutoplay);
    opts.root.addEventListener('focusin', stopAutoplay);
    opts.root.addEventListener('focusout', startAutoplay);
  }

  show(0);
  startAutoplay();

  return { show: show, next: next, prev: prev, stopAutoplay: stopAutoplay, startAutoplay: startAutoplay };
}

function initBanner() {
  var root = document.querySelector('.home-banner');
  if (!root) return;

  var slides = Array.prototype.slice.call(root.querySelectorAll('.home-banner-slide'));
  initCarousel({
    root: root,
    slides: slides,
    prevBtn: document.getElementById('homeBannerPrev'),
    nextBtn: document.getElementById('homeBannerNext'),
    dots: Array.prototype.slice.call(document.querySelectorAll('#homeBannerDots button')),
    autoplayMs: 7000
  });
}

function initPartners() {
  var track = document.getElementById('homePartnersTrack');
  if (!track || !track.children.length) return;

  var items = Array.prototype.slice.call(track.children);
  items.forEach(function (node) {
    track.appendChild(node.cloneNode(true));
  });

  var offset = 0;
  var speed = 0.35;

  function step() {
    offset += speed;
    var half = track.scrollWidth / 2;
    if (offset >= half) offset = 0;
    track.style.transform = 'translate3d(' + (-offset) + 'px,0,0)';
    requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

function initStats() {
  var els = Array.prototype.slice.call(document.querySelectorAll('.home-stat-value[data-count]'));
  if (!els.length) return;

  function animate(el) {
    var target = parseInt(el.getAttribute('data-count'), 10) || 0;
    var duration = Math.max(600, Math.min(2500, 1500 + target * 80));
    var start = 0;
    var startTime = null;

    function step(ts) {
      if (!startTime) startTime = ts;
      var progress = Math.min((ts - startTime) / duration, 1);
      var current = Math.floor(progress * (target - start) + start);
      el.textContent = '+' + current;
      if (progress < 1) window.requestAnimationFrame(step);
      else el.textContent = '+' + target;
    }

    window.requestAnimationFrame(step);
  }

  if ('IntersectionObserver' in window) {
    var obs = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animate(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    els.forEach(function (el) {
      el.textContent = '+0';
      obs.observe(el);
    });
  } else {
    els.forEach(function (el) {
      el.textContent = '+0';
      animate(el);
    });
  }
}

function initHomeNews() {
  var grid = document.getElementById('homeNewsGrid');
  var modal = document.getElementById('newsModal');
  if (!grid) return;

  var posts = [];
  var modalEls = modal
    ? {
        backdrop: modal.querySelector('.news-modal-backdrop'),
        closeBtn: modal.querySelector('.news-modal-close'),
        image: modal.querySelector('.news-modal-image'),
        date: modal.querySelector('.news-modal-date'),
        title: modal.querySelector('.news-modal-title'),
        content: modal.querySelector('.news-modal-content'),
        gallery: modal.querySelector('.news-modal-gallery')
      }
    : null;

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatDate(iso) {
    if (!iso) return '';
    var d = new Date(iso + 'T12:00:00');
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  }

  function getLongDescription(post) {
    if (Array.isArray(post.longDescription) && post.longDescription.length) {
      return post.longDescription;
    }
    if (post.longDescription) return [post.longDescription];
    if (Array.isArray(post.content) && post.content.length) return post.content;
    if (post.content) return [post.content];
    return post.excerpt ? [post.excerpt] : [];
  }

  function normalizeImages(post) {
    var list = post.images;
    if (!Array.isArray(list)) return [];
    return list
      .map(function (item) {
        if (typeof item === 'string') return { src: item, caption: '' };
        if (item && item.src) return { src: item.src, caption: item.caption || '' };
        return null;
      })
      .filter(Boolean);
  }

  function findPost(id) {
    return posts.find(function (p) {
      return p.id === id;
    });
  }

  function topPosts(all) {
    return all
      .slice()
      .sort(function (a, b) {
        return (b.date || '').localeCompare(a.date || '');
      })
      .slice(0, 5);
  }

  function renderGrid() {
    var items = topPosts(posts);
    if (!items.length) {
      grid.innerHTML = '<p class="news-empty">No news posts yet.</p>';
      return;
    }

    grid.innerHTML = items
      .map(function (post) {
        var img = encodeURI(post.image || '');
        var title = escapeHtml(post.title);
        var date = escapeHtml(formatDate(post.date));
        var excerpt = escapeHtml(post.excerpt);

        return [
          '<article class="news-card" data-post-id="', escapeHtml(post.id), '" tabindex="0" role="button" aria-label="Read: ', title, '">',
          '<div class="news-card-media">',
          '<img src="', img, '" alt="" loading="lazy">',
          '</div>',
          '<div class="news-card-body">',
          '<h3 class="news-card-title">', title, '</h3>',
          '<p class="news-card-meta"><time datetime="', escapeHtml(post.date || ''), '">', date, '</time></p>',
          '<p class="news-card-excerpt">', excerpt, '</p>',
          '</div>',
          '</article>'
        ].join('');
      })
      .join('');
  }

  function renderGallery(images, postTitle) {
    if (!modalEls) return;
    if (!images.length) {
      modalEls.gallery.innerHTML = '';
      modalEls.gallery.hidden = true;
      return;
    }

    modalEls.gallery.hidden = false;
    modalEls.gallery.innerHTML =
      '<h3 class="news-modal-gallery-title">Gallery</h3>' +
      '<div class="news-modal-gallery-grid">' +
      images
        .map(function (img, index) {
          var src = encodeURI(img.src);
          var alt = escapeHtml(img.caption || postTitle + ' — image ' + (index + 1));
          var caption = img.caption
            ? '<figcaption>' + escapeHtml(img.caption) + '</figcaption>'
            : '';
          return (
            '<figure class="news-modal-gallery-item">' +
            '<img src="' + src + '" alt="' + alt + '" loading="lazy">' +
            caption +
            '</figure>'
          );
        })
        .join('') +
      '</div>';
  }

  function openModal(post) {
    if (!modalEls || !modal || !post) return;

    var banner = post.image || '';
    if (banner) {
      modalEls.image.src = encodeURI(banner);
      modalEls.image.alt = post.title || '';
      modalEls.image.hidden = false;
    } else {
      modalEls.image.removeAttribute('src');
      modalEls.image.hidden = true;
    }

    modalEls.date.textContent = formatDate(post.date);
    modalEls.date.setAttribute('datetime', post.date || '');
    modalEls.title.textContent = post.title || '';
    modalEls.content.innerHTML = getLongDescription(post)
      .map(function (p) {
        return '<p>' + escapeHtml(p) + '</p>';
      })
      .join('');

    renderGallery(normalizeImages(post), post.title || '');

    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('news-modal-open');
    modal.querySelector('.news-modal-scroll').scrollTop = 0;
    modalEls.closeBtn.focus();
  }

  function closeModal() {
    if (!modalEls || !modal) return;
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('news-modal-open');
    modalEls.image.removeAttribute('src');
    modalEls.image.hidden = false;
    modalEls.content.innerHTML = '';
    modalEls.gallery.innerHTML = '';
    modalEls.gallery.hidden = true;
  }

  grid.addEventListener('click', function (e) {
    var card = e.target.closest('.news-card');
    if (!card) return;
    var post = findPost(card.getAttribute('data-post-id'));
    if (post) openModal(post);
  });

  grid.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var card = e.target.closest('.news-card');
    if (!card) return;
    e.preventDefault();
    var post = findPost(card.getAttribute('data-post-id'));
    if (post) openModal(post);
  });

  if (modalEls) {
    modalEls.backdrop.addEventListener('click', closeModal);
    modalEls.closeBtn.addEventListener('click', closeModal);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal && !modal.hidden) closeModal();
    });
  }

  fetch('news.json')
    .then(function (res) {
      if (!res.ok) throw new Error('Failed to load news');
      return res.json();
    })
    .then(function (data) {
      posts = data.posts || [];
      renderGrid();
    })
    .catch(function () {
      grid.innerHTML =
        '<p class="news-empty">Unable to load news posts. Please try again later.</p>';
    });
}
