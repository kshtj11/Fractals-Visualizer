class FigmaColorPicker {
  constructor() {
    this.active = false;
    this.targetStop = null;
    this.h = 0;   // 0 - 360
    this.s = 1.0; // 0 - 1
    this.v = 1.0; // 0 - 1
    
    this.w = 260;
    this.hHeight = 315;
    this.x = 0;
    this.y = 0;
    
    this.targetPx = 0;
    this.targetPy = 0;
    
    this.draggingSV = false;
    this.draggingHue = false;
    
    this.swatches = [
      "#FF3B30", "#FF9500", "#FFCC00", "#34C759", "#00C7BE",
      "#30B0C7", "#32ADE6", "#007AFF", "#5856D6", "#AF52DE",
      "#FF2D55", "#E07A5F", "#F4F1DE", "#3D5A80", "#2B2D42"
    ];
  }
  
  open(stop, px, py) {
    this.targetStop = stop;
    this.targetPx = px;
    this.targetPy = py;
    this.active = true;
    
    let c = stop.c;
    let r = c.levels[0], g = c.levels[1], b = c.levels[2];
    let hsv = this.rgbToHsv(r, g, b);
    this.h = hsv.h;
    this.s = hsv.s;
    this.v = hsv.v;
    
    // Spawn strictly to the LEFT of the right sidebar panel (width - 280 - 20)
    let sidebarX = width - 280 - 20;
    let idealX = sidebarX - this.w - 16; // 16px gap to the left of sidebar
    
    this.x = constrain(idealX, 20, width - this.w - 20);
    this.y = constrain(py - 80, 60, height - this.hHeight - 20);
  }
  
  close() {
    this.active = false;
    this.targetStop = null;
    this.draggingSV = false;
    this.draggingHue = false;
  }
  
  updateTargetColor() {
    if (!this.targetStop) return;
    let rgb = this.hsvToRgb(this.h, this.s, this.v);
    this.targetStop.c = color(rgb.r, rgb.g, rgb.b);
    globalDirty = true;
  }
  
  draw() {
    if (!this.active || !this.targetStop) return;
    
    push();
    
    // Connector pointer arrow pointing toward the target stop node on the right
    let arrowY = constrain(this.targetPy, this.y + 20, this.y + this.hHeight - 20);
    fill("rgba(255, 255, 255, 0.95)");
    stroke(Theme.BORDER);
    strokeWeight(1);
    triangle(
      this.x + this.w, arrowY - 7,
      this.x + this.w + 10, arrowY,
      this.x + this.w, arrowY + 7
    );
    
    // Main Modal Container
    fill("rgba(255, 255, 255, 0.95)");
    stroke(Theme.BORDER);
    strokeWeight(1);
    rect(this.x, this.y, this.w, this.hHeight, 14);
    
    // Header
    let pal = paletteManager.current();
    let stopIdx = pal ? pal.stops.indexOf(this.targetStop) + 1 : 1;
    let totalStops = pal ? pal.stops.length : 1;
    
    fill(Theme.TEXT_COLOR);
    noStroke();
    textAlign(LEFT, CENTER);
    textSize(Theme.FONT_SIZE_NORMAL);
    text(`Color Picker (Stop ${stopIdx}/${totalStops})`, this.x + 15, this.y + 22);
    
    // Close button X
    let closeX = this.x + this.w - 22;
    let closeY = this.y + 22;
    fill(Theme.TEXT_DIM);
    textAlign(CENTER, CENTER);
    textSize(14);
    text("✕", closeX, closeY);
    
    // 2D Saturation/Value Box
    let svX = this.x + 15;
    let svY = this.y + 45;
    let svW = this.w - 30;
    let svH = 130;
    
    // Render SV gradient grid
    for (let py = 0; py < svH; py += 3) {
      let val = 1.0 - (py / svH);
      for (let px = 0; px < svW; px += 3) {
        let sat = px / svW;
        let rgb = this.hsvToRgb(this.h, sat, val);
        fill(rgb.r, rgb.g, rgb.b);
        noStroke();
        rect(svX + px, svY + py, 3, 3);
      }
    }
    
    noFill();
    stroke(Theme.BORDER);
    strokeWeight(1);
    rect(svX, svY, svW, svH, 4);
    
    // Handle for SV Picker
    let handleX = svX + this.s * svW;
    let handleY = svY + (1.0 - this.v) * svH;
    fill(this.targetStop.c);
    stroke(255);
    strokeWeight(2.5);
    ellipse(handleX, handleY, 14, 14);
    stroke(0, 100);
    strokeWeight(1);
    noFill();
    ellipse(handleX, handleY, 16, 16);
    
    // Rainbow Hue Bar
    let hueX = this.x + 15;
    let hueY = svY + svH + 14;
    let hueW = this.w - 30;
    let hueH = 16;
    
    for (let i = 0; i < hueW; i++) {
      let hueVal = (i / hueW) * 360;
      let rgb = this.hsvToRgb(hueVal, 1.0, 1.0);
      stroke(rgb.r, rgb.g, rgb.b);
      line(hueX + i, hueY, hueX + i, hueY + hueH);
    }
    
    noFill();
    stroke(Theme.BORDER);
    strokeWeight(1);
    rect(hueX, hueY, hueW, hueH, 4);
    
    // Handle for Hue Slider
    let hHandleX = hueX + (this.h / 360.0) * hueW;
    fill(255);
    stroke(Theme.TEXT_COLOR);
    strokeWeight(1.5);
    rect(hHandleX - 4, hueY - 2, 8, hueH + 4, 3);
    
    // Hex Code & Preview Box
    let curRGB = this.hsvToRgb(this.h, this.s, this.v);
    let hexStr = this.rgbToHex(curRGB.r, curRGB.g, curRGB.b);
    
    let infoY = hueY + hueH + 14;
    fill(curRGB.r, curRGB.g, curRGB.b);
    stroke(Theme.BORDER);
    strokeWeight(1);
    rect(this.x + 15, infoY, 28, 28, 6);
    
    fill(Theme.TEXT_COLOR);
    noStroke();
    textAlign(LEFT, CENTER);
    textSize(Theme.FONT_SIZE_SMALL);
    text(hexStr, this.x + 52, infoY + 14);
    
    fill(Theme.TEXT_DIM);
    textSize(11);
    text(`R:${curRGB.r} G:${curRGB.g} B:${curRGB.b}`, this.x + 130, infoY + 14);
    
    // Swatches Grid
    let swatchY = infoY + 36;
    let swatchSize = 14;
    let swatchGap = 4;
    for (let i = 0; i < this.swatches.length; i++) {
      let sx = this.x + 15 + (i % 10) * (swatchSize + swatchGap);
      let sy = swatchY + Math.floor(i / 10) * (swatchSize + swatchGap);
      fill(this.swatches[i]);
      stroke(Theme.BORDER);
      strokeWeight(0.5);
      rect(sx, sy, swatchSize, swatchSize, 3);
    }
    
    pop();
  }
  
  mousePressed() {
    if (!this.active) return false;
    
    // Close button click
    let closeX = this.x + this.w - 22;
    let closeY = this.y + 22;
    if (dist(mouseX, mouseY, closeX, closeY) < 16) {
      this.close();
      return true;
    }
    
    // SV Box click
    let svX = this.x + 15;
    let svY = this.y + 45;
    let svW = this.w - 30;
    let svH = 130;
    if (mouseX >= svX && mouseX <= svX + svW && mouseY >= svY && mouseY <= svY + svH) {
      this.draggingSV = true;
      this.s = constrain((mouseX - svX) / svW, 0, 1);
      this.v = constrain(1.0 - (mouseY - svY) / svH, 0, 1);
      this.updateTargetColor();
      return true;
    }
    
    // Hue Bar click
    let hueX = this.x + 15;
    let hueY = svY + svH + 14;
    let hueW = this.w - 30;
    let hueH = 16;
    if (mouseX >= hueX && mouseX <= hueX + hueW && mouseY >= hueY && mouseY <= hueY + hueH) {
      this.draggingHue = true;
      this.h = constrain((mouseX - hueX) / hueW, 0, 1) * 360.0;
      this.updateTargetColor();
      return true;
    }
    
    // Swatch click
    let infoY = hueY + hueH + 14;
    let swatchY = infoY + 36;
    let swatchSize = 14;
    let swatchGap = 4;
    for (let i = 0; i < this.swatches.length; i++) {
      let sx = this.x + 15 + (i % 10) * (swatchSize + swatchGap);
      let sy = swatchY + Math.floor(i / 10) * (swatchSize + swatchGap);
      if (mouseX >= sx && mouseX <= sx + swatchSize && mouseY >= sy && mouseY <= sy + swatchSize) {
        let hex = this.swatches[i];
        let c = color(hex);
        this.targetStop.c = c;
        let hsv = this.rgbToHsv(c.levels[0], c.levels[1], c.levels[2]);
        this.h = hsv.h; this.s = hsv.s; this.v = hsv.v;
        globalDirty = true;
        return true;
      }
    }
    
    // Clicked inside modal window
    if (mouseX >= this.x && mouseX <= this.x + this.w && mouseY >= this.y && mouseY <= this.y + this.hHeight) {
      return true;
    }
    
    // Clicked outside - close modal
    this.close();
    return false;
  }
  
  mouseDragged() {
    if (!this.active) return false;
    
    if (this.draggingSV) {
      let svX = this.x + 15;
      let svY = this.y + 45;
      let svW = this.w - 30;
      let svH = 130;
      this.s = constrain((mouseX - svX) / svW, 0, 1);
      this.v = constrain(1.0 - (mouseY - svY) / svH, 0, 1);
      this.updateTargetColor();
      return true;
    }
    
    if (this.draggingHue) {
      let svY = this.y + 45;
      let svH = 130;
      let hueX = this.x + 15;
      let hueY = svY + svH + 14;
      let hueW = this.w - 30;
      this.h = constrain((mouseX - hueX) / hueW, 0, 1) * 360.0;
      this.updateTargetColor();
      return true;
    }
    
    return false;
  }
  
  mouseReleased() {
    if (this.draggingSV || this.draggingHue) {
      this.draggingSV = false;
      this.draggingHue = false;
      return true;
    }
    return false;
  }
  
  hsvToRgb(h, s, v) {
    let r = 0, g = 0, b = 0;
    let i = Math.floor((h / 60.0) % 6);
    let f = (h / 60.0) - Math.floor(h / 60.0);
    let p = v * (1.0 - s);
    let q = v * (1.0 - f * s);
    let t = v * (1.0 - (1.0 - f) * s);
    switch (i) {
      case 0: r = v; g = t; b = p; break;
      case 1: r = q; g = v; b = p; break;
      case 2: r = p; g = v; b = t; break;
      case 3: r = p; g = q; b = v; break;
      case 4: r = t; g = p; b = v; break;
      case 5: r = v; g = p; b = q; break;
    }
    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
  }
  
  rgbToHsv(r, g, b) {
    r /= 255.0; g /= 255.0; b /= 255.0;
    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, v = max;
    let d = max - min;
    s = max === 0 ? 0 : d / max;
    if (max === min) {
      h = 0;
    } else {
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6.0;
    }
    return { h: Math.round(h * 360.0), s: s, v: v };
  }
  
  rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
  }
}
