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
    this.resolution = 0;
    
    this.renderedCx = 0; this.renderedCy = 0; this.renderedZoom = 0;
    this.renderedMaxIt = 0; this.renderedER = 0; this.renderedC_re = 0; this.renderedC_im = 0;
    this.renderedShift = 0; this.renderedDensity = 0;
    this.renderedFType = -1; this.renderedPalette = null;
    
    this.lastFrameCx = 0; this.lastFrameCy = 0; this.lastFrameZoom = 0;
    
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
    let curER = this.getParam("escape_radius").value;
    let curShift = this.getParam("color_shift").value;
    let curDensity = this.getParam("color_density").value;
    
    let paramsChanged = (
       curMaxIt !== this.renderedMaxIt || curER !== this.renderedER || palette !== this.renderedPalette ||
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
       this.renderedMaxIt = curMaxIt; this.renderedER = curER; this.renderedPalette = palette;
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
      
      let bgR = 249, bgG = 247, bgB = 241;
      let w = this.buffer.width;
      let h = this.buffer.height;
      let res = this.resolution;

      let cr = this.renderedC_re;
      let ci = this.renderedC_im;
      let limitSq = curER * curER;
      
      for(let y=0; y<h; y+=res) {
        for(let x=0; x<w; x+=res) {
          let zx = this.renderedCx + (x + res/2.0 - w/2) / this.renderedZoom;
          let zy = this.renderedCy + (y + res/2.0 - h/2) / this.renderedZoom;
          
          let i=0;
          while(zx*zx + zy*zy < limitSq && i < curMaxIt) {
            let nextX = 0, nextY = 0;
            if (this.renderedFType === 0) {
                nextX = zx*zx - zy*zy + cr; nextY = 2.0*zx*zy + ci;
            } else if (this.renderedFType === 1) {
                nextX = zx*zx*zx - 3*zx*zy*zy + cr; nextY = 3*zx*zx*zy - zy*zy*zy + ci;
            } else if (this.renderedFType === 2) {
                let zx2 = zx*zx; let zy2 = zy*zy;
                nextX = zx2*zx2 - 6*zx2*zy2 + zy2*zy2 + cr; nextY = 4*zx*zx2*zy - 4*zx*zy2*zy + ci;
            } else if (this.renderedFType === 3) {
                let absX = Math.abs(zx); let absY = Math.abs(zy);
                nextX = absX*absX - absY*absY + cr; nextY = 2.0*absX*absY + ci;
            } else if (this.renderedFType === 4) {
                nextX = Math.sin(zx) * Math.cosh(zy) + cr; nextY = Math.cos(zx) * Math.sinh(zy) + ci;
            }
            zx = nextX; zy = nextY; i++;
          }
          
          let pr, pg, pb;
          if(i >= curMaxIt) {
            pr = bgR; pg = bgG; pb = bgB;
          } else {
             let distSq = zx*zx + zy*zy;
             let smooth = i + 1.0 - (Math.log(Math.log(Math.sqrt(distSq))) / Math.LN2);
             let t = (smooth / curMaxIt * curDensity + curShift) % 1.0;
             if (t < 0) t += 1.0;
             
             let lutIdx = Math.floor(t * 999);
             let rgb = lut[lutIdx];
             pr = rgb[0]; pg = rgb[1]; pb = rgb[2];
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
