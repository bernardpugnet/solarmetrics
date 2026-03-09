// nav-active.js
// Highlights the current page in the navigation menu (desktop + mobile)
(function () {
  const page = location.pathname.split('/').pop() || 'index.html';

  // Map each page to its parent menu category
  const menuMap = {
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
    'contact.html':             'collaborer'
  };

  const category = menuMap[page];
  if (!category) return;

  // Active styles
  const activeLink   = 'text-amber-400';
  const activeButton = 'text-amber-400';
  const activeMobile = 'text-amber-400 font-semibold';

  // --- Desktop nav (hidden lg:flex) ---
  const desktopNav = document.querySelector('.hidden.lg\\:flex');
  if (desktopNav) {
    // Direct links: Accueil, Analyses, Collaborer
    desktopNav.querySelectorAll(':scope > a').forEach(function (a) {
      const href = a.getAttribute('href') || '';
      const hPage = href.split('/').pop();
      const hCat = menuMap[hPage];
      if (hCat === category) {
        a.classList.remove('text-slate-400');
        a.classList.add(activeLink);
        // Remove fixed orange on Collaborer if not active
        if (hPage === 'recrutez-moi.html') {
          a.classList.remove('bg-amber-500/20', 'text-amber-500', 'hover:bg-amber-500/30');
          a.classList.add('text-amber-400', 'bg-amber-500/20');
        }
      } else if (hPage === 'recrutez-moi.html') {
        // Collaborer when NOT active: subtle style instead of always-orange
        a.classList.remove('bg-amber-500/20', 'text-amber-500', 'hover:bg-amber-500/30');
        a.classList.add('text-slate-400', 'hover:text-white', 'hover:bg-slate-800');
      }
    });

    // Dropdown buttons: Économie, Technologies, Outils, Ressources
    desktopNav.querySelectorAll(':scope > .relative.group > button').forEach(function (btn) {
      var text = (btn.textContent || '').trim().toLowerCase();
      // Normalize accented chars
      var norm = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (norm === category) {
        btn.classList.remove('text-slate-400');
        btn.classList.add(activeButton);
      }
    });

    // Highlight the exact sub-link in dropdown
    desktopNav.querySelectorAll('a[href]').forEach(function (a) {
      var href = (a.getAttribute('href') || '').split('/').pop();
      if (href === page) {
        // Add a left amber border to the active dropdown item
        a.style.borderLeft = '3px solid #f59e0b';
        a.style.paddingLeft = '13px';
      }
    });
  }

  // --- Mobile nav ---
  var mobileMenu = document.getElementById('mobileMenu');
  if (mobileMenu) {
    mobileMenu.querySelectorAll('a[href]').forEach(function (a) {
      var href = (a.getAttribute('href') || '').split('/').pop();
      if (href === page) {
        a.classList.remove('text-slate-400');
        activeMobile.split(' ').forEach(function (c) { a.classList.add(c); });
        // Remove fixed orange on Collaborer mobile
        a.classList.remove('bg-amber-500/20', 'text-amber-500');
      } else if (href === 'recrutez-moi.html') {
        a.classList.remove('bg-amber-500/20', 'text-amber-500');
        a.classList.add('text-slate-400');
      }
    });
  }
})();
