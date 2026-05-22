document.addEventListener('DOMContentLoaded', function () {
  var grid = document.getElementById('galleryGrid');
  if (!grid) return;

  var lightbox = document.getElementById('galleryLightbox');
  var lightboxImg = document.getElementById('galleryLightboxImg');
  var lightboxCaption = document.getElementById('galleryLightboxCaption');
  var prevBtn = document.getElementById('galleryPrev');
  var nextBtn = document.getElementById('galleryNext');

  var images = [];
  var currentIndex = 0;

  function imageSrc(file) {
    return 'media/gallery/' + encodeURI(file);
  }

  function sortNewestFirst(list) {
    return list.slice().sort(function (a, b) {
      var da = a.date || '';
      var db = b.date || '';
      if (da !== db) return db.localeCompare(da);
      return (b.file || '').localeCompare(a.file || '');
    });
  }

  function renderGrid() {
    grid.innerHTML = '';
    if (!images.length) {
      grid.innerHTML = '<p class="gallery-empty">No gallery images yet. Add photos to <code>media/gallery/</code> and update <code>gallery.json</code>.</p>';
      return;
    }

    images.forEach(function (item, index) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'gallery-item';
      btn.setAttribute('data-index', String(index));
      btn.setAttribute('aria-label', item.caption || 'Open gallery image');

      var img = document.createElement('img');
      img.src = imageSrc(item.file);
      img.alt = item.caption || 'Gallery image';
      img.loading = index < 6 ? 'eager' : 'lazy';
      btn.appendChild(img);

      if (item.caption) {
        var cap = document.createElement('span');
        cap.className = 'gallery-item-caption';
        cap.textContent = item.caption;
        btn.appendChild(cap);
      }

      btn.addEventListener('click', function () {
        openLightbox(index);
      });

      grid.appendChild(btn);
    });
  }

  function openLightbox(index) {
    if (!images.length || !lightbox) return;
    currentIndex = index;
    updateLightbox();
    lightbox.hidden = false;
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.classList.add('gallery-modal-open');
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.hidden = true;
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('gallery-modal-open');
    if (lightboxImg) lightboxImg.src = '';
  }

  function updateLightbox() {
    var item = images[currentIndex];
    if (!item || !lightboxImg) return;
    lightboxImg.src = imageSrc(item.file);
    lightboxImg.alt = item.caption || 'Gallery image';
    if (lightboxCaption) {
      lightboxCaption.textContent = item.caption || '';
      lightboxCaption.hidden = !item.caption;
    }
    if (prevBtn) prevBtn.disabled = images.length <= 1;
    if (nextBtn) nextBtn.disabled = images.length <= 1;
  }

  function showPrev() {
    if (!images.length) return;
    currentIndex = (currentIndex - 1 + images.length) % images.length;
    updateLightbox();
  }

  function showNext() {
    if (!images.length) return;
    currentIndex = (currentIndex + 1) % images.length;
    updateLightbox();
  }

  if (prevBtn) prevBtn.addEventListener('click', showPrev);
  if (nextBtn) nextBtn.addEventListener('click', showNext);

  if (lightbox) {
    lightbox.querySelectorAll('[data-close-lightbox]').forEach(function (el) {
      el.addEventListener('click', closeLightbox);
    });
  }

  document.addEventListener('keydown', function (e) {
    if (!lightbox || lightbox.hidden) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') showPrev();
    if (e.key === 'ArrowRight') showNext();
  });

  fetch('gallery.json')
    .then(function (res) {
      if (!res.ok) throw new Error('Failed to load gallery');
      return res.json();
    })
    .then(function (data) {
      images = sortNewestFirst(data.images || []);
      renderGrid();
    })
    .catch(function () {
      grid.innerHTML = '<p class="gallery-empty">Could not load the gallery. Check that <code>gallery.json</code> exists in the site root.</p>';
    });
});
