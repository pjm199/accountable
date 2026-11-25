/* Shared sample data and chart helpers for the three mockups. */
(function () {
  var C = { green: '#06D6A0', gold: '#FFC145', coral: '#F78C6B', blue: '#118AB2', rasp: '#EF476F', ink: '#073B4C', mist: '#CDD8DB' };
  var STAGES = [
    { name: 'New', prob: 0.10, color: C.green, text: C.ink },
    { name: 'Qualified', prob: 0.25, color: C.gold, text: C.ink },
    { name: 'Proposal', prob: 0.50, color: C.coral, text: C.ink },
    { name: 'Negotiation', prob: 0.75, color: C.blue, text: '#fff' },
    { name: 'Won', prob: 1, color: C.ink, text: '#fff' },
    { name: 'Lost', prob: 0, color: C.rasp, text: '#fff' }
  ];
  var TODAY = '2026-11-24';
  var MONTHS = [
    ['Jan', 2, 28000], ['Feb', 3, 41500], ['Mar', 2, 36000], ['Apr', 4, 62500], ['May', 3, 48000], ['Jun', 5, 71000],
    ['Jul', 4, 59500], ['Aug', 3, 52000], ['Sep', 5, 78500], ['Oct', 4, 67000], ['Nov', 2, 29800]
  ].map(function (r) { return { m: r[0], won: r[1], rev: r[2] }; });
  var D = [
    ['Website rebuild', 'Brightwave Media', 'Tara Nguyen', 'New', 18000, '2027-01-31'],
    ['Annual support plan', 'Harbor Dental', 'Luis Ortega', 'New', 9500, '2027-01-15'],
    ['Fleet tracking pilot', 'Northline Freight', 'Priya Shah', 'New', 32000, '2027-02-28'],
    ['CRM rollout', 'Alder & Finch Law', 'Marcus Bell', 'Qualified', 24000, '2026-12-18'],
    ['Inventory module', 'Greenleaf Grocers', 'Hana Kim', 'Qualified', 41000, '2026-12-10'],
    ['Onboarding package', 'Pixel Forge Studio', 'Ben Carter', 'Qualified', 12500, '2026-11-14'],
    ['Q1 retainer', 'Summit Fitness', 'Olivia Reed', 'Proposal', 36000, '2026-12-05'],
    ['Equipment lease', 'Redwood Builders', 'Sam Patel', 'Proposal', 58000, '2026-11-19'],
    ['Training series', 'Lumen Education', 'Dana Cruz', 'Proposal', 15500, '2026-12-20'],
    ['Multi-site license', 'Coastline Clinics', 'Jorge Alvarez', 'Negotiation', 92000, '2026-12-12'],
    ['Renewal 2027', 'Maple Street Bakery', 'Ivy Chen', 'Negotiation', 14000, '2026-11-30'],
    ['Data migration', 'Northline Freight', 'Priya Shah', 'Negotiation', 27000, '2026-11-21'],
    ['Pilot program', 'Bluebird Logistics', 'Nina Walsh', 'Won', 21000, '2026-11-06'],
    ['Staff training', 'Lumen Education', 'Dana Cruz', 'Won', 8800, '2026-11-12'],
    ['Analytics add-on', 'Redwood Builders', 'Sam Patel', 'Lost', 19000, '2026-10-30'],
    ['Bulk order', 'Greenleaf Grocers', 'Hana Kim', 'Lost', 12000, '2026-11-09']
  ].map(function (r) {
    var st = STAGES.filter(function (s) { return s.name === r[3]; })[0];
    var open = r[3] !== 'Won' && r[3] !== 'Lost';
    return { name: r[0], org: r[1], contact: r[2], stage: r[3], value: r[4], close: r[5], prob: st.prob, color: st.color, open: open, late: open && r[5] < TODAY };
  });
  var ACT = [
    ['call', 'Called Jorge about licence terms. He wants a 12-month price lock.', 'Multi-site license', 'Today, 9:40'],
    ['email', 'Sent revised proposal to Olivia.', 'Q1 retainer', 'Today, 8:15'],
    ['stage', 'Moved from Proposal to Negotiation', 'Renewal 2027', 'Yesterday'],
    ['note', 'Hana is comparing us with one other supplier.', 'Inventory module', 'Yesterday'],
    ['stage', 'Moved from Negotiation to Won', 'Staff training', '12 Nov'],
    ['call', 'Intro call with Tara. Budget confirmed for January.', 'Website rebuild', '11 Nov']
  ].map(function (r) { return { type: r[0], text: r[1], on: r[2], when: r[3] }; });
  var FU = [
    ['Chase signed order form', 'Equipment lease', 'Sam Patel', '2026-11-20'],
    ['Send data migration plan', 'Data migration', 'Priya Shah', '2026-11-22'],
    ['Call Jorge about price lock', 'Multi-site license', 'Jorge Alvarez', '2026-11-25'],
    ['Book demo with Hana', 'Inventory module', 'Hana Kim', '2026-11-26'],
    ['Check in after proposal', 'Q1 retainer', 'Olivia Reed', '2026-11-28'],
    ['Reply to Tara about scope', 'Website rebuild', 'Tara Nguyen', '2026-12-01']
  ].map(function (r) { return { text: r[0], deal: r[1], who: r[2], due: r[3], overdue: r[3] < TODAY }; });

  function money(n) { return 'US$' + Math.round(n).toLocaleString('en-US'); }
  function moneyK(n) { return n >= 1e6 ? 'US$' + (n / 1e6).toFixed(2) + 'M' : 'US$' + (n / 1000).toFixed(n >= 1e5 ? 0 : 1) + 'K'; }
  function dateLabel(iso) { var d = new Date(iso + 'T00:00:00'); return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }); }
  function initials(n) { return n.split(' ').map(function (p) { return p[0]; }).slice(0, 2).join(''); }
  function sum(a, f) { return a.reduce(function (t, x) { return t + f(x); }, 0); }

  var open = D.filter(function (d) { return d.open; });
  var T = {
    openValue: sum(open, function (d) { return d.value; }),
    expected: sum(open, function (d) { return d.value * d.prob; }),
    openCount: open.length,
    wonYtd: sum(MONTHS, function (m) { return m.rev; }),
    wonCount: sum(MONTHS, function (m) { return m.won; }),
    late: open.filter(function (d) { return d.late; }).length
  };
  function stageTotals(name) {
    var ds = D.filter(function (d) { return d.stage === name; });
    return { deals: ds, value: sum(ds, function (d) { return d.value; }), expected: sum(ds, function (d) { return d.value * d.prob; }) };
  }
  /* value that has reached each stage: deals now at that stage or further along (Lost excluded after New) */
  function funnel() {
    var order = ['New', 'Qualified', 'Proposal', 'Negotiation', 'Won'];
    return order.map(function (s, i) {
      var later = order.slice(i);
      var v = sum(D.filter(function (d) { return later.indexOf(d.stage) > -1 || (i === 0 && d.stage === 'Lost'); }), function (d) { return d.value; });
      var st = STAGES[i];
      return { name: s, value: v, color: st.color, text: st.text };
    });
  }

  function nice(max) { var p = Math.pow(10, Math.floor(Math.log10(max))); var n = max / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p; }
  function axis(max, w, h, l, t, r, b, fmt) {
    var s = '', i, y;
    for (i = 0; i <= 4; i++) {
      y = t + (h - t - b) * (1 - i / 4);
      s += '<line x1="' + l + '" x2="' + (w - r) + '" y1="' + y + '" y2="' + y + '" stroke="#073B4C" stroke-opacity=".08"/>';
      s += '<text x="' + (l - 8) + '" y="' + (y + 4) + '" text-anchor="end" font-size="11" fill="#073B4C" fill-opacity=".6" font-family="JetBrains Mono, monospace">' + fmt(max * i / 4) + '</text>';
    }
    return s;
  }
  var kfmt = function (v) { return v === 0 ? '0' : (v / 1000) + 'K'; };
  function lineChart(vals, labels, color, o) {
    o = o || {}; var w = 600, h = o.h || 230, l = 46, t = 12, r = 14, b = 28, max = nice(Math.max.apply(null, vals) * 1.05);
    var xs = function (i) { return l + (w - l - r) * i / (vals.length - 1); };
    var ys = function (v) { return t + (h - t - b) * (1 - v / max); };
    var pts = vals.map(function (v, i) { return xs(i) + ',' + ys(v); });
    var s = '<svg viewBox="0 0 ' + w + ' ' + h + '" width="100%" role="img" aria-label="Line chart">' + axis(max, w, h, l, t, r, b, kfmt);
    s += '<polygon points="' + xs(0) + ',' + ys(0) + ' ' + pts.join(' ') + ' ' + xs(vals.length - 1) + ',' + ys(0) + '" fill="' + color + '" fill-opacity=".14"/>';
    s += '<polyline points="' + pts.join(' ') + '" fill="none" stroke="' + color + '" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>';
    vals.forEach(function (v, i) {
      s += '<circle cx="' + xs(i) + '" cy="' + ys(v) + '" r="' + (i === vals.length - 1 ? 5 : 3) + '" fill="#fff" stroke="' + color + '" stroke-width="2.5"/>';
      s += '<text x="' + xs(i) + '" y="' + (h - 8) + '" text-anchor="middle" font-size="11" fill="#073B4C" fill-opacity=".7">' + labels[i] + '</text>';
    });
    return s + '</svg>';
  }
  function barChart(vals, labels, color, o) {
    o = o || {}; var w = 600, h = o.h || 230, l = 30, t = 12, r = 14, b = 28, max = Math.ceil(Math.max.apply(null, vals) * 1.1 / 4) * 4;
    var bw = (w - l - r) / vals.length, s = '<svg viewBox="0 0 ' + w + ' ' + h + '" width="100%" role="img" aria-label="Bar chart">' + axis(max, w, h, l, t, r, b, function (v) { return v; });
    vals.forEach(function (v, i) {
      var bh = (h - t - b) * v / max, x = l + i * bw + bw * .2;
      s += '<rect x="' + x + '" y="' + (h - b - bh) + '" width="' + bw * .6 + '" height="' + bh + '" rx="5" fill="' + (o.last && i === vals.length - 1 ? o.last : color) + '"/>';
      s += '<text x="' + (x + bw * .3) + '" y="' + (h - b - bh - 5) + '" text-anchor="middle" font-size="11" fill="#073B4C" font-family="JetBrains Mono, monospace">' + v + '</text>';
      s += '<text x="' + (x + bw * .3) + '" y="' + (h - 8) + '" text-anchor="middle" font-size="11" fill="#073B4C" fill-opacity=".7">' + labels[i] + '</text>';
    });
    return s + '</svg>';
  }
  function donut(parts, size, thick, center, sub) {
    var tot = sum(parts, function (p) { return p.value; }), R = size / 2 - thick / 2, c = 2 * Math.PI * R, off = 0;
    var s = '<svg viewBox="0 0 ' + size + ' ' + size + '" width="100%" role="img" aria-label="Open pipeline by stage"><g transform="rotate(-90 ' + size / 2 + ' ' + size / 2 + ')">';
    parts.forEach(function (p) {
      var len = c * p.value / tot;
      s += '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + R + '" fill="none" stroke="' + p.color + '" stroke-width="' + thick + '" stroke-dasharray="' + Math.max(len - 3, 0) + ' ' + (c - Math.max(len - 3, 0)) + '" stroke-dashoffset="' + -off + '"/>';
      off += len;
    });
    s += '</g><text x="50%" y="48%" text-anchor="middle" font-size="26" font-weight="600" fill="#073B4C" font-family="JetBrains Mono, monospace">' + center + '</text>';
    s += '<text x="50%" y="48%" dy="22" text-anchor="middle" font-size="12" fill="#073B4C" fill-opacity=".7">' + sub + '</text></svg>';
    return s;
  }
  function funnelHTML(steps, o) {
    o = o || {}; var max = steps[0].value;
    return steps.map(function (s) {
      var pct = Math.max(s.value / max * 100, 46);
      return '<div class="fn-row"><div class="fn-bar" style="width:' + pct + '%;background:' + s.color + ';color:' + s.text + '"><span>' + s.name + '</span><b>' + moneyK(s.value) + '</b></div></div>';
    }).join('');
  }
  var ICON = {
    dash: '<path d="M3 13h8V3H3zM13 21h8V11h-8zM3 21h8v-6H3zM13 9h8V3h-8z"/>',
    org: '<path d="M4 21V7l8-4 8 4v14M9 21v-6h6v6M8 10h2M14 10h2"/>',
    contact: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>',
    deal: '<path d="M12 3v18M16 7H9.5a2.5 2.5 0 0 0 0 5h5a2.5 2.5 0 0 1 0 5H7"/>',
    pipe: '<path d="M4 4h4v16H4zM10 4h4v10h-4zM16 4h4v13h-4z"/>',
    call: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
    email: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    note: '<path d="M6 3h9l4 4v14H6zM9 12h7M9 16h7"/>',
    stage: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    warn: '<path d="M12 3 2 20h20zM12 10v5M12 18v.5"/>'
  };
  function icon(n, s) { return '<svg viewBox="0 0 24 24" width="' + (s || 18) + '" height="' + (s || 18) + '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICON[n] + '</svg>'; }
  function fillHash(views) {
    function show() {
      var v = (location.hash || '#dashboard').slice(1);
      Object.keys(views).forEach(function (k) { document.getElementById(k).hidden = k !== v; });
      document.querySelectorAll('[data-nav]').forEach(function (a) { a.classList.toggle('on', a.dataset.nav === v); });
    }
    window.addEventListener('hashchange', show); show();
  }
  window.M = { C: C, STAGES: STAGES, D: D, ACT: ACT, FU: FU, MONTHS: MONTHS, T: T, TODAY: TODAY, money: money, moneyK: moneyK, dateLabel: dateLabel, initials: initials, stageTotals: stageTotals, funnel: funnel, lineChart: lineChart, barChart: barChart, donut: donut, funnelHTML: funnelHTML, icon: icon, fillHash: fillHash };
})();
