import { getEls } from './dom.js';
import { createState } from './state.js';
import { DPR, sizeCanvasToCSS } from './utils.js';
import { startWebcam } from './webcam.js';
import { wireCalibration } from './calibrate.js';
import { processFrame } from './vision.js';
import { initPad } from './pad.js';
import { initThree } from './threeScene.js';
import { updateSurfaceFromAmps } from './surface.js';
import { wireSTLExport } from './exportSTL.js';
import { GRID_W, GRID_H } from './config.js';

const els = getEls();
const state = createState();
const three = initThree(els);

initPad(els, state);
wireCalibration(els, state);
wireSTLExport(els, state, three);

// sizing
new ResizeObserver(() => sizeCanvasToCSS(els.cam)).observe(els.cam);

// webcam button
els.btnStart.addEventListener('click', async () => {
  els.btnStart.disabled = true;
  try {
    await startWebcam(els);
    els.status.textContent = 'streaming';
    sizeCanvasToCSS(els.cam);
    els.btnCalib.disabled = false;
    els.btnBaseline.disabled = true;
  } catch (e) {
    console.error(e);
    els.status.textContent = 'camera error';
    els.btnStart.disabled = false;
    alert('Could not start webcam.');
  }
});

// baseline button
els.btnBaseline.addEventListener('click', () => {
  if (!state.calibAuv || !state.calibBuv) { alert('Calibrate first (TL then BR).'); return; }
  processFrame(els, state);
  els.status.textContent = 'baseline set';
});

// UI readouts
const updateSensVal = () => els.sensVal.textContent = (parseFloat(els.sens.value)/100).toFixed(2) + '×';
els.sens.addEventListener('input', updateSensVal);
updateSensVal();

els.gain.addEventListener('input', ()=>{ els.gainVal.textContent=(parseFloat(els.gain.value)/100).toFixed(2); state.needSurfaceUpdate=true; });
els.sigma.addEventListener('input', ()=>{ els.sigmaVal.textContent=`${(parseFloat(els.sigma.value)/100).toFixed(2)}× cell`; state.needSurfaceUpdate=true; });

els.btnResetView.addEventListener('click', ()=> {
  three.camera.position.set(5,4,6);
  const t = three.orbit.target;
  t.set(0,0,0);
  three.orbit.update();
});

els.btnClear.addEventListener('click', ()=> {
  for(let j=0;j<GRID_H;j++){
    for(let i=0;i<GRID_W;i++){
      state.ampsManual[j][i]=0;
      state.ampsCamera[j][i]=0;
      state.ampsBias[j][i]=0;
      state.ampsSmoothed[j][i]=0;
      state.cameraBaselineArea[j][i]=0;
    }
  }
  state.needSurfaceUpdate = true;
});

function updateCameraPanelVisibility(){
  els.cameraWrap.style.display = els.showCamera.checked ? 'grid' : 'none';
}
els.showCamera.addEventListener('change', updateCameraPanelVisibility);
updateCameraPanelVisibility();

// render loop
function animate(){
  requestAnimationFrame(animate);
  sizeCanvasToCSS(els.cam);
  processFrame(els, state);

  three.orbit.update();
  if (!els.pause.checked && state.needSurfaceUpdate){
    updateSurfaceFromAmps(three.geom, els, state);
    state.needSurfaceUpdate = false;
  }
  three.renderer.render(three.scene, three.camera);
}
animate();

// smoothing + fps tick
function tick(){
  const ema = parseFloat(els.ema.value);
  const base = els.driveCamera.checked ? state.ampsCamera : state.ampsManual;

  for (let j=0;j<GRID_H;j++){
    for (let i=0;i<GRID_W;i++){
      const val = Math.max(0, Math.min(1, base[j][i] + state.ampsBias[j][i]));
      state.ampsSmoothed[j][i] = ema*state.ampsSmoothed[j][i] + (1-ema)*val;
    }
  }

  state.needSurfaceUpdate = true;

  const now = performance.now();
  const dt = now - state.lastTime;
  state.lastTime = now;
  els.fps.textContent = Math.max(1, Math.round(1000/dt)).toString();

  requestAnimationFrame(tick);
}
tick();
