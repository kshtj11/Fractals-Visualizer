class SierpinskiTriangle extends Fractal {
  constructor() {
    super();
    this.name = "Sierpinski Triangle";
    this.formulas = ["Triangle (3Pts)", "Square (4Pts)", "Pentagon (5Pts)", "Hexagon (6Pts)", "Heptagon (7Pts)"];
    this.equation = this.formulas[0];
    this.theoreticalDimension = Math.log(3) / Math.log(2); 
    this.addParameter("points_per_frame", 100, 10000, 2000, true);
    this.addParameter("jump_ratio", 0.1, 0.9, 0.5);
    
    this.buffer = null;
    this.lastP = 0; this.lastJ = 0;
    this.lastCx = 0; this.lastCy = 0; this.lastZoom = 0;
    this.lastFType = -1;
    this.px = 0; this.py = 0; 
    
    this.reset();
  }
  
  reset() {
    this.getParam("points_per_frame").value = 2000;
    this.getParam("jump_ratio").value = 0.5;
    if (this.buffer) {
      this.buffer.clear();
    }
  }
  
  defaultView() {
    return [0, 0, 800 / 2.5];
  }
  
  render(g, cam, palette) {
    let dirty = false;
    if (!this.buffer || this.buffer.width !== g.width || this.buffer.height !== g.height) {
      if (this.buffer) this.buffer.remove();
      this.buffer = createGraphics(g.width, g.height);
      dirty = true;
    }
    
    let curP = this.getParam("points_per_frame").value;
    let curJ = this.getParam("jump_ratio").value;
    
    if (globalDirty || cam.cx !== this.lastCx || cam.cy !== this.lastCy || cam.zoom !== this.lastZoom || curJ !== this.lastJ || this.currentFormula !== this.lastFType) {
      dirty = true;
      this.lastCx = cam.cx; this.lastCy = cam.cy; this.lastZoom = cam.zoom; this.lastJ = curJ; this.lastP = curP;
      this.lastFType = this.currentFormula;
    }
    
    if (dirty) {
      this.buffer.clear();
      this.px = 0; this.py = 0; 
    }
    
    this.buffer.strokeWeight(2); 
    
    let pts = curP;
    let sides = this.currentFormula + 3;
    let vx = new Array(sides);
    let vy = new Array(sides);
    let TWO_PI_VAL = Math.PI * 2.0;
    for (let v = 0; v < sides; v++) {
        let a = -Math.PI / 2 + v * TWO_PI_VAL / sides;
        vx[v] = Math.cos(a);
        vy[v] = Math.sin(a);
    }
    
    this.buffer.loadPixels();
    let pixels32 = new Uint32Array(this.buffer.pixels.buffer);
    let w = this.buffer.width;
    let h = this.buffer.height;
    
    let lut32 = new Uint32Array(1000);
    for (let j = 0; j < 1000; j++) {
      let c = palette.sample(j / 1000.0);
      let r = c.levels[0], g = c.levels[1], b = c.levels[2];
      lut32[j] = 0xFF000000 | (b << 16) | (g << 8) | r;
    }
    
    let halfW = w * 0.5;
    let halfH = h * 0.5;
    let zoom = cam.zoom;
    let cx = cam.cx;
    let cy = cam.cy;
    
    for (let i = 0; i < pts; i++) {
        let r = (Math.random() * sides) | 0;
        this.px = this.px + (vx[r] - this.px) * curJ;
        this.py = this.py + (vy[r] - this.py) * curJ;
        
        let ix = ((this.px - cx) * zoom + halfW) | 0;
        let iy = ((this.py - cy) * zoom + halfH) | 0;
        
        if (ix >= 0 && ix < w && iy >= 0 && iy < h) {
          let angle = Math.atan2(this.py, this.px) + Math.PI;
          let t = (angle / TWO_PI_VAL) % 1.0;
          if (t < 0) t += 1.0;
          let lutIdx = (t * 999) | 0;
          if (lutIdx < 0) lutIdx = 0;
          else if (lutIdx > 999) lutIdx = 999;
          
          pixels32[iy * w + ix] = lut32[lutIdx];
        }
    }
    this.buffer.updatePixels();
    
    g.image(this.buffer, 0, 0);
  }
}
