import { getDisplayRect, screenToVideoUV_clientCoords, videoUVToScreen } from './utils.js';

export function wireCalibration(els, state){
  els.btnCalib.addEventListener('click', () => {
    state.calibMode = true;
    state.calibAuv = null;
    state.calibBuv = null;
    els.status.textContent = 'calibrating (click TL then BR)';
  });

  els.cam.addEventListener('click', (e) => {
    const cw = els.cam.width, ch = els.cam.height;
    const vw = els.video.videoWidth, vh = els.video.videoHeight;
    if (!vw || !vh) return;

    const rect = getDisplayRect(cw, ch, vw, vh);
    const uv = screenToVideoUV_clientCoords(e.clientX, e.clientY, els.cam, rect, els.flipY.checked);
    if (!uv) { els.status.textContent = 'click inside the video area'; return; }

    // draw crosshair click marker
    const ctx = els.cam.getContext('2d', { willReadFrequently:true });
    const p = videoUVToScreen(uv.u, uv.v, rect, els.flipY.checked);
    ctx.save(); ctx.strokeStyle = '#7c6cf2'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, Math.PI*2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(p.x-10, p.y); ctx.lineTo(p.x+10, p.y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(p.x, p.y-10); ctx.lineTo(p.x, p.y+10); ctx.stroke();
    ctx.restore();

    if (!state.calibMode) return;

    if (!state.calibAuv) {
      state.calibAuv = { u: uv.u, v: uv.v };
      els.status.textContent = 'calibrating: click opposite corner';
    } else {
      state.calibBuv = { u: uv.u, v: uv.v };

      const A = videoUVToScreen(state.calibAuv.u, state.calibAuv.v, rect, els.flipY.checked);
      const B = videoUVToScreen(state.calibBuv.u, state.calibBuv.v, rect, els.flipY.checked);
      const w = Math.abs(B.x - A.x), h = Math.abs(B.y - A.y);

      if (w < 20 || h < 20) {
        state.calibAuv = null; state.calibBuv = null; state.calibMode = true;
        els.status.textContent = 'calibration too small — try again';
        return;
      }

      state.calibMode = false;
      els.status.textContent = `calibrated: ${w|0}×${h|0}px`;
      els.btnBaseline.disabled = false;
    }
  });
}
