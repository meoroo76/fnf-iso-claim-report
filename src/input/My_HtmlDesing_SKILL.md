# F&F Style - HTML Document Generator

Generate single-file HTML documents in the F&F corporate visual style. Professional, Korean-localized dashboard/education pages with zero external dependencies.

## When to Use

- Training materials, boot camp content, onboarding guides
- Dashboard-style reports and analysis documents
- Professional single-file HTML handouts
- Any Korean corporate material needing a polished, branded look

## Instructions

1. Start from the **Base Template** below (copy the full `<style>` and `<script>`)
2. Pick components from the **Component Snippets** section
3. Follow the **Design Rules** for consistency
4. Customize gradients per section for visual variety

---

## Base Template

Every F&F style document starts with this skeleton. Copy the entire CSS block as-is — do NOT simplify or omit styles.

```html
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{{DOCUMENT_TITLE}}</title>
<style>
  :root {
    --primary: #1a1a2e;
    --accent: #e94560;
    --accent2: #0f3460;
    --bg: #f8f9fa;
    --card: #ffffff;
    --text: #2d3436;
    --text-light: #636e72;
    --border: #e9ecef;
    --success: #00b894;
    --warning: #fdcb6e;
    --info: #74b9ff;
    --danger: #d63031;
  }
  * { margin:0; padding:0; box-sizing:border-box; }
  html { scroll-behavior:smooth; }
  body { font-family:'Segoe UI',-apple-system,sans-serif; background:var(--bg); color:var(--text); line-height:1.6; padding-top:56px; }

  /* ── Sticky Navigation ── */
  .top-nav {
    position:fixed; top:0; left:0; right:0; z-index:9999;
    background:linear-gradient(135deg, var(--primary) 0%, var(--accent2) 100%);
    box-shadow:0 2px 12px rgba(0,0,0,0.3);
    display:flex; justify-content:center; align-items:center; height:56px; gap:0;
  }
  .top-nav a {
    color:rgba(255,255,255,0.7); text-decoration:none;
    padding:16px 22px; font-size:13px; font-weight:600;
    transition:all 0.3s; position:relative; white-space:nowrap;
  }
  .top-nav a:hover { color:#fff; background:rgba(255,255,255,0.08); }
  .top-nav a.active { color:#fff; background:rgba(233,69,96,0.3); }
  .top-nav a.active::after {
    content:''; position:absolute; bottom:0; left:0; right:0;
    height:3px; background:var(--accent);
  }
  .top-nav .nav-title {
    color:#fff; font-weight:700; font-size:14px;
    padding:16px 18px; letter-spacing:0.5px; margin-right:4px;
    border-right:1px solid rgba(255,255,255,0.2);
  }

  /* ── Scroll Top ── */
  .scroll-top-btn {
    position:fixed; bottom:32px; right:32px; z-index:9998;
    width:48px; height:48px; border-radius:50%;
    background:var(--accent); color:#fff; border:none;
    font-size:22px; cursor:pointer;
    box-shadow:0 4px 16px rgba(233,69,96,0.4);
    transition:all 0.3s; opacity:0; pointer-events:none;
    display:flex; align-items:center; justify-content:center;
  }
  .scroll-top-btn.visible { opacity:1; pointer-events:auto; }
  .scroll-top-btn:hover { transform:scale(1.1); }

  /* ── Divider ── */
  .session-divider { height:6px; background:linear-gradient(90deg, var(--accent) 0%, var(--accent2) 50%, var(--primary) 100%); }

  /* ── Header ── */
  .header { color:#fff; padding:48px 0 40px; text-align:center; }
  .header .badge { display:inline-block; background:var(--accent); color:#fff; padding:4px 16px; border-radius:20px; font-size:13px; margin-bottom:12px; letter-spacing:1px; }
  .header h1 { font-size:2.2rem; font-weight:700; margin-bottom:8px; }
  .header p { font-size:1.05rem; opacity:0.85; }

  /* Header gradient presets — pick one per section */
  .hdr-navy    { background:linear-gradient(135deg, var(--primary) 0%, var(--accent2) 100%); }
  .hdr-purple  { background:linear-gradient(135deg, #16213e 0%, #0f3460 50%, #533483 100%); }
  .hdr-magenta { background:linear-gradient(135deg, #2c003e 0%, #533483 50%, #e94560 100%); }
  .hdr-fire    { background:linear-gradient(135deg, #0f3460 0%, #1a1a2e 50%, #e94560 100%); }
  .hdr-sunset  { background:linear-gradient(135deg, var(--primary) 0%, #533483 50%, var(--accent) 100%); }

  /* ── Container ── */
  .container { max-width:1200px; margin:0 auto; padding:0 24px; }

  /* ── Section ── */
  .section { padding:28px 0 16px; }
  .section h2 { font-size:1.3rem; margin-bottom:20px; color:var(--primary); border-left:4px solid var(--accent); padding-left:12px; }

  /* ── Meta Bar ── */
  .meta-bar { display:flex; gap:24px; justify-content:center; padding:20px 0; flex-wrap:wrap; }
  .meta-item { display:flex; align-items:center; gap:8px; font-size:14px; color:var(--text-light); }
  .meta-item .dot { width:10px; height:10px; border-radius:50%; }
  .dot.green { background:var(--success); } .dot.yellow { background:var(--warning); }
  .dot.blue { background:var(--info); } .dot.red { background:var(--accent); }

  /* ── Alert Box ── */
  .alert-box {
    background:linear-gradient(135deg, #d63031, #e17055);
    color:#fff; border-radius:12px; padding:24px 32px; margin:24px 0;
    display:flex; align-items:center; gap:16px;
    box-shadow:0 4px 16px rgba(214,48,49,0.3);
  }
  .alert-icon-large { font-size:36px; flex-shrink:0; }
  .alert-text-large { font-size:15px; }
  .alert-text-large strong { font-size:17px; display:block; margin-bottom:4px; }

  /* ── Stat Cards ── */
  .stat-row { display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:16px; margin:20px 0; }
  .stat-card {
    background:var(--card); border-radius:12px; padding:24px 18px; text-align:center;
    border:1px solid var(--border); box-shadow:0 2px 8px rgba(0,0,0,0.04);
    transition:transform 0.2s, box-shadow 0.2s;
  }
  .stat-card:hover { transform:translateY(-2px); box-shadow:0 6px 20px rgba(0,0,0,0.1); }
  .stat-value { font-size:2rem; font-weight:800; }
  .stat-value.danger { color:var(--danger); } .stat-value.warning { color:#e17055; }
  .stat-value.accent { color:var(--accent); } .stat-value.info { color:var(--accent2); }
  .stat-value.success { color:var(--success); }
  .stat-label { font-size:12px; color:var(--text-light); margin-top:6px; line-height:1.4; }
  .stat-sub { font-size:11px; color:var(--accent); font-weight:600; margin-top:4px; }

  /* ── Cards ── */
  .cards-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(340px, 1fr)); gap:20px; }
  .cards-3 { grid-template-columns:repeat(3, 1fr); }
  .card {
    background:var(--card); border-radius:12px; padding:28px;
    box-shadow:0 2px 12px rgba(0,0,0,0.06); border:1px solid var(--border);
    transition:transform 0.2s, box-shadow 0.2s;
  }
  .card:hover { transform:translateY(-2px); box-shadow:0 6px 20px rgba(0,0,0,0.1); }
  .card-header { display:flex; align-items:center; gap:12px; margin-bottom:16px; }
  .card-icon {
    width:44px; height:44px; border-radius:10px;
    display:flex; align-items:center; justify-content:center; font-size:22px; flex-shrink:0;
  }
  .card-icon.red { background:#ffeef0; } .card-icon.blue { background:#e8f4fd; }
  .card-icon.green { background:#e6f9f0; } .card-icon.purple { background:#f3e8ff; }
  .card-icon.orange { background:#fff4e6; } .card-icon.gray { background:#f1f3f5; }
  .card-title { font-size:1.05rem; font-weight:700; }
  .card-subtitle { font-size:12px; color:var(--text-light); }
  .card-body p { font-size:14px; color:var(--text-light); margin-bottom:10px; }
  .card-body ul { padding-left:18px; }
  .card-body li { font-size:14px; margin-bottom:6px; color:var(--text); }

  /* ── Compare Table ── */
  .compare-table { width:100%; border-collapse:collapse; margin:8px 0; }
  .compare-table th, .compare-table td { padding:10px 12px; text-align:left; font-size:13px; border-bottom:1px solid var(--border); }
  .compare-table th { background:#f1f3f5; font-weight:600; color:var(--primary); }
  .compare-table tr:last-child td { border-bottom:none; }

  /* ── Impact Table (dark header) ── */
  .impact-table { width:100%; border-collapse:collapse; margin:12px 0; border-radius:12px; overflow:hidden; }
  .impact-table th { background:var(--primary); color:#fff; padding:12px 14px; text-align:left; font-size:13px; font-weight:600; }
  .impact-table td { padding:12px 14px; font-size:13px; border-bottom:1px solid var(--border); vertical-align:top; }
  .impact-table tr:nth-child(even) td { background:#fafbfc; }
  .impact-table tr:hover td { background:#f0f4ff; }

  /* ── Risk Badges ── */
  .risk-badge { display:inline-block; padding:3px 10px; border-radius:12px; font-size:11px; font-weight:700; }
  .risk-critical { background:#ffeef0; color:#d63031; }
  .risk-high { background:#fff0e6; color:#e17055; }
  .risk-medium { background:#fff9e6; color:#d68910; }
  .risk-low { background:#e6f9f0; color:#00b894; }

  /* ── Code Block ── */
  .code-block {
    background:#1e1e2e; color:#cdd6f4; border-radius:8px; padding:16px 20px;
    font-family:'Consolas','Courier New',monospace; font-size:13px;
    overflow-x:auto; margin:12px 0; line-height:1.7; position:relative;
  }
  .code-block .comment { color:#6c7086; }
  .code-block .cmd { color:#89b4fa; }
  .code-block .str { color:#a6e3a1; }
  .code-block .url { color:#f9e2af; }
  .copy-btn {
    position:absolute; top:8px; right:8px;
    background:rgba(255,255,255,0.1); color:#cdd6f4; border:1px solid rgba(255,255,255,0.15);
    padding:5px 12px; border-radius:6px; font-size:12px; cursor:pointer;
    font-family:'Segoe UI',sans-serif; transition:all 0.2s; display:flex; align-items:center; gap:5px;
  }
  .copy-btn:hover { background:rgba(255,255,255,0.2); }
  .copy-btn.copied { background:var(--success); color:#fff; border-color:var(--success); }

  /* ── Flow Diagram ── */
  .flow { display:flex; align-items:center; gap:6px; flex-wrap:wrap; padding:16px 0; }
  .flow-step { background:var(--primary); color:#fff; padding:10px 18px; border-radius:8px; font-size:13px; font-weight:600; }
  .flow-arrow { color:var(--accent); font-size:20px; font-weight:700; }
  .flow-step.danger { background:var(--danger); }
  .flow-step.accent { background:var(--accent); }

  /* ── Timeline ── */
  .timeline { display:flex; gap:0; overflow-x:auto; padding-bottom:12px; }
  .tl-item { flex:1; min-width:140px; position:relative; text-align:center; padding:16px 8px; }
  .tl-item::before { content:''; position:absolute; top:38px; left:0; right:0; height:3px; background:var(--border); z-index:0; }
  .tl-item:first-child::before { left:50%; }
  .tl-item:last-child::before { right:50%; }
  .tl-dot { width:20px; height:20px; border-radius:50%; margin:0 auto 12px; position:relative; z-index:1; border:3px solid #fff; }
  .tl-dot.red { background:var(--danger); box-shadow:0 0 0 2px var(--danger); }
  .tl-dot.orange { background:#e17055; box-shadow:0 0 0 2px #e17055; }
  .tl-dot.blue { background:var(--accent2); box-shadow:0 0 0 2px var(--accent2); }
  .tl-dot.green { background:var(--success); box-shadow:0 0 0 2px var(--success); }
  .tl-dot.accent { background:var(--accent); box-shadow:0 0 0 2px var(--accent); }
  .tl-time { font-size:12px; font-weight:700; }
  .tl-time.red { color:var(--danger); } .tl-time.orange { color:#e17055; }
  .tl-time.blue { color:var(--accent2); } .tl-time.green { color:var(--success); }
  .tl-title { font-size:13px; font-weight:600; margin-top:4px; }
  .tl-type { font-size:11px; color:var(--text-light); margin-top:2px; }

  /* ── Tip / Warning / Danger Boxes ── */
  .tip-box { background:#e8f8f5; border-left:4px solid var(--success); border-radius:0 8px 8px 0; padding:16px 20px; margin:16px 0; }
  .tip-box .tip-label { font-weight:700; color:var(--success); font-size:13px; margin-bottom:4px; }
  .tip-box p { font-size:14px; color:var(--text); margin:0; }
  .warning-box { background:#fff9e6; border-left:4px solid #f39c12; border-radius:0 8px 8px 0; padding:16px 20px; margin:16px 0; }
  .warning-box .warning-label { font-weight:700; color:#f39c12; font-size:13px; margin-bottom:4px; }
  .warning-box p { font-size:14px; color:var(--text); margin:0; }
  .danger-box { background:#fef2f2; border-left:4px solid var(--danger); border-radius:0 8px 8px 0; padding:16px 20px; margin:16px 0; }
  .danger-box .danger-label { font-weight:700; color:var(--danger); font-size:13px; margin-bottom:4px; }
  .danger-box p { font-size:14px; color:var(--text); margin:0; }

  /* ── Compare Block (Before/After, Bad/Good) ── */
  .compare-block { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin:16px 0; }
  .compare-item { border-radius:10px; padding:18px; }
  .compare-item.bad { background:#fef2f2; border:1px solid #fecaca; }
  .compare-item.good { background:#f0fdf4; border:1px solid #bbf7d0; }
  .compare-label { font-size:12px; font-weight:700; letter-spacing:0.5px; margin-bottom:8px; display:flex; align-items:center; gap:6px; }
  .compare-label.bad-label { color:var(--danger); }
  .compare-label.good-label { color:var(--success); }
  .compare-text { font-size:14px; color:var(--text); line-height:1.7; }

  /* ── Why Box ── */
  .why-box { background:#fffbeb; border-left:4px solid #f59e0b; border-radius:0 8px 8px 0; padding:14px 18px; margin:12px 0; }
  .why-box .why-label { font-weight:700; color:#d97706; font-size:12px; margin-bottom:4px; }
  .why-box p { font-size:13px; color:var(--text); margin:0; }

  /* ── Anti-Pattern Card ── */
  .anti-card { background:var(--card); border-radius:16px; margin-bottom:28px; box-shadow:0 2px 16px rgba(0,0,0,0.07); border:1px solid var(--border); overflow:hidden; }
  .anti-header { padding:20px 28px; display:flex; align-items:center; gap:14px; }
  .anti-header.bad-bg { background:linear-gradient(135deg, #d63031, #e17055); color:#fff; }
  .anti-num { width:40px; height:40px; border-radius:50%; background:rgba(255,255,255,0.2); display:flex; align-items:center; justify-content:center; font-size:18px; font-weight:700; flex-shrink:0; }
  .anti-title { font-size:1.1rem; font-weight:700; }
  .anti-desc { font-size:13px; opacity:0.9; margin-top:2px; }
  .anti-body { padding:24px 28px; }

  /* ── Step Items (CSS Counter) ── */
  .steps { counter-reset:step; }
  .step-item {
    background:var(--card); border-radius:12px; padding:48px 24px 24px;
    margin-bottom:16px; position:relative; border:1px solid var(--border);
    box-shadow:0 2px 8px rgba(0,0,0,0.04);
  }
  .step-item::before {
    counter-increment:step; content:"Step " counter(step);
    position:absolute; left:20px; top:16px;
    background:var(--accent2); color:#fff; padding:4px 12px; border-radius:6px;
    font-size:11px; font-weight:700; letter-spacing:0.5px;
  }
  .step-item h4 { font-size:1rem; font-weight:700; margin-bottom:8px; color:var(--primary); }
  .step-item p { font-size:14px; color:var(--text); margin-bottom:8px; }

  /* ── Checklist Cards ── */
  .checklist-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(300px, 1fr)); gap:16px; }
  .check-card { background:var(--card); border-radius:12px; padding:24px; border:2px solid var(--border); display:flex; align-items:center; gap:16px; transition:border-color 0.2s; }
  .check-card:hover { border-color:var(--accent); }
  .check-num { width:48px; height:48px; border-radius:50%; background:var(--accent); color:#fff; display:flex; align-items:center; justify-content:center; font-size:20px; font-weight:700; flex-shrink:0; }

  /* ── Strategy Cards (3-phase) ── */
  .strategy-grid { display:grid; grid-template-columns:repeat(3, 1fr); gap:20px; margin:20px 0; }
  .strategy-card { border-radius:12px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,0.06); border:1px solid var(--border); transition:transform 0.2s; }
  .strategy-card:hover { transform:translateY(-2px); box-shadow:0 6px 20px rgba(0,0,0,0.1); }
  .strategy-header { padding:18px 24px; color:#fff; }
  .strategy-header.urgent { background:linear-gradient(135deg, #d63031, #e17055); }
  .strategy-header.mid { background:linear-gradient(135deg, #0f3460, #533483); }
  .strategy-header.long { background:linear-gradient(135deg, var(--primary), var(--accent2)); }
  .strategy-header .period { font-size:11px; opacity:0.85; font-weight:600; }
  .strategy-header h3 { font-size:1.05rem; font-weight:700; margin-top:4px; }
  .strategy-body { padding:20px 24px; background:var(--card); }
  .strategy-body li { font-size:14px; margin-bottom:8px; }
  .strategy-body ul { padding-left:18px; }

  /* ── Shortcut Grid ── */
  .shortcut-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:12px; margin-top:12px; }
  .shortcut-item { background:#f8f9fa; border-radius:8px; padding:14px; display:flex; align-items:center; gap:12px; }
  .shortcut-key { background:var(--primary); color:#fff; padding:6px 12px; border-radius:6px; font-family:monospace; font-size:13px; font-weight:700; white-space:nowrap; }
  .shortcut-desc { font-size:13px; color:var(--text); }

  /* ── Principle Cards ── */
  .principle-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:16px; margin:20px 0; }
  .principle-card { background:var(--card); border-radius:12px; padding:24px; text-align:center; border:2px solid var(--border); transition:border-color 0.2s; }
  .principle-card:hover { border-color:var(--accent); }
  .principle-icon { font-size:32px; margin-bottom:12px; }
  .principle-title { font-size:1rem; font-weight:700; color:var(--primary); margin-bottom:6px; }
  .principle-desc { font-size:13px; color:var(--text-light); }

  /* ── Contact Card ── */
  .contact-card { background:linear-gradient(135deg, #667eea 0%, #764ba2 100%); color:#fff; border-radius:16px; padding:32px; margin:24px 0; box-shadow:0 4px 20px rgba(102,126,234,0.3); }
  .contact-card h3 { font-size:1.2rem; margin-bottom:16px; }
  .contact-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:16px; }
  .contact-item { background:rgba(255,255,255,0.15); border-radius:12px; padding:20px; backdrop-filter:blur(10px); }

  /* ── Summary Box (Dark) ── */
  .summary-box { background:linear-gradient(135deg, var(--primary), var(--accent2)); color:#fff; border-radius:16px; padding:32px; margin:32px 0; }
  .summary-box h2 { font-size:1.3rem; margin-bottom:20px; border-left:4px solid var(--accent); padding-left:12px; }
  .summary-list { list-style:none; }
  .summary-list li { padding:8px 0; font-size:15px; display:flex; align-items:flex-start; gap:10px; }
  .summary-num { background:var(--accent); color:#fff; width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:700; flex-shrink:0; }

  /* ── Segment Bar Chart ── */
  .segment-chart { margin:20px 0; }
  .seg-row { display:flex; align-items:center; gap:12px; margin-bottom:14px; }
  .seg-label { width:160px; font-size:13px; font-weight:600; flex-shrink:0; text-align:right; }
  .seg-bar-wrap { flex:1; background:#f1f3f5; border-radius:8px; height:36px; overflow:hidden; }
  .seg-bar { height:100%; border-radius:8px; display:flex; align-items:center; justify-content:flex-end; padding-right:12px; font-size:12px; font-weight:700; color:#fff; transition:width 1s ease; }
  .seg-bar.critical { background:linear-gradient(90deg, #d63031, #e17055); }
  .seg-bar.high { background:linear-gradient(90deg, #e17055, #fdcb6e); }
  .seg-bar.medium { background:linear-gradient(90deg, #fdcb6e, #ffeaa7); color:var(--text); }
  .seg-bar.low { background:linear-gradient(90deg, #00b894, #55efc4); }
  .seg-tag { font-size:11px; color:var(--text-light); width:80px; flex-shrink:0; }

  /* ── Footer ── */
  .footer-bar { background:var(--primary); color:rgba(255,255,255,0.6); text-align:center; padding:20px; font-size:12px; margin-top:40px; }

  /* ── Responsive ── */
  @media (max-width:768px) {
    .top-nav { flex-wrap:wrap; height:auto; }
    .top-nav a { padding:10px 12px; font-size:11px; }
    .top-nav .nav-title { display:none; }
    body { padding-top:48px; }
    .header h1 { font-size:1.5rem; }
    .cards-grid, .cards-3, .strategy-grid { grid-template-columns:1fr; }
    .compare-block { grid-template-columns:1fr; }
    .timeline { flex-direction:column; }
    .tl-item::before { display:none; }
    .flow { flex-direction:column; align-items:flex-start; }
    .stat-row { grid-template-columns:repeat(2, 1fr); }
    .seg-label { width:100px; font-size:12px; }
  }
</style>
</head>
<body>

<!-- Sticky Navigation -->
<nav class="top-nav" id="topNav">
  <span class="nav-title">{{BRAND_TITLE}}</span>
  <a href="#sec-1" data-section="sec-1">{{ICON}} {{Section 1}}</a>
  <a href="#sec-2" data-section="sec-2">{{ICON}} {{Section 2}}</a>
  <!-- add more as needed -->
</nav>

<!-- Scroll Top Button -->
<button class="scroll-top-btn" id="scrollTopBtn" onclick="window.scrollTo({top:0,behavior:'smooth'})">&#8593;</button>

<!-- === SECTION 1 === -->
<section id="sec-1">
  <div class="header hdr-navy">
    <div class="container">
      <div class="badge">{{BADGE}}</div>
      <h1>{{TITLE}}</h1>
      <p>{{SUBTITLE}}</p>
    </div>
  </div>
  <div class="container">
    <!-- content here using component snippets -->
  </div>
</section>

<div class="session-divider"></div>

<!-- === SECTION 2 === -->
<section id="sec-2">
  <!-- ... -->
</section>

<!-- Footer -->
<div class="footer-bar">{{FOOTER_TEXT}}</div>

<script>
// Scroll Top
var sb=document.getElementById('scrollTopBtn');
window.addEventListener('scroll',function(){sb.classList.toggle('visible',window.scrollY>400);});

// Active Nav
var ss=document.querySelectorAll('section[id]'),nl=document.querySelectorAll('.top-nav a[data-section]');
var ob=new IntersectionObserver(function(e){e.forEach(function(en){if(en.isIntersecting){var id=en.target.id;nl.forEach(function(l){l.classList.toggle('active',l.getAttribute('data-section')===id);});}});},{rootMargin:'-80px 0px -50% 0px',threshold:0});
ss.forEach(function(s){ob.observe(s);});

// Smooth Scroll
document.querySelectorAll('.top-nav a[href^="#"]').forEach(function(a){a.addEventListener('click',function(e){e.preventDefault();var t=document.querySelector(this.getAttribute('href'));if(t)window.scrollTo({top:t.getBoundingClientRect().top+window.pageYOffset-56,behavior:'smooth'});});});

// Copy Button (add if using code-block)
function copyText(btn,text){navigator.clipboard.writeText(text).then(function(){btn.innerHTML='&#10003; 복사됨';btn.classList.add('copied');setTimeout(function(){btn.innerHTML='&#128203; 복사';btn.classList.remove('copied');},2000);});}

// Segment Bar Animation (add if using segment-chart)
var bc=document.querySelector('.segment-chart');
if(bc){var bo=new IntersectionObserver(function(e){e.forEach(function(en){if(en.isIntersecting){en.target.querySelectorAll('.seg-bar').forEach(function(b){var w=b.style.width;b.style.width='0%';setTimeout(function(){b.style.width=w;},100);});bo.unobserve(en.target);}});},{threshold:0.3});bo.observe(bc);}
</script>
</body>
</html>
```

