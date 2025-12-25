import { GRID_W, GRID_H } from './config.js';
import { getDisplayRect, videoUVToScreen } from './utils.js';

export function rgbToHsv(r,g,b){
  r/=255; g/=255; b/=255;
  const max=Math.max(r,g,b), min=Math.min(r,g,b), d=max-min; let h=0;
  if(d!==0){
    switch(max){
      case r: h=((g-b)/d)%6; break;
      case g: h=(b-r)/d+2; break;
      case b: h=(r-g)/d+4; break;
    }
    h*=60; if(h<0) h+=360;
  }
  const s=max===0?0:d/max, v=max;
  return {h,s,v};
}

export function labelComponents(mask, W, H) {
  const labels = new Int32Array(W*H);
  let nextLabel = 1; const parent = [0];
  function find(a){ while(parent[a]!==a){ parent[a]=parent[parent[a]]; a=parent[a]; } return a; }
  function unite(a,b){ a=find(a); b=find(b); if(a!==b) parent[Math.max(a,b)]=Math.min(a,b); }

  for (let y=0;y<H;y++){
    for (let x=0;x<W;x++){
      const i=y*W+x; if(!mask[i]) continue;
      const L = x>0 ? labels[i-1] : 0;
      const U = y>0 ? labels[i-W] : 0;
      if (!L && !U){ labels[i]=nextLabel; parent[nextLabel]=nextLabel; nextLabel++; }
      else if (L && !U){ labels[i]=L; }
      else if (!L && U){ labels[i]=U; }
      else { labels[i]=Math.min(L,U); if(L!==U) unite(L,U); }
    }
  }
  const map = new Map(); let compact=1;
  for (let i=0;i<labels.length;i++){
    const L=labels[i]; if(!L) continue;
    const r=find(L);
    if(!map.has(r)) map.set(r, compact++);
    labels[i]=map.get(r);
  }
  return { labels, num: compact-1 };
}

export function drawDebugMaskToOverlay(mask, PW, PH, ctx, cw) {
  const img = ctx.createImageData(PW, PH);
  for (let i = 0; i < mask.length; i++) {
    const on = mask[i] ? 255 : 0;
    img.data[i*4+0] = 124;
    img.data[i*4+1] = 108;
    img.data[i*4+2] = 242;
    img.data[i*4+3] = on ? 160 : 0;
  }
  const w = Math.round(cw * 0.25);
  const h = Math.round(w * PH / PW);
  const off = document.createElement('canvas');
  off.width = PW; off.height = PH;
  off.getContext('2d').putImageData(img, 0, 0);
  ctx.save(); ctx.drawImage(off, 8, 8, w, h); ctx.restore();
}

export function imageXYtoCell(x, y, calibAuv, calibBuv, rect, flipY){
  const A = videoUVToScreen(calibAuv.u, calibAuv.v, rect, flipY);
  const B = videoUVToScreen(calibBuv.u, calibBuv.v, rect, flipY);
  const x1 = Math.min(A.x, B.x), x2 = Math.max(A.x, B.x);
  const y1 = Math.min(A.y, B.y), y2 = Math.max(A.y, B.y);
  if (x < x1 || x > x2 || y < y1 || y > y2) return null;
  const u = (x - x1) / (x2 - x1);
  const v = (y - y1) / (y2 - y1);
  let ix = Math.floor(u * GRID_W); if (ix === GRID_W) ix = GRID_W-1;
  let iy = Math.floor(v * GRID_H); if (iy === GRID_H) iy = GRID_H-1;
  return {ix, iy};
}

