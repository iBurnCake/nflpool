const enc = (s) => encodeURIComponent(s.trim());
const uri = (svg) => `data:image/svg+xml;utf8,${enc(svg)}`;

const svgWrap = (w, h, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${body}</svg>`;

const grad = (id, stops) =>
  `<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">${
    stops.map(([o,c])=>`<stop offset="${o}" stop-color="${c}"/>`).join('')
  }</linearGradient></defs>`;

const stripes = (w,h,colors,angle=35) => {
  const band = 60;
  let g = `<g transform="rotate(${angle} ${w/2} ${h/2})">`;
  for (let i=-w; i<w*2; i+=band){
    const c = colors[(Math.floor(i/band)%colors.length+colors.length)%colors.length];
    g += `<rect x="${i}" y="-${h}" width="${band}" height="${h*3}" fill="${c}"/>`;
  }
  g += `</g>`;
  return svgWrap(w,h,g);
};

const dots = (w,h,bg,fg) => {
  const r=5, gap=22; let b=`<rect width="100%" height="100%" fill="${bg}"/>`;
  for(let y=gap/2; y<h; y+=gap){
    for(let x=gap/2; x<w; x+=gap){
      b+=`<circle cx="${x}" cy="${y}" r="${r}" fill="${fg}" opacity="0.25"/>`;
    }
  }
  return svgWrap(w,h,b);
};

const waves = (w,h,stops,amp=20,rows=5) => {
  const id='g'+Math.random().toString(36).slice(2,7);
  let b = grad(id, stops);
  for(let i=0;i<rows;i++){
    let p=`M0 ${h/rows*i}`;
    for(let x=0;x<=w;x+=40){
      p+=` Q ${x+20} ${h/rows*i + (i%2?amp:-amp)} ${x+40} ${h/rows*i}`;
    }
    b+=`<path d="${p}" stroke="url(#${id})" stroke-width="16" fill="none" opacity="${0.18+0.12*i}"/>`;
  }
  return svgWrap(w,h,b);
};

const yardLines = (w,h,grassA='#0c4d2c',grassB='#136d3f') => {
  let b=`<defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${grassA}"/><stop offset="1" stop-color="${grassB}"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>`;
  for(let y=20;y<h;y+=40){ b+=`<rect x="0" y="${y}" width="${w}" height="4" fill="#fff" opacity=".5"/>`; }
  for(let y=0;y<h;y+=40){
    for(let x=40;x<w;x+=60){
      b+=`<rect x="${x}" y="${y+8}" width="6" height="10" fill="#fff" opacity=".7"/>`;
    }
  }
  return svgWrap(w,h,b);
};

const playDiagram = (w,h,bg='#222',route='#ffd700',def='#4cc2ff') => {
  let b=`<rect width="100%" height="100%" fill="${bg}"/>`;
  const pts=[[60,180],[120,140],[180,200],[240,120],[300,180],[360,140]];
  pts.forEach(([x,y],i)=>{
    b+=`<circle cx="${x}" cy="${y}" r="10" fill="${route}" opacity=".9"/>`;
    b+=`<path d="M${x} ${y} q 40 -40 80 -10 t 80 0" fill="none" stroke="${route}" stroke-width="4" opacity=".55"/>`;
  });
  const xs=[[90,60],[210,80],[330,60],[150,240],[270,240]];
  xs.forEach(([x,y])=>{
    b+=`<g stroke="${def}" stroke-width="6" opacity=".6">
          <line x1="${x-10}" y1="${y-10}" x2="${x+10}" y2="${y+10}"/>
          <line x1="${x-10}" y1="${y+10}" x2="${x+10}" y2="${y-10}"/>
        </g>`;
  });
  
  return svgWrap(w,h,b);
};

const chevrons = (w,h,colors) => {
  let b=`<rect width="100%" height="100%" fill="${colors[0]}"/>`, y=0;
  for(let i=1;i<colors.length;i++){
    b+=`<path d="M0 ${y} L${w} ${y} L${w} ${y+60} L0 ${y+120} Z" fill="${colors[i]}" opacity=".8"/>`;
    y+=50;
  }
  return svgWrap(w,h,b);
};

