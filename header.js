/* header.js — generates a randomized SVG header for pauloengler.com
 * Usage:
 *   renderHeader(svgElement[, options])
 *   options: { debug: bool — prints state at bottom of SVG; returns state object }
 *
 * Self-contained. Requires the Google Fonts stylesheet listed in header.css to be loaded.
 */
(function(global){
'use strict';

// ─── Constants ──────────────────────────────────────────────────────────────
const VW=800, VH=250, PAD=32, BG='#F7F4EE';
const FONT='"Unbounded",sans-serif', FW='700', COL='#0A0A0A';
const WARM='#926650', COLD='#6B7A8D';
const ANCHORS=['L','C','R'];
const SP=14, GAP_MIN=0, GAP_MAX=8, SZ_FLOOR=18;
const RATIOS=[1/8,1/6,1/4,1/3,1/2,1,2,3,4];

// ─── Canvas measurer ────────────────────────────────────────────────────────
const _cv=document.createElement('canvas'), _cx=_cv.getContext('2d');
function mW(t,sz){_cx.font=`700 ${sz}px Unbounded,sans-serif`;return _cx.measureText(t).width;}
function rndInt(a,b){return Math.floor(a+Math.random()*(b-a+1));}
function rnd(a,b){return a+Math.random()*(b-a);}
function pick(a){return a[Math.floor(Math.random()*a.length)];}
function weightedPick(items,key='w'){
  const total=items.reduce((s,x)=>s+(x[key]||1),0);
  let r=Math.random()*total;
  for(const x of items){r-=(x[key]||1);if(r<=0)return x;}
  return items[0];
}

// ─── Layout helpers ─────────────────────────────────────────────────────────
function mkLayout(anchor,w){
  if(anchor==='L')return{x:PAD,ta:'start',L:PAD,R:PAD+w};
  if(anchor==='R')return{x:VW-PAD,ta:'end',L:VW-PAD-w,R:VW-PAD};
  return{x:VW/2,ta:'middle',L:VW/2-w/2,R:VW/2+w/2};
}
function clamp(l){
  let{x,ta,L,R}=l;
  if(L<PAD){const d=PAD-L;x+=d;L+=d;R+=d;}
  if(R>VW-PAD){const d=R-(VW-PAD);x-=d;L-=d;R-=d;}
  return{...l,x,L,R};
}
function fitSzW(t,sz){const mxW=VW-PAD*2;while(sz>SZ_FLOOR&&mW(t,sz)>mxW)sz--;return Math.max(SZ_FLOOR,sz);}
function ampPlace(va,adjB,adjS,sA){
  const adjTop=adjB-adjS;
  if(va==='top')return{yA:adjTop+sA};
  if(va==='bottom')return{yA:adjB};
  return{yA:adjTop+adjS/2+sA/2};
}

// ─── Shape helpers ──────────────────────────────────────────────────────────
function star(n,outer,inner){
  let d='';
  for(let i=0;i<n*2;i++){const a=Math.PI/n*i-Math.PI/2,r=i%2===0?outer:inner;d+=(i?'L':'M')+Math.round(Math.cos(a)*r*100)/100+','+Math.round(Math.sin(a)*r*100)/100;}
  return d+'Z';
}
function tStar(d,cx,cy){return d.replace(/(-?\d+\.?\d*),(-?\d+\.?\d*)/g,(_,x,y)=>`${Math.round((+x+cx)*100)/100},${Math.round((+y+cy)*100)/100}`);}
function attrs(m,f,s,sw){
  if(m==='filled') return`fill="${f}" stroke="none"`;
  return`fill="none" stroke="${s}" stroke-width="${sw}"`;
}
function shapeEl(m,tag,f,s,sw){return`${tag} ${attrs(m,f,s,sw)}/>`;}

// ─── SHAPES ─────────────────────────────────────────────────────────────────
// cat: 'star' | 'solid' | 'hollow' — used for weighting
// cf: centerFilled (true → & can be cream over fill, false → & must be dark)
const SHAPES=[
  // ── Solids ──
  {id:'circle',    cat:'solid', cf:true,  draw:(cx,cy,r,m,f,s,sw)=>shapeEl(m,`<circle cx="${cx}" cy="${cy}" r="${r}"`,f,s,sw)},
  {id:'square',    cat:'solid', cf:true,  draw:(cx,cy,r,m,f,s,sw)=>shapeEl(m,`<rect x="${cx-r}" y="${cy-r}" width="${r*2}" height="${r*2}"`,f,s,sw)},
  {id:'squareT',   cat:'solid', cf:true,  draw:(cx,cy,r,m,f,s,sw)=>shapeEl(m,`<rect x="${cx-r}" y="${cy-r}" width="${r*2}" height="${r*2}" transform="rotate(45,${cx},${cy})"`,f,s,sw)},
  {id:'hexagon',   cat:'solid', cf:true,  draw:(cx,cy,r,m,f,s,sw)=>{let d='';for(let i=0;i<6;i++){const a=Math.PI/3*i;d+=(i?'L':'M')+(cx+Math.cos(a)*r)+','+(cy+Math.sin(a)*r);}return`<path d="${d}Z" ${attrs(m,f,s,sw)}/>`;} },
  {id:'octagon',   cat:'solid', cf:true,  draw:(cx,cy,r,m,f,s,sw)=>{let d='';for(let i=0;i<8;i++){const a=Math.PI/4*i;d+=(i?'L':'M')+(cx+Math.cos(a)*r)+','+(cy+Math.sin(a)*r);}return`<path d="${d}Z" ${attrs(m,f,s,sw)}/>`;} },
  {id:'triU',      cat:'solid', cf:true,  draw:(cx,cy,r,m,f,s,sw)=>shapeEl(m,`<polygon points="${cx},${cy-r} ${cx+r*.87},${cy+r*.5} ${cx-r*.87},${cy+r*.5}"`,f,s,sw)},
  {id:'triD',      cat:'solid', cf:true,  draw:(cx,cy,r,m,f,s,sw)=>shapeEl(m,`<polygon points="${cx},${cy+r} ${cx+r*.87},${cy-r*.5} ${cx-r*.87},${cy-r*.5}"`,f,s,sw)},
  {id:'diamond',   cat:'solid', cf:true,  draw:(cx,cy,r,m,f,s,sw)=>shapeEl(m,`<polygon points="${cx},${cy-r} ${cx+r*.7},${cy} ${cx},${cy+r} ${cx-r*.7},${cy}"`,f,s,sw)},
  {id:'diamondW',  cat:'solid', cf:true,  draw:(cx,cy,r,m,f,s,sw)=>shapeEl(m,`<polygon points="${cx},${cy-r*.7} ${cx+r},${cy} ${cx},${cy+r*.7} ${cx-r},${cy}"`,f,s,sw)},
  {id:'ellipseV',  cat:'solid', cf:true,  draw:(cx,cy,r,m,f,s,sw)=>shapeEl(m,`<ellipse cx="${cx}" cy="${cy}" rx="${r*.6}" ry="${r}"`,f,s,sw)},
  {id:'ellipseH',  cat:'solid', cf:true,  draw:(cx,cy,r,m,f,s,sw)=>shapeEl(m,`<ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${r*.6}"`,f,s,sw)},
  {id:'ellipseT',  cat:'solid', cf:true,  draw:(cx,cy,r,m,f,s,sw)=>shapeEl(m,`<ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${r*.5}" transform="rotate(35,${cx},${cy})"`,f,s,sw)},
  {id:'heart',     cat:'solid', cf:true,  draw:(cx,cy,r,m,f,s,sw)=>{const y=cy+r*.15,A=attrs(m,f,s,sw);return`<path d="M${cx},${y+r*.45} C${cx-r*1.1},${y-.05*r} ${cx-r*1.15},${y-r*.75} ${cx-r*.55},${y-r*.8} C${cx-r*.15},${y-r*.85} ${cx},${y-r*.45} ${cx},${y-r*.45} C${cx},${y-r*.45} ${cx+r*.15},${y-r*.85} ${cx+r*.55},${y-r*.8} C${cx+r*1.15},${y-r*.75} ${cx+r*1.1},${y-.05*r} ${cx},${y+r*.45}Z" ${A}/>`;}},
  {id:'leaf',      cat:'solid', cf:true,  draw:(cx,cy,r,m,f,s,sw)=>{const A=attrs(m,f,s,sw);return`<path d="M${cx},${cy-r} Q${cx+r},${cy} ${cx},${cy+r} Q${cx-r},${cy} ${cx},${cy-r}Z" ${A}/>`;}},
  {id:'cross',     cat:'solid', cf:true,  draw:(cx,cy,r,m,f,s,sw)=>{const t=r*.35,A=attrs(m,f,s,sw);return`<path d="M${cx-t},${cy-r} L${cx+t},${cy-r} L${cx+t},${cy-t} L${cx+r},${cy-t} L${cx+r},${cy+t} L${cx+t},${cy+t} L${cx+t},${cy+r} L${cx-t},${cy+r} L${cx-t},${cy+t} L${cx-r},${cy+t} L${cx-r},${cy-t} L${cx-t},${cy-t}Z" ${A}/>`;}},
  {id:'crossX',    cat:'solid', cf:true,  draw:(cx,cy,r,m,f,s,sw)=>{const t=r*.35,A=attrs(m,f,s,sw);return`<path d="M${cx-t},${cy-r} L${cx+t},${cy-r} L${cx+t},${cy-t} L${cx+r},${cy-t} L${cx+r},${cy+t} L${cx+t},${cy+t} L${cx+t},${cy+r} L${cx-t},${cy+r} L${cx-t},${cy+t} L${cx-r},${cy+t} L${cx-r},${cy-t} L${cx-t},${cy-t}Z" ${A} transform="rotate(45,${cx},${cy})"/>`;}},
  {id:'arrow',     cat:'solid', cf:true,  draw:(cx,cy,r,m,f,s,sw)=>{const A=attrs(m,f,s,sw);return`<path d="M${cx-r*.3},${cy-r*.28} L${cx+r*.2},${cy-r*.28} L${cx+r*.2},${cy-r*.65} L${cx+r},${cy} L${cx+r*.2},${cy+r*.65} L${cx+r*.2},${cy+r*.28} L${cx-r*.3},${cy+r*.28}Z" ${A}/>`;}},
  // ── Hollow ──
  {id:'crescent',  cat:'hollow', cf:false, draw:(cx,cy,r,m,f,s,sw)=>{const A=attrs(m,f,s,sw);return`<path d="M${cx},${cy-r} A${r},${r} 0 1,1 ${cx},${cy+r} A${r*.72},${r*.72} 0 1,0 ${cx},${cy-r}Z" ${A}/>`;}},
  {id:'ring',      cat:'hollow', cf:false, draw:(cx,cy,r,m,f,s,sw)=>{
    if(m==='stroke') return`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${s}" stroke-width="${sw}"/><circle cx="${cx}" cy="${cy}" r="${r*.48}" fill="none" stroke="${s}" stroke-width="${sw}"/>`;
    return`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${f}" stroke="none"/><circle cx="${cx}" cy="${cy}" r="${r*.48}" fill="${BG}" stroke="none"/>`;
  }},
  // ── Stars (de-weighted; sub-tagged by toothShape) ──
  {id:'star4-spike',  cat:'star', cf:false, draw:(cx,cy,r,m,f,s,sw)=>`<path d="${tStar(star(4,r,r*.22),cx,cy)}" ${attrs(m,f,s,sw)}/>`},
  {id:'star5-spike',  cat:'star', cf:false, draw:(cx,cy,r,m,f,s,sw)=>`<path d="${tStar(star(5,r,r*.25),cx,cy)}" ${attrs(m,f,s,sw)}/>`},
  {id:'star6-spike',  cat:'star', cf:false, draw:(cx,cy,r,m,f,s,sw)=>`<path d="${tStar(star(6,r,r*.25),cx,cy)}" ${attrs(m,f,s,sw)}/>`},
  {id:'star8-spike',  cat:'star', cf:false, draw:(cx,cy,r,m,f,s,sw)=>`<path d="${tStar(star(8,r,r*.28),cx,cy)}" ${attrs(m,f,s,sw)}/>`},
  {id:'star12-spike', cat:'star', cf:false, draw:(cx,cy,r,m,f,s,sw)=>`<path d="${tStar(star(12,r,r*.3),cx,cy)}" ${attrs(m,f,s,sw)}/>`},
  {id:'star4-med',    cat:'star', cf:false, draw:(cx,cy,r,m,f,s,sw)=>`<path d="${tStar(star(4,r,r*.45),cx,cy)}" ${attrs(m,f,s,sw)}/>`},
  {id:'star5-med',    cat:'star', cf:false, draw:(cx,cy,r,m,f,s,sw)=>`<path d="${tStar(star(5,r,r*.48),cx,cy)}" ${attrs(m,f,s,sw)}/>`},
  {id:'star6-med',    cat:'star', cf:false, draw:(cx,cy,r,m,f,s,sw)=>`<path d="${tStar(star(6,r,r*.5),cx,cy)}" ${attrs(m,f,s,sw)}/>`},
  {id:'star8-med',    cat:'star', cf:false, draw:(cx,cy,r,m,f,s,sw)=>`<path d="${tStar(star(8,r,r*.5),cx,cy)}" ${attrs(m,f,s,sw)}/>`},
  {id:'star10-med',   cat:'star', cf:false, draw:(cx,cy,r,m,f,s,sw)=>`<path d="${tStar(star(10,r,r*.5),cx,cy)}" ${attrs(m,f,s,sw)}/>`},
  {id:'star16-med',   cat:'star', cf:false, draw:(cx,cy,r,m,f,s,sw)=>`<path d="${tStar(star(16,r,r*.52),cx,cy)}" ${attrs(m,f,s,sw)}/>`},
  {id:'star5-fat',    cat:'star', cf:false, draw:(cx,cy,r,m,f,s,sw)=>`<path d="${tStar(star(5,r,r*.68),cx,cy)}" ${attrs(m,f,s,sw)}/>`},
  {id:'star6-fat',    cat:'star', cf:false, draw:(cx,cy,r,m,f,s,sw)=>`<path d="${tStar(star(6,r,r*.7),cx,cy)}" ${attrs(m,f,s,sw)}/>`},
  {id:'star8-fat',    cat:'star', cf:false, draw:(cx,cy,r,m,f,s,sw)=>`<path d="${tStar(star(8,r,r*.7),cx,cy)}" ${attrs(m,f,s,sw)}/>`},
  {id:'star12-fat',   cat:'star', cf:false, draw:(cx,cy,r,m,f,s,sw)=>`<path d="${tStar(star(12,r,r*.72),cx,cy)}" ${attrs(m,f,s,sw)}/>`},
  {id:'burst16',      cat:'star', cf:false, draw:(cx,cy,r,m,f,s,sw)=>`<path d="${tStar(star(16,r,r*.75),cx,cy)}" ${attrs(m,f,s,sw)}/>`},
  {id:'burst24',      cat:'star', cf:false, draw:(cx,cy,r,m,f,s,sw)=>`<path d="${tStar(star(24,r,r*.78),cx,cy)}" ${attrs(m,f,s,sw)}/>`},
  {id:'burst-spike',  cat:'star', cf:false, draw:(cx,cy,r,m,f,s,sw)=>`<path d="${tStar(star(20,r,r*.55),cx,cy)}" ${attrs(m,f,s,sw)}/>`},
  {id:'star4-needle', cat:'star', cf:false, draw:(cx,cy,r,m,f,s,sw)=>`<path d="${tStar(star(4,r,r*.15),cx,cy)}" ${attrs(m,f,s,sw)}/>`},
  {id:'star6-needle', cat:'star', cf:false, draw:(cx,cy,r,m,f,s,sw)=>`<path d="${tStar(star(6,r,r*.18),cx,cy)}" ${attrs(m,f,s,sw)}/>`},
  {id:'star8-needle', cat:'star', cf:false, draw:(cx,cy,r,m,f,s,sw)=>`<path d="${tStar(star(8,r,r*.2),cx,cy)}" ${attrs(m,f,s,sw)}/>`},
  {id:'gear8',        cat:'star', cf:false, draw:(cx,cy,r,m,f,s,sw)=>`<path d="${tStar(star(8,r,r*.82),cx,cy)}" ${attrs(m,f,s,sw)}/>`},
  {id:'gear12',       cat:'star', cf:false, draw:(cx,cy,r,m,f,s,sw)=>`<path d="${tStar(star(12,r,r*.82),cx,cy)}" ${attrs(m,f,s,sw)}/>`},
  {id:'gear16',       cat:'star', cf:false, draw:(cx,cy,r,m,f,s,sw)=>`<path d="${tStar(star(16,r,r*.85),cx,cy)}" ${attrs(m,f,s,sw)}/>`},
  {id:'star3',        cat:'star', cf:false, draw:(cx,cy,r,m,f,s,sw)=>`<path d="${tStar(star(3,r,r*.35),cx,cy)}" ${attrs(m,f,s,sw)}/>`},
  {id:'star7-spike',  cat:'star', cf:false, draw:(cx,cy,r,m,f,s,sw)=>`<path d="${tStar(star(7,r,r*.3),cx,cy)}" ${attrs(m,f,s,sw)}/>`},
  {id:'star9-med',    cat:'star', cf:false, draw:(cx,cy,r,m,f,s,sw)=>`<path d="${tStar(star(9,r,r*.5),cx,cy)}" ${attrs(m,f,s,sw)}/>`},
  {id:'star11-med',   cat:'star', cf:false, draw:(cx,cy,r,m,f,s,sw)=>`<path d="${tStar(star(11,r,r*.5),cx,cy)}" ${attrs(m,f,s,sw)}/>`},
];

// Pool weight per shape, applied via weightedPick.
// FEEDBACK: stars over-represented and boring as stroke. Drop star weight, boost solids.
SHAPES.forEach(sh=>{
  if(sh.cat==='star')   sh.w=1;
  if(sh.cat==='solid')  sh.w=2.5;
  if(sh.cat==='hollow') sh.w=1.5;
});

// ─── Modes / colors / fonts / palettes ──────────────────────────────────────
const SHAPE_MODES=[{m:'filled',w:3},{m:'stroke',w:5}];
function pickMode(){return weightedPick(SHAPE_MODES).m;}
const SHAPE_COLORS=[WARM,WARM,COLD];

const SENIOR_FONTS=[
  {f:'"Bungee Shade",sans-serif',          w:'400',s:'normal', label:'Bungee Shade'},
  {f:'"Bungee Inline",sans-serif',         w:'400',s:'normal', label:'Bungee Inline'},
  {f:'"Bungee Outline",sans-serif',        w:'400',s:'normal', label:'Bungee Outline'},
  {f:'"Bungee",sans-serif',                w:'400',s:'normal', label:'Bungee'},
  {f:'"Rubik Mono One",sans-serif',        w:'400',s:'normal', label:'Rubik Mono One'},
  {f:'"Rubik Wet Paint",sans-serif',       w:'400',s:'normal', label:'Rubik Wet Paint'},
  {f:'"Rubik Glitch",sans-serif',          w:'400',s:'normal', label:'Rubik Glitch'},
  {f:'"Rubik Burned",sans-serif',          w:'400',s:'normal', label:'Rubik Burned'},
  {f:'"Rubik Beastly",sans-serif',         w:'400',s:'normal', label:'Rubik Beastly'},
  {f:'"Abril Fatface",serif',              w:'400',s:'normal', label:'Abril Fatface'},
  {f:'"Bodoni Moda",serif',                w:'900',s:'italic', label:'Bodoni Moda Black Italic'},
  {f:'"Big Shoulders Display",sans-serif', w:'900',s:'normal', label:'Big Shoulders Black'},
  {f:'"Yeseva One",serif',                 w:'400',s:'normal', label:'Yeseva One'},
  {f:'"Bowlby One",sans-serif',            w:'400',s:'normal', label:'Bowlby One'},
  {f:'"Alfa Slab One",serif',              w:'400',s:'normal', label:'Alfa Slab One'},
  {f:'"VT323",monospace',                  w:'400',s:'normal', label:'VT323'},
  {f:'"Major Mono Display",monospace',     w:'400',s:'normal', label:'Major Mono'},
  {f:'"Share Tech Mono",monospace',        w:'400',s:'normal', label:'Share Tech Mono'},
  {f:'"Nova Mono",monospace',              w:'400',s:'normal', label:'Nova Mono'},
  {f:'"Monoton",sans-serif',               w:'400',s:'normal', label:'Monoton'},
  {f:'"Faster One",sans-serif',            w:'400',s:'normal', label:'Faster One'},
  {f:'"Bagel Fat One",sans-serif',         w:'400',s:'normal', label:'Bagel Fat One'},
  {f:'"Codystar",sans-serif',              w:'400',s:'normal', label:'Codystar'},
  {f:'"Gravitas One",serif',               w:'400',s:'normal', label:'Gravitas One'},
  {f:'"UnifrakturCook",serif',             w:'700',s:'normal', label:'UnifrakturCook'},
  {f:'"Pirata One",serif',                 w:'400',s:'normal', label:'Pirata One'},
  {f:'"Caveat Brush",cursive',             w:'400',s:'normal', label:'Caveat Brush'},
  {f:'"Permanent Marker",cursive',         w:'400',s:'normal', label:'Permanent Marker'},
  {f:'"Rampart One",cursive',              w:'400',s:'normal', label:'Rampart One'},
  {f:'"Bruno Ace SC",sans-serif',          w:'400',s:'normal', label:'Bruno Ace SC'},
];

const D=COL, W=WARM, C=COLD;
const COLOR_PALETTES=[
  {c:[D,D,D], label:'All dark',           w:1},
  {c:[W,D,D], label:'Sr warm',            w:1},
  {c:[D,W,D], label:'CD warm',            w:1},
  {c:[D,D,W], label:'HoA warm',           w:1},
  {c:[W,D,W], label:'Sr+HoA warm',        w:3},
  {c:[D,W,W], label:'CD+HoA warm',        w:3},
  {c:[C,D,D], label:'Sr cold',            w:1},
  {c:[D,C,D], label:'CD cold',            w:1},
  {c:[D,D,C], label:'HoA cold',           w:1},
  {c:[C,D,C], label:'Sr+HoA cold',        w:3},
  {c:[D,C,C], label:'CD+HoA cold',        w:3},
  {c:[C,D,W], label:'Sr cold · HoA warm', w:4},
  {c:[W,D,C], label:'Sr warm · HoA cold', w:4},
  {c:[C,W,D], label:'Sr cold · CD warm',  w:4},
  {c:[D,C,W], label:'CD cold · HoA warm', w:4},
  {c:[C,C,D], label:'Sr+CD cold',         w:3},
  {c:[W,W,D], label:'Sr+CD warm',         w:3},
  {c:[D,W,C], label:'CD warm · HoA cold', w:4},
];
function pickPalette(){return weightedPick(COLOR_PALETTES);}

// ─── No-recent picker (state preserved across renderHeader calls) ───────────
const recentShapes=[], recentFonts=[];
const RECENT_MEM=3;
function pickNoRecent(pool, history, key){
  const fresh=pool.filter(x=>!history.includes(x[key]));
  const choice=fresh.length ? weightedPick(fresh) : weightedPick(pool);
  history.push(choice[key]);
  if(history.length>RECENT_MEM) history.shift();
  return choice;
}

// ─── Main generator ─────────────────────────────────────────────────────────
let _seq=0;
function generate(){
  _seq++;
  const t1='Senior',t2='Creative Director',t3='Head of Art',tA='&';
  const sf=pickNoRecent(SENIOR_FONTS,recentFonts,'label');
  const pal=pickPalette();
  const shapeObj=pickNoRecent(SHAPES,recentShapes,'id');
  // Tuning: stars are boring as stroke. 70% chance to force filled if star.
  let mode=pickMode();
  if(shapeObj.cat==='star' && mode==='stroke' && Math.random()<0.7) mode='filled';
  const shapecol=pick(SHAPE_COLORS);
  const strokecol=COL;
  function mW1(t,sz){_cx.font=`${sf.s==='italic'?'italic ':''}${sf.w} ${sz}px ${sf.f.replace(/"/g,'').split(',')[0]},sans-serif`;return _cx.measureText(t).width;}
  const maxFitCD=fitSzW(t2,999);
  const base=rndInt(24,Math.min(maxFitCD,100));
  const vR=RATIOS.filter(r=>Math.round(base*r)>=SZ_FLOOR && Math.round(base*r)<=base*2);
  let s23=base;
  let s1=fitSzW(t1,Math.round(base*pick(vR)));
  let sA=fitSzW(tA,Math.round(base*pick(vR)));
  let g12=rndInt(GAP_MIN,GAP_MAX),g23=rndInt(GAP_MIN,GAP_MAX),gA=rndInt(GAP_MIN,GAP_MAX);
  // Anchor pairs — favor Senior shares anchor with CD or HoA
  const pairChoices=[[1,2],[1,2],[1,3],[1,3],[2,3]];
  const shared=pick(ANCHORS), pair=pick(pairChoices);
  const anch={1:null,2:null,3:null};
  pair.forEach(i=>anch[i]=shared);
  const third=[1,2,3].find(i=>!pair.includes(i));
  anch[third]=pick(ANCHORS.filter(a=>a!==shared));
  const fL2c=clamp(mkLayout(anch[2],mW(t2,s23))), fL3c=clamp(mkLayout(anch[3],mW(t3,s23)));
  const wAc=mW(tA,sA);
  const valid=[];
  if(fL2c.R+SP+wAc<=VW-PAD) valid.push(1);
  valid.push(2);
  if(fL3c.L-SP-wAc>=PAD) valid.push('3L');
  // Tuning: bias against own-row (was boring in 17/26 borings). Inline weighted 2× when valid.
  const weighted=[];
  valid.forEach(p=>{ weighted.push(p); if(p===1||p==='3L') weighted.push(p); });
  const pos=pick(weighted);
  const hasOwnRow=pos===2;
  const vAlign=hasOwnRow?'middle':pick(['middle','bottom']);
  function stackH(s1,s23,sA,g12,g23,gA){return s1+g12+s23+(hasOwnRow?gA+sA+gA:0)+g23+s23;}
  const maxH=VH-PAD*2;
  if(stackH(s1,s23,sA,g12,g23,gA)>maxH){g12=0;g23=0;gA=0;}
  if(stackH(s1,s23,sA,0,0,0)>maxH){
    const sc=maxH/(s1+s23+s23+(hasOwnRow?sA:0));
    s23=Math.max(SZ_FLOOR,Math.floor(s23*sc));
    s1=Math.max(SZ_FLOOR,Math.floor(s1*sc));
    sA=Math.max(SZ_FLOOR,Math.floor(sA*sc));
    s1=fitSzW(t1,s1); sA=fitSzW(tA,sA); g12=0;g23=0;gA=0;
  }
  const fw1=mW1(t1,s1), fw2=mW(t2,s23), fw3=mW(t3,s23), fwA=mW(tA,sA);
  const fL1=clamp(mkLayout(anch[1],fw1)), fL2=clamp(mkLayout(anch[2],fw2)), fL3=clamp(mkLayout(anch[3],fw3));
  const finalH=stackH(s1,s23,sA,g12,g23,gA);
  const topY=Math.round((VH-finalH)/2);
  const B1=topY+s1, B2=B1+g12+s23, BA=hasOwnRow?B2+gA+sA:null, B3=hasOwnRow?BA+gA+s23:B2+g23+s23;
  let xA,ampY,taA;
  if(pos===1){xA=fL2.R+SP;taA='start';}
  else if(pos===2){const LA=clamp(mkLayout(anch[2],fwA));xA=LA.x;taA=LA.ta;}
  else{xA=fL3.L-SP-fwA;taA='start';}
  if(hasOwnRow){ampY=BA;}
  else{const adjB=pos===1?B2:B3;ampY=ampPlace(vAlign,adjB,s23,sA).yA;}
  const ampCX=taA==='start'?xA+fwA/2:taA==='end'?xA-fwA/2:xA;
  const ampCY=ampY-sA*0.35;
  const minRFactor={'arrow':1.3,'ring':1.25,'heart':1.2}[shapeObj.id]||0.95;
  const shapeR=Math.round(sA*rnd(minRFactor,minRFactor+0.25));
  const sw=Math.min(4,Math.max(1.5,shapeR*.04));
  const ampHasFill=mode==='filled'&&shapeObj.cf;
  // Overlap-aware text color
  function lineOverlapsShape(lineX,lineW,lineBaseline,lineSz,anchor){
    const lL=anchor==='start'?lineX:anchor==='end'?lineX-lineW:lineX-lineW/2;
    const lR=lL+lineW;
    const lTop=lineBaseline-lineSz, lBot=lineBaseline+lineSz*0.2;
    const sL=ampCX-shapeR*1.1, sR=ampCX+shapeR*1.1, sTop=ampCY-shapeR*1.1, sBot=ampCY+shapeR*1.1;
    return lR>sL && lL<sR && lBot>sTop && lTop<sBot;
  }
  function safeColor(col,lineX,lineW,lineBaseline,lineSz,anchor){
    if(col===COL) return col;
    if(!ampHasFill) return col;
    return lineOverlapsShape(lineX,lineW,lineBaseline,lineSz,anchor)?COL:col;
  }
  const c1=safeColor(pal.c[0],fL1.x,fw1,B1,s1,fL1.ta);
  const c2=safeColor(pal.c[1],fL2.x,fw2,B2,s23,fL2.ta);
  const c3=safeColor(pal.c[2],fL3.x,fw3,B3,s23,fL3.ta);
  function ampColorNoFill(){
    let adjacents=[];
    if(pos===1) adjacents=[c2];
    else if(pos==='3L') adjacents=[c3];
    else adjacents=[c2,c3];
    if(adjacents.some(c=>c===COL)) return shapecol;
    return COL;
  }
  const ampCol=ampHasFill?BG:ampColorNoFill();
  const tf=(t,x,y,sz,ta,col,font,weight,fstyle)=>`<text x="${x}" y="${y}" text-anchor="${ta}" font-family=${font||FONT} font-weight="${weight||FW}" font-style="${fstyle||'normal'}" font-size="${sz}" fill="${col||COL}">${t}</text>`;
  let out='';
  out+=`<rect width="${VW}" height="${VH}" fill="${BG}"/>`;
  out+=shapeObj.draw(ampCX,ampCY,shapeR,mode,shapecol,strokecol,sw);
  out+=`<text x="${xA}" y="${ampY}" text-anchor="${taA}" font-family=${FONT} font-weight="${FW}" font-size="${sA}" fill="${ampCol}">&amp;</text>`;
  out+=tf(t1,fL1.x,B1,s1,fL1.ta,c1,sf.f,sf.w,sf.s);
  out+=tf(t2,fL2.x,B2,s23,fL2.ta,c2);
  out+=tf(t3,fL3.x,B3,s23,fL3.ta,c3);
  const posLabel=pos===1?'right of CD':pos===2?'own row':'left of HoA';
  const shapeLabel=`${shapeObj.id}/${mode}/${shapecol===WARM?'warm':'cold'}`;
  return {svg:out, state:{n:_seq, shape:shapeLabel, sfLabel:sf.label, palLabel:pal.label, posLabel, vAlign:hasOwnRow?null:vAlign, s23, s1, sA}};
}

// ─── Public API ─────────────────────────────────────────────────────────────
function renderHeader(svgEl, opts){
  opts=opts||{};
  const {svg, state} = generate();
  let inner=svg;
  if(opts.debug){
    inner+=`<text x="${PAD}" y="${VH-8}" font-family=${FONT} font-size="9" fill="#aaa">#${state.n} · ${state.posLabel}${state.vAlign?' · '+state.vAlign:''} · ${state.shape} · ${state.sfLabel} · ${state.palLabel}</text>`;
  }
  svgEl.setAttribute('viewBox',`0 0 ${VW} ${VH}`);
  svgEl.setAttribute('preserveAspectRatio','xMidYMid meet');
  svgEl.innerHTML=inner;
  return state;
}

global.renderHeader=renderHeader;
global.HeaderConfig={VW,VH,PAD,BG,WARM,COLD,COL};
})(window);
