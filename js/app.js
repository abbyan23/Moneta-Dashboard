/* ============================================================
   Moneta – App Entry Point (Render & Init)
   ============================================================ */

// ── Main Render ──
function render() {
  // Apply dark mode class
  document.documentElement.classList.toggle('dark', dark);

  // If not logged in, show login
  if (!ME) {
    $('#app').innerHTML = Login();
    return;
  }

  // Render main app layout
  $('#app').innerHTML = `
    ${Sidebar()}
    <div style="padding-left:0" class="app-main">
      ${Header()}
      <main class="max-w-app mx-auto py-6 flex flex-col gap-6" style="max-width:1440px;margin:0 auto;padding:1.5rem 1rem">
        ${view !== 'dashboard'
          ? `<button onclick="A.go('dashboard')" class="text-sm font-semibold text-sec flex items-center gap-1 w-fit" style="background:none;border:none;cursor:pointer;font-family:var(--font-sans)">
              ${ic('arrow_back')}Kembali ke Beranda
            </button>`
          : ''
        }
        ${VIEWS[view]()}
      </main>
    </div>`;

  // Apply responsive styles after render
  applyResponsiveStyles();
}

// ── Responsive Style Application ──
function applyResponsiveStyles() {
  const width = window.innerWidth;

  // Sidebar visibility & main padding
  const appMain = document.querySelector('.app-main');
  if (appMain && width >= 1024) {
    appMain.style.paddingLeft = '16rem';
  } else if (appMain) {
    appMain.style.paddingLeft = '0';
  }

  // Main content padding on larger screens
  const main = document.querySelector('main');
  if (main && width >= 1024) {
    main.style.paddingLeft = '2rem';
    main.style.paddingRight = '2rem';
  }

  // Show sidebar on desktop
  const sidebar = document.querySelector('.sidebar');
  if (sidebar) {
    sidebar.style.display = width >= 1024 ? 'flex' : 'none';
  }

  // Mobile nav visibility
  const mobileNav = document.querySelector('.mobile-nav');
  if (mobileNav) {
    mobileNav.style.display = width < 1024 ? 'flex' : 'none';
  }

  // Dashboard grid columns
  const metricGrid = document.querySelectorAll('section')[1];
  if (metricGrid && metricGrid.classList.contains('grid')) {
    if (width >= 1024) {
      metricGrid.style.gridTemplateColumns = 'repeat(4, minmax(0, 1fr))';
    } else if (width >= 640) {
      metricGrid.style.gridTemplateColumns = 'repeat(2, minmax(0, 1fr))';
    } else {
      metricGrid.style.gridTemplateColumns = '1fr';
    }
  }

  // Cash flow + recent transactions grid
  const cfSection = document.querySelectorAll('section')[2];
  if (cfSection && width >= 1024) {
    cfSection.style.gridTemplateColumns = '7fr 5fr';
  }

  // Budget + goals grid
  const bgSection = document.querySelectorAll('section')[3];
  if (bgSection && width >= 1024) {
    bgSection.style.gridTemplateColumns = 'repeat(2, minmax(0, 1fr))';
  }

  // Settings grid
  const settingsGrid = document.querySelector('.settings-grid');
  if (settingsGrid) {
    settingsGrid.style.gridTemplateColumns = width >= 1024 ? 'repeat(2, minmax(0, 1fr))' : '1fr';
    const fullWidth = document.querySelector('.settings-full');
    if (fullWidth && width >= 1024) {
      fullWidth.style.gridColumn = 'span 2 / span 2';
    }
  }

  // Header responsive text
  document.querySelectorAll('.sm\\\\:inline, [class*="sm:inline"]').forEach(el => {
    el.style.display = width >= 640 ? 'inline' : 'none';
  });
  document.querySelectorAll('.md\\\\:block, [class*="md:block"]').forEach(el => {
    el.style.display = width >= 768 ? 'block' : 'none';
  });
  document.querySelectorAll('.md\\\\:inline-flex, [class*="md:inline-flex"]').forEach(el => {
    el.style.display = width >= 768 ? 'inline-flex' : 'none';
  });
}

// ── Keyboard Shortcuts ──
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') A.close();
});

// ── Resize Handler ──
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(applyResponsiveStyles, 100);
});

// ── Initial Render ──
render();

// ── Optional: Firebase Sync ──
(async () => {
  try {
    if (!window.claude) return;
    const db = await claude.use('db');
    const u = await claude.use('user');
    if (!db || !u) return;
    DB = db;
    DBID = await u.id();

    const r = await dref('accounts').get();
    if (r.exists && r.data().json) {
      Object.assign(ACC, JSON.parse(r.data().json));
    }

    if (ME) {
      const d = await dref('d_' + hx(ME)).get();
      if (d.exists && d.data().json) {
        S = JSON.parse(d.data().json);
      } else {
        await save();
      }
    }

    synced = true;
    render();
  } catch (e) {
    DB = null;
  }
})();
