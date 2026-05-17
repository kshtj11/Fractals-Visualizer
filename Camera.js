class Camera {
  constructor(w, h) {
    this.cx = 0;
    this.cy = 0;
    this.zoom = 1;
    this.targetCx = 0;
    this.targetCy = 0;
    this.targetZoom = 1;
    this.width = w; 
    this.height = h;
  }
  
  update() {
    if (Math.abs(this.targetCx - this.cx) > 0.000000000001) this.cx += (this.targetCx - this.cx) * 0.15;
    if (Math.abs(this.targetCy - this.cy) > 0.000000000001) this.cy += (this.targetCy - this.cy) * 0.15;
    
    let logZ = Math.log(this.zoom);
    let logT = Math.log(this.targetZoom);
    if (Math.abs(logZ - logT) > 0.00001) {
      logZ += (logT - logZ) * 0.15;
      this.zoom = Math.exp(logZ);
    } else {
      this.cx = this.targetCx;
      this.cy = this.targetCy;
      this.zoom = this.targetZoom;
    }
  }
  
  setView(cx, cy, zoom) {
    this.cx = cx; 
    this.cy = cy; 
    this.zoom = zoom;
    this.targetCx = cx;
    this.targetCy = cy;
    this.targetZoom = zoom;
  }
  
  pan(dxScr, dyScr) {
    this.targetCx -= dxScr / this.targetZoom;
    this.targetCy -= dyScr / this.targetZoom;
  }
  
  zoomAt(focusXScr, focusYScr, factor) {
    let wx = this.targetCx + (focusXScr - this.width/2) / this.targetZoom;
    let wy = this.targetCy + (focusYScr - this.height/2) / this.targetZoom;
    
    this.targetZoom *= factor;
    
    this.targetCx = wx - (focusXScr - this.width/2) / this.targetZoom;
    this.targetCy = wy - (focusYScr - this.height/2) / this.targetZoom;
  }
  
  screenToWorldX(x) { return this.cx + (x - this.width/2) / this.zoom; }
  screenToWorldY(y) { return this.cy + (y - this.height/2) / this.zoom; }
  
  worldToScreenX(wx) { return this.width/2 + (wx - this.cx) * this.zoom; }
  worldToScreenY(wy) { return this.height/2 + (wy - this.cy) * this.zoom; }
}
