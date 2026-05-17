class KochSnowflake extends Fractal {
  constructor() {
    super();
    this.name = "Koch Snowflake";
    this.formulas = ["Snowflake View", "Anti-Snowflake View"];
    this.equation = this.formulas[0];
    this.theoreticalDimension = Math.log(4) / Math.log(3);
    this.addParameter("iterations", 0, 10, 4, true); 
    this.addParameter("bump_angle", 0, 360, 60); 
    this.addParameter("color_density", 0.1, 5.0, 1.0);
    this.addParameter("color_shift", 0.0, 1.0, 0.0);
    
    this.buffer = null;
    this.lastZoom = 0; this.lastCx = 0; this.lastCy = 0; 
    this.lastIters = 0; this.lastAngle = 0; this.lastShift = 0; this.lastDensity = 0;
    this.lastFType = -1;
    this.lastPal = null;
    
    this.reset();
  }
  
  reset() {
    this.getParam("iterations").value = 4;
    this.getParam("bump_angle").value = 60;
    this.getParam("color_density").value = 1.0;
    this.getParam("color_shift").value = 0.0;
  }
  
  defaultView() {
    return [0, 0, 800 / 3.0]; 
  }
  
  render(g, cam, palette) {
    let dirty = false;
    if (!this.buffer || this.buffer.width !== g.width || this.buffer.height !== g.height) {
      if (this.buffer) this.buffer.remove();
      this.buffer = createGraphics(g.width, g.height);
      dirty = true;
    }
    
    let curIters = this.getParam("iterations").value;
    let curAngle = this.getParam("bump_angle").value;
    let curDensity = this.getParam("color_density").value;
    let curShift = this.getParam("color_shift").value;
    
    if (globalDirty || cam.zoom !== this.lastZoom || cam.cx !== this.lastCx || cam.cy !== this.lastCy || 
        curIters !== this.lastIters || curAngle !== this.lastAngle || this.currentFormula !== this.lastFType || 
        curDensity !== this.lastDensity || curShift !== this.lastShift || palette !== this.lastPal) {
        
        dirty = true;
        this.lastZoom = cam.zoom; this.lastCx = cam.cx; this.lastCy = cam.cy; this.lastIters = curIters;
        this.lastAngle = curAngle; this.lastFType = this.currentFormula; 
        this.lastDensity = curDensity; this.lastShift = curShift; this.lastPal = palette;
    }
    
    if (dirty) {
        this.buffer.clear();
        
        this.buffer.push();
        this.buffer.translate(cam.width/2.0, cam.height/2.0);
        this.buffer.scale(cam.zoom);
        this.buffer.translate(-cam.cx, -cam.cy);
        
        this.buffer.strokeWeight(1.5 / cam.zoom); 
        this.buffer.noFill();
        
        let theta = radians(curAngle);
        if (this.currentFormula === 1) theta = -theta; 
        
        let r = 1.0; 
        let x1 = 0, y1 = -r;
        let x2 = r * cos(PI/6), y2 = r * sin(PI/6);
        let x3 = -r * cos(PI/6), y3 = r * sin(PI/6);
        
        let n = Math.floor(curIters);
        this.drawKoch(this.buffer, x1, y1, x2, y2, n, theta, palette, curDensity, curShift);
        this.drawKoch(this.buffer, x2, y2, x3, y3, n, theta, palette, curDensity, curShift);
        this.drawKoch(this.buffer, x3, y3, x1, y1, n, theta, palette, curDensity, curShift);
        
        this.buffer.pop();
    }
    
    g.image(this.buffer, 0, 0);
  }
  
  drawKoch(g, x1, y1, x2, y2, n, theta, pal, den, shift) {
    if (n === 0) {
      let midX = (x1 + x2) * 0.5;
      let midY = (y1 + y2) * 0.5;
      let distance = dist(0, 0, midX, midY); 
      
      let t = (distance * den + shift) % 1.0;
      if (t < 0) t += 1.0;
      g.stroke(pal.sample(t));
      
      g.line(x1, y1, x2, y2);
      return;
    }
    
    let dx = x2 - x1;
    let dy = y2 - y1;
    
    let x3 = x1 + dx / 3.0;
    let y3 = y1 + dy / 3.0;
    let x4 = x1 + 2.0 * dx / 3.0;
    let y4 = y1 + 2.0 * dy / 3.0;
    
    let d = dist(x3, y3, x4, y4);
    let midX = (x3 + x4) / 2.0;
    let midY = (y3 + y4) / 2.0;
    
    let nx = -dy / 3.0; 
    let ny = dx / 3.0;
    let len = dist(0, 0, nx, ny);
    if (len > 0) { nx /= len; ny /= len; }
    
    let H = (d / 2.0) * tan(theta);
    let p5x = midX + nx * H;
    let p5y = midY + ny * H;
    
    this.drawKoch(g, x1, y1, x3, y3, n-1, theta, pal, den, shift);
    this.drawKoch(g, x3, y3, p5x, p5y, n-1, theta, pal, den, shift);
    this.drawKoch(g, p5x, p5y, x4, y4, n-1, theta, pal, den, shift);
    this.drawKoch(g, x4, y4, x2, y2, n-1, theta, pal, den, shift);
  }
}
