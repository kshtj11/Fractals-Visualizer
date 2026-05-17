class JuliaSet extends Fractal {
  constructor() {
    super();
    this.name = "Julia Set";
    this.formulas = ["z → z² + c", "z → z³ + c", "z → z⁴ + c", "Burning Ship", "z → sin(z) + c"];
    this.equation = this.formulas[0];
    this.theoreticalDimension = 2.0;

    this.addParameter("max_iterations", 10, 500, 150, true);
    this.addParameter("escape_radius", 2, 100, 4.0);
    this.addParameter("c_real", -2.0, 2.0, -0.7);
    this.addParameter("c_imag", -2.0, 2.0, 0.27015);
    this.addParameter("color_density", 0.1, 8.0, 2.0);
    this.addParameter("color_shift", 0.0, 1.0, 0.0);
    
    this.buffer = null;
    this.resolution = 8;
    this.lastZoom = 0; this.lastCx = 0; this.lastCy = 0; 
    this.lastMaxIt = 0; this.lastER = 0; this.lastC_re = 0; this.lastC_im = 0;
    this.lastShift = 0; this.lastDensity = 0;
    this.lastFType = -1;
    this.lastPalette = null;
    
    this.reset();
  }
  
  reset() {
    this.getParam("max_iterations").value = 150;
    this.getParam("escape_radius").value = 4.0;
    this.getParam("c_real").value = -0.7;
    this.getParam("c_imag").value = 0.27015;
    this.getParam("color_density").value = 2.0;
    this.getParam("color_shift").value = 0.0;
  }
  
  defaultView() {
    return [0, 0, 800/2.5]; 
  }
  
  render(g, cam, palette) {
    let dirty = false;
    if (!this.buffer || this.buffer.width !== g.width || this.buffer.height !== g.height) {
      if (this.buffer) this.buffer.remove();
      this.buffer = createGraphics(g.width, g.height);
      dirty = true;
    }
    
    let cRe = this.getParam("c_real");
    let cIm = this.getParam("c_imag");
    
    if (keyIsPressed && keyCode === SHIFT && !hideUI) {
      let cvsX = 280;
      let cvsY = 60;
      if (mouseX >= cvsX && mouseX <= width && mouseY >= cvsY && mouseY <= height - 60) {
        cRe.value = cam.screenToWorldX(mouseX - cvsX);
        cIm.value = cam.screenToWorldY(mouseY - cvsY);
      }
    }
    
    let curMaxIt = this.getParam("max_iterations").value;
    let curER = this.getParam("escape_radius").value;
    let curShift = this.getParam("color_shift").value;
    let curDensity = this.getParam("color_density").value;
    
    if(globalDirty || cam.zoom !== this.lastZoom || cam.cx !== this.lastCx || cam.cy !== this.lastCy || 
       curMaxIt !== this.lastMaxIt || curER !== this.lastER || palette !== this.lastPalette ||
       cRe.value !== this.lastC_re || cIm.value !== this.lastC_im || 
       this.currentFormula !== this.lastFType || curShift !== this.lastShift || curDensity !== this.lastDensity) {
       
       dirty = true;
       this.lastZoom = cam.zoom; this.lastCx = cam.cx; this.lastCy = cam.cy; 
       this.lastMaxIt = curMaxIt; this.lastER = curER; this.lastPalette = palette;
       this.lastC_re = cRe.value; this.lastC_im = cIm.value;
       this.lastFType = this.currentFormula; this.lastShift = curShift; this.lastDensity = curDensity;
    }
    
    if (dirty) this.resolution = 8;
    
    if (this.resolution >= 1) {
      this.buffer.noStroke();
      let cr = cRe.value;
      let ci = cIm.value;
      let limitSq = curER * curER;
      
      for(let y=0; y<this.buffer.height; y+=this.resolution) {
        for(let x=0; x<this.buffer.width; x+=this.resolution) {
          let zx = cam.screenToWorldX(x + this.resolution/2.0);
          let zy = cam.screenToWorldY(y + this.resolution/2.0);
          
          let i=0;
          while(zx*zx + zy*zy < limitSq && i < curMaxIt) {
            let nextX = 0, nextY = 0;
            if (this.currentFormula === 0) {
                nextX = zx*zx - zy*zy + cr;
                nextY = 2.0*zx*zy + ci;
            } else if (this.currentFormula === 1) {
                nextX = zx*zx*zx - 3*zx*zy*zy + cr;
                nextY = 3*zx*zx*zy - zy*zy*zy + ci;
            } else if (this.currentFormula === 2) {
                let zx2 = zx*zx;
                let zy2 = zy*zy;
                nextX = zx2*zx2 - 6*zx2*zy2 + zy2*zy2 + cr;
                nextY = 4*zx*zx2*zy - 4*zx*zy2*zy + ci;
            } else if (this.currentFormula === 3) {
                let absX = abs(zx);
                let absY = abs(zy);
                nextX = absX*absX - absY*absY + cr;
                nextY = 2.0*absX*absY + ci;
            } else if (this.currentFormula === 4) {
                nextX = sin(zx) * Math.cosh(zy) + cr;
                nextY = cos(zx) * Math.sinh(zy) + ci;
            }
            zx = nextX;
            zy = nextY;
            i++;
          }
          
          if(i >= curMaxIt) {
            this.buffer.fill(Theme.BG);
          } else {
             let distSq = zx*zx + zy*zy;
             let smooth = i + 1.0 - (log(log(sqrt(distSq))) / log(2.0));
             let t = (smooth / curMaxIt * curDensity + curShift) % 1.0;
             if (t < 0) t += 1.0;
             this.buffer.fill(palette.sample(t));
          }
          this.buffer.rect(x, y, this.resolution, this.resolution);
        }
      }
      if(this.resolution > 1) this.resolution /= 2;
    }
    
    g.image(this.buffer, 0, 0);
  }
}
