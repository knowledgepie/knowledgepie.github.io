document.addEventListener('DOMContentLoaded', function () {
  if (!document.body.classList.contains('page-home')) return;

  initBanner();
  initPartners();
  initVideos();
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

function youtubeEmbedUrl(id) {
  if (!id) return '';
  return 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) + '?rel=0';
}

function loadVideoIframe(slide) {
  if (!slide) return;
  var id = (slide.getAttribute('data-youtube-id') || '').trim();
  var iframe = slide.querySelector('iframe');
  if (!iframe || !id) return;
  var src = youtubeEmbedUrl(id);
  if (iframe.getAttribute('src') !== src) {
    iframe.setAttribute('src', src);
  }
}

function pauseVideoIframe(slide) {
  if (!slide) return;
  var iframe = slide.querySelector('iframe');
  if (!iframe) return;
  var src = iframe.getAttribute('src');
  if (src) {
    iframe.setAttribute('data-src', src);
    iframe.removeAttribute('src');
  }
}

function initVideos() {
  var root = document.getElementById('homeVideosCarousel');
  if (!root) return;

  var slides = Array.prototype.slice.call(root.querySelectorAll('.home-video-slide'));
  initCarousel({
    root: root,
    slides: slides,
    prevBtn: document.getElementById('homeVideosPrev'),
    nextBtn: document.getElementById('homeVideosNext'),
    autoplayMs: 0,
    onChange: function (active, i) {
      slides.forEach(function (slide, n) {
        if (n === i) loadVideoIframe(slide);
        else pauseVideoIframe(slide);
      });
    }
  });
}
