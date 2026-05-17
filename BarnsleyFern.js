class BarnsleyFern extends Fractal {
  constructor() {
    super();
    this.name = "Barnsley Fern";
    this.formulas = ["Classic Fern", "Slender Fern", "Wide Fern", "Symmetric Tree"];
    this.equation = this.formulas[0];
    this.theoreticalDimension = 1.45;
    this.addParameter("points_per_frame", 100, 20000, 5000, true);
    this.addParameter("color_density", 0.1, 5.0, 1.0);
    this.addParameter("color_shift", 0.0, 1.0, 0.0);
    
    this.buffer = null;
    this.lastP = 0;
    this.lastCx = 0; this.lastCy = 0; this.lastZoom = 0;
    this.lastFType = -1;
    this.lastShift = 0; this.lastDensity = 0;
    this.px = 0; this.py = 0;
    
    this.reset();
  }
  
  reset() {
    this.getParam("points_per_frame").value = 5000;
    this.getParam("color_density").value = 1.0;
    this.getParam("color_shift").value = 0.0;
    this.px = 0; this.py = 0;
    if (this.buffer) {
      this.buffer.clear();
    }
  }
  
  defaultView() {
    return [0.25, -2.5, 800 / 11.0];
  }
  
  render(g, cam, palette) {
    let dirty = false;
    if (!this.buffer || this.buffer.width !== g.width || this.buffer.height !== g.height) {
      if (this.buffer) this.buffer.remove();
      this.buffer = createGraphics(g.width, g.height);
      dirty = true;
    }
    
    let curP = this.getParam("points_per_frame").value;
    let curShift = this.getParam("color_shift").value;
    let curDensity = this.getParam("color_density").value;
    
    if (globalDirty || cam.cx !== this.lastCx || cam.cy !== this.lastCy || cam.zoom !== this.lastZoom || this.currentFormula !== this.lastFType || curShift !== this.lastShift || curDensity !== this.lastDensity) {
      dirty = true;
      this.lastCx = cam.cx; this.lastCy = cam.cy; this.lastZoom = cam.zoom; this.lastP = curP;
      this.lastFType = this.currentFormula; this.lastShift = curShift; this.lastDensity = curDensity;
    }
    
    if (dirty) {
      this.buffer.clear();
      this.px = 0; this.py = 0; 
    }
    
    this.buffer.strokeWeight(1.0); 
    
    let pts = curP;
    
    for (let i = 0; i < pts; i++) {
        let r = random(1);
        let nextX=0, nextY=0;
        
        if (this.currentFormula === 0) {
            if (r < 0.01) {
                nextX = 0; nextY = 0.16 * this.py;
            } else if (r < 0.86) {
                nextX = 0.85 * this.px + 0.04 * this.py;
                nextY = -0.04 * this.px + 0.85 * this.py + 1.6;
            } else if (r < 0.93) {
                nextX = 0.2 * this.px - 0.26 * this.py;
                nextY = 0.23 * this.px + 0.22 * this.py + 1.6;
            } else {
                nextX = -0.15 * this.px + 0.28 * this.py;
                nextY = 0.26 * this.px + 0.24 * this.py + 0.44;
            }
        } else if (this.currentFormula === 1) {
            if (r < 0.01) {
                nextX = 0; nextY = 0.16 * this.py;
            } else if (r < 0.86) {
                nextX = 0.75 * this.px + 0.04 * this.py;
                nextY = -0.02 * this.px + 0.95 * this.py + 1.6;
            } else if (r < 0.93) {
                nextX = 0.15 * this.px - 0.2 * this.py;
                nextY = 0.2 * this.px + 0.25 * this.py + 1.6;
            } else {
                nextX = -0.15 * this.px + 0.2 * this.py;
                nextY = 0.2 * this.px + 0.25 * this.py + 0.44;
            }
        } else if (this.currentFormula === 2) {
            if (r < 0.01) {
                nextX = 0; nextY = 0.16 * this.py;
            } else if (r < 0.86) {
                nextX = 0.95 * this.px + 0.04 * this.py;
                nextY = -0.06 * this.px + 0.8 * this.py + 1.6;
            } else if (r < 0.93) {
                nextX = 0.25 * this.px - 0.3 * this.py;
                nextY = 0.25 * this.px + 0.2 * this.py + 1.6;
            } else {
                nextX = -0.2 * this.px + 0.3 * this.py;
                nextY = 0.3 * this.px + 0.2 * this.py + 0.44;
            }
        } else if (this.currentFormula === 3) {
            if (r < 0.1) {
                nextX = 0; nextY = 0.2 * this.py;
            } else if (r < 0.55) {
                nextX = 0.4 * this.px - 0.4 * this.py;
                nextY = 0.4 * this.px + 0.4 * this.py + 2.0;
            } else {
                nextX = -0.4 * this.px + 0.4 * this.py;
                nextY = -0.4 * this.px + 0.4 * this.py + 2.0;
            }
        }
        
        this.px = nextX;
        this.py = nextY;
        
        let sx = cam.worldToScreenX(this.px);
        let sy = cam.worldToScreenY(-this.py); 
        let t = (this.py / 10.0 * curDensity + curShift) % 1.0;
        if (t < 0) t += 1.0;
        
        this.buffer.stroke(palette.sample(t));
        this.buffer.point(sx, sy);
    }
    
    g.image(this.buffer, 0, 0);
  }
}
