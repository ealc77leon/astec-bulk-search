(function(){

if(window.AB_LOADED){console.warn("ASTEC BULK ya cargado");return;}
window.AB_LOADED = true;

let R = [];
let globalFactor = 1.3;
let globalUtilidad = 0.7;

// -------- helpers --------
function toNum(v){
  if(!v || v==='' || v==='—') return null;
  let n = parseFloat(String(v).replace(/,/g,''));
  return isNaN(n)?null:n;
}

function calcDealer(price){
  let n = toNum(price);
  if(n===null) return price;
  return n * 0.8;
}

function calcPVP(r){
  if(typeof r.dealer !== 'number') return r.dealer;
  if(!r.utilidad || r.utilidad === 0) return '';
  return (r.dealer * r.factor) / r.utilidad;
}

// -------- UI --------
let p = document.createElement('div');
p.style = "position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:900px;background:#0d0f10;color:#fff;z-index:999999;padding:10px;border:2px solid orange;font-family:monospace";
p.innerHTML = `
<div style="display:flex;justify-content:space-between">
  <b>ASTEC PRO</b>
  <button id="ab-close">X</button>
</div>

<div style="margin:10px 0">
  Factor <input id="gFactor" type="number" step="0.01" value="1.3">
  Utilidad <input id="gUtil" type="number" step="0.01" value="0.7">
  <button id="delSel">Eliminar seleccionados</button>
</div>

<textarea id="refs" style="width:100%;height:80px"></textarea>
<button id="run">BUSCAR</button>

<table border="1" width="100%" style="margin-top:10px;font-size:11px">
<thead>
<tr>
<th><input type="checkbox" id="selAll"></th>
<th>#</th><th>Buscado</th><th>Part</th><th>Price</th>
<th>Dealer</th><th>Factor</th><th>Util</th><th>PVP</th>
</tr>
</thead>
<tbody id="tb"></tbody>
</table>
`;

document.body.appendChild(p);

// -------- render --------
function render(){
  let tb = document.getElementById('tb');
  tb.innerHTML = '';

  R.forEach((r,i)=>{
    let tr = document.createElement('tr');

    tr.innerHTML = `
    <td><input type="checkbox" data-i="${i}"></td>
    <td>${i+1}</td>
    <td>${r.searched}</td>
    <td>${r.partnum}</td>
    <td>${r.price}</td>
    <td>${typeof r.dealer==='number'?r.dealer.toFixed(2):r.dealer}</td>
    <td><input type="number" step="0.01" value="${r.factor}" data-f="${i}"></td>
    <td><input type="number" step="0.01" value="${r.utilidad}" data-u="${i}"></td>
    <td>${typeof r.pvp==='number'?r.pvp.toFixed(2):r.pvp}</td>
    `;

    tb.appendChild(tr);
  });
}

// -------- eventos --------
document.getElementById('gFactor').onchange = function(){
  globalFactor = parseFloat(this.value);
  R.forEach(r=>{
    if(!r.isFactorOverridden){
      r.factor = globalFactor;
      r.pvp = calcPVP(r);
    }
  });
  render();
};

document.getElementById('gUtil').onchange = function(){
  globalUtilidad = parseFloat(this.value);
  R.forEach(r=>{
    if(!r.isUtilidadOverridden){
      r.utilidad = globalUtilidad;
      r.pvp = calcPVP(r);
    }
  });
  render();
};

document.getElementById('tb').addEventListener('change',function(e){
  let i = e.target.dataset.f ?? e.target.dataset.u;
  if(i===undefined) return;

  let row = R[i];

  if(e.target.dataset.f !== undefined){
    row.factor = parseFloat(e.target.value);
    row.isFactorOverridden = true;
  }

  if(e.target.dataset.u !== undefined){
    row.utilidad = parseFloat(e.target.value);
    row.isUtilidadOverridden = true;
  }

  row.pvp = calcPVP(row);
  render();
});

// eliminar
document.getElementById('delSel').onclick = function(){
  let checks = document.querySelectorAll('#tb input[type=checkbox]:checked');
  let idx = Array.from(checks).map(c=>parseInt(c.dataset.i));

  R = R.filter((_,i)=>!idx.includes(i));
  render();
};

// select all
document.getElementById('selAll').onclick = function(){
  document.querySelectorAll('#tb input[type=checkbox]').forEach(c=>c.checked=this.checked);
};

// cerrar
document.getElementById('ab-close').onclick = ()=>p.remove();

// -------- demo búsqueda (mock) --------
// aquí deberías conectar tu lógica actual de scraping
document.getElementById('run').onclick = function(){

  let refs = document.getElementById('refs').value.split('\n').filter(x=>x);

  R = refs.map((r,i)=>{
    let price = Math.random()*1000;

    let row = {
      searched:r,
      partnum:r,
      price:price,
      dealer:calcDealer(price),
      factor:globalFactor,
      utilidad:globalUtilidad,
      isFactorOverridden:false,
      isUtilidadOverridden:false
    };

    row.pvp = calcPVP(row);
    return row;
  });

  render();
};

})();