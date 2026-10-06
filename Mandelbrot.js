class Mandelbrot extends Fractal {
  constructor() {
    super();
    this.name = "Mandelbrot Set";
    this.formulas = ["z → z² + c", "z → z³ + c", "z → z⁴ + c", "Burning Ship", "z → sin(z) + c"];
    this.equation = this.formulas[0];
    this.theoreticalDimension = 2.0;
    
    this.addParameter("max_iterations", 10, 500, 100, true);
    this.addParameter("escape_radius", 2, 100, 4.0);
    this.addParameter("color_density", 0.1, 8.0, 2.0);
    this.addParameter("color_shift", 0.0, 1.0, 0.0);
    
    this.buffer = null;
    this.resolution = 0;
    
    this.renderedCx = 0; this.renderedCy = 0; this.renderedZoom = 0;
    this.renderedMaxIt = 0; this.renderedER = 0;
    this.renderedShift = 0; this.renderedDensity = 0;
    this.renderedFType = -1; this.renderedPalette = null;
    
    this.lastFrameCx = 0; this.lastFrameCy = 0; this.lastFrameZoom = 0;
    
    this.reset();
  }
  
  reset() {
    this.getParam("max_iterations").value = 100;
    this.getParam("escape_radius").value = 4.0;
    this.getParam("color_density").value = 2.0;
    this.getParam("color_shift").value = 0.0;
  }
  
  defaultView() {
    return [-0.5, 0, 800/2.5]; 
  }
  
  render(g, cam, palette) {
    if (!this.buffer || this.buffer.width !== g.width || this.buffer.height !== g.height) {
      if (this.buffer) this.buffer.remove();
      this.buffer = createGraphics(g.width, g.height);
      this.buffer.pixelDensity(1); 
      this.renderedZoom = 0; 
    }
    
    let curMaxIt = this.getParam("max_iterations").value;
    let curER = this.getParam("escape_radius").value;
    let curShift = this.getParam("color_shift").value;
    let curDensity = this.getParam("color_density").value;
    
    let paramsChanged = (
       curMaxIt !== this.renderedMaxIt || curER !== this.renderedER || palette !== this.renderedPalette ||
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
       this.renderedFType = this.currentFormula; this.renderedShift = curShift; this.renderedDensity = curDensity;
    }
    
    if (this.resolution >= 1 && !isMoving) {
      this.buffer.loadPixels();
      let limitSq = curER * curER;
      
      let lut32 = new Uint32Array(1000);
      for (let i = 0; i < 1000; i++) {
        let c = palette.sample(i / 1000.0);
        let r = c.levels[0], g = c.levels[1], b = c.levels[2];
        lut32[i] = 0xFF000000 | (b << 16) | (g << 8) | r;
      }
      
      let bgCol = 0xFFF1F7F9; // 249, 247, 241, 255
      let w = this.buffer.width;
      let h = this.buffer.height;
      let res = this.resolution;
      let pixels32 = new Uint32Array(this.buffer.pixels.buffer);
      
      let invZoom = 1.0 / this.renderedZoom;
      let halfW = w / 2.0;
      let halfH = h / 2.0;
      let startCx = this.renderedCx + (res * 0.5 - halfW) * invZoom;
      let stepC = res * invZoom;
      let LN2 = Math.LN2;
      let fType = this.renderedFType;
      
      for (let y = 0; y < h; y += res) {
        let cy = this.renderedCy + (y + res * 0.5 - halfH) * invZoom;
        let cx = startCx;
        
        for (let x = 0; x < w; x += res, cx += stepC) {
          let zx = 0, zy = 0, i = 0;
          let color32 = bgCol;
          
          // Fast Cardioid / Period-2 Bulb test for z^2 + c
          if (fType === 0) {
            let cxShift = cx - 0.25;
            let cy2 = cy * cy;
            let q = cxShift * cxShift + cy2;
            if (q * (q + cxShift) < 0.25 * cy2 || (cx + 1.0) * (cx + 1.0) + cy2 < 0.0625) {
              i = curMaxIt;
            }
          }
          
          if (i < curMaxIt) {
            if (fType === 0) {
              while (i < curMaxIt) {
                let zx2 = zx * zx, zy2 = zy * zy;
                if (zx2 + zy2 >= limitSq) break;
                zy = 2.0 * zx * zy + cy;
                zx = zx2 - zy2 + cx;
                i++;
              }
            } else if (fType === 1) {
              while (i < curMaxIt) {
                let zx2 = zx * zx, zy2 = zy * zy;
                if (zx2 + zy2 >= limitSq) break;
                let nextX = zx * zx2 - 3.0 * zx * zy2 + cx;
                let nextY = 3.0 * zx2 * zy - zy * zy2 + cy;
                zx = nextX; zy = nextY; i++;
              }
            } else if (fType === 2) {
              while (i < curMaxIt) {
                let zx2 = zx * zx, zy2 = zy * zy;
                if (zx2 + zy2 >= limitSq) break;
                let nextX = zx2 * zx2 - 6.0 * zx2 * zy2 + zy2 * zy2 + cx;
                let nextY = 4.0 * zx * zx2 * zy - 4.0 * zx * zy2 * zy + cy;
                zx = nextX; zy = nextY; i++;
              }
            } else if (fType === 3) {
              while (i < curMaxIt) {
                let absX = Math.abs(zx), absY = Math.abs(zy);
                let zx2 = absX * absX, zy2 = absY * absY;
                if (zx2 + zy2 >= limitSq) break;
                zx = zx2 - zy2 + cx;
                zy = 2.0 * absX * absY + cy;
                i++;
              }
            } else {
              while (i < curMaxIt) {
                let zx2 = zx * zx, zy2 = zy * zy;
                if (zx2 + zy2 >= limitSq) break;
                let nextX = Math.sin(zx) * Math.cosh(zy) + cx;
                let nextY = Math.cos(zx) * Math.sinh(zy) + cy;
                zx = nextX; zy = nextY; i++;
              }
            }
          }
          
          if (i < curMaxIt) {
            let distSq = zx * zx + zy * zy;
            let smooth = i + 1.0 - (Math.log(0.5 * Math.log(distSq)) / LN2);
            let t = (smooth / curMaxIt * curDensity + curShift) % 1.0;
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
