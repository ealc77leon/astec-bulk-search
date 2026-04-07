(function(){

if(window.AB_LOADED){return;}
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

function fmt(v){
  if(typeof v !== 'number') return v;
  return v.toFixed(2);
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
let style = document.createElement('style');
style.textContent = `
#abp{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
width:95vw;max-width:1200px;height:85vh;background:#0d0f10;
border:2px solid #f97316;z-index:999999;font-family:monospace;
display:flex;flex-direction:column}
#abp-h{background:#161a1c;padding:10px;display:flex;justify-content:space-between}
#abp-b{padding:10px;display:flex;flex-direction:column;gap:8px;flex:1;overflow:hidden}
#abp-ta{height:70px;background:#0d1215;color:#fff;border:1px solid #2a3038}
#abp-tw{flex:1;overflow:auto;border:1px solid #2a3038}
#abp-t{width:100%;font-size:11px;border-collapse:collapse}
#abp-t th{position:sticky;top:0;background:#161a1c}
#abp-t td,#abp-t th{padding:5px;border-bottom:1px solid #1e2428}
.abp-var td{background:rgba(249,115,22,0.05)}
`;
document.head.appendChild(style);

let p = document.createElement('div');
p.id='abp';

p.innerHTML = `
<div id="abp-h">
<b>ASTEC PRO</b>
<button id="abp-x">X</button>
</div>

<div id="abp-b">

<textarea id="abp-ta" placeholder="Referencias"></textarea>

<div>
Factor <input id="gF" type="number" step="0.01" value="1.3">
Utilidad <input id="gU" type="number" step="0.01" value="0.7">
<button id="run">BUSCAR</button>
<button id="del">Eliminar</button>
<button id="csv">Excel</button>
</div>

<div id="abp-tw">
<table id="abp-t">
<thead>
<tr>
<th><input type="checkbox" id="all"></th>
<th>#</th><th>Buscado</th><th>Part</th>
<th>Line</th><th>Description</th>
<th>Qty</th><th>List</th>
<th>Dealer</th>
<th>Factor</th>
<th>Util</th>
<th>PVP</th>
</tr>
</thead>
<tbody id="tb"></tbody>
</table>
</div>

</div>
`;

document.body.appendChild(p);

// -------- render --------
function render(){
  let tb = document.getElementById('tb');
  tb.innerHTML='';

  R.forEach((r,i)=>{
    let tr = document.createElement('tr');
    if(r.variant) tr.className='abp-var';

    tr.innerHTML = `
<td><input type="checkbox" data-i="${i}"></td>
<td>${i+1}</td>
<td>${r.searched}</td>
<td>${r.partnum}</td>
<td>${r.line||''}</td>
<td>${r.desc||''}</td>
<td>${r.qty||''}</td>
<td>${r.price||''}</td>
<td>${fmt(r.dealer)}</td>
<td><input type="number" step="0.01" value="${r.factor}" data-f="${i}"></td>
<td><input type="number" step="0.01" value="${r.utilidad}" data-u="${i}"></td>
<td>${fmt(r.pvp)}</td>
`;

    tb.appendChild(tr);
  });
}

// -------- eventos --------
document.getElementById('abp-x').onclick=()=>p.remove();

document.getElementById('gF').onchange=e=>{
  globalFactor=parseFloat(e.target.value);
  R.forEach(r=>{
    if(!r.fO){
      r.factor=globalFactor;
      r.pvp=calcPVP(r);
    }
  });
  render();
};

document.getElementById('gU').onchange=e=>{
  globalUtilidad=parseFloat(e.target.value);
  R.forEach(r=>{
    if(!r.uO){
      r.utilidad=globalUtilidad;
      r.pvp=calcPVP(r);
    }
  });
  render();
};

document.getElementById('tb').onchange=e=>{
  let i=e.target.dataset.f??e.target.dataset.u;
  if(i===undefined) return;

  let r=R[i];

  if(e.target.dataset.f){
    r.factor=parseFloat(e.target.value);
    r.fO=true;
  }
  if(e.target.dataset.u){
    r.utilidad=parseFloat(e.target.value);
    r.uO=true;
  }

  r.pvp=calcPVP(r);
  render();
};

document.getElementById('del').onclick=()=>{
  let sel=[...document.querySelectorAll('#tb input:checked')].map(x=>+x.dataset.i);
  R=R.filter((_,i)=>!sel.includes(i));
  render();
};

document.getElementById('all').onclick=e=>{
  document.querySelectorAll('#tb input[type=checkbox]').forEach(c=>c.checked=e.target.checked);
};

// -------- export excel --------
document.getElementById('csv').onclick=()=>{
  let rows=R.map(r=>[
    r.searched,r.partnum,r.line,r.desc,r.qty,r.price,
    r.dealer,r.factor,r.utilidad,r.pvp
  ]);

  let csv="sep=;\n"+["Buscado","Part","Line","Desc","Qty","List","Dealer","Factor","Util","PVP"].join(";")+"\n"+
  rows.map(r=>r.join(";")).join("\n");

  let b=new Blob(["\uFEFF"+csv]);
  let a=document.createElement('a');
  a.href=URL.createObjectURL(b);
  a.download="astec.csv";
  a.click();
};

// -------- DEMO (reemplazar con scraping real) --------
document.getElementById('run').onclick=()=>{
  let refs=document.getElementById('abp-ta').value.split('\n').filter(x=>x);

  R=[];

  refs.forEach(ref=>{
    let variants = Math.random()>0.5?2:1;

    for(let i=0;i<variants;i++){
      let price=Math.random()*1000;

      let r={
        searched:ref,
        partnum:ref+"-"+(i+1),
        line:"KPI",
        desc:"Demo item",
        qty:Math.floor(Math.random()*10),
        price:price,
        dealer:calcDealer(price),
        factor:globalFactor,
        utilidad:globalUtilidad,
        variant:i>0
      };

      r.pvp=calcPVP(r);
      R.push(r);
    }
  });

  render();
};

})();