const laces = (w,h,bg='#2b2b2b',lace='#ffffff') => {
  let b=`<rect width="100%" height="100%" fill="${bg}"/>`;
  b+=`<rect x="${w/2-8}" y="20" width="16" height="${h-40}" rx="8" fill="#111" opacity=".45"/>`;
  for(let i=50;i<h-50;i+=36){
    b+=`<rect x="${w/2-60}" y="${i}" width="120" height="8" rx="4" fill="${lace}" opacity=".8"/>`;
  }
  return svgWrap(w,h,b);
};

const confetti = (w,h,bg='#222',palette=['#ffd700','#ff4d4d','#4de1ff','#6dff6d']) => {
  let b=`<rect width="100%" height="100%" fill="${bg}"/>`;
  for(let i=0;i<120;i++){
    const x=Math.random()*w, y=Math.random()*h, s=3+Math.random()*8, r=Math.random()*360;
    const c=palette[i%palette.length];
    b+=`<rect x="${x}" y="${y}" width="${s}" height="${s*0.6}" fill="${c}" transform="rotate(${r} ${x} ${y})" opacity=".8"/>`;
  }
  return svgWrap(w,h,b);
};

const grid = (w,h,bg='#242424',line='#ffd700') => {
  let b=`<rect width="100%" height="100%" fill="${bg}"/>`;
  for(let x=0;x<w;x+=40){ b+=`<rect x="${x}" y="0" width="2" height="${h}" fill="${line}" opacity=".1"/>`; }
  for(let y=0;y<h;y+=40){ b+=`<rect x="0" y="${y}" width="${w}" height="2" fill="${line}" opacity=".1"/>`; }
  return svgWrap(w,h,b);
};

const diagLines = (w,h,bg='#1f1f1f',line='#3b7eed') => {
  let b=`<rect width="100%" height="100%" fill="${bg}"/>`;
  for(let i=-h;i<w;i+=24){ b+=`<rect x="${i}" y="0" width="3" height="${h*2}" fill="${line}" transform="rotate(-45 ${i} ${h/2})" opacity=".35"/>`; }
  return svgWrap(w,h,b);
};

const W=600,H=280;
export const BANNERS = [
  uri(stripes(W,H,['#2b2b2b','#3a3a3a','#ffd700','#2b2b2b'])),
  uri(waves(W,H,[['0%','#3b7eed'],['100%','#1aa4a8']] ,18,6)),
  uri( yardLines(W,H) ),
  uri( playDiagram(W,H) ),
  uri( dots(W,H,'#222','#ffd700') ),
  uri( chevrons(W,H,['#111','#252525','#ffd700','#252525','#3b7eed']) ),
  uri( confetti(W,H) ),
  uri( laces(W,H) ),
  uri( grid(W,H) ),
  uri( diagLines(W,H) ),
  uri( waves(W,H,[['0%','#ff7a00'],['100%','#ffd700']],14,7) ),
  uri( stripes(W,H,['#1aa4a8','#0f6a6e','#1aa4a8','#00363a'],25) ),
  uri( dots(W,H,'#1f1f1f','#4de1ff') ),
  uri( chevrons(W,H,['#0e0e0e','#222','#ff3b3b','#222','#ffd700']) ),
  uri( grid(W,H,'#1b1b1b','#4de1ff') ),
  uri( playDiagram(W,H,'#151515','#ffd700','#ff4d4d') ),
  uri( laces(W,H,'#202020','#ffd700') ),
  uri( stripes(W,H,['#2b2b2b','#2e2e2e','#4de1ff','#2b2b2b'],40) ),
  uri( waves(W,H,[['0%','#6dff6d'],['100%','#1aa4a8']],20,5) ),
  uri( confetti(W,H,'#101010',['#ffd700','#3b7eed','#1aa4a8','#ff4d4d']) )

];
