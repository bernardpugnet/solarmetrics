// nav-active.js
// Highlights the current page in the navigation menu (desktop + mobile)
(function () {
  var page = location.pathname.split('/').pop() || 'index.html';

  // Map each page to its parent menu category keyword
  var menuMap = {
    'index.html':        'accueil',
    'economie.html':     'economie',
    'marches.html':      'economie',
    'prix-solaire.html': 'economie',
    'hypotheses.html':   'economie',
    'risques-bankability.html': 'economie',
    'comparatif-pays.html':     'economie',
    'technologies.html':        'technologies',
    'technologies-emergentes.html': 'technologies',
    'vehicle-to-grid.html':     'technologies',
    'centrales-virtuelles.html':'technologies',
    'physique-electricite-ferme-photovoltaique.html': 'technologies',
    'outils-simulation.html':   'outils',
    'outils-industriel.html':   'outils',
    'outils.html':              'outils',
    'comparateur.html':         'outils',
    'guide-installation.html':  'outils',
    'widgets.html':             'outils',
    'ressources.html':          'ressources',
    'recyclage-fin-de-vie.html':'ressources',
    'veille-reglementaire.html':'ressources',
    'mon-solaire-60s.html':     'ressources',
    'recrutez-moi.html':        'collaborer',
    'contact.html':             'collaborer',
    'etude-de-cas.html':        'ressources',
    'ia-data.html':             'ressources',
    'schema-grande-installation.html': 'outils',
    'schema-plug-and-play.html':       'outils'
  };

  var category = menuMap[page];
  if (!category) return;

  // --- Find the desktop nav bar ---
  var nav = document.querySelector('nav');
  if (!nav) return;

  // All links and buttons in the nav
  var allNavLinks = nav.querySelectorAll('a[href], button');

  // --- 1) Highlight the exact page link (both in dropdown and mobile) ---
  allNavLinks.forEach(function (el) {
    if (el.tagName !== 'A') return;
    var href = (el.getAttribute('href') || '').split('/').pop().split('?')[0].split('#')[0];
    if (href === page) {
      // Is it inside the mobile menu?
      var inMobile = el.closest('#mobileMenu');
      if (inMobile) {
        el.classList.remove('text-slate-400');
        el.classList.add('text-amber-400', 'font-semibold');
      } else {
        // Desktop dropdown sub-link: add left border
        el.style.borderLeft = '3px solid #f59e0b';
        el.style.paddingLeft = '13px';
      }
    }
  });

  // --- 2) Highlight the parent dropdown button (desktop) ---
  // The dropdown buttons contain text like "Économie", "Technologies", etc.
  // Match by normalizing text and comparing to category
  var categoryLabels = {
    'economie':     'conomie',   // partial match (avoids É accent issues)
    'technologies': 'echnologies',
    'outils':       'utils',
    'ressources':   'essources',
    'accueil':      'ccueil',
    'collaborer':   'ollaborer'
  };

  var searchText = categoryLabels[category] || category;

  // Find desktop dropdown buttons (they are inside .relative.group divs)
  var dropdownGroups = nav.querySelectorAll('.relative.group');
  dropdownGroups.forEach(function (group) {
    var btn = group.querySelector('button');
    if (!btn) return;
    // Get just the text, not SVG content
    var btnText = '';
    btn.childNodes.forEach(function (node) {
      if (node.nodeType === 3) btnText += node.textContent; // text nodes only
    });
    btnText = btnText.trim().toLowerCase();

    if (btnText.indexOf(searchText) !== -1) {
      btn.classList.remove('text-slate-400');
      btn.classList.add('text-amber-400');
    }
  });

  // --- 3) Highlight direct nav links (Accueil, Analyses, Collaborer) ---
  // These are <a> tags that are direct children of the desktop flex container
  var desktopFlex = nav.querySelector('.hidden');
  if (desktopFlex) {
    var directLinks = desktopFlex.querySelectorAll(':scope > a');
    directLinks.forEach(function (a) {
      var href = (a.getAttribute('href') || '').split('/').pop().split('?')[0].split('#')[0];
      var linkCat = menuMap[href];
      if (linkCat === category) {
        a.classList.remove('text-slate-400');
        a.classList.add('text-amber-400');
      }
    });
  }
})();