---

## Component Snippets

Copy these HTML blocks into any `<div class="container"><div class="section">` area.

### Alert Box
```html
<div class="alert-box">
  <div class="alert-icon-large">&#9888;</div>
  <div class="alert-text-large">
    <strong>{{TITLE}}</strong>
    {{DESCRIPTION}}
  </div>
</div>
```

### Stat Cards Row
```html
<div class="stat-row">
  <div class="stat-card">
    <div class="stat-value danger">{{VALUE}}</div>
    <div class="stat-label">{{LABEL}}</div>
    <div class="stat-sub">{{SUBLABEL}}</div>
  </div>
  <!-- .stat-value variants: danger, warning, accent, info, success -->
</div>
```

### Content Card with Icon
```html
<div class="cards-grid">
  <div class="card">
    <div class="card-header">
      <div class="card-icon red">{{EMOJI}}</div>
      <div><div class="card-title">{{TITLE}}</div><div class="card-subtitle">{{SUB}}</div></div>
    </div>
    <div class="card-body">
      <p>{{TEXT}}</p>
      <ul><li>{{ITEM}}</li></ul>
    </div>
  </div>
  <!-- .card-icon variants: red, blue, green, purple, orange, gray -->
</div>
```

### Compare Block (Bad/Good or Before/After)
```html
<div class="compare-block">
  <div class="compare-item bad">
    <div class="compare-label bad-label">&#10060; Bad</div>
    <div class="compare-text">{{BAD_CONTENT}}</div>
  </div>
  <div class="compare-item good">
    <div class="compare-label good-label">&#9989; Good</div>
    <div class="compare-text">{{GOOD_CONTENT}}</div>
  </div>
</div>
```

