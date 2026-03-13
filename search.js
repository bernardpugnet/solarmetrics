/**
 * Solar Data Atlas Site Search
 * Lightweight client-side search using a JSON index.
 */
(function () {
  'use strict';

  // Detect language from <html lang="...">
  var lang = document.documentElement.lang === 'fr' ? 'fr' : 'en';

  // Determine base path (pages in subdirectories need ../)
  var depth = 0;
  var path = window.location.pathname;
  if (lang === 'fr' && path.indexOf('/fr/analyses/') !== -1) depth = 1;
  if (lang === 'en' && path.indexOf('/en/insights/') !== -1) depth = 1;
  var prefix = depth === 1 ? '../' : '';

  // Labels
  var labels = {
    fr: { placeholder: 'Rechercher…', noResults: 'Aucun résultat', close: 'Fermer' },
    en: { placeholder: 'Search…', noResults: 'No results', close: 'Close' }
  };
  var L = labels[lang];

  var searchIndex = null;
  var searchOpen = false;

  // Build the search overlay HTML
  function buildSearchUI() {
    // Overlay
    var overlay = document.createElement('div');
    overlay.id = 'searchOverlay';
    overlay.style.cssText = 'display:none;position:fixed;inset:0;z-index:999;background:rgba(15,23,42,0.85);backdrop-filter:blur(4px);padding:1rem;';
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeSearch();
    });

    // Container
    var container = document.createElement('div');
    container.style.cssText = 'max-width:540px;margin:80px auto 0;background:#1e293b;border:1px solid #334155;border-radius:0.75rem;overflow:hidden;box-shadow:0 25px 60px rgba(0,0,0,0.5);';

    // Input row
    var inputRow = document.createElement('div');
    inputRow.style.cssText = 'display:flex;align-items:center;padding:0.75rem 1rem;border-bottom:1px solid #334155;gap:0.75rem;';

    // Search icon
    var icon = document.createElement('span');
    icon.innerHTML = '<svg width="20" height="20" fill="none" stroke="#94a3b8" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>';

    // Input
    var input = document.createElement('input');
    input.type = 'text';
    input.id = 'searchInput';
    input.placeholder = L.placeholder;
    input.autocomplete = 'off';
    input.style.cssText = 'flex:1;background:transparent;border:none;outline:none;color:#e2e8f0;font-size:1rem;font-family:Inter,sans-serif;';

    // ESC hint
    var escHint = document.createElement('kbd');
    escHint.textContent = 'ESC';
    escHint.style.cssText = 'padding:2px 6px;background:#0f172a;color:#64748b;font-size:0.7rem;border-radius:4px;border:1px solid #334155;cursor:pointer;';
    escHint.addEventListener('click', closeSearch);

    inputRow.appendChild(icon);
    inputRow.appendChild(input);
    inputRow.appendChild(escHint);

    // Results container
    var results = document.createElement('div');
    results.id = 'searchResults';
    results.style.cssText = 'max-height:400px;overflow-y:auto;padding:0.5rem;';

    container.appendChild(inputRow);
    container.appendChild(results);
    overlay.appendChild(container);
    document.body.appendChild(overlay);

    // Events
    input.addEventListener('input', function () {
      doSearch(input.value.trim());
    });

    return { overlay: overlay, input: input, results: results };
  }

  var ui = null;

  function openSearch() {
    if (!ui) ui = buildSearchUI();
    ui.overlay.style.display = 'block';
    ui.input.value = '';
    ui.results.innerHTML = '';
    searchOpen = true;
    setTimeout(function () { ui.input.focus(); }, 50);
    loadIndex();
  }

  function closeSearch() {
    if (ui) {
      ui.overlay.style.display = 'none';
      searchOpen = false;
    }
  }

  function loadIndex() {
    if (searchIndex) return;
    var indexFile = lang === 'fr' ? 'search-index-fr.json' : 'search-index-en.json';
    // Compute path to root
    var rootPrefix = '';
    if (path.indexOf('/' + lang + '/analyses/') !== -1 || path.indexOf('/' + lang + '/insights/') !== -1) {
      rootPrefix = '../../';
    } else if (path.indexOf('/' + lang + '/') !== -1) {
      rootPrefix = '../';
    }
    fetch(rootPrefix + indexFile)
      .then(function (r) { return r.json(); })
      .then(function (data) { searchIndex = data; })
      .catch(function () { searchIndex = []; });
  }

  function doSearch(query) {
    if (!ui) return;
    if (!query || query.length < 2) {
      ui.results.innerHTML = '';
      return;
    }
    if (!searchIndex) {
      ui.results.innerHTML = '<p style="color:#64748b;padding:1rem;text-align:center;">...</p>';
      setTimeout(function () { doSearch(query); }, 200);
      return;
    }

    var q = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    var words = q.split(/\s+/).filter(function (w) { return w.length >= 2; });

    var scored = [];
    searchIndex.forEach(function (item) {
      var title = (item.title || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      var desc = (item.desc || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      var kw = (item.kw || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      var haystack = title + ' ' + desc + ' ' + kw;

      var score = 0;
      var allMatch = true;
      words.forEach(function (w) {
        if (haystack.indexOf(w) === -1) {
          allMatch = false;
        } else {
          if (title.indexOf(w) !== -1) score += 10;
          if (kw.indexOf(w) !== -1) score += 5;
          if (desc.indexOf(w) !== -1) score += 2;
        }
      });

      if (allMatch && score > 0) {
        scored.push({ item: item, score: score });
      }
    });

    scored.sort(function (a, b) { return b.score - a.score; });

    if (scored.length === 0) {
      ui.results.innerHTML = '<p style="color:#64748b;padding:1.5rem;text-align:center;font-size:0.9rem;">' + L.noResults + '</p>';
      return;
    }

    var html = '';
    scored.slice(0, 8).forEach(function (r) {
      var item = r.item;
      html += '<a href="' + prefix + item.url + '" style="display:block;padding:0.75rem 1rem;border-radius:0.5rem;text-decoration:none;transition:background 0.15s;" onmouseover="this.style.background=\'#334155\'" onmouseout="this.style.background=\'transparent\'">';
      html += '<div style="color:#f8fafc;font-size:0.9rem;font-weight:600;">' + escapeHtml(item.title) + '</div>';
      if (item.desc) {
        html += '<div style="color:#94a3b8;font-size:0.8rem;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escapeHtml(item.desc) + '</div>';
      }
      html += '</a>';
    });
    ui.results.innerHTML = html;
  }

  function escapeHtml(text) {
    var d = document.createElement('div');
    d.textContent = text;
    return d.innerHTML;
  }

  // Global keyboard shortcut: Ctrl+K or Cmd+K
  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      if (searchOpen) closeSearch(); else openSearch();
    }
    if (e.key === 'Escape' && searchOpen) {
      closeSearch();
    }
  });

  // Expose globally for nav button
  window.openSiteSearch = openSearch;
})();
