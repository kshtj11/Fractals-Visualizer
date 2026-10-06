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
      
      let lut32 = new Uint32Array(1000);
      for (let j = 0; j < 1000; j++) {
        let c = palette.sample(j / 1000.0);
        let r = c.levels[0], g = c.levels[1], b = c.levels[2];
        lut32[j] = 0xFF000000 | (b << 16) | (g << 8) | r;
      }
      
      let bgCol = 0xFF422D2B; // 43, 45, 66, 255 (dark slate text color fallback)
      let w = this.buffer.width;
      let h = this.buffer.height;
      let res = this.resolution;
      let pixels32 = new Uint32Array(this.buffer.pixels.buffer);

      let cr = this.renderedC_re;
      let ci = this.renderedC_im;
      let degree = this.renderedFType + 3;
      let coef1 = 1.0 - (curRelax / degree);
      let coef2 = curRelax / degree;
      let invZoom = 1.0 / this.renderedZoom;
      let halfW = w / 2.0;
      let halfH = h / 2.0;
      let startZx = this.renderedCx + (res * 0.5 - halfW) * invZoom;
      let stepZ = res * invZoom;
      let TWO_PI = Math.PI * 2.0;
      
      for (let y = 0; y < h; y += res) {
        let startZy = this.renderedCy + (y + res * 0.5 - halfH) * invZoom;
        let startX = startZx;
        
        for (let x = 0; x < w; x += res, startX += stepZ) {
          let zx = startX, zy = startZy;
          if (zx === 0 && zy === 0) zx = 0.0001;
          
          let i = 0;
          let converged = false;
          
          while (i < curMaxIt) {
            let tr = 1.0, ti = 0.0;
            for (let k = 0; k < degree - 1; k++) {
              let ntr = tr * zx - ti * zy;
              let nti = tr * zy + ti * zx;
              tr = ntr; ti = nti;
            }
            
            let modSq = tr * tr + ti * ti;
            if (modSq < 0.00000001) break;
            
            let invMod = 1.0 / modSq;
            let inv_tr = tr * invMod;
            let inv_ti = -ti * invMod;
            
            let term_r = cr * inv_tr - ci * inv_ti;
            let term_i = cr * inv_ti + ci * inv_tr;
            
            let nextX = coef1 * zx + coef2 * term_r;
            let nextY = coef1 * zy + coef2 * term_i;
            
            let dx = nextX - zx;
            let dy = nextY - zy;
            if (dx * dx + dy * dy < curTol * curTol) {
              converged = true;
              break;
            }
            
            zx = nextX;
            zy = nextY;
            i++;
          }
          
          let color32 = bgCol;
          if (converged) {
             let angle = Math.atan2(zy, zx);
             let baseT = (angle + Math.PI) / TWO_PI;
             let t = (baseT * curDensity + curShift + i / curMaxIt) % 1.0;
             if (t < 0) t += 1.0;
             
             let lutIdx = (t * 999) | 0;
             if (lutIdx < 0) lutIdx = 0;
             else if (lutIdx > 999) lutIdx = 999;
             color32 = lut32[lutIdx];
          }
          
          if (res === 1) {
            pixels32[y * w + x] = color32;
          } else {
            for (let dy = 0; dy < res; dy++) {
              let rowOffset = (y + dy) * w;
              if (y + dy < h) {
                for (let dx = 0; dx < res; dx++) {
                  if (x + dx < w) {
                    pixels32[rowOffset + x + dx] = color32;
                  }
                }
              }
            }
          }
        }
      }
      this.buffer.updatePixels();
      if (this.resolution > 1) this.resolution /= 2;
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