### Flow Diagram
```html
<div class="flow">
  <div class="flow-step danger">{{STEP 1}}</div>
  <div class="flow-arrow">&#10140;</div>
  <div class="flow-step">{{STEP 2}}</div>
  <div class="flow-arrow">&#10140;</div>
  <div class="flow-step accent">{{STEP 3}}</div>
</div>
```

### Timeline
```html
<div class="timeline">
  <div class="tl-item">
    <div class="tl-dot green"></div>
    <div class="tl-time green">{{TIME}}</div>
    <div class="tl-title">{{TITLE}}</div>
    <div class="tl-type">{{TYPE}}</div>
  </div>
  <!-- .tl-dot/.tl-time variants: red, orange, blue, green, accent -->
</div>
```

### Impact Table (Dark Header)
```html
<table class="impact-table">
  <tr><th>{{COL1}}</th><th>{{COL2}}</th><th>{{COL3}}</th></tr>
  <tr>
    <td><strong>{{DATA}}</strong></td>
    <td>{{DATA}}</td>
    <td><span class="risk-badge risk-critical">{{RISK}}</span></td>
  </tr>
  <!-- .risk-badge variants: risk-critical, risk-high, risk-medium, risk-low -->
</table>
```

### Strategy Cards (3-Phase)
```html
<div class="strategy-grid">
  <div class="strategy-card">
    <div class="strategy-header urgent">
      <div class="period">PHASE 1</div><h3>{{TITLE}}</h3>
    </div>
    <div class="strategy-body"><ul><li>{{ITEM}}</li></ul></div>
  </div>
  <!-- .strategy-header variants: urgent(red), mid(purple), long(navy) -->
</div>
```

