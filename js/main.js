document.addEventListener('DOMContentLoaded',function(){
  var navToggle=document.getElementById('navToggle');
  var siteNav=document.getElementById('siteNav');

  var mobileNavQuery = window.matchMedia('(max-width: 880px)');

  function syncNavAria(open){
    if(mobileNavQuery.matches){
      siteNav.setAttribute('aria-hidden', open ? 'false' : 'true');
    } else {
      siteNav.removeAttribute('aria-hidden');
    }
  }

  function setNavOpen(open){
    if(!siteNav || !navToggle) return;
    siteNav.classList.toggle('open', open);
    document.body.classList.toggle('nav-open', open);
    var header = navToggle.closest('.site-header');
    if(header) header.classList.toggle('nav-open', open);
    navToggle.classList.toggle('is-open', open);
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    syncNavAria(open);
  }

  function closeNav(){
    setNavOpen(false);
  }

  if(navToggle && siteNav){
    syncNavAria(false);
    mobileNavQuery.addEventListener('change',function(){
      if(!mobileNavQuery.matches) closeNav();
      syncNavAria(siteNav.classList.contains('open'));
    });

    navToggle.addEventListener('click',function(){
      setNavOpen(!siteNav.classList.contains('open'));
    });

    document.addEventListener('keydown',function(e){
      if(e.key === 'Escape' && siteNav.classList.contains('open')) closeNav();
    });

    // Close mobile nav when a link is clicked
    siteNav.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click',closeNav);
    });

    function slugFromPath(pathname){
      var parts = String(pathname || '').toLowerCase().split('/').filter(Boolean);
      if(!parts.length) return 'home';
      var last = parts[parts.length - 1];
      if(last === 'index.html' || last === 'index.htm'){
        return parts.length > 1 ? parts[parts.length - 2] : 'home';
      }
      if(last.endsWith('.html')) last = last.slice(0, -5);
      return last;
    }

    function slugFromHref(href){
      href = (href || '').split('#')[0].split('?')[0].toLowerCase();
      if(!href || href === './' || href === '/') return 'home';
      if(/^(https?:|mailto:|tel:)/.test(href)) return '';
      href = href.replace(/^\.\/?/, '');
      href = href.replace(/\/+$/, '');
      if(!href) return 'home';
      if(href === 'index.html') return 'home';
      if(href.endsWith('.html')) href = href.slice(0, -5);
      var parts = href.split('/').filter(Boolean);
      if(parts[parts.length - 1] === 'index') parts.pop();
      return parts[parts.length - 1] || 'home';
    }

    var currentSlug = slugFromPath(location.pathname);
    siteNav.querySelectorAll('a').forEach(function(link){
      var slug = slugFromHref(link.getAttribute('href'));
      if(!slug) return;
      if(slug === currentSlug){
        link.classList.add('active');
        link.setAttribute('aria-current','page');
      }
    });
  }

  var form=document.getElementById('contactForm');
  if(form){
    form.addEventListener('submit',function(e){
      e.preventDefault();
      var name=form.elements['name'].value.trim();
      var email=form.elements['email'].value.trim();
      var message=form.elements['message'].value.trim();
      if(!name||!email||!message){
        alert('Please complete all fields.');
        return;
      }
      alert('Thanks — your inquiry has been received (demo).');
      form.reset();
    });
  }

  var scrollTopBtn = document.getElementById('scrollTop');
  if(scrollTopBtn){
    window.addEventListener('scroll', function(){
      scrollTopBtn.classList.toggle('visible', window.scrollY > 400);
    });
    scrollTopBtn.addEventListener('click', function(){
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
});
