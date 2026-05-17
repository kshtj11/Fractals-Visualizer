class NewtonFractal extends Fractal {
  constructor() {
    super();
    this.name = "Newton Fractal";
    this.formulas = ["z³ - c", "z⁴ - c", "z⁵ - c", "z⁶ - c"];
    this.equation = this.formulas[0];
    this.theoreticalDimension = 2.0;

    this.addParameter("max_iterations", 10, 150, 40, true);
    this.addParameter("tolerance", 0.001, 0.1, 0.01);
    this.addParameter("relaxation", 0.1, 2.0, 1.0);
    this.addParameter("c_real", -2.0, 2.0, 1.0);
    this.addParameter("c_imag", -2.0, 2.0, 0.0);
    this.addParameter("color_density", 0.1, 5.0, 1.0);
    this.addParameter("color_shift", 0.0, 1.0, 0.0);
    
    this.buffer = null;
    this.resolution = 8;
    this.lastZoom = 0; this.lastCx = 0; this.lastCy = 0; 
    this.lastMaxIt = 0; this.lastTolerance = 0; this.lastRelaxation = 0;
    this.lastC_re = 0; this.lastC_im = 0;
    this.lastShift = 0; this.lastDensity = 0;
    this.lastFType = -1;
    this.lastPalette = null;
    
    this.reset();
  }
  
  reset() {
    this.getParam("max_iterations").value = 40;
    this.getParam("tolerance").value = 0.01;
    this.getParam("relaxation").value = 1.0;
    this.getParam("c_real").value = 1.0;
    this.getParam("c_imag").value = 0.0;
    this.getParam("color_density").value = 1.0;
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
    let curTol = this.getParam("tolerance").value;
    let curRelax = this.getParam("relaxation").value;
    let curShift = this.getParam("color_shift").value;
    let curDensity = this.getParam("color_density").value;
    
    if(globalDirty || cam.zoom !== this.lastZoom || cam.cx !== this.lastCx || cam.cy !== this.lastCy || 
       curMaxIt !== this.lastMaxIt || curTol !== this.lastTolerance || curRelax !== this.lastRelaxation || palette !== this.lastPalette ||
       cRe.value !== this.lastC_re || cIm.value !== this.lastC_im || 
       this.currentFormula !== this.lastFType || curShift !== this.lastShift || curDensity !== this.lastDensity) {
       
       dirty = true;
       this.lastZoom = cam.zoom; this.lastCx = cam.cx; this.lastCy = cam.cy; 
       this.lastMaxIt = curMaxIt; this.lastTolerance = curTol; this.lastRelaxation = curRelax; this.lastPalette = palette;
       this.lastC_re = cRe.value; this.lastC_im = cIm.value;
       this.lastFType = this.currentFormula; this.lastShift = curShift; this.lastDensity = curDensity;
    }
    
    if (dirty) this.resolution = 8;
    
    if (this.resolution >= 1) {
      this.buffer.noStroke();
      let cr = cRe.value;
      let ci = cIm.value;
      let degree = this.currentFormula + 3; // z3 to z6 mapping
      
      for(let y=0; y<this.buffer.height; y+=this.resolution) {
        for(let x=0; x<this.buffer.width; x+=this.resolution) {
          let zx = cam.screenToWorldX(x + this.resolution/2.0);
          let zy = cam.screenToWorldY(y + this.resolution/2.0);
          
          if (zx === 0 && zy === 0) zx = 0.0001; 
          
          let i=0;
          let converged = false;
          
          while(i < curMaxIt) {
            let tr = 1.0, ti = 0.0;
            for(let k=0; k<degree-1; k++) {
                let ntr = tr*zx - ti*zy;
                let nti = tr*zy + ti*zx;
                tr = ntr; ti = nti;
            }
            
            let modSq = tr*tr + ti*ti;
            if (modSq < 0.00000001) break; 
            
            let inv_tr = tr / modSq;
            let inv_ti = -ti / modSq;
            
            let term_r = cr * inv_tr - ci * inv_ti;
            let term_i = cr * inv_ti + ci * inv_tr;
            
            let coef1 = 1.0 - (curRelax / degree);
            let coef2 = curRelax / degree;
            
            let nextX = coef1 * zx + coef2 * term_r;
            let nextY = coef1 * zy + coef2 * term_i;
            
            if (abs(nextX - zx) < curTol && abs(nextY - zy) < curTol) {
                converged = true;
                break;
            }
            
            zx = nextX;
            zy = nextY;
            i++;
          }
          
          if (!converged) {
             this.buffer.fill(Theme.TEXT_COLOR); 
          } else {
             let angle = atan2(zy, zx); 
             let baseT = (angle + PI) / TWO_PI;
             let t = (baseT * curDensity + curShift + i / curMaxIt) % 1.0;
             if (t < 0) t += 1.0;
             
             let rootColor = palette.sample(t);
             this.buffer.fill(rootColor);
          }
          this.buffer.rect(x, y, this.resolution, this.resolution);
        }
      }
      if(this.resolution > 1) this.resolution /= 2;
    }
    
    g.image(this.buffer, 0, 0);
  }
}
