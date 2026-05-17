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
    for (let v = 0; v < sides; v++) {
        let a = -PI/2 + v * TWO_PI / sides;
        vx[v] = cos(a);
        vy[v] = sin(a);
    }
    
    for (let i=0; i<pts; i++) {
        let r = Math.floor(random(sides));
        this.px = lerp(this.px, vx[r], curJ);
        this.py = lerp(this.py, vy[r], curJ);
        
        let sx = cam.worldToScreenX(this.px);
        let sy = cam.worldToScreenY(this.py);
        
        let angle = atan2(this.py, this.px) + PI;
        this.buffer.stroke(palette.sample(angle / TWO_PI));
        this.buffer.point(sx, sy);
    }
    
    g.image(this.buffer, 0, 0);
  }
}
