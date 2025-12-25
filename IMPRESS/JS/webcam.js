export async function startWebcam(els){
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { width: { ideal: 1280 }, height: { ideal: 720 } },
    audio: false
  });
  els.video.srcObject = stream;

  await new Promise((resolve) => {
    const done = () => (els.video.videoWidth > 0 && els.video.videoHeight > 0);
    const onLoaded = () => { if (done()) resolve(); };
    els.video.addEventListener('loadedmetadata', onLoaded, { once: true });
    const t = setInterval(() => { if (done()) { clearInterval(t); resolve(); } }, 50);
  });

  return stream;
}
