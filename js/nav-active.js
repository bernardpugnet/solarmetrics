// nav-active.js — Highlights the current page in nav (desktop + mobile)
(function () {
  var path = location.pathname;
  var page = path.split('/').pop() || 'index.html';
  // Handle trailing slash or no extension (Netlify pretty URLs)
  if (page === '' || page === 'fr') page = 'index.html';

  // Map pages to their parent dropdown category
  var categories = {
    'economie': ['economie.html','marches.html','prix-solaire.html','hypotheses.html','risques-bankability.html','comparatif-pays.html'],
    'technologies': ['technologies.html','technologies-emergentes.html','vehicle-to-grid.html','centrales-virtuelles.html','physique-electricite-ferme-photovoltaique.html'],
    'outils': ['outils.html','outils-simulation.html','outils-industriel.html','comparateur.html','guide-installation.html','widgets.html','schema-grande-installation.html','schema-plug-and-play.html'],
    'ressources': ['ressources.html','recyclage-fin-de-vie.html','veille-reglementaire.html','mon-solaire-60s.html','etude-de-cas.html','ia-data.html']
  };

  var myCategory = null;
  for (var cat in categories) {
    if (categories[cat].indexOf(page) !== -1) { myCategory = cat; break; }
  }

  // Color constants
  var AMBER = '#fbbf24';

  // --- DESKTOP: highlight parent dropdown button ---
  if (myCategory) {
    var buttons = document.querySelectorAll('nav .relative.group > button');
    for (var i = 0; i < buttons.length; i++) {
      var btn = buttons[i];
      // Extract text only (skip SVG)
      var txt = '';
      for (var j = 0; j < btn.childNodes.length; j++) {
        if (btn.childNodes[j].nodeType === 3) txt += btn.childNodes[j].textContent;
      }
      txt = txt.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      // Match category name
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
    var href = (a.getAttribute('href') || '').split('/').pop().split('?')[0].split('#')[0];
    if (href === page) {
      var inMobile = a.closest('#mobileMenu');
      if (inMobile) {
        // Mobile: amber text + bold
        a.style.color = AMBER;
        a.style.fontWeight = '600';
      } else if (a.closest('.relative.group')) {
        // Desktop dropdown sub-link: left border
        a.style.borderLeft = '3px solid ' + AMBER;
        a.style.paddingLeft = '13px';
      } else {
        // Desktop top-level link (Accueil, Analyses, Collaborer)
        a.style.color = AMBER;
      }
    }
  }
})();
