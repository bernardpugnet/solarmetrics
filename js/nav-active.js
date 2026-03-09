// nav-active.js — Highlights the current page in nav (desktop + mobile)
// Works with both /page.html and Netlify pretty URLs (/page)
(function () {
  // Helper: extract page slug without .html
  function slug(str) {
    var s = (str || '').split('/').pop().split('?')[0].split('#')[0];
    return s.replace(/\.html$/, '');
  }

  var path = location.pathname;
  // Get current page slug (no .html)
  var page = slug(path);
  // Root, empty, or language root → index
  if (!page || page === 'fr' || page === 'en') page = 'index';

  // Map pages to their parent dropdown category (slugs without .html)
  var categories = {
    'economie': ['economie','marches','prix-solaire','hypotheses','risques-bankability','comparatif-pays'],
    'technologies': ['technologies','technologies-emergentes','vehicle-to-grid','centrales-virtuelles','physique-electricite-ferme-photovoltaique'],
    'outils': ['outils','outils-simulation','outils-industriel','outils-residentiel','comparateur','guide-installation','widgets','schema-grande-installation','schema-plug-and-play'],
    'ressources': ['ressources','recyclage-fin-de-vie','veille-reglementaire','mon-solaire-60s','etude-de-cas','ia-data']
  };

  var myCategory = null;
  for (var cat in categories) {
    if (categories[cat].indexOf(page) !== -1) { myCategory = cat; break; }
  }

  // Color constant
  var AMBER = '#fbbf24';

  // --- DESKTOP: highlight parent dropdown button ---
  if (myCategory) {
    var buttons = document.querySelectorAll('nav .relative.group > button');
    for (var i = 0; i < buttons.length; i++) {
      var btn = buttons[i];
      // Extract text only (skip SVG icons)
      var txt = '';
      for (var j = 0; j < btn.childNodes.length; j++) {
        if (btn.childNodes[j].nodeType === 3) txt += btn.childNodes[j].textContent;
      }
      txt = txt.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      // Match category name via substring
      if (
        (myCategory === 'economie' && txt.indexOf('conomie') > -1) ||
        (myCategory === 'technologies' && txt.indexOf('echnolog') > -1) ||
        (myCategory === 'outils' && txt.indexOf('util') > -1) ||
        (myCategory === 'ressources' && txt.indexOf('essource') > -1)
      ) {
        btn.style.color = AMBER;
      }
    }
  }

  // --- DESKTOP + MOBILE: highlight exact page link ---
  var allLinks = document.querySelectorAll('nav a[href]');
  for (var k = 0; k < allLinks.length; k++) {
    var a = allLinks[k];
    var linkSlug = slug(a.getAttribute('href'));
    if (linkSlug === page) {
      var inMobile = a.closest('#mobileMenu');
      if (inMobile) {
        // Mobile: amber text + bold
        a.style.color = AMBER;
        a.style.fontWeight = '600';
      } else if (a.closest('.relative.group')) {
        // Desktop dropdown sub-link: left amber border
        a.style.borderLeft = '3px solid ' + AMBER;
        a.style.paddingLeft = '13px';
      } else {
        // Desktop top-level link (Accueil, Analyses, Collaborer)
        a.style.color = AMBER;
      }
    }
  }
})();
