document.addEventListener('DOMContentLoaded', function () {
  var grid = document.getElementById('newsGrid');
  var pagination = document.getElementById('newsPagination');
  var modal = document.getElementById('newsModal');
  if (!grid || !pagination || !modal) return;

  var state = { posts: [], postsPerPage: 9, page: 1 };
  var modalEls = {
    backdrop: modal.querySelector('.news-modal-backdrop'),
    closeBtn: modal.querySelector('.news-modal-close'),
    image: modal.querySelector('.news-modal-image'),
    date: modal.querySelector('.news-modal-date'),
    title: modal.querySelector('.news-modal-title'),
    content: modal.querySelector('.news-modal-content'),
    gallery: modal.querySelector('.news-modal-gallery')
  };

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
        if (typeof item === 'string') {
          return { src: item, caption: '' };
        }
        if (item && item.src) {
          return { src: item.src, caption: item.caption || '' };
        }
        return null;
      })
      .filter(Boolean);
  }

  function findPost(id) {
    return state.posts.find(function (p) {
      return p.id === id;
    });
  }

  function totalPages() {
    return Math.max(1, Math.ceil(state.posts.length / state.postsPerPage));
  }

  function pagePosts() {
    var start = (state.page - 1) * state.postsPerPage;
    return state.posts.slice(start, start + state.postsPerPage);
  }

  function renderGrid() {
    var items = pagePosts();
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
          '<h2 class="news-card-title">', title, '</h2>',
          '<p class="news-card-meta"><time datetime="', escapeHtml(post.date || ''), '">', date, '</time></p>',
          '<p class="news-card-excerpt">', excerpt, '</p>',
          '</div>',
          '</article>'
        ].join('');
      })
      .join('');
  }

  function renderPagination() {
    var pages = totalPages();
    if (pages <= 1) {
      pagination.innerHTML = '';
      pagination.hidden = true;
      return;
    }
    pagination.hidden = false;

    var parts = ['<div class="news-pagination-pages" role="group" aria-label="Page numbers">'];
    for (var i = 1; i <= pages; i++) {
      var active = i === state.page;
      parts.push(
        '<button type="button" class="news-page-btn',
        active ? ' is-active' : '',
        '" data-page="', i, '"',
        active ? ' aria-current="page"' : '',
        '>', i, '</button>'
      );
    }
    parts.push('</div>');

    if (state.page < pages) {
      parts.push(
        '<button type="button" class="news-pagination-next" data-page="',
        state.page + 1,
        '">Next &rarr;</button>'
      );
    }

    pagination.innerHTML = parts.join('');
  }

  function renderGallery(images, postTitle) {
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
    if (!post) return;

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

    var paragraphs = getLongDescription(post);
    modalEls.content.innerHTML = paragraphs
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
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('news-modal-open');
    modalEls.image.removeAttribute('src');
    modalEls.image.hidden = false;
    modalEls.content.innerHTML = '';
    modalEls.gallery.innerHTML = '';
    modalEls.gallery.hidden = true;
  }

  function goToPage(page) {
    state.page = Math.min(Math.max(1, page), totalPages());
    renderGrid();
    renderPagination();
    grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

  pagination.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-page]');
    if (!btn) return;
    e.preventDefault();
    goToPage(parseInt(btn.getAttribute('data-page'), 10));
  });

  modalEls.backdrop.addEventListener('click', closeModal);
  modalEls.closeBtn.addEventListener('click', closeModal);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !modal.hidden) closeModal();
  });

  fetch('news.json')
    .then(function (res) {
      if (!res.ok) throw new Error('Failed to load news');
      return res.json();
    })
    .then(function (data) {
      state.posts = data.posts || [];
      state.postsPerPage = data.postsPerPage || 9;
      state.page = 1;
      renderGrid();
      renderPagination();
    })
    .catch(function () {
      grid.innerHTML =
        '<p class="news-empty">Unable to load news posts. Please try again later.</p>';
      pagination.hidden = true;
    });
});
