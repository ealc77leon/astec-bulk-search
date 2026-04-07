(function() {
    // === LOGICA DE REDIRECCIÓN Y SESIÓN ===
    const isAzure = window.location.hostname.includes('azurewebsites.net');
    const iframe = document.getElementById('reflex-iframe');

    // Caso A: Estamos en la página principal y detectamos el iframe
    if (iframe && !isAzure) {
        var m = iframe.src.match(/[?&]sid=([^&]+)/);
        if (!m) {
            alert('Sesión no encontrada. Asegúrate de estar logueado en ASTEC.');
            return;
        }
        var sid = m[1];
        var targetUrl = 'https://astec-nexus-portal.azurewebsites.net/reflex/parts-search?sid=' + sid + '&portal_url=https%3A//dealers.astec.support&category=Parts';
        
        console.log('ASTEC PRO: Redirigiendo a zona de búsqueda...');
        window.location.href = targetUrl;
        return; 
    }

    // Caso B: Ya estamos en la página de búsqueda, ejecutamos el código de Claude
    if (!isAzure) {
        alert('Por favor, ejecuta esto dentro del portal de ASTEC.');
        return;
    }

    // Evitar duplicados
    if (document.getElementById('abp')) {
        document.getElementById('abp').style.display = 'flex';
        return;
    }

    // === CÓDIGO ORIGINAL DE CLAUDE (Integrado) ===
    var R = [];
    var globalFactor = 1.3;
    var globalUtilidad = 0.8; // <--- Configurado al 20% (0.8)
    var selectedRows = new Set();

    var s = document.createElement('style');
    s.textContent =
        '#abp{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:1180px;max-width:98vw;max-height:88vh;background:#0d0f10;border:2px solid #f97316;z-index:999999999;font-family:monospace;display:flex;flex-direction:column;box-shadow: 0 0 40px rgba(0,0,0,0.8)}' +
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
        '.abp-sel td{background:rgba(239,68,68,0.06)!important}';
    document.head.appendChild(s);

    var p = document.createElement('div');
    p.id = 'abp';
    p.innerHTML =
        '<div id="abp-h"><b>ASTEC PRO v2.5</b><button id="abp-x">X</button></div>' +
        '<div id="abp-b">' +
        '<textarea id="abp-ta" placeholder="Referencias una por linea..."></textarea>' +
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
        '<span>Importaciones (1.3)</span>' +
        '&nbsp;&nbsp;&nbsp;' +
        '<label>Utilidad:</label>' +
        '<input id="abp-guv" type="number" step="0.01" min="0.01" max="1" value="0.8">' +
        '<span>Margen (0.8 = 20%)</span>' +
        '</div>' +
        '<div id="abp-tw"><table id="abp-t"><thead><tr>' +
        '<th><input type="checkbox" id="abp-chkall"></th>' +
        '<th>#</th><th>Buscado</th><th>Part Number</th><th>Line</th><th>Description</th><th>Stock</th><th>List Price</th><th>Cur</th><th>Dealer Net</th><th>Factor</th><th>Utilidad</th><th>PVP</th><th>Weight</th>' +
        '</tr></thead><tbody id="abp-tb"></tbody></table></div>' +
        '</div>';
    document.body.appendChild(p);

    // --- FUNCIONES AUXILIARES ---
    function sl(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }
    function sv(el, v) {
        try { var pr = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value'); if (pr && pr.set) pr.set.call(el, v); else el.value = v; } catch (e) { el.value = v; }
        var k = Object.keys(el).find(function(k) { return k.startsWith('__reactProps'); });
        if (k) { try { var p2 = el[k]; if (p2 && p2.onChange) p2.onChange({ target: el, currentTarget: el, type: 'change', bubbles: true }); } catch (e) {} }
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
    }

    function toNum(v) { if (!v || v === '' || v === '—') return v; var n = parseFloat(String(v).replace(/,/g, '')); return isNaN(n) ? v : n; }
    function fmtNum(v) { if (v === null || v === undefined || v === '' || v === '—') return v === undefined ? '' : v; var n = parseFloat(String(v).replace(/,/g, '')); if (isNaN(n)) return v; return String(n).replace('.', ','); }
    function csvCell(v) { var s = String(v === null || v === undefined ? '' : v); return '"' + s.replace(/"/g, '""') + '"'; }
    function asTextCell(v) { var s = String(v === null || v === undefined ? '' : v); return '"=""' + s.replace(/"/g, '""') + '"""'; }
    function escHtml(str) { return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

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

    function getTableText() { return Array.from(document.querySelectorAll('.dt-scroll-body tbody tr')).map(function(r) { return r.innerText.trim(); }).join('|'); }
    function isTableNoResults() {
        var rows = document.querySelectorAll('.dt-scroll-body tbody tr');
        if (rows.length === 0) return true;
        if (rows.length === 1) {
            var txt = rows[0].innerText.trim().toLowerCase();
            if (txt.indexOf('no data') > -1 || txt.indexOf('no results') > -1) return true;
        }
        return false;
    }

    async function waitEmpty() { for (var i = 0; i < 30; i++) { await sl(300); if (document.querySelectorAll('.dt-scroll-body tbody tr').length === 0) return; } }
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

    // --- RENDERIZADO Y LOGICA DE EVENTOS ---
    function renderTable() {
        var tb = document.getElementById('abp-tb');
        tb.innerHTML = ''; selectedRows.clear(); updateDelBtn();
        for (var i = 0; i < R.length; i++) {
            (function(idx) {
                var d = R[idx]; var tr = document.createElement('tr');
                if (d._isVar) tr.className = 'abp-var';
                tr.dataset.idx = idx;

                var tdChk = document.createElement('td');
                var chk = document.createElement('input'); chk.type = 'checkbox'; chk.dataset.idx = idx;
                chk.onchange = function() {
                    if (this.checked) { selectedRows.add(idx); tr.classList.add('abp-sel'); }
                    else { selectedRows.delete(idx); tr.classList.remove('abp-sel'); }
                    updateDelBtn();
                };
                tdChk.appendChild(chk); tr.appendChild(tdChk);

                var tdN = document.createElement('td'); tdN.style.color = '#94a3b8'; tdN.textContent = d._num || ''; tr.appendChild(tdN);
                var tdRef = document.createElement('td');
                if (d._isVar) { tdRef.style.color = '#64748b'; tdRef.style.fontSize = '10px'; tdRef.textContent = '↳ variante'; }
                else { tdRef.style.color = '#f97316'; tdRef.style.fontWeight = '600'; tdRef.innerHTML = escHtml(d.searched || '') + (d._refExtra || ''); }
                tr.appendChild(tdRef);

                var tdPN = document.createElement('td'); tdPN.style.fontWeight = '600';
                if (d._noResult) { tdPN.style.color = '#ef4444'; tdPN.colSpan = 11; tdPN.textContent = 'Sin resultados'; tr.appendChild(tdPN); tb.appendChild(tr); return; }
                tdPN.style.color = '#fb923c'; tdPN.textContent = d.partnum; tr.appendChild(tdPN);

                tr.innerHTML += `<td style="color:#94a3b8">${d.line}</td><td style="white-space:normal;max-width:220px">${d.desc}</td>` +
                    `<td style="color:${d.qty.includes('0') ? '#ef4444' : '#22c55e'};font-weight:700">${d.qty}</td>` +
                    `<td style="color:#22c55e">${fmtNum(d.price)}</td><td style="color:#64748b">${d.currency}</td>` +
                    `<td style="color:#38bdf8">${fmtNum(calcDealerNet(d.price))}</td>`;

                var tdF = document.createElement('td'); var inpF = document.createElement('input');
                inpF.className = 'abp-ei'; inpF.type = 'number'; inpF.value = d.factor;
                inpF.onchange = function() { R[idx].factor = this.value; R[idx].isFactorOverridden = true; refreshPVP(idx); };
                tdF.appendChild(inpF); tr.appendChild(tdF);

                var tdU = document.createElement('td'); var inpU = document.createElement('input');
                inpU.className = 'abp-ei'; inpU.type = 'number'; inpU.value = d.utilidad;
                inpU.onchange = function() { R[idx].utilidad = this.value; R[idx].isUtilidadOverridden = true; refreshPVP(idx); };
                tdU.appendChild(inpU); tr.appendChild(tdU);

                var tdPVP = document.createElement('td'); tdPVP.style.color = '#a78bfa'; tdPVP.style.fontWeight = '700';
                tdPVP.id = 'pvp-' + idx; tdPVP.textContent = fmtNum(calcPVP(d.price, d.factor, d.utilidad));
                tr.appendChild(tdPVP);

                tr.innerHTML += `<td style="color:#94a3b8">${fmtNum(d.weight)}</td>`;
                tb.appendChild(tr);
            })(i);
        }
    }

    function refreshPVP(idx) { var el = document.getElementById('pvp-' + idx); if (el) el.textContent = fmtNum(calcPVP(R[idx].price, R[idx].factor, R[idx].utilidad)); }
    function updateDelBtn() { document.getElementById('abp-del').style.display = selectedRows.size > 0 ? 'inline-block' : 'none'; }

    async function run() {
        var btn = document.getElementById('abp-go'); var prog = document.getElementById('abp-p');
        var lines = document.getElementById('abp-ta').value.split('\n').map(l => l.trim()).filter(Boolean);
        if (!lines.length) return;
        btn.disabled = true; R = []; 
        var inp = document.querySelector('input[placeholder="Part Number"]');
        for (var i = 0; i < lines.length; i++) {
            var ref = lines[i]; prog.innerHTML = `Buscando ${i + 1}/${lines.length}: <b style="color:#f97316">${ref}</b>`;
            sv(inp, ''); await sl(300); sv(inp, ref); await waitStable(ref);
            var matches = readResults(ref);
            if (!matches.length) R.push({ searched: ref, _num: i + 1, _noResult: true, price: '', factor: globalFactor, utilidad: globalUtilidad });
            else matches.forEach((m, j) => { R.push({ ...m, searched: ref, _num: j === 0 ? i + 1 : '', _isVar: j > 0, factor: globalFactor, utilidad: globalUtilidad, price: toNum(m.price) }); });
            renderTable();
        }
        prog.innerHTML = '<span style="color:#22c55e">Completado</span>'; btn.disabled = false;
        document.getElementById('abp-csv').style.display = 'inline-block';
    }

    // Eventos de Botones
    document.getElementById('abp-go').onclick = run;
    document.getElementById('abp-x').onclick = () => document.getElementById('abp').remove();
    document.getElementById('abp-new').onclick = () => { R = []; renderTable(); document.getElementById('abp-ta').value = ''; };
    
    document.getElementById('abp-csv').onclick = function() {
        var csv = 'sep=;\r\nBuscado;Part Number;Line;Description;Stock;Price;Currency;DealerNet;Factor;Utilidad;PVP;Weight\r\n' +
            R.map(r => `${r.searched};${r.partnum};${r.line};${r.desc};${r.qty};${fmtNum(r.price)};${r.currency};${fmtNum(calcDealerNet(r.price))};${r.factor};${r.utilidad};${fmtNum(calcPVP(r.price, r.factor, r.utilidad))};${r.weight}`).join('\r\n');
        var b = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        var a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `ASTEC_EXPORT.csv`; a.click();
    };

})();
