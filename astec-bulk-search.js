javascript: (function () {
  if (document.getElementById('abp')) { document.getElementById('abp').style.display = 'flex'; return; }

  // ── PEGAR AQUI LA URL CSV DEL GOOGLE SHEET (publicado como CSV) ───────────
  var SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vREWNCDYnqcRmQvQ8VGdVZBEglx4PlahEbj2OSz5H3NponSyFBX-M_S4MhEK_HQhNZDqcZZQ_Dl38WF/pub?gid=0&single=true&output=csv';
  // ─────────────────────────────────────────────────────────────────────────────

  var R = [];
  var cotDB = {};        // { 'PARTNUMBER': [ {quote,fecha,qty,price,leadtime,notes}, ...] }
  var cotDBLoaded = false;
  var globalFactor = 1.3;
  var globalUtilidad = 0.7;
  var globalTRM = 4000;
  var selectedRows = new Set();

  var s = document.createElement('style');
  s.textContent =
    '#abp{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:1180px;max-width:98vw;max-height:88vh;background:#0d0f10;border:2px solid #f97316;z-index:999999999;font-family:monospace;display:flex;flex-direction:column}' +
    '#abp-h{background:#161a1c;padding:12px 16px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #2a3038;flex-shrink:0}' +
    '#abp-h b{color:#f97316;letter-spacing:2px;font-size:13px}' +
    '#abp-x{background:transparent;border:1px solid #444;color:#888;cursor:pointer;padding:4px 10px;font-family:monospace}' +
    '#abp-b{padding:14px;display:flex;flex-direction:column;gap:8px;flex:1;overflow:hidden}' +
    '#abp-ta{background:#0d1215;border:1px solid #2a3038;color:#e2e8f0;padding:10px;font-size:12px;resize:none;height:90px;outline:none;width:100%;font-family:monospace;box-sizing:border-box}' +
    '#abp-ta:focus{border-color:#f97316}' +
    '#abp-c{display:flex;gap:8px;align-items:center;flex-wrap:wrap}' +
    '#abp-go{background:#f97316;color:#000;border:none;cursor:pointer;padding:8px 18px;font-weight:700;font-size:12px;font-family:monospace}' +
    '#abp-go:disabled{opacity:0.4;cursor:not-allowed}' +
    '#abp-new{background:transparent;border:1px solid #444;color:#888;cursor:pointer;padding:8px 12px;font-size:11px;font-family:monospace}' +
    '#abp-new:hover{border-color:#f97316;color:#f97316}' +
    '#abp-csv{background:transparent;border:1px solid #2a3038;color:#64748b;cursor:pointer;padding:8px 12px;font-size:11px;font-family:monospace;display:none}' +
    '#abp-csv:hover{border-color:#22c55e;color:#22c55e}' +
    '#abp-del{background:transparent;border:1px solid #ef4444;color:#ef4444;cursor:pointer;padding:8px 12px;font-size:11px;font-family:monospace;display:none}' +
    '#abp-del:hover{background:#ef4444;color:#000}' +
    '#abp-p{font-size:11px;color:#64748b;flex:1;min-width:80px}' +
    '#abp-gf{display:flex;gap:16px;align-items:center;flex-wrap:wrap;padding:7px 10px;background:#0d1215;border:1px solid #2a3038}' +
    '#abp-gf label{color:#94a3b8;font-size:10px;letter-spacing:1px;text-transform:uppercase}' +
    '#abp-gf input{background:#161a1c;border:1px solid #2a3038;color:#e2e8f0;padding:4px 8px;font-size:12px;width:72px;font-family:monospace;outline:none}' +
    '#abp-gf input.wide{width:90px}' +
    '#abp-gf input:focus{border-color:#f97316}' +
    '#abp-gf span{color:#64748b;font-size:10px}' +
    '#abp-tw{flex:1;overflow:auto;border:1px solid #2a3038}' +
    '#abp-t{width:100%;border-collapse:collapse;font-size:11px}' +
    '#abp-t th{background:#161a1c;padding:6px 8px;text-align:left;color:#64748b;font-size:9px;letter-spacing:1px;text-transform:uppercase;border-bottom:1px solid #2a3038;position:sticky;top:0;white-space:nowrap}' +
    '#abp-t td{padding:5px 8px;border-bottom:1px solid #1e2428;color:#e2e8f0;white-space:nowrap}' +
    '.abp-var td{background:rgba(249,115,22,0.04)}' +
    '.abp-ei{background:#0d1215;border:1px solid #2a3038;color:#e2e8f0;padding:3px 5px;font-size:11px;width:60px;font-family:monospace;outline:none;-moz-appearance:textfield}' +
    '.abp-ei::-webkit-outer-spin-button,.abp-ei::-webkit-inner-spin-button{-webkit-appearance:none}' +
    '.abp-ei:focus{border-color:#f97316}' +
    '.abp-ei.ovr{border-color:#f97316;color:#f97316}' +
    '#abp-t input[type=checkbox]{accent-color:#f97316;cursor:pointer;width:13px;height:13px}' +
    '.abp-sel td{background:rgba(239,68,68,0.06)!important}' +
    '.abp-cot td{background:rgba(14,165,233,0.07)!important}' +
    '.abp-cot-lbl{color:#38bdf8;font-size:9px;letter-spacing:1px;text-transform:uppercase;font-weight:700}' +
    '.abp-cot-q{color:#fbbf24;font-weight:700;font-size:11px}' +
    '.abp-cot-d{color:#94a3b8;font-size:10px}' +
    '.abp-cot-p{color:#4ade80;font-weight:700}' +
    '.abp-cot-lt{color:#c084fc;font-size:10px}' +
    '.abp-ni{background:#0d1215;border:1px solid #1e3a4a;color:#e2e8f0;padding:2px 5px;font-size:10px;font-family:monospace;outline:none;width:100%;box-sizing:border-box}' +
    '.abp-ni:focus{border-color:#38bdf8}' +
    '#abp-db-status{font-size:10px;padding:3px 8px;border-radius:2px}';
  document.head.appendChild(s);

  var p = document.createElement('div');
  p.id = 'abp';
  p.innerHTML =
    '<div id="abp-h"><b>ASTEC BULK SEARCH</b><span id="abp-db-status" style="color:#64748b;background:#1e2428">⏳ cargando DB...</span><button id="abp-x">X</button></div>' +
    '<div id="abp-b">' +
    '<textarea id="abp-ta" placeholder="Referencias una por linea:&#10;450056&#10;450053&#10;406055sx"></textarea>' +
    '<div id="abp-c">' +
    '<button id="abp-go">BUSCAR</button>' +
    '<button id="abp-new">&#x21BA; NUEVA BUSQUEDA</button>' +
    '<button id="abp-csv">&#x2B07; EXPORTAR EXCEL</button>' +
    '<button id="abp-del">&#x1F5D1; ELIMINAR SELECCIONADOS</button>' +
    '<div id="abp-p">Listo</div>' +
    '</div>' +
    '<div id="abp-gf">' +
    '<label>Factor:</label>' +
    '<input id="abp-gfv" type="number" step="0.01" min="0.01" value="1.3">' +
    '<span>Importaciones (def. 1.3)</span>' +
    '&nbsp;&nbsp;&nbsp;' +
    '<label>Utilidad:</label>' +
    '<input id="abp-guv" type="number" step="0.01" min="0.01" max="1" value="0.7">' +
    '<span>Margen (def. 0.7 = 30%)</span>' +
    '&nbsp;&nbsp;&nbsp;' +
    '<label>TRM:</label>' +
    '<input id="abp-gtrm" type="number" step="1" min="1" value="4000" class="wide">' +
    '<span>COP/USD (def. 4000)</span>' +
    '</div>' +
    '<div id="abp-tw"><table id="abp-t"><thead><tr>' +
    '<th><input type="checkbox" id="abp-chkall" title="Seleccionar todo"></th>' +
    '<th>#</th>' +
    '<th>Buscado</th>' +
    '<th>Part Number</th>' +
    '<th>Product Line</th>' +
    '<th>Description</th>' +
    '<th>Qty On Hand</th>' +
    '<th>List Price</th>' +
    '<th>Currency</th>' +
    '<th>Dealer Net</th>' +
    '<th>Factor</th>' +
    '<th>Utilidad</th>' +
    '<th>PVP</th>' +
    '<th>TRM</th>' +
    '<th>PVP COP</th>' +
    '<th>Weight</th>' +
    '</tr></thead><tbody id="abp-tb"></tbody></table></div>' +
    '</div>';
  document.body.appendChild(p);

  function sl(ms) { return new Promise(function (r) { setTimeout(r, ms); }) }

  function sv(el, v) {
    try { var pr = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value'); if (pr && pr.set) pr.set.call(el, v); else el.value = v; } catch (e) { el.value = v; }
    var k = Object.keys(el).find(function (k) { return k.startsWith('__reactProps'); });
    if (k) { try { var p2 = el[k]; if (p2 && p2.onChange) p2.onChange({ target: el, currentTarget: el, type: 'change', bubbles: true }); } catch (e) { } }
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function toNum(v) { if (!v || v === '' || v === '—') return v; var n = parseFloat(String(v).replace(/,/g, '')); return isNaN(n) ? v : n; }
  function fmtNum(v) { if (v === null || v === undefined || v === '' || v === '—') return v === undefined ? '' : v; var n = parseFloat(String(v).replace(/,/g, '')); if (isNaN(n)) return v; return String(n).replace('.', ','); }
  function csvCell(v) { var s = String(v === null || v === undefined ? '' : v); return '"' + s.replace(/"/g, '""') + '"'; }
  function asTextCell(v) { var s = String(v === null || v === undefined ? '' : v); return '"=""' + s.replace(/"/g, '""') + '"""'; }
  function escHtml(str) { return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  /* ── Base de cotizaciones (Google Sheets) ── */
  function parseCSV(text) {
    var rows = [];
    var lines = text.split('\n');
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].replace(/\r/, '');
      if (!line.trim()) continue;
      var cols = []; var cur = ''; var inQ = false;
      for (var j = 0; j < line.length; j++) {
        var ch = line[j];
        if (ch === '"') { inQ = !inQ; }
        else if (ch === ',' && !inQ) { cols.push(cur.trim()); cur = ''; }
        else cur += ch;
      }
      cols.push(cur.trim());
      rows.push(cols);
    }
    return rows;
  }

  async function loadCotDB() {
    var statusEl = document.getElementById('abp-db-status');
    if (!SHEET_CSV_URL || SHEET_CSV_URL.indexOf('SHEET_ID') > -1) {
      if (statusEl) { statusEl.textContent = '⚠ DB no configurada'; statusEl.style.color = '#f97316'; }
      cotDBLoaded = true; return;
    }
    try {
      var resp = await fetch(SHEET_CSV_URL + '&cachebust=' + Date.now());
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      var text = await resp.text();
      console.log("CSV RAW (primeros 300 chars):", text.substring(0,300));
      var rows = parseCSV(text);
      console.log("Total filas:", rows.length);
      console.log("Fila 1 (headers):", rows[0]);
      console.log("Fila 2 (primer dato):", rows[1]);
      cotDB = {};
      if (rows.length < 2) {
        if (statusEl) { statusEl.textContent = '📋 DB vacía'; statusEl.style.color = '#64748b'; }
        cotDBLoaded = true; return;
      }
      // Header: Quote#(0) Fecha(1) Line(2) Part(3) Description(4)
      //         Expected Qty(5) Unit Price(6) Ext. Price(7) Lead Time(8) Notes(9)
      for (var i = 1; i < rows.length; i++) {
        var r = rows[i];
        if (i === 1) {
          console.log("Fila analizada:", r);
          console.log("Part detectado (r[3]):", r[3]);
        }
        if (r.length < 4) continue;
        var part = String(r[3] || '').trim().toUpperCase();
        if (!part) continue;
        if (!cotDB[part]) cotDB[part] = [];
        cotDB[part].push({
          quote: String(r[0] || '').trim(),
          fecha: String(r[1] || '').trim(),
          line: String(r[2] || '').trim(),
          desc: String(r[4] || '').trim(),
          qty: String(r[5] || '').trim(),
          price: String(r[6] || '').trim(),
          extPrice: String(r[7] || '').trim(),
          leadTime: String(r[8] || '').trim(),
          notes: String(r[9] || '').trim()
        });
      }
      var total = Object.keys(cotDB).length;
      if (statusEl) {
        statusEl.textContent = '📋 DB: ' + total + ' refs';
        statusEl.style.color = '#22c55e';
        statusEl.style.background = 'rgba(34,197,94,0.1)';
      }
      cotDBLoaded = true;
    } catch (e) {
      if (statusEl) { statusEl.textContent = '❌ DB error'; statusEl.style.color = '#ef4444'; statusEl.style.background = 'rgba(239,68,68,0.1)'; }
      cotDBLoaded = true;
      console.warn('ASTEC cotDB load error:', e);
    }
  }

  function calcDealerNet(price) {
    if (price === null || price === undefined || price === '' || price === '—') return '—';
    var n = typeof price === 'number' ? price : parseFloat(String(price).replace(/,/g, ''));
    if (isNaN(n) || n === 0) return price;
    return Math.round(n * 0.8 * 100) / 100;
  }

  function calcPVP(price, factor, utilidad) {
    var dn = calcDealerNet(price);
    if (dn === null || dn === undefined || dn === '' || dn === '—') return '—';
    var dnN = typeof dn === 'number' ? dn : parseFloat(String(dn).replace(/,/g, ''));
    var f = parseFloat(factor); var u = parseFloat(utilidad);
    if (isNaN(dnN) || isNaN(f) || isNaN(u) || u === 0) return '—';
    return Math.round(dnN * f / u * 100) / 100;
  }

  function calcPVPCOP(price, factor, utilidad, trm) {
    var pvp = calcPVP(price, factor, utilidad);
    if (pvp === null || pvp === undefined || pvp === '' || pvp === '—') return '—';
    var pvpN = typeof pvp === 'number' ? pvp : parseFloat(String(pvp).replace(/,/g, ''));
    var t = parseFloat(trm);
    if (isNaN(pvpN) || isNaN(t)) return '—';
    return Math.round(pvpN * t);
  }

  function getTableText() { return Array.from(document.querySelectorAll('.dt-scroll-body tbody tr')).map(function (r) { return r.innerText.trim(); }).join('|'); }
  function isTableEmpty() { var rows = document.querySelectorAll('.dt-scroll-body tbody tr'); if (rows.length === 0) return true; if (rows.length === 1 && rows[0].innerText.trim().toLowerCase().indexOf('no data') > -1) return true; return false; }
  function isTableNoResults() { var rows = document.querySelectorAll('.dt-scroll-body tbody tr'); if (rows.length === 0) return true; if (rows.length === 1) { var txt = rows[0].innerText.trim().toLowerCase(); if (txt.indexOf('no data') > -1 || txt.indexOf('no results') > -1) return true; } return false; }
  async function waitEmpty() { for (var i = 0; i < 30; i++) { await sl(300); if (isTableEmpty()) return; } }
  async function waitStable(ref) {
    var prev = ''; var sameCount = 0; var noDataCount = 0;
    for (var i = 0; i < 30; i++) {
      await sl(400); var curr = getTableText();
      if (isTableNoResults()) { noDataCount++; if (noDataCount >= 5) return; } else { noDataCount = 0; }
      if (curr === prev && curr !== '' && curr.toLowerCase().indexOf('no data') === -1 && curr.toUpperCase().indexOf(ref.toUpperCase()) > -1) { sameCount++; if (sameCount >= 2) return; } else { sameCount = 0; }
      prev = curr;
    }
  }

  function readResults(ref) {
    var results = [];
    var rows = document.querySelectorAll('.dt-scroll-body tbody tr');
    for (var i = 0; i < rows.length; i++) {
      var c = rows[i].querySelectorAll('td');
      if (c.length < 6) continue;
      var pn = c[0].innerText.trim();
      if (pn.toUpperCase().indexOf(ref.toUpperCase()) > -1) {
        results.push({ partnum: pn, line: c[1] ? c[1].innerText.trim() : '—', desc: c[2] ? c[2].innerText.trim() : '—', qty: c[4] ? c[4].innerText.trim() : '—', price: c[5] ? c[5].innerText.trim() : '—', currency: c[6] ? c[6].innerText.trim() : '—', weight: c[9] ? c[9].innerText.trim() : '—' });
      }
    }
    return results;
  }

  function renderTable() {
    var tb = document.getElementById('abp-tb');
    tb.innerHTML = '';
    selectedRows.clear();
    updateDelBtn(); updateSelectAll();
    for (var i = 0; i < R.length; i++) {
      (function (idx) {
        var d = R[idx];
        var tr = document.createElement('tr');
        if (d._isVar) tr.className = 'abp-var';
        tr.dataset.idx = idx;

        // Checkbox
        var tdChk = document.createElement('td');
        var chk = document.createElement('input'); chk.type = 'checkbox'; chk.dataset.idx = idx;
        chk.onchange = function () {
          if (this.checked) { selectedRows.add(idx); tr.classList.add('abp-sel'); }
          else { selectedRows.delete(idx); tr.classList.remove('abp-sel'); }
          updateDelBtn(); updateSelectAll();
        };
        tdChk.appendChild(chk); tr.appendChild(tdChk);

        // #
        var tdN = document.createElement('td'); tdN.style.color = '#94a3b8'; tdN.textContent = d._num !== undefined ? String(d._num) : ''; tr.appendChild(tdN);

        // Buscado
        var tdRef = document.createElement('td');
        if (d._isVar) { tdRef.style.color = '#64748b'; tdRef.style.fontSize = '10px'; tdRef.style.paddingLeft = '16px'; tdRef.textContent = '↳ variante'; }
        else { tdRef.style.color = '#f97316'; tdRef.style.fontWeight = '600'; tdRef.innerHTML = escHtml(d.searched || '') + (d._refExtra || ''); }
        tr.appendChild(tdRef);

        // Part Number — si no result o error, colSpan y salir
        var tdPN = document.createElement('td');
        tdPN.style.fontWeight = '600';
        if (d._noResult) {
          tdPN.style.color = '#ef4444'; tdPN.style.fontStyle = 'italic'; tdPN.colSpan = 11; tdPN.textContent = 'Sin resultados';
          tr.appendChild(tdPN); document.getElementById('abp-tb').appendChild(tr); return;
        }
        if (d._error) {
          tdPN.style.color = '#ef4444'; tdPN.style.fontStyle = 'italic'; tdPN.colSpan = 11; tdPN.textContent = 'Error: ' + d.desc;
          tr.appendChild(tdPN); document.getElementById('abp-tb').appendChild(tr); return;
        }
        tdPN.style.color = '#fb923c'; tdPN.textContent = d.partnum; tr.appendChild(tdPN);

        // Product Line
        var tdL = document.createElement('td'); tdL.style.color = '#94a3b8'; tdL.textContent = d.line; tr.appendChild(tdL);
        // Description
        var tdD = document.createElement('td'); tdD.style.whiteSpace = 'normal'; tdD.style.maxWidth = '220px'; tdD.textContent = d.desc; tr.appendChild(tdD);
        // Qty
        var tdQ = document.createElement('td');
        var qc = d.qty === 'Call for Availability' ? '#eab308' : (!isNaN(parseInt(d.qty)) && parseInt(d.qty) > 0) ? '#22c55e' : '#ef4444';
        tdQ.style.color = qc; tdQ.style.fontWeight = '700'; tdQ.textContent = d.qty; tr.appendChild(tdQ);
        // List Price
        var tdLP = document.createElement('td'); tdLP.style.color = '#22c55e'; tdLP.textContent = fmtNum(d.price); tr.appendChild(tdLP);
        // Currency
        var tdCur = document.createElement('td'); tdCur.style.color = '#64748b'; tdCur.textContent = d.currency; tr.appendChild(tdCur);
        // Dealer Net
        var dn = calcDealerNet(d.price);
        var tdDN = document.createElement('td'); tdDN.style.color = '#38bdf8'; tdDN.textContent = fmtNum(dn); tr.appendChild(tdDN);

        // Factor (editable)
        var tdF = document.createElement('td');
        var inpF = document.createElement('input');
        inpF.type = 'number'; inpF.step = '0.01'; inpF.min = '0.01';
        inpF.className = 'abp-ei' + (d.isFactorOverridden ? ' ovr' : '');
        inpF.value = d.factor; inpF.title = d.isFactorOverridden ? 'Modificado manualmente' : 'Valor global';
        inpF.onchange = function () {
          var val = parseFloat(this.value); if (isNaN(val) || val <= 0) return;
          R[idx].factor = val; R[idx].isFactorOverridden = true;
          this.className = 'abp-ei ovr'; this.title = 'Modificado manualmente';
          refreshPVP(idx);
        };
        tdF.appendChild(inpF); tr.appendChild(tdF);

        // Utilidad (editable)
        var tdU = document.createElement('td');
        var inpU = document.createElement('input');
        inpU.type = 'number'; inpU.step = '0.01'; inpU.min = '0.01'; inpU.max = '1';
        inpU.className = 'abp-ei' + (d.isUtilidadOverridden ? ' ovr' : '');
        inpU.value = d.utilidad; inpU.title = d.isUtilidadOverridden ? 'Modificado manualmente' : 'Valor global';
        inpU.onchange = function () {
          var val = parseFloat(this.value); if (isNaN(val) || val <= 0) return;
          R[idx].utilidad = val; R[idx].isUtilidadOverridden = true;
          this.className = 'abp-ei ovr'; this.title = 'Modificado manualmente';
          refreshPVP(idx);
        };
        tdU.appendChild(inpU); tr.appendChild(tdU);

        // PVP
        var tdPVP = document.createElement('td');
        tdPVP.style.color = '#a78bfa'; tdPVP.style.fontWeight = '700';
        tdPVP.dataset.pvpIdx = idx;
        tdPVP.textContent = fmtNum(calcPVP(d.price, d.factor, d.utilidad));
        tr.appendChild(tdPVP);

        // TRM (editable)
        var tdT = document.createElement('td');
        var inpT = document.createElement('input');
        inpT.type = 'number'; inpT.step = '1'; inpT.min = '1';
        inpT.style.width = '72px';
        inpT.className = 'abp-ei' + (d.isTRMOverridden ? ' ovr' : '');
        inpT.value = d.trm; inpT.title = d.isTRMOverridden ? 'Modificado manualmente' : 'Valor global';
        inpT.onchange = function () {
          var val = parseFloat(this.value); if (isNaN(val) || val <= 0) return;
          R[idx].trm = val; R[idx].isTRMOverridden = true;
          this.className = 'abp-ei ovr'; this.title = 'Modificado manualmente';
          refreshPVP(idx);
        };
        tdT.appendChild(inpT); tr.appendChild(tdT);

        // PVP COP
        var tdCOP = document.createElement('td');
        tdCOP.style.color = '#fbbf24'; tdCOP.style.fontWeight = '700';
        tdCOP.dataset.pvpcopIdx = idx;
        tdCOP.textContent = fmtNum(calcPVPCOP(d.price, d.factor, d.utilidad, d.trm));
        tr.appendChild(tdCOP);

        // Weight
        var tdW = document.createElement('td'); tdW.style.color = '#94a3b8'; tdW.textContent = fmtNum(d.weight); tr.appendChild(tdW);

        document.getElementById('abp-tb').appendChild(tr);

        // ── Cotizaciones previas (sub-filas) ──────────────────────────────────
        if (!d._noResult && !d._error && d.partnum) {
          var key = String(d.partnum).toUpperCase();
          var cots = cotDB[key] || [];
          // También buscar por la referencia buscada (por si el part number difiere levemente)
          if (!cots.length && d.searched) {
            var key2 = String(d.searched).toUpperCase();
            cots = cotDB[key2] || [];
          }
          // Mostrar solo la más reciente por defecto (ordenar por fecha desc)
          if (cots.length) {
            var sorted = cots.slice().sort(function (a, b) { return b.fecha.localeCompare(a.fecha); });
            for (var ci = 0; ci < sorted.length; ci++) {
              (function (cot, cidx) {
                var ctr = document.createElement('tr');
                ctr.className = 'abp-cot';

                // col 1: checkbox vacío
                var ctdChk = document.createElement('td'); ctr.appendChild(ctdChk);
                // col 2: ícono
                var ctdN = document.createElement('td');
                ctdN.innerHTML = '<span title="Cotización previa ASTEC" style="font-size:13px">📋</span>';
                ctr.appendChild(ctdN);
                // col 3: label
                var ctdLbl = document.createElement('td');
                ctdLbl.innerHTML = '<span class="abp-cot-lbl">Cotiz. previa</span>';
                ctr.appendChild(ctdLbl);
                // col 4: Quote#
                var ctdQ = document.createElement('td');
                ctdQ.innerHTML = '<span class="abp-cot-q">' + escHtml(cot.quote) + '</span>';
                ctr.appendChild(ctdQ);
                // col 5: fecha
                var ctdF = document.createElement('td');
                ctdF.innerHTML = '<span class="abp-cot-d">' + escHtml(cot.fecha) + '</span>';
                ctr.appendChild(ctdF);
                // col 6: descripción
                var ctdDesc = document.createElement('td');
                ctdDesc.style.whiteSpace = 'normal'; ctdDesc.style.maxWidth = '220px';
                ctdDesc.innerHTML = '<span class="abp-cot-d">' + escHtml(cot.desc || '—') + '</span>';
                ctr.appendChild(ctdDesc);
                // col 7: qty
                var ctdQty = document.createElement('td');
                ctdQty.innerHTML = '<span class="abp-cot-d">' + escHtml(cot.qty || '—') + '</span>';
                ctr.appendChild(ctdQty);
                // col 8: unit price
                var ctdP = document.createElement('td');
                ctdP.innerHTML = '<span class="abp-cot-p">' + escHtml(cot.price || '—') + '</span>';
                ctr.appendChild(ctdP);
                // col 9: currency (vacío — heredado)
                var ctdCur2 = document.createElement('td'); ctr.appendChild(ctdCur2);
                // col 10: ext price
                var ctdExt = document.createElement('td');
                ctdExt.innerHTML = '<span class="abp-cot-d">Ext: ' + escHtml(cot.extPrice || '—') + '</span>';
                ctr.appendChild(ctdExt);
                // col 11: lead time (span 2: Factor + Utilidad)
                var ctdLT = document.createElement('td'); ctdLT.colSpan = 2;
                ctdLT.innerHTML = '<span class="abp-cot-lt">⏱ ' + escHtml(cot.leadTime || '—') + '</span>';
                ctr.appendChild(ctdLT);
                // col 13 (PVP): vacío
                var ctdPvp2 = document.createElement('td'); ctr.appendChild(ctdPvp2);
                // col 14 (TRM): vacío
                var ctdTrm2 = document.createElement('td'); ctr.appendChild(ctdTrm2);
                // col 15 (PVP COP): vacío
                var ctdCop2 = document.createElement('td'); ctr.appendChild(ctdCop2);
                // col 16: Notes (editable)
                var ctdNotes = document.createElement('td');
                var inpNotes = document.createElement('input');
                inpNotes.type = 'text'; inpNotes.className = 'abp-ni';
                inpNotes.value = cot.notes; inpNotes.placeholder = 'Notas...';
                inpNotes.title = 'Nota local (solo esta sesión)';
                inpNotes.onchange = function () { cot.notes = this.value; };
                ctdNotes.appendChild(inpNotes); ctr.appendChild(ctdNotes);

                document.getElementById('abp-tb').appendChild(ctr);
              })(sorted[ci], ci);
            }
          }
        }
      })(i);
    }
  }

  function refreshPVP(idx) {
    var td = document.querySelector('[data-pvp-idx="' + idx + '"]');
    if (td) td.textContent = fmtNum(calcPVP(R[idx].price, R[idx].factor, R[idx].utilidad));
    var td2 = document.querySelector('[data-pvpcop-idx="' + idx + '"]');
    if (td2) td2.textContent = fmtNum(calcPVPCOP(R[idx].price, R[idx].factor, R[idx].utilidad, R[idx].trm));
  }
  function updateDelBtn() { var btn = document.getElementById('abp-del'); if (btn) btn.style.display = selectedRows.size > 0 ? 'inline-block' : 'none'; }
  function updateSelectAll() {
    var chkAll = document.getElementById('abp-chkall'); if (!chkAll) return;
    var all = document.querySelectorAll('#abp-tb input[type=checkbox]');
    if (all.length === 0) { chkAll.checked = false; chkAll.indeterminate = false; return; }
    chkAll.checked = selectedRows.size === all.length;
    chkAll.indeterminate = selectedRows.size > 0 && selectedRows.size < all.length;
  }

  function addRows(num, ref, matches) {
    if (matches.length === 0) {
      R.push({
        searched: ref, _num: num, _isVar: false, _noResult: true, _error: false,
        partnum: '', line: '', desc: 'Sin resultados', qty: '', price: '', currency: '', weight: '',
        factor: globalFactor, utilidad: globalUtilidad, trm: globalTRM, isFactorOverridden: false, isUtilidadOverridden: false, isTRMOverridden: false, _refExtra: ''
      });
      return;
    }
    var isMulti = matches.length > 1;
    for (var j = 0; j < matches.length; j++) {
      var d = matches[j];
      R.push({
        searched: ref, _num: j === 0 ? num : '', _isVar: j > 0, _noResult: false, _error: false,
        _refExtra: j === 0 && isMulti ? ' <span style="color:#94a3b8;font-size:9px">(' + matches.length + ')</span>' : '',
        partnum: d.partnum, line: d.line, desc: d.desc,
        qty: d.qty, price: toNum(d.price), currency: d.currency, weight: toNum(d.weight),
        factor: globalFactor, utilidad: globalUtilidad, trm: globalTRM, isFactorOverridden: false, isUtilidadOverridden: false, isTRMOverridden: false
      });
    }
  }

  // Cerrar
  document.getElementById('abp-x').onclick = function () { p.style.display = 'none'; };

  // Nueva búsqueda
  document.getElementById('abp-new').onclick = function () {
    document.getElementById('abp-ta').value = '';
    document.getElementById('abp-tb').innerHTML = '';
    document.getElementById('abp-csv').style.display = 'none';
    document.getElementById('abp-del').style.display = 'none';
    document.getElementById('abp-p').textContent = 'Listo';
    document.getElementById('abp-ta').focus();
    R = []; selectedRows.clear();
  };

  // Select all
  document.getElementById('abp-chkall').onchange = function () {
    var checks = document.querySelectorAll('#abp-tb input[type=checkbox]');
    selectedRows.clear();
    for (var i = 0; i < checks.length; i++) {
      checks[i].checked = this.checked;
      if (this.checked) { selectedRows.add(parseInt(checks[i].dataset.idx)); checks[i].closest('tr').classList.add('abp-sel'); }
      else checks[i].closest('tr').classList.remove('abp-sel');
    }
    updateDelBtn();
  };

  // Eliminar seleccionados
  document.getElementById('abp-del').onclick = function () {
    if (selectedRows.size === 0) return;
    Array.from(selectedRows).sort(function (a, b) { return b - a; }).forEach(function (i) { R.splice(i, 1); });
    selectedRows.clear();
    renderTable();
    document.getElementById('abp-p').textContent = 'Tabla actualizada — ' + R.length + ' filas';
  };

  // Factor global (en tiempo real con oninput)
  document.getElementById('abp-gfv').oninput = function () {
    var val = parseFloat(this.value); if (isNaN(val) || val <= 0) return;
    globalFactor = val;
    document.querySelectorAll('#abp-tb tr[data-idx]').forEach(function (row) {
      var idx = parseInt(row.dataset.idx);
      if (!isNaN(idx) && R[idx] && !R[idx].isFactorOverridden) {
        R[idx].factor = globalFactor;
        var inp = row.querySelectorAll('.abp-ei')[0];
        if (inp) inp.value = globalFactor;
        refreshPVP(idx);
      }
    });
  };

  // Utilidad global (en tiempo real con oninput)
  document.getElementById('abp-guv').oninput = function () {
    var val = parseFloat(this.value); if (isNaN(val) || val <= 0) return;
    globalUtilidad = val;
    document.querySelectorAll('#abp-tb tr[data-idx]').forEach(function (row) {
      var idx = parseInt(row.dataset.idx);
      if (!isNaN(idx) && R[idx] && !R[idx].isUtilidadOverridden) {
        R[idx].utilidad = globalUtilidad;
        var inp = row.querySelectorAll('.abp-ei')[1];
        if (inp) inp.value = globalUtilidad;
        refreshPVP(idx);
      }
    });
  };

  // TRM global (en tiempo real con oninput)
  document.getElementById('abp-gtrm').oninput = function () {
    var val = parseFloat(this.value); if (isNaN(val) || val <= 0) return;
    globalTRM = val;
    document.querySelectorAll('#abp-tb tr[data-idx]').forEach(function (row) {
      var idx = parseInt(row.dataset.idx);
      if (!isNaN(idx) && R[idx] && !R[idx].isTRMOverridden) {
        R[idx].trm = globalTRM;
        var inp = row.querySelectorAll('.abp-ei')[2];
        if (inp) inp.value = globalTRM;
        refreshPVP(idx);
      }
    });
  };

  // Búsqueda principal
  async function run() {
    var btn = document.getElementById('abp-go');
    var csvBtn = document.getElementById('abp-csv');
    var prog = document.getElementById('abp-p');
    var parts = document.getElementById('abp-ta').value.split('\n').map(function (l) { return l.trim(); }).filter(Boolean);
    if (!parts.length) { prog.textContent = 'Ingresa referencias primero'; return; }
    btn.disabled = true; R = []; selectedRows.clear();
    document.getElementById('abp-tb').innerHTML = '';
    csvBtn.style.display = 'none';
    document.getElementById('abp-del').style.display = 'none';
    document.getElementById('abp-new').style.display = 'none';
    var inp = document.querySelector('input[placeholder="Part Number"]');
    if (!inp) { prog.innerHTML = '<span style="color:#ef4444">Campo Part Number no encontrado</span>'; btn.disabled = false; return; }
    for (var i = 0; i < parts.length; i++) {
      var ref = parts[i];
      try {
        prog.innerHTML = 'Limpiando... <span style="color:#64748b">' + ref + '</span>';
        sv(inp, ''); await waitEmpty(); await sl(300);
        prog.innerHTML = 'Buscando ' + (i + 1) + '/' + parts.length + ': <span style="color:#f97316">' + ref + '</span>';
        sv(inp, ref); await waitStable(ref);
        addRows(i + 1, ref, readResults(ref));
        renderTable();
        var tb2 = document.getElementById('abp-tb');
        if (tb2.lastChild) tb2.lastChild.scrollIntoView({ block: 'nearest' });
      } catch (e) {
        R.push({
          searched: ref, _num: i + 1, _isVar: false, _noResult: false, _error: true, desc: e.message,
          partnum: '', line: '', qty: '', price: '', currency: '', weight: '', _refExtra: '',
          factor: globalFactor, utilidad: globalUtilidad, trm: globalTRM, isFactorOverridden: false, isUtilidadOverridden: false, isTRMOverridden: false
        });
        renderTable();
      }
      if (i < parts.length - 1) await sl(200);
    }
    prog.innerHTML = '<span style="color:#22c55e">Completado — ' + R.length + ' filas / ' + parts.length + ' referencias</span>';
    btn.disabled = false; csvBtn.style.display = 'inline-block';
    document.getElementById('abp-new').style.display = 'inline-block';
  }
  document.getElementById('abp-go').onclick = run;

  // Exportar CSV
  document.getElementById('abp-csv').onclick = function () {
    var sep = ';';
    var header = [asTextCell('Buscado'), asTextCell('Part Number'), csvCell('Product Line'), csvCell('Description'), csvCell('Qty On Hand'), csvCell('List Price'), csvCell('Currency'), csvCell('Dealer Net'), csvCell('Factor'), csvCell('Utilidad'), csvCell('PVP'), csvCell('TRM'), csvCell('PVP COP'), csvCell('Weight')];
    function numCell(v) { return typeof v === 'number' ? String(v).replace('.', ',') : csvCell(v || ''); }
    var rows = R.filter(function (r) { return !r._noResult && !r._error && r.partnum; }).map(function (r) {
      var pvp = calcPVP(r.price, r.factor, r.utilidad);
      var dn = calcDealerNet(r.price);
      var pvpcop = calcPVPCOP(r.price, r.factor, r.utilidad, r.trm);
      return [asTextCell(r.searched || ''), asTextCell(r.partnum || ''), csvCell(r.line || ''), csvCell(r.desc || ''), numCell(r.qty), numCell(r.price), csvCell(r.currency || ''), numCell(dn), String(r.factor).replace('.', ','), String(r.utilidad).replace('.', ','), numCell(pvp), String(r.trm).replace('.', ','), numCell(pvpcop), numCell(r.weight)];
    });
    var csv = 'sep=;\r\n' + [header].concat(rows).map(function (r) { return r.join(sep); }).join('\r\n');
    var b = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    var u = URL.createObjectURL(b);
    var a = document.createElement('a'); a.href = u; a.download = 'ASTEC_' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(u);
  };

  // Cargar base de cotizaciones al abrir
  loadCotDB();

})();