export function processFrame(els, state){
  const cw = els.cam.width, ch = els.cam.height;
  const vw = els.video.videoWidth, vh = els.video.videoHeight;
  const ctx = els.cam.getContext('2d', { willReadFrequently: true });
  ctx.clearRect(0,0,cw,ch);

  if (!vw || !vh) return;

  const rect = getDisplayRect(cw, ch, vw, vh);

  // draw video to cam
  ctx.save();
  if (els.flipY.checked){
    ctx.translate(rect.x, rect.y + rect.h);
    ctx.scale(1, -1);
    ctx.drawImage(els.video, 0, 0, rect.w, rect.h);
  } else {
    ctx.drawImage(els.video, rect.x, rect.y, rect.w, rect.h);
  }
  ctx.restore();

  // draw calibration grid overlay
  if (state.calibAuv && state.calibBuv){
    const A = videoUVToScreen(state.calibAuv.u, state.calibAuv.v, rect, els.flipY.checked);
    const B = videoUVToScreen(state.calibBuv.u, state.calibBuv.v, rect, els.flipY.checked);
    const x1 = Math.min(A.x, B.x), x2 = Math.max(A.x, B.x);
    const y1 = Math.min(A.y, B.y), y2 = Math.max(A.y, B.y);
    const w = Math.max(1, x2 - x1), h = Math.max(1, y2 - y1);
    ctx.save(); ctx.strokeStyle = '#7c6cf2'; ctx.lineWidth = 2; ctx.strokeRect(x1,y1,w,h);
    ctx.lineWidth=1;
    for (let i=1;i<GRID_W;i++){ const gx=x1 + (w*i/GRID_W); ctx.beginPath(); ctx.moveTo(gx,y1); ctx.lineTo(gx,y2); ctx.stroke(); }
    for (let j=1;j<GRID_H;j++){ const gy=y1 + (h*j/GRID_H); ctx.beginPath(); ctx.moveTo(x1,gy); ctx.lineTo(x2,gy); ctx.stroke(); }
    ctx.restore();
  }

  // only process if driving from camera + calibrated
  if (!els.driveCamera.checked || !state.calibAuv || !state.calibBuv) return;

  const PW = parseInt(els.procW.value,10);
  const PH = Math.max(1, Math.round(PW * (rect.h / rect.w)));
  const off = state.canvasPool.get(PW, PH);
  const octx = off.getContext('2d', { willReadFrequently: true });

  octx.save();
  if (els.flipY.checked){ octx.translate(0, PH); octx.scale(1, -1); }
  octx.drawImage(els.video, 0, 0, PW, PH);
  octx.restore();

  const img = octx.getImageData(0,0,PW,PH);
  const data = img.data;

  const hMin = +els.hMin.value, hMax = +els.hMax.value;
  const sMin = +els.sMin.value/100, vMin = +els.vMin.value/100;

  const mask = new Uint8Array(PW*PH);
  for (let y=0; y<PH; y++){
    let i=y*PW*4;
    for (let x=0; x<PW; x++, i+=4){
      const r=data[i], g=data[i+1], b=data[i+2];
      const {h,s,v}=rgbToHsv(r,g,b);
      mask[y*PW+x] = (h>=hMin && h<=hMax && s>=sMin && v>=vMin) ? 1 : 0;
    }
  }

  const {labels, num} = labelComponents(mask, PW, PH);

  const stats = new Map();
  for (let id=1; id<=num; id++) stats.set(id, {area:0,sumX:0,sumY:0});
  for (let y=0; y<PH; y++){
    for (let x=0; x<PW; x++){
      const L=labels[y*PW+x]; if(!L) continue;
      const s=stats.get(L); s.area++; s.sumX+=x; s.sumY+=y;
    }
  }

  const sx = rect.w / PW, sy = rect.h / PH;
  const x0 = rect.x,      y0 = rect.y;
  const minA = +els.minArea.value;

  const detections = Array.from({length:GRID_H}, () => Array(GRID_W).fill(null));
  for (const [,v] of stats){
    if (v.area < minA) continue;
    const cxProc = v.sumX / v.area;
    const cyProc = v.sumY / v.area;
    const cxI = x0 + cxProc * sx;
    const cyI = y0 + cyProc * sy;

    const cell = imageXYtoCell(cxI, cyI, state.calibAuv, state.calibBuv, rect, els.flipY.checked);
    if (!cell) continue;

    const areaFull = v.area * (sx*sy);
    const cur = detections[cell.iy][cell.ix];
    if (!cur || areaFull > cur.area) detections[cell.iy][cell.ix] = {area:areaFull, cx:cxI, cy:cyI};
  }

  if (els.showMask.checked) drawDebugMaskToOverlay(mask, PW, PH, ctx, cw);
  if (els.showBoxes.checked) {
    ctx.save(); ctx.strokeStyle = '#b39bff'; ctx.lineWidth = 2;
    for (let j=0;j<GRID_H;j++) for (let i=0;i<GRID_W;i++){
      const d = detections[j][i]; if (!d) continue;
      ctx.beginPath(); ctx.arc(d.cx, d.cy, 12, 0, Math.PI*2); ctx.stroke();
    }
    ctx.restore();
  }

  // baseline + amplitude
  for (let j=0; j<GRID_H; j++){
    for (let i=0; i<GRID_W; i++){
      if (!state.cameraBaselineArea[j][i] && detections[j][i]) state.cameraBaselineArea[j][i] = detections[j][i].area;
    }
  }

  const sens = parseFloat(els.sens.value)/100;
  const rawMode = els.rawAreaMode.checked;

  for (let j=0; j<GRID_H; j++){
    for (let i=0; i<GRID_W; i++){
      const det = detections[j][i];
      const A0  = state.cameraBaselineArea[j][i];
      let a = 0;

      if (rawMode) {
        const norm = A0 || 1;
        a = det ? Math.min(1, (det.area / Math.max(1, norm)) * sens) : 0;
      } else {
        if (det && A0>0){
          const r  = Math.sqrt(det.area/Math.PI);
          const r0 = Math.sqrt(A0/Math.PI);
          const s  = r0>0 ? (r/r0) : 1;
          a = Math.max(0, (s - 1) * sens);
        } else a = 0;
      }

      state.ampsCamera[j][i] = Math.max(0, Math.min(1, a));
    }
  }
}
