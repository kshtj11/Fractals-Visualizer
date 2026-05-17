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
    this.resolution = 0;
    
    this.renderedCx = 0; this.renderedCy = 0; this.renderedZoom = 0;
    this.renderedMaxIt = 0; this.renderedTolerance = 0; this.renderedRelaxation = 0;
    this.renderedC_re = 0; this.renderedC_im = 0;
    this.renderedShift = 0; this.renderedDensity = 0;
    this.renderedFType = -1; this.renderedPalette = null;
    
    this.lastFrameCx = 0; this.lastFrameCy = 0; this.lastFrameZoom = 0;
    
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
    if (!this.buffer || this.buffer.width !== g.width || this.buffer.height !== g.height) {
      if (this.buffer) this.buffer.remove();
      this.buffer = createGraphics(g.width, g.height);
      this.buffer.pixelDensity(1); 
      this.renderedZoom = 0;
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
    
    let paramsChanged = (
       curMaxIt !== this.renderedMaxIt || curTol !== this.renderedTolerance || curRelax !== this.renderedRelaxation || palette !== this.renderedPalette ||
       cRe.value !== this.renderedC_re || cIm.value !== this.renderedC_im || 
       this.currentFormula !== this.renderedFType || curShift !== this.renderedShift || curDensity !== this.renderedDensity || globalDirty
    );

    let isRender = (typeof animator !== 'undefined' && animator.isRendering);
    let camChanged = (cam.cx !== this.renderedCx || cam.cy !== this.renderedCy || cam.zoom !== this.renderedZoom);
    let isMoving = !isRender && (cam.cx !== this.lastFrameCx || cam.cy !== this.lastFrameCy || cam.zoom !== this.lastFrameZoom);
    
    this.lastFrameCx = cam.cx; this.lastFrameCy = cam.cy; this.lastFrameZoom = cam.zoom;
    
    if (paramsChanged || (camChanged && !isMoving) || isRender) {
       this.resolution = isRender ? 1 : 4;
       this.renderedCx = cam.cx; this.renderedCy = cam.cy; this.renderedZoom = cam.zoom;
       this.renderedMaxIt = curMaxIt; this.renderedTolerance = curTol; this.renderedRelaxation = curRelax; this.renderedPalette = palette;
       this.renderedC_re = cRe.value; this.renderedC_im = cIm.value;
       this.renderedFType = this.currentFormula; this.renderedShift = curShift; this.renderedDensity = curDensity;
    }
    
    if (this.resolution >= 1 && !isMoving) {
      this.buffer.loadPixels();
      
      let lut = new Array(1000);
      for (let j = 0; j < 1000; j++) {
        let c = palette.sample(j / 1000.0);
        lut[j] = [c.levels[0], c.levels[1], c.levels[2]];
      }
      
      let textColR = 43, textColG = 45, textColB = 66; 
      let w = this.buffer.width;
      let h = this.buffer.height;
      let res = this.resolution;

      let cr = this.renderedC_re;
      let ci = this.renderedC_im;
      let degree = this.renderedFType + 3; 
      
      for(let y=0; y<h; y+=res) {
        for(let x=0; x<w; x+=res) {
          let zx = this.renderedCx + (x + res/2.0 - w/2) / this.renderedZoom;
          let zy = this.renderedCy + (y + res/2.0 - h/2) / this.renderedZoom;
          
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
            
            if (Math.abs(nextX - zx) < curTol && Math.abs(nextY - zy) < curTol) {
                converged = true;
                break;
            }
            
            zx = nextX;
            zy = nextY;
            i++;
          }
          
          let pr, pg, pb;
          if (!converged) {
             pr = textColR; pg = textColG; pb = textColB;
          } else {
             let angle = Math.atan2(zy, zx); 
             let baseT = (angle + Math.PI) / (2 * Math.PI);
             let t = (baseT * curDensity + curShift + i / curMaxIt) % 1.0;
             if (Number.isNaN(t) || t === Infinity || t === -Infinity) t = 0;
             if (t < 0) t += 1.0;
             
             let lutIdx = Math.floor(t * 999);
             if (lutIdx < 0) lutIdx = 0;
             if (lutIdx > 999 || Number.isNaN(lutIdx)) lutIdx = 999;
             let rgb = lut[lutIdx];
             if (rgb) {
               pr = rgb[0]; pg = rgb[1]; pb = rgb[2];
             } else {
               pr = textColR; pg = textColG; pb = textColB;
             }
          }
          
          for (let dy = 0; dy < res; dy++) {
            for (let dx = 0; dx < res; dx++) {
               let px = x + dx;
               let py = y + dy;
               if (px < w && py < h) {
                  let idx = (px + py * w) * 4;
                  this.buffer.pixels[idx] = pr;
                  this.buffer.pixels[idx+1] = pg;
                  this.buffer.pixels[idx+2] = pb;
                  this.buffer.pixels[idx+3] = 255;
               }
            }
          }
        }
      }
      this.buffer.updatePixels();
      if(this.resolution > 1) this.resolution /= 2;
      else this.resolution = 0;
    }
    
    g.push();
    if (this.renderedZoom > 0) {
        let scaleF = cam.zoom / this.renderedZoom;
        let dx = (this.renderedCx - cam.cx) * cam.zoom;
        let dy = (this.renderedCy - cam.cy) * cam.zoom;
        g.translate(g.width/2 + dx, g.height/2 + dy);
        g.scale(scaleF);
        g.translate(-g.width/2, -g.height/2);
    }
    g.drawingContext.imageSmoothingEnabled = true;
    g.image(this.buffer, 0, 0);
    g.pop();
  }
}
