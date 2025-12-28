import { CELL_X, CELL_Z } from './config.js';

export function updateSurfaceFromAmps(geom, els, state){
  const pos = geom.attributes.position;
  const gain = parseFloat(els.gain.value)/100;
  const sigmaFactor = parseFloat(els.sigma.value)/100;

  const sigmaX = Math.max(1e-6, sigmaFactor * CELL_X);
  const sigmaZ = Math.max(1e-6, sigmaFactor * CELL_Z);
  const denomX = 2*sigmaX*sigmaX;
  const denomZ = 2*sigmaZ*sigmaZ;

  for (let i=0; i<pos.count; i++){
    const x = pos.getX(i);
    const z = pos.getZ(i);
    let y = 0;

    for (const c of state.centers){
      const a = state.ampsSmoothed[c.iy][c.ix];
      if (a <= 0) continue;
      const dx = x - c.x, dz = z - c.z;
      y += a * Math.exp(-(dx*dx)/denomX - (dz*dz)/denomZ);
    }

    pos.setY(i, gain * y);
  }

  pos.needsUpdate = true;
  geom.computeVertexNormals();
}
