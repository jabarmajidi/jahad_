function openLayerCanvas() {
    const layerOffCanvas = document.getElementById("layersOffCanvas");
    const layersCanvasHeader = document.getElementById('layersCanvasHeader');
    layersCanvasHeader.innerText = 'لایه های موجود';
    const bsCanvas = bootstrap.Offcanvas.getInstance(layerOffCanvas) || new bootstrap.Offcanvas(layerOffCanvas);
    bsCanvas.show();
}