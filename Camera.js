class Camera {
  constructor(w, h) {
    this.cx = 0;
    this.cy = 0;
    this.zoom = 1;
    this.width = w; 
    this.height = h;
  }
  
  setView(cx, cy, zoom) {
    this.cx = cx; 
    this.cy = cy; 
    this.zoom = zoom;
  }
  
  pan(dxScr, dyScr) {
    this.cx -= dxScr / this.zoom;
    this.cy -= dyScr / this.zoom;
  }
  
  zoomAt(focusXScr, focusYScr, factor) {
    let wx = this.screenToWorldX(focusXScr);
    let wy = this.screenToWorldY(focusYScr);
    
    this.zoom *= factor;
    
    let newFocusXScr = this.worldToScreenX(wx);
    let newFocusYScr = this.worldToScreenY(wy);
    
    this.cx += (focusXScr - newFocusXScr) / this.zoom;
    this.cy += (focusYScr - newFocusYScr) / this.zoom;
  }
  
  screenToWorldX(x) { return this.cx + (x - this.width/2) / this.zoom; }
  screenToWorldY(y) { return this.cy + (y - this.height/2) / this.zoom; }
  
  worldToScreenX(wx) { return this.width/2 + (wx - this.cx) * this.zoom; }
  worldToScreenY(wy) { return this.height/2 + (wy - this.cy) * this.zoom; }
}
