class CantorSet extends Fractal {
  constructor() {
    super();
    this.name = "Cantor Set";
    this.equation = "Recursive Line Removal";
    this.theoreticalDimension = Math.log(2) / Math.log(3);
    this.addParameter("iterations", 1, 8, 5, true);
    this.addParameter("gap_ratio", 0.1, 0.6, 0.3333);
    this.reset();
  }
  
  reset() {
    this.getParam("iterations").value = 5;
    this.getParam("gap_ratio").value = 0.3333;
  }
  
  defaultView() {
    return [0, 0, 800 / 2.5]; 
  }
  
  render(g, cam, palette) {
    let iters = this.getParam("iterations").value;
    let gap = this.getParam("gap_ratio").value;
    
    g.push();
    g.translate(cam.width/2.0, cam.height/2.0);
    g.scale(cam.zoom);
    g.translate(-cam.cx, -cam.cy);
    
    g.noStroke();
    
    let startX = -1.0;
    let length = 2.0;
    let yStart = -0.5;
    let yStep = 1.0 / iters; 
    
    this.drawCantor(g, startX, yStart, length, yStep, iters, gap, palette);
    
    g.pop();
  }
  
  drawCantor(g, x, y, len, yStep, n, gapRatio, pal) {
    if (n === 0) return;
    
    let maxIters = this.getParam("iterations").value;
    let colVal = 1.0 - (n / maxIters); 
    g.fill(pal.sample(colVal));
    
    let h = yStep * 0.6; 
    g.rect(x, y, len, h);
    
    let sideLen = len * (1.0 - gapRatio) / 2.0;
    
    this.drawCantor(g, x, y + yStep, sideLen, yStep, n-1, gapRatio, pal);
    this.drawCantor(g, x + len - sideLen, y + yStep, sideLen, yStep, n-1, gapRatio, pal);
  }
}
