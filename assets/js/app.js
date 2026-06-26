/**
 * AI Flux - Static Site Frontend App
 * Handles category filtering and "load more" functionality.
 */
(function () {
  'use strict';

  var API_BASE = '/data/articles.json';
  var allArticles = [];
  // Detect category from query param (?category=) or URL path (/{category}/{id}/ for detail pages)
  function getCategoryFromPath() {
    var known = ['Frontiers', 'Deep Reads', 'Business', 'Dev Hub', 'Tools', 'Reports'];
    var path = window.location.pathname.replace(/\/+$/, '');
    var segs = path.split('/');
    for (var i = 0; i < segs.length; i++) {
      for (var j = 0; j < known.length; j++) {
        if (segs[i] === known[j]) return known[j];
      }
    }
    return null;
  }
  var currentCategory = getQueryParam('category') || getCategoryFromPath() || null;
  var visibleCount = 20;
  var loadMoreBtn = null;
  var articleGrid = null;

  function getQueryParam(name) {
    var params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  function render(articles) {
    if (!articleGrid) return;

    // Filter by category
    var filtered = articles;
    if (currentCategory) {
      filtered = articles.filter(function (a) { return a.category === currentCategory; });
    }

    var slice = filtered.slice(0, visibleCount);
    var html = '';

    slice.forEach(function (article, index) {
      var featuredClass = (index === 0 && !currentCategory) ? ' featured' : '';
      var thumbnail = article.thumbnail || '';
      html +=
        '<article class="article-card' + featuredClass + '">' +
          '<a href="' + article.url + '">' +
            (thumbnail ? '<img src="' + thumbnail + '" alt="' + escapeHtml(article.title) + '" loading="lazy">' : '') +
            '<div class="content">' +
              '<span class="category-tag">' + escapeHtml(article.category) + '</span>' +
              '<h2>' + escapeHtml(article.title) + '</h2>' +
              '<p>' + escapeHtml(article.summary || '') + '</p>' +
            '</div>' +
          '</a>' +
        '</article>';
    });

    articleGrid.innerHTML = html;

    if (loadMoreBtn) {
      if (filtered.length > visibleCount) {
        loadMoreBtn.style.display = 'block';
      } else {
        loadMoreBtn.style.display = 'none';
      }
    }
  }

  function escapeHtml(text) {
    if (!text) return '';
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(text));
    return div.innerHTML;
  }

  function updateNavHighlight() {
    var links = document.querySelectorAll('.category-nav a');
    links.forEach(function(link) {
      link.classList.remove('active');
    });
    var cat = currentCategory;
    if (!cat) cat = getCategoryFromPath();
    if (cat) {
      var found = false;
      document.querySelectorAll('.category-nav a').forEach(function(l) {
        if (l.getAttribute('href').indexOf('?category=' + cat) !== -1) {
          l.classList.add('active');
          found = true;
        }
      });
      if (!found) {
        document.querySelectorAll('.category-nav a').forEach(function(l) {
          if (l.textContent.trim() === cat) {
            l.classList.add('active');
          }
        });
      }
    } else {
      var first = document.querySelector('.category-nav a');
      if (first) first.classList.add('active');
    }
  }

  function loadArticles() {
    // Apply nav highlight immediately based on current URL
    updateNavHighlight();
    
    fetch(API_BASE + '?t=' + Date.now())
      .then(function (res) { return res.json(); })
      .then(function (data) {
        allArticles = data;
        render(allArticles);
        updateNavHighlight();
      })
      .catch(function () {
        try {
          var cached = localStorage.getItem('aiflux_articles');
          if (cached) {
            allArticles = JSON.parse(cached);
            render(allArticles);
            updateNavHighlight();
          }
        } catch (e) {
          console.error('Failed to load articles');
        }
      });
  }

  function init() {
    articleGrid = document.getElementById('article-grid');
    if (!articleGrid) return;
    // Create load more button
    loadMoreBtn = document.createElement('button');
    loadMoreBtn.textContent = 'Load More';
    loadMoreBtn.className = 'load-more-btn';
      'display:block;margin:24px auto;padding:12px 32px;' +
      'background:var(--wsj-accent);color:white;border:none;' +
      'border-radius:4px;font-family:var(--wsj-font-sans);' +
      'font-size:14px;cursor:pointer;transition:opacity 0.2s;';
    loadMoreBtn.addEventListener('mouseenter', function () { this.style.opacity = '0.9'; });
    loadMoreBtn.addEventListener('mouseleave', function () { this.style.opacity = '1'; });
    loadMoreBtn.addEventListener('click', function () {
      visibleCount += 20;
      render(allArticles);
    });
    articleGrid.parentNode.appendChild(loadMoreBtn);
    // Load data (updateNavHighlight is called inside loadArticles)
    loadArticles();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
