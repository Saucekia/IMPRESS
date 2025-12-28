import * as THREE from "three";
import { STLExporter } from "https://cdn.jsdelivr.net/npm/three@0.159.0/examples/jsm/exporters/STLExporter.js";
import { BASE_THICKNESS, DIVS_X, DIVS_Z } from './config.js';
import { updateSurfaceFromAmps } from './surface.js';

export function wireSTLExport(els, state, three){
  const { geom, mesh } = three;

  els.btnStl.addEventListener('click', () => {
    //check geometry is current
    state.needSurfaceUpdate = true;
    updateSurfaceFromAmps(geom, els, state);
    geom.computeVertexNormals();
    mesh.updateMatrixWorld(true);

    //world-space geometry
    const srcGeom = mesh.geometry.clone();
    srcGeom.applyMatrix4(mesh.matrixWorld);

    const pos = srcGeom.attributes.position;
    const topCount = pos.count;
    const expected = (DIVS_X + 1) * (DIVS_Z + 1);

    if (topCount !== expected) {
      alert(`Unexpected vertex count (${topCount} != ${expected}). Cannot build solid.`);
      return;
    }

    // bottom plane
    let minY = Infinity;
    for (let i = 0; i < topCount; i++){
      const y = pos.getY(i);
      if (y < minY) minY = y;
    }
    const bottomY = minY - BASE_THICKNESS;

    const vertices = [];
    const indices = [];

    // top verts
    for (let i = 0; i < topCount; i++){
      vertices.push(pos.getX(i), pos.getY(i), pos.getZ(i));
    }
    // bottom verts
    for (let i = 0; i < topCount; i++){
      vertices.push(pos.getX(i), bottomY, pos.getZ(i));
    }

    const gw = DIVS_X;
    const gh = DIVS_Z;
    const stride = gw + 1;
    const offset = topCount;

    //top faces
    for (let j=0; j<gh; j++){
      for (let i=0; i<gw; i++){
        const a = i     + j     * stride;
        const b = i + 1 + j     * stride;
        const c = i + 1 + (j+1) * stride;
        const d = i     + (j+1) * stride;
        indices.push(a, b, d);
        indices.push(b, c, d);
      }
    }

    //bottom faces (reverse)
    for (let j=0; j<gh; j++){
      for (let i=0; i<gw; i++){
        const a = offset + i     + j     * stride;
        const b = offset + i + 1 + j     * stride;
        const c = offset + i + 1 + (j+1) * stride;
        const d = offset + i     + (j+1) * stride;
        indices.push(a, d, b);
        indices.push(b, d, c);
      }
    }

    //side walls
    //front edge (j=0)
    for (let i=0; i<gw; i++){
      const tA=i, tB=i+1;
      const bA=offset+tA, bB=offset+tB;
      indices.push(tA, bA, bB);
      indices.push(tA, bB, tB);
    }
    //back edge (j=gh)
    for (let i=0; i<gw; i++){
      const tA=gh*stride+i, tB=gh*stride+i+1;
      const bA=offset+tA, bB=offset+tB;
      indices.push(tA, bB, bA);
      indices.push(tA, tB, bB);
    }
    //left edge (i=0)
    for (let j=0; j<gh; j++){
      const tA=j*stride, tB=(j+1)*stride;
      const bA=offset+tA, bB=offset+tB;
      indices.push(tA, bA, bB);
      indices.push(tA, bB, tB);
    }
    //right edge (i=gw)
    for (let j=0; j<gh; j++){
      const tA=j*stride+gw, tB=(j+1)*stride+gw;
      const bA=offset+tA, bB=offset+tB;
      indices.push(tA, bB, bA);
      indices.push(tA, tB, bB);
    }

    const solidGeom = new THREE.BufferGeometry();
    solidGeom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    solidGeom.setIndex(indices);
    solidGeom.computeVertexNormals();

    const tmpMesh = new THREE.Mesh(solidGeom, new THREE.MeshStandardMaterial());

    const exporter = new STLExporter();
    const arrayBuffer = exporter.parse(tmpMesh, { binary:true });
    const blob = new Blob([arrayBuffer], { type: 'model/stl' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `membrane_solid_${new Date().toISOString().replace(/[:.]/g,'-')}.stl`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  });
}
