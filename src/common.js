/* Shared behaviour for all three design options. Same IDs / data-* hooks in every shell. */
(function () {
  var ITEMS = [
    { id: 101, code: 'GRL-OTY', name: 'Garlic Ooty (G1)', uom: 'Bag', unit: 'Kg' },
    { id: 102, code: 'GRL-DSM', name: 'Garlic Desi Medium', uom: 'Bag', unit: 'Kg' },
    { id: 103, code: 'GRL-DSL', name: 'Garlic Desi Lado', uom: 'Bag', unit: 'Kg' },
    { id: 104, code: 'GRL-RIK', name: 'Garlic Riyawan Bold', uom: 'Bag', unit: 'Kg' },
    { id: 105, code: 'CHL-TJA', name: 'Red Chilli Teja S17', uom: 'Bag', unit: 'Kg' },
    { id: 106, code: 'CHL-BYD', name: 'Byadgi Dry Chilli', uom: 'Bag', unit: 'Kg' },
    { id: 107, code: 'CHL-334', name: 'Red Chilli Sannam 334', uom: 'Bag', unit: 'Kg' },
    { id: 108, code: 'CHL-KSH', name: 'Kashmiri Chilli Deluxe', uom: 'Bag', unit: 'Kg' },
    { id: 109, code: 'CHL-WRG', name: 'Wonder Hot Chilli', uom: 'Bag', unit: 'Kg' },
    { id: 110, code: 'GRL-CHN', name: 'Garlic China Pink', uom: 'Box', unit: 'Kg' },
    { id: 111, code: 'GNY-BAG', name: 'Gunny Bag (50 Kg)', uom: 'Nos', unit: 'Nos' },
    { id: 112, code: 'CHL-STK', name: 'Chilli Stemless Teja', uom: 'Bag', unit: 'Kg' }
  ];

  var LOTS = [
    { supplier: 'Ramesh Patidar', place: 'Mandsaur', arr: 3200, date: '02 Oct 2026', item: 'Garlic Ooty (G1)', lot: 'L-2610-07', tag: 'MD-12', avl: 2350, req: 1200, rate: 118.5 },
    { supplier: 'Shree Krishna Traders', place: 'Neemuch', arr: 1800, date: '03 Oct 2026', item: 'Garlic Desi Medium', lot: 'L-2610-11', tag: 'NM-04', avl: 1800, req: 800, rate: 96 },
    { supplier: 'Gopal Agro', place: 'Ratlam', arr: 2600, date: '04 Oct 2026', item: 'Red Chilli Teja S17', lot: 'L-2610-15', tag: 'RT-21', avl: 1450, req: 500, rate: 212.75 }
  ];

  var ICON = {
    edit: '<svg class="i" viewBox="0 0 24 24"><use href="#i-edit"/></svg>',
    trash: '<svg class="i" viewBox="0 0 24 24"><use href="#i-trash"/></svg>'
  };

  var root = document.documentElement;
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  var inr = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  var qty = new Intl.NumberFormat('en-IN');

  /* ---------- toast ---------- */
  var toastTimer;
  function toast(msg) {
    var t = $('#toast');
    if (!t) return;
    t.textContent = msg;
    t.hidden = false;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); setTimeout(function () { t.hidden = true; }, 250); }, 2600);
  }

  /* ---------- screens ---------- */
  var SCREENS = ['items', 'item-form', 'sale-order'];
  function show(name) {
    if (SCREENS.indexOf(name) < 0) name = 'items';
    $$('[data-screen]').forEach(function (s) { s.hidden = s.getAttribute('data-screen') !== name; });
    var nav = name === 'item-form' ? 'items' : name;
    $$('[data-go]').forEach(function (a) { a.classList.toggle('active', a.getAttribute('data-go') === nav); });
    $$('[data-group]').forEach(function (g) { g.classList.toggle('has-active', !!$('[data-go="' + nav + '"]', g)); });
    document.body.classList.remove('nav-open');
    $$('details.menu[open]').forEach(function (d) { if (window.matchMedia('(min-width: 900px)').matches) d.open = false; });
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', function () { show(location.hash.slice(1)); });

  document.addEventListener('click', function (e) {
    var off = e.target.closest('[data-demo-off]');
    if (off) { e.preventDefault(); toast((off.querySelector('.sr') || off).textContent.trim() + ' is not part of this design preview.'); return; }
    if (e.target.closest('[data-drawer-toggle]')) { document.body.classList.toggle('nav-open'); return; }
    if (e.target.closest('[data-scrim]')) { document.body.classList.remove('nav-open'); closePanels(); return; }
    var tt = e.target.closest('[data-theme-toggle]');
    if (tt) {
      var dark = root.getAttribute('data-theme') ? root.getAttribute('data-theme') === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.setAttribute('data-theme', dark ? 'light' : 'dark');
      return;
    }
    var pb = e.target.closest('[data-panel]');
    if (pb) { togglePanel(pb.getAttribute('data-panel')); return; }
    var go = e.target.closest('[data-go]');
    if (go) { closePanels(); document.body.classList.remove('nav-open'); if (go.getAttribute('href') === location.hash) show(location.hash.slice(1)); }
    var del = e.target.closest('[data-delete]');
    if (del) { toast('Delete asks for confirmation in the real app. Disabled in preview.'); return; }
    var rm = e.target.closest('[data-remove-lot]');
    if (rm) { LOTS.splice(+rm.getAttribute('data-remove-lot'), 1); renderLots(); toast('Lot removed from order'); return; }
    if (e.target.closest('[data-add-lot]')) { toast('Opens the supplier lot picker in the real app.'); return; }
  });

  /* desktop dropdowns (design B): one open at a time, close on outside click */
  document.addEventListener('toggle', function (e) {
    var d = e.target;
    if (d.matches && d.matches('details.menu') && d.open) {
      $$('details.menu[open]').forEach(function (o) { if (o !== d) o.open = false; });
    }
  }, true);
  document.addEventListener('click', function (e) {
    if (!e.target.closest('details.menu')) $$('details.menu[open]').forEach(function (d) { if (window.matchMedia('(min-width: 900px)').matches) d.open = false; });
  });

  /* secondary panels (design C) */
  function closePanels() {
    $$('[data-panel-content]').forEach(function (p) { p.classList.remove('open'); });
    $$('[data-panel]').forEach(function (b) { b.classList.remove('active-panel'); b.setAttribute('aria-expanded', 'false'); });
    document.body.classList.remove('panel-open');
  }
  function togglePanel(name) {
    var p = $('[data-panel-content="' + name + '"]');
    var wasOpen = p && p.classList.contains('open');
    closePanels();
    if (p && !wasOpen) {
      p.classList.add('open');
      document.body.classList.add('panel-open');
      $$('[data-panel="' + name + '"]').forEach(function (b) { b.classList.add('active-panel'); b.setAttribute('aria-expanded', 'true'); });
    }
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closePanels(); document.body.classList.remove('nav-open'); }
  });

  /* ---------- item list ---------- */
  function renderItems() {
    var q = ($('#itemSearch') && $('#itemSearch').value || '').toLowerCase().trim();
    var rows = ITEMS.filter(function (it) {
      return !q || (it.name + ' ' + it.code + ' ' + it.id).toLowerCase().indexOf(q) >= 0;
    });
    var tb = $('#itemRows');
    if (!tb) return;
    tb.innerHTML = rows.map(function (it) {
      return '<tr>' +
        '<td data-label="ID" class="num muted">' + it.id + '</td>' +
        '<td data-label="Code"><span class="code">' + it.code + '</span></td>' +
        '<td data-label="Name" class="strong">' + it.name + '</td>' +
        '<td data-label="UOM">' + it.uom + '</td>' +
        '<td data-label="Unit">' + it.unit + '</td>' +
        '<td data-label="Action" class="actions">' +
          '<a class="icon-btn" href="#item-form" data-go="item-form" title="Edit ' + it.name + '" aria-label="Edit ' + it.name + '">' + ICON.edit + '</a>' +
          '<button class="icon-btn danger" type="button" data-delete="' + it.id + '" title="Delete" aria-label="Delete ' + it.name + '">' + ICON.trash + '</button>' +
        '</td></tr>';
    }).join('') || '<tr class="empty"><td colspan="6">No items match "' + q.replace(/</g, '&lt;') + '". Check the spelling or clear the search.</td></tr>';
    var c = $('#itemCount');
    if (c) c.textContent = rows.length === ITEMS.length ? ITEMS.length + ' items' : rows.length + ' of ' + ITEMS.length + ' items';
  }

  /* ---------- sale order ---------- */
  function renderLots() {
    var tb = $('#soRows');
    if (!tb) return;
    tb.innerHTML = LOTS.map(function (l, i) {
      return '<tr>' +
        '<td data-label="Supplier" class="strong">' + l.supplier + '<small>' + l.place + '</small></td>' +
        '<td data-label="Arr. Qty" class="num">' + qty.format(l.arr) + '</td>' +
        '<td data-label="Inward Date" class="nowrap">' + l.date + '</td>' +
        '<td data-label="Item">' + l.item + '</td>' +
        '<td data-label="Lot"><span class="code">' + l.lot + '</span></td>' +
        '<td data-label="Tag"><span class="tag">' + l.tag + '</span></td>' +
        '<td data-label="Avl. Qty" class="num">' + qty.format(l.avl) + '</td>' +
        '<td data-label="Req. Qty" class="num"><input class="cell-input" id="req-' + i + '" type="number" min="0" max="' + l.avl + '" value="' + l.req + '" data-i="' + i + '" data-f="req" aria-label="Required quantity for ' + l.lot + '"></td>' +
        '<td data-label="Rate (₹/Kg)" class="num"><input class="cell-input" id="rate-' + i + '" type="number" min="0" step="0.25" value="' + l.rate + '" data-i="' + i + '" data-f="rate" aria-label="Rate for ' + l.lot + '"></td>' +
        '<td data-label="Amount (₹)" class="num strong" id="amt-' + i + '">' + inr.format(l.req * l.rate) + '</td>' +
        '<td data-label="Action" class="actions"><button class="icon-btn danger" type="button" data-remove-lot="' + i + '" aria-label="Remove ' + l.lot + '" title="Remove">' + ICON.trash + '</button></td>' +
        '</tr>';
    }).join('') || '<tr class="empty"><td colspan="11">No lots added yet. Use “Add Supplier Lot” to pick stock from inward entries.</td></tr>';
    totals();
  }
  function totals() {
    var tq = 0, sub = 0, over = false;
    LOTS.forEach(function (l, i) {
      tq += l.req; sub += l.req * l.rate;
      var a = $('#amt-' + i); if (a) a.textContent = inr.format(l.req * l.rate);
      var r = $('#req-' + i); if (r) { var bad = l.req > l.avl; r.classList.toggle('invalid', bad); over = over || bad; }
    });
    var adv = parseFloat(($('#soAdvance') || {}).value) || 0;
    set('#soLineCount', LOTS.length + (LOTS.length === 1 ? ' lot' : ' lots'));
    set('#soTotalQty', qty.format(tq) + ' Kg');
    set('#soSubtotal', '₹ ' + inr.format(sub));
    set('#soAdvanceOut', '₹ ' + inr.format(adv));
    set('#soBalance', '₹ ' + inr.format(sub - adv));
    var w = $('#soWarn'); if (w) w.hidden = !over;
  }
  function set(s, v) { var e = $(s); if (e) e.textContent = v; }

  document.addEventListener('input', function (e) {
    var t = e.target;
    if (t.id === 'itemSearch') renderItems();
    if (t.dataset && t.dataset.f) { LOTS[+t.dataset.i][t.dataset.f] = parseFloat(t.value) || 0; totals(); }
    if (t.id === 'soAdvance') totals();
  });

  document.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = e.target, missing = [];
    $$('[required]', f).forEach(function (el) {
      var bad = !String(el.value).trim();
      el.classList.toggle('invalid', bad);
      var field = el.closest('.field'); if (field) field.classList.toggle('has-error', bad);
      if (bad) missing.push(el);
    });
    if (missing.length) { missing[0].focus(); toast('Fill in the highlighted fields to save.'); return; }
    toast(f.id === 'itemForm' ? 'Item saved (preview only, nothing was stored)' : 'Sale order saved (preview only, nothing was stored)');
  });

  /* ---------- boot ---------- */
  renderItems();
  renderLots();
  show(location.hash.slice(1) || 'items');
})();
