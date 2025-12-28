import { GRID_W, GRID_H, SIZE_X, SIZE_Z, CELL_X, CELL_Z } from './config.js';

export function createState(){
  const ampsManual   = Array.from({length:GRID_H}, () => Array(GRID_W).fill(0));
  const ampsCamera   = Array.from({length:GRID_H}, () => Array(GRID_W).fill(0));
  const ampsBias     = Array.from({length:GRID_H}, () => Array(GRID_W).fill(0));
  const ampsSmoothed = Array.from({length:GRID_H}, () => Array(GRID_W).fill(0));
  const cameraBaselineArea = Array.from({length:GRID_H}, () => Array(GRID_W).fill(0));

  const centers = [];
  const startX = -SIZE_X/2, startZ = -SIZE_Z/2;
  for (let j=0; j<GRID_H; j++){
    for (let i=0; i<GRID_W; i++){
      centers.push({ x: startX + i*CELL_X, z: startZ + j*CELL_Z, ix:i, iy:j });
    }
  }

  return {
    // timing
    lastTime: performance.now(),
    needSurfaceUpdate: true,

    // calibration
    calibMode: false,
    calibAuv: null,
    calibBuv: null,

    // grids
    ampsManual, ampsCamera, ampsBias, ampsSmoothed,
    cameraBaselineArea,
    centers,

    // shared scratch canvas
    canvasPool: {
      _c: null,
      get(w,h){
        if(!this._c) this._c = document.createElement('canvas');
        const c = this._c;
        if(c.width!==w||c.height!==h){ c.width=w; c.height=h; }
        return c;
      }
    }
  };
}
