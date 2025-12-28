import { GRID_W, GRID_H } from './config.js';

export function initPad(els, state){
  const ctxPad = els.pad.getContext('2d', { alpha:false });

  function currentPaintTargetGrid(){
    return els.driveCamera.checked ? state.ampsBias : state.ampsManual;
  }

  function drawPad(){
    const grid = currentPaintTargetGrid();
    const W=els.pad.width,H=els.pad.height, cellW=W/GRID_W, cellH=H/GRID_H;
    ctxPad.fillStyle="#fff"; ctxPad.fillRect(0,0,W,H);

    for (let j=0; j<GRID_H; j++){
      for (let i=0; i<GRID_W; i++){
        const a = grid[j][i];
        let color;
        if (grid === state.ampsBias){
          const v = Math.max(-1, Math.min(1, a));
          if (v >= 0){
            const t=v; const r=230-40*t,g=228-30*t,b=255-80*t;
            color=`rgb(${r|0},${g|0},${b|0})`;
          } else {
            const t=-v; const r=255-0*t,g=220-50*t,b=230-60*t;
            color=`rgb(${r|0},${g|0},${b|0})`;
          }
        } else {
          const r = Math.round(230 - 60*a), g = Math.round(228 - 40*a), b = Math.round(255 - 0*a);
          color = `rgb(${r},${g},${b})`;
        }
        ctxPad.fillStyle = color;
        ctxPad.fillRect(i*cellW, j*cellH, cellW, cellH);
      }
    }

    ctxPad.strokeStyle="#ddd"; ctxPad.lineWidth=1;
    for (let i=1;i<GRID_W;i++){ const x=i*(W/GRID_W); ctxPad.beginPath(); ctxPad.moveTo(x,0); ctxPad.lineTo(x,H); ctxPad.stroke(); }
    for (let j=1;j<GRID_H;j++){ const y=j*(H/GRID_H); ctxPad.beginPath(); ctxPad.moveTo(0,y); ctxPad.lineTo(W,y); ctxPad.stroke(); }
  }

  function applyPad(e){
    const r = els.pad.getBoundingClientRect();
    const x = (e.clientX - r.left) * (els.pad.width / r.width);
    const y = (e.clientY - r.top)  * (els.pad.height/ r.height);
    const cellW = els.pad.width/GRID_W, cellH = els.pad.height/GRID_H;
    const cx = x / cellW, cy = y / cellH;

    const mode = els.modeRadios.find(r=>r.checked)?.value || 'add';
    const strength = parseFloat(els.brushStrength.value);
    const radius = parseInt(els.brushSize.value,10);

    const grid = currentPaintTargetGrid();
    const ix0 = Math.max(0, Math.floor(cx) - radius);
    const ix1 = Math.min(GRID_W-1, Math.floor(cx) + radius);
    const iy0 = Math.max(0, Math.floor(cy) - radius);
    const iy1 = Math.min(GRID_H-1, Math.floor(cy) + radius);

    for (let j=iy0; j<=iy1; j++){
      for (let i=ix0; i<=ix1; i++){
        const dx = (i + 0.5) - cx;
        const dy = (j + 0.5) - cy;
        const d = Math.sqrt(dx*dx + dy*dy);
        if (d > radius + 0.5) continue;
        const t = Math.max(0, 1 - d/(radius+0.5));
        const w = t*t*(3-2*t);

        if (grid === state.ampsBias){
          if (mode === 'add'){ grid[j][i] = Math.min( 1, grid[j][i] + strength * w); }
          else if (mode === 'sub'){ grid[j][i] = Math.max(-1, grid[j][i] - strength * w); }
          else {
            const base = (els.driveCamera.checked ? state.ampsCamera[j][i] : state.ampsManual[j][i]);
            const desired = strength;
            const targetBias = desired - base;
            grid[j][i] = grid[j][i] * (1 - w) + targetBias * w;
            grid[j][i] = Math.max(-1, Math.min(1, grid[j][i]));
          }
        } else {
          if (mode === 'add'){ grid[j][i] = Math.min(1, grid[j][i] + strength * w); }
          else if (mode === 'sub'){ grid[j][i] = Math.max(0, grid[j][i] - strength * w); }
          else { grid[j][i] = grid[j][i] * (1 - w) + strength * w; grid[j][i] = Math.max(0, Math.min(1, grid[j][i])); }
        }
      }
    }

    state.needSurfaceUpdate = true;
    drawPad();
  }

  //wire paint
  let painting=false;
  els.pad.addEventListener('mousedown', (e)=>{ painting=true; applyPad(e); });
  window.addEventListener('mouseup', ()=> painting=false);
  els.pad.addEventListener('mouseleave', ()=> painting=false);
  els.pad.addEventListener('mousemove', (e)=>{ if(!painting) return; applyPad(e); });

  //buttons
  els.btnClearManual.addEventListener('click', () => {
    for (let j=0;j<GRID_H;j++) for (let i=0;i<GRID_W;i++) state.ampsManual[j][i]=0;
    state.needSurfaceUpdate=true; drawPad();
  });
  els.btnClearBias.addEventListener('click', () => {
    for (let j=0;j<GRID_H;j++) for (let i=0;i<GRID_W;i++) state.ampsBias[j][i]=0;
    state.needSurfaceUpdate=true; drawPad();
  });

  function updatePaintHint(){
    els.paintTargetHint.textContent = els.driveCamera.checked ? 'Painting: camera offset' : 'Painting: manual pad';
    drawPad();
  }
  els.driveCamera.addEventListener('change', updatePaintHint);
  updatePaintHint();

  drawPad();
  return { drawPad };
}