### Anti-Pattern Card
```html
<div class="anti-card">
  <div class="anti-header bad-bg">
    <div class="anti-num">1</div>
    <div><div class="anti-title">{{TITLE}}</div><div class="anti-desc">{{DESC}}</div></div>
  </div>
  <div class="anti-body">
    <!-- compare-block, why-box, etc. -->
  </div>
</div>
```

### Tip / Warning / Danger Boxes
```html
<div class="tip-box">
  <div class="tip-label">TIP</div><p>{{CONTENT}}</p>
</div>
<div class="warning-box">
  <div class="warning-label">&#9888; 주의</div><p>{{CONTENT}}</p>
</div>
<div class="danger-box">
  <div class="danger-label">&#9888; 위험</div><p>{{CONTENT}}</p>
</div>
```

### Summary Box (Dark)
```html
<div class="summary-box">
  <h2>{{TITLE}}</h2>
  <ul class="summary-list">
    <li><span class="summary-num">1</span> {{ITEM}}</li>
    <li><span class="summary-num">2</span> {{ITEM}}</li>
  </ul>
</div>
```

### Segment Bar Chart
```html
<div class="segment-chart">
  <div class="seg-row">
    <div class="seg-label">{{LABEL}}</div>
    <div class="seg-bar-wrap"><div class="seg-bar critical" style="width:90%;">{{TEXT}}</div></div>
    <div class="seg-tag">{{TAG}}</div>
  </div>
  <!-- .seg-bar variants: critical(red), high(orange), medium(yellow), low(green) -->
</div>
```

