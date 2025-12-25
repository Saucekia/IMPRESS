export const DPR = Math.max(1, window.devicePixelRatio || 1);

export function sizeCanvasToCSS(canvas){
  const r = canvas.getBoundingClientRect();
  const w = Math.max(1, Math.floor(r.width  * DPR));
  const h = Math.max(1, Math.floor(r.height * DPR));
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
}

export function getDisplayRect(cw, ch, vw, vh) {
  const canvasAR = cw / ch;
  const videoAR  = vw / vh;
  if (videoAR > canvasAR) {
    const w = cw, h = Math.round(cw / videoAR);
    return { x:0, y:Math.round((ch - h)/2), w, h };
  } else {
    const h = ch, w = Math.round(ch * videoAR);
    return { x:Math.round((cw - w)/2), y:0, w, h };
  }
}

export function screenToVideoUV_clientCoords(clientX, clientY, canvas, rectCSS, flipY=false) {
  const r = canvas.getBoundingClientRect();
  const cx = (clientX - r.left) * DPR;
  const cy = (clientY - r.top)  * DPR;
  const {x, y, w, h} = rectCSS;
  if (cx < x || cx > x + w || cy < y || cy > y + h) return null;
  const u = (cx - x) / w;
  let v  = (cy - y) / h;
  if (flipY) v = 1 - v;
  return { u, v, cx, cy };
}

export function videoUVToScreen(u, v, rect, flipY=false) {
  const vv = flipY ? (1 - v) : v;
  return { x: rect.x + u * rect.w, y: rect.y + vv * rect.h };
}
