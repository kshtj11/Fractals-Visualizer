class GradientEditor {
  constructor() {
    this.draggingStop = null;
    this.selectedStop = null;
    this.expanded = false;
    this.currentH = 80;
    this.figmaPicker = new FigmaColorPicker();
    
    // Bind HTML image file input listener
    let fileInput = document.getElementById('palette-image-input');
    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          paletteManager.createPaletteFromImageFile(e.target.files[0]);
          e.target.value = ''; // Reset input
        }
      });
    }
  }
  
  draw() {
    let w = 280;
    let x = width - w - 20;
    let y = 220;
    
    // Hover expansion check
    let isHovered = mouseX >= x - 10 && mouseX <= x + w + 10 && mouseY >= y - 10 && mouseY <= y + this.currentH + 10;
    let isEditing = (this.figmaPicker && this.figmaPicker.active) || (this.draggingStop != null);
    
    this.expanded = isHovered || isEditing;
    let targetH = this.expanded ? 360 : 80;
    this.currentH = lerp(this.currentH, targetH, 0.2);
    
    push();
    // Glassmorphic Panel Container
    fill(Theme.PANEL_BG);
    stroke(Theme.BORDER);
    strokeWeight(1);
    rect(x, y, w, this.currentH, 12);
    
    let pal = paletteManager.current();
    
    // Title & Header
    fill(Theme.TEXT_COLOR);
    noStroke();
    textAlign(LEFT, TOP);
    textSize(Theme.FONT_SIZE_NORMAL);
    text("Colors", x + 15, y + 12);
    
    // Palette badge / count chip
    let badgeText = `${pal.name} (${pal.stops.length}/8)`;
    textSize(Theme.FONT_SIZE_SMALL);
    textAlign(RIGHT, TOP);
    fill(Theme.TEXT_DIM);
    text(badgeText, x + w - 15, y + 14);
    
    // Gradient Spectrum Bar
    let barX = x + 15;
    let barY = y + 38;
    let barW = w - 30;
    let barH = 20;
    
    for (let i = 0; i <= barW; i++) {
      let t = i / barW;
      stroke(pal.sample(t));
      line(barX + i, barY, barX + i, barY + barH);
    }
    
    noFill();
    strokeWeight(1);
    stroke(Theme.BORDER);
    rect(barX, barY, barW, barH, 2);
    
    // Draggable Color Stops
    for (let s of pal.stops) {
      let sx = barX + s.t * barW;
      let sy = barY + barH;
      
      fill(s.c);
      stroke(s === this.selectedStop || s === this.draggingStop ? Theme.ACCENT : Theme.TEXT_COLOR);
      strokeWeight(s === this.selectedStop || s === this.draggingStop ? 2 : 1.5);
      
      // Node triangle & color box handle
      triangle(sx, sy, sx - 6, sy + 7, sx + 6, sy + 7);
      rect(sx - 6, sy + 7, 12, 9, 2);
    }
    
    // Expanded View Content (only if expanding)
    if (this.currentH > 120) {
      let opacity = constrain(map(this.currentH, 120, 360, 0, 255), 0, 255);
      
      // Stop Action Controls Row (+ Stop / - Remove)
      let btnY = barY + barH + 22;
      let canAdd = pal.stops.length < 8;
      let canRemove = pal.stops.length > 2 && this.selectedStop != null;
      
      this.drawMiniButton("+ Add Stop", x + 15, btnY, 115, 26, canAdd, opacity);
      this.drawMiniButton("🗑️ Remove", x + 140, btnY, 125, 26, canRemove, opacity);
      
      // Section Header: Palettes
      let palY = btnY + 36;
      fill(red(color(Theme.TEXT_COLOR)), green(color(Theme.TEXT_COLOR)), blue(color(Theme.TEXT_COLOR)), opacity);
      noStroke();
      textAlign(LEFT, TOP);
      textSize(Theme.FONT_SIZE_SMALL);
      text("PALETTE PRESETS", x + 15, palY);
      
      // Palette Grid Chips (showing mini previews)
      let chipY = palY + 20;
      let chipH = 26;
      let maxVisible = Math.min(paletteManager.palettes.length, 5);
      
      for (let pIdx = 0; pIdx < maxVisible; pIdx++) {
        let p = paletteManager.palettes[pIdx];
        let pyPos = chipY + pIdx * (chipH + 5);
        if (pyPos + chipH > y + this.currentH - 45) break; // Clip within bounds
        
        let isCurrent = pIdx === paletteManager.currentIndex;
        fill(isCurrent ? "rgba(224, 122, 95, 0.15)" : "rgba(0, 0, 0, 0.04)");
        stroke(isCurrent ? Theme.ACCENT : Theme.BORDER);
        strokeWeight(isCurrent ? 1.5 : 1);
        rect(x + 15, pyPos, w - 30, chipH, 6);
        
        // Palette Name
        fill(red(color(Theme.TEXT_COLOR)), green(color(Theme.TEXT_COLOR)), blue(color(Theme.TEXT_COLOR)), opacity);
        noStroke();
        textAlign(LEFT, CENTER);
        textSize(12);
        text(p.name, x + 25, pyPos + chipH / 2);
        
        // Mini Gradient Preview Bar
        let pBarX = x + 150;
        let pBarW = 100;
        let pBarY = pyPos + 6;
        let pBarH = 14;
        for (let px = 0; px < pBarW; px += 2) {
          stroke(p.sample(px / pBarW));
          line(pBarX + px, pBarY, pBarX + px, pBarY + pBarH);
        }
        noFill();
        stroke(Theme.BORDER);
        strokeWeight(1);
        rect(pBarX, pBarY, pBarW, pBarH, 2);
      }
      
      // Bottom Action Row (+ Add Palette / 📷 Auto from Image)
      let bottomY = y + this.currentH - 36;
      this.drawMiniButton("+ New Palette", x + 15, bottomY, 115, 26, true, opacity);
      this.drawMiniButton("📷 Auto Image", x + 140, bottomY, 125, 26, true, opacity);
    }
    
    pop();
    
    // Render Figma Color Picker on top
    if (this.figmaPicker) {
      this.figmaPicker.draw();
    }
  }
  
  drawMiniButton(label, bx, by, bw, bh, enabled, opacity) {
    fill(enabled ? "rgba(255, 255, 255, 0.9)" : "rgba(230, 230, 230, 0.4)");
    stroke(enabled ? Theme.BORDER : "rgba(0,0,0,0.05)");
    strokeWeight(1);
    rect(bx, by, bw, bh, 6);
    
    fill(enabled ? Theme.TEXT_COLOR : Theme.TEXT_DIM);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(11);
    text(label, bx + bw / 2, by + bh / 2);
  }
  
  mousePressed() {
    if (hideUI) return false;
    
    // Route to Figma Color Picker if open
    if (this.figmaPicker && this.figmaPicker.active) {
      if (this.figmaPicker.mousePressed()) return true;
    }
    
    let w = 280;
    let x = width - w - 20;
    let y = 220;
    let pal = paletteManager.current();
    
    let barX = x + 15;
    let barW = w - 30;
    let barY = y + 38;
    let barH = 20;
    let sy = barY + barH;
    
    // 1. Check Color Stop Node Click (handles/triangles)
    for (let i = pal.stops.length - 1; i >= 0; i--) {
      let s = pal.stops[i];
      let sx = barX + s.t * barW;
      if (mouseX >= sx - 8 && mouseX <= sx + 8 && mouseY >= sy - 2 && mouseY <= sy + 18) {
        this.draggingStop = s;
        this.selectedStop = s;
        // Open Figma Color Selector
        this.figmaPicker.open(s, mouseX, mouseY);
        return true;
      }
    }

    // 2. Direct Spectrum Bar Click (adds new color stop with exact color already present)
    if (mouseX >= barX && mouseX <= barX + barW && mouseY >= barY && mouseY <= barY + barH) {
      if (pal.stops.length < 8) {
        let t = (mouseX - barX) / barW;
        let sampledCol = pal.sample(t);
        let newStop = pal.addStop(t, sampledCol);
        if (newStop) {
          this.selectedStop = newStop;
          this.draggingStop = newStop;
          this.figmaPicker.open(newStop, mouseX, mouseY);
          globalDirty = true;
        }
      }
      return true;
    }
    
    // Expanded View Interactivity
    if (this.expanded && this.currentH > 200) {
      let btnY = barY + barH + 22;
      
      // "+ Add Stop" Button
      if (mouseX >= x + 15 && mouseX <= x + 130 && mouseY >= btnY && mouseY <= btnY + 26) {
        if (pal.stops.length < 8) {
          let newStop = pal.addStop(0.5);
          this.selectedStop = newStop;
          if (newStop) this.figmaPicker.open(newStop, x + 140, btnY);
          globalDirty = true;
        }
        return true;
      }
      
      // "🗑️ Remove Stop" Button
      if (mouseX >= x + 140 && mouseX <= x + 265 && mouseY >= btnY && mouseY <= btnY + 26) {
        if (this.selectedStop && pal.stops.length > 2) {
          pal.removeStop(this.selectedStop);
          this.selectedStop = pal.stops[0];
          this.figmaPicker.close();
          globalDirty = true;
        }
        return true;
      }
      
      // Palette Preset Chips Click
      let chipY = btnY + 58;
      let chipH = 26;
      let maxVisible = Math.min(paletteManager.palettes.length, 5);
      for (let pIdx = 0; pIdx < maxVisible; pIdx++) {
        let pyPos = chipY + pIdx * (chipH + 5);
        if (mouseX >= x + 15 && mouseX <= x + w - 15 && mouseY >= pyPos && mouseY <= pyPos + chipH) {
          paletteManager.currentIndex = pIdx;
          this.selectedStop = paletteManager.current().stops[0];
          globalDirty = true;
          return true;
        }
      }
      
      // Bottom Buttons
      let bottomY = y + this.currentH - 36;
      
      // "+ New Palette"
      if (mouseX >= x + 15 && mouseX <= x + 130 && mouseY >= bottomY && mouseY <= bottomY + 26) {
        paletteManager.createCustomPalette();
        this.selectedStop = paletteManager.current().stops[0];
        globalDirty = true;
        return true;
      }
      
      // "📷 Auto Image"
      if (mouseX >= x + 140 && mouseX <= x + 265 && mouseY >= bottomY && mouseY <= bottomY + 26) {
        let fileInput = document.getElementById('palette-image-input');
        if (fileInput) fileInput.click();
        return true;
      }
    }
    
    // Check if clicked inside panel area
    if (mouseX >= x && mouseX <= x + w && mouseY >= y && mouseY <= y + this.currentH) {
      return true;
    }
    
    return false;
  }
  
  mouseDragged() {
    if (this.figmaPicker && this.figmaPicker.active) {
      if (this.figmaPicker.mouseDragged()) return true;
    }
    
    if (this.draggingStop != null) {
      let w = 280;
      let x = width - w - 20;
      let barX = x + 15;
      let barW = w - 30;
      
      let newT = (mouseX - barX) / barW;
      this.draggingStop.t = constrain(newT, 0, 1);
      
      paletteManager.current().sortStops();
      globalDirty = true;
      return true;
    }
    return false;
  }
  
  mouseReleased() {
    if (this.figmaPicker && this.figmaPicker.active) {
      this.figmaPicker.mouseReleased();
    }
    if (this.draggingStop != null) {
      this.draggingStop = null;
      return true;
    }
    return false;
  }
}
