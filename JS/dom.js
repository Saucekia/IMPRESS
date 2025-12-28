export function getEls(){
    return {
      video: document.getElementById('video'),
      cam: document.getElementById('cam'),
      status: document.getElementById('status'),
      fps: document.getElementById('fps'),
  
      driveCamera: document.getElementById('driveCamera'),
      showCamera: document.getElementById('showCamera'),
      btnResetView: document.getElementById('btnResetView'),
      btnStl: document.getElementById('btnStl'),
  
      cameraWrap: document.getElementById('cameraWrap'),
      btnStart: document.getElementById('btnStart'),
      btnCalib: document.getElementById('btnCalib'),
      btnBaseline: document.getElementById('btnBaseline'),
      flipY: document.getElementById('flipY'),
      showMask: document.getElementById('showMask'),
      showBoxes: document.getElementById('showBoxes'),
      rawAreaMode: document.getElementById('rawAreaMode'),
  
      hMin: document.getElementById('hMin'),
      hMax: document.getElementById('hMax'),
      sMin: document.getElementById('sMin'),
      vMin: document.getElementById('vMin'),
      minArea: document.getElementById('minArea'),
      procW: document.getElementById('procW'),
  
      sens: document.getElementById('sens'),
      sensVal: document.getElementById('sensVal'),
  
      ema: document.getElementById('ema'),
      gain: document.getElementById('gain'),
      gainVal: document.getElementById('gainVal'),
      sigma: document.getElementById('sigma'),
      sigmaVal: document.getElementById('sigmaVal'),
      pause: document.getElementById('pause'),
      btnClear: document.getElementById('btnClear'),
  
      modeRadios: [...document.querySelectorAll('input[name="mode"]')],
      brushStrength: document.getElementById('brushStrength'),
      brushSize: document.getElementById('brushSize'),
      paintTargetHint: document.getElementById('paintTargetHint'),
      btnClearManual: document.getElementById('btnClearManual'),
      btnClearBias: document.getElementById('btnClearBias'),
  
      mount: document.getElementById('mount'),
      pad: document.getElementById('pad'),
    };
  }
  