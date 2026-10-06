// Assembles the three self-contained design option pages from src/.
// Usage: node build.js   →  writes Option-A-*.html, Option-B-*.html, Option-C-*.html
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, 'src');
const IMG = path.join(__dirname, '..', 'progarlic-backend', 'Source', 'Code', 'wwwroot', 'images');
const read = (f) => fs.readFileSync(path.join(SRC, f), 'utf8');
const dataUri = (f) => 'data:image/png;base64,' + fs.readFileSync(path.join(IMG, f)).toString('base64');

// Menu mirrors the existing modules. Entries with a target are live in the preview.
const MENU = [
  { key: 'dash', label: 'Dashboard', short: 'Home', icon: 'home', single: true },
  { key: 'masters', label: 'Masters', short: 'Masters', icon: 'box', items: [['Item', 'items'], 'Item Classification', 'Unit', 'Tag', 'Account', 'Sub Head', 'Location', 'Transport', 'Transport Area', 'Staff', 'Department', 'Expense Head'] },
  { key: 'inward', label: 'Inward', short: 'Inward', icon: 'inward', items: ['Inward Entry', 'Supplier Invoice', 'Supplier Payment'] },
  { key: 'sales', label: 'Sales', short: 'Sales', icon: 'cart', items: [['Sale Order', 'sale-order'], 'Customer Invoice', 'Sale Receipt', 'Dispatch'] },
  { key: 'expenses', label: 'Expenses', short: 'Expense', icon: 'wallet', items: ['Expense Invoice', 'Expense Payment'] },
  { key: 'accounts', label: 'Accounts', short: 'Accounts', icon: 'book', items: ['Journal Voucher', 'Contra Voucher', 'Ledger', 'Bank Reconciliation', 'Credit Score'] },
  { key: 'reports', label: 'Reports', short: 'Reports', icon: 'chart', items: ['Balance Sheet', 'Profit & Loss', 'Trial Balance', 'T-Ledger', 'Schedules', 'Sundry', 'Daily Cash Sale', 'Daily Journal', 'Daily Sale (Inward)', 'Sale Summary', 'Debtors Collection', 'Debt Management', 'Outstanding Bill Age', 'Inward Tracking', 'Item-wise Stock', 'Bank Payment Daily', 'Bank Reconciliation'] },
  { key: 'admin', label: 'Admin', short: 'Admin', icon: 'users', items: ['Users', 'User Roles', 'Credit Score Config', 'Print Queue'] },
];

const icon = (n, cls = 'i') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-${n}"/></svg>`;
const link = (it, cls = 'nav-link') => Array.isArray(it)
  ? `<a class="${cls}" href="#${it[1]}" data-go="${it[1]}">${it[0]}</a>`
  : `<a class="${cls}" href="#" data-demo-off>${it}</a>`;

// A: grouped, collapsible sidebar
function navA() {
  return MENU.map((g) => g.single
    ? `<a class="nav-top" href="#" data-demo-off>${icon(g.icon)}<span>${g.label}</span></a>`
    : `<details class="navgrp" data-group${g.key === 'masters' || g.key === 'sales' ? ' open' : ''}>
        <summary>${icon(g.icon)}<span>${g.label}</span>${icon('chevron', 'i chev')}</summary>
        <div class="sub">${g.items.map((i) => link(i)).join('')}</div>
      </details>`).join('\n');
}

// B: horizontal bar with dropdowns
function navB() {
  return MENU.map((g) => g.single
    ? `<a class="nav-top" href="#" data-demo-off>${g.label}</a>`
    : `<details class="menu" data-group>
        <summary class="nav-top">${g.label}${icon('chevron', 'i chev')}</summary>
        <div class="dropdown${g.items.length > 8 ? ' wide' : ''}">${g.items.map((i) => link(i)).join('')}</div>
      </details>`).join('\n');
}

// C: icon rail with fly-out panels
function navC() {
  return MENU.map((g) => g.single
    ? `<div class="rail-item"><button class="rail-btn" type="button" data-demo-off><span class="sr">${g.label}</span>${icon(g.icon)}<em aria-hidden="true">${g.short}</em></button></div>`
    : `<div class="rail-item" data-group>
        <button class="rail-btn" type="button" data-panel="${g.key}" aria-expanded="false" aria-controls="fly-${g.key}"><span class="sr">${g.label}</span>${icon(g.icon)}<em aria-hidden="true">${g.short}</em></button>
        <div class="flyout" id="fly-${g.key}" data-panel-content="${g.key}" role="menu" aria-label="${g.label}">
          <p class="fly-title">${g.label}</p>
          <div class="fly-links${g.items.length > 8 ? ' two-col' : ''}">${g.items.map((i) => link(i)).join('')}</div>
        </div>
      </div>`).join('\n');
}

const parts = {
  BASE_CSS: read('base.css'),
  COMMON_JS: read('common.js'),
  SPRITE: read('sprite.svg'),
  SCREENS: read('screens.html'),
  LOGO: dataUri('logo.png'),
  MARK: dataUri('logo-add-small.png'),
};

const DESIGNS = [
  { file: 'design-a.html', out: 'Option-A-Classic-Sidebar.html', nav: navA },
  { file: 'design-b.html', out: 'Option-B-Top-Navigation.html', nav: navB },
  { file: 'design-c.html', out: 'Option-C-Soft-Cards.html', nav: navC },
];

for (const d of DESIGNS) {
  const html = read(d.file).replace(/\{\{(\w+)\}\}/g, (m, k) => {
    if (k === 'NAV') return d.nav();
    if (!(k in parts)) throw new Error(`Unknown placeholder ${m} in ${d.file}`);
    return parts[k];
  });
  fs.writeFileSync(path.join(__dirname, d.out), html);

  // Standalone copy for sharing by email/WhatsApp: full document with charset + viewport.
  // The artifact viewer normally supplies this wrapper and a small reset (body margin, img sizing).
  const [head, ...rest] = html.split('</style>');
  const share = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<style>body { margin: 0; } img { max-width: 100%; }</style>
${head}</style>
</head>
<body>${rest.join('</style>')}
</body>
</html>
`;
  fs.mkdirSync(path.join(__dirname, 'share'), { recursive: true });
  fs.writeFileSync(path.join(__dirname, 'share', d.out), share);
  console.log(`${d.out}  ${(html.length / 1024).toFixed(0)} KB  (+ share/${d.out})`);
}