### Code Block with Copy
```html
<div class="code-block">
  <button class="copy-btn" onclick="copyText(this, '{{TEXT_TO_COPY}}')">&#128203; 복사</button>
  <span class="cmd">{{COMMAND}}</span> <span class="str">{{ARGS}}</span>
</div>
```

### Step Items
```html
<div class="steps">
  <div class="step-item">
    <h4>{{TITLE}}</h4>
    <p>{{DESCRIPTION}}</p>
  </div>
  <!-- auto-numbered via CSS counter -->
</div>
```

---

## Design Rules

1. **Single-file**: All CSS/JS inline. Zero external dependencies.
2. **Always copy the full CSS** from Base Template. Never paraphrase or approximate.
3. **Section structure**: `<section id>` → `.header.hdr-*` → `.container > .section` → components.
4. **Gradient variety**: Use a different `.hdr-*` class per section for visual rhythm.
5. **Section titles**: Always `<h2>` inside `.section` — gets automatic 4px accent left border.
6. **Dividers**: Place `<div class="session-divider"></div>` between sections.
7. **Responsive**: Already handled in CSS. No additional media queries needed.
8. **Korean-first**: Labels, tips, and UI text in Korean. Use HTML entities for icons (&#9888; &#128200; etc.).
9. **Card hover**: All cards have `translateY(-2px)` hover. Do not override.
10. **Color semantics**: danger=red problems, success=green positive, warning=yellow caution, accent=coral highlights, info=blue neutral.
