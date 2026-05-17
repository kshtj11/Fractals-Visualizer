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

    let camChanged = (cam.cx !== this.renderedCx || cam.cy !== this.renderedCy || cam.zoom !== this.renderedZoom);
    let isMoving = (cam.cx !== this.lastFrameCx || cam.cy !== this.lastFrameCy || cam.zoom !== this.lastFrameZoom);
    
    this.lastFrameCx = cam.cx; this.lastFrameCy = cam.cy; this.lastFrameZoom = cam.zoom;
    
    if (paramsChanged || (camChanged && !isMoving)) {
       this.resolution = 8;
       this.renderedCx = cam.cx; this.renderedCy = cam.cy; this.renderedZoom = cam.zoom;
       this.renderedMaxIt = curMaxIt; this.renderedER = curER; this.renderedPalette = palette;
       this.renderedC_re = cRe.value; this.renderedC_im = cIm.value;
       this.renderedFType = this.currentFormula; this.renderedShift = curShift; this.renderedDensity = curDensity;
    }
    
    if (this.resolution >= 1 && !isMoving) {
      this.buffer.noStroke();
      let cr = this.renderedC_re;
      let ci = this.renderedC_im;
      let limitSq = curER * curER;
      
      for(let y=0; y<this.buffer.height; y+=this.resolution) {
        for(let x=0; x<this.buffer.width; x+=this.resolution) {
          let zx = this.renderedCx + (x + this.resolution/2.0 - this.buffer.width/2) / this.renderedZoom;
          let zy = this.renderedCy + (y + this.resolution/2.0 - this.buffer.height/2) / this.renderedZoom;
          
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
                let absX = abs(zx); let absY = abs(zy);
                nextX = absX*absX - absY*absY + cr; nextY = 2.0*absX*absY + ci;
            } else if (this.renderedFType === 4) {
                nextX = sin(zx) * Math.cosh(zy) + cr; nextY = cos(zx) * Math.sinh(zy) + ci;
            }
            zx = nextX; zy = nextY; i++;
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
