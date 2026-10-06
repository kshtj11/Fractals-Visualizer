class Animator {
  constructor() {
    this.active = false;
    this.h = 120;
    this.lengthSec = 4;
    this.fps = 30;
    this.frames = this.lengthSec * this.fps;
    this.playhead = 0;
    this.keyframes = []; 
    this.isPlaying = false;
    this.loopColors = false;
    this.exportFormat = 'webm'; // 'webm' or 'gif'
    
    this.capturer = null;
    this.isRendering = false;
    this.renderStartTime = 0;
    this.draggingPlayhead = false;
    
    // Render Studio Modal & Presets
    this.showRenderModal = false;
    this.selectedPresetIdx = 0; // Default 720p HD
    this.exportPresets = [
      { name: "720p HD", w: 1280, h: 720, aspect: "16:9", label: "Fast & Crisp (Recommended)" },
      { name: "1080p Full HD", w: 1920, h: 1080, aspect: "16:9", label: "High Resolution" },
      { name: "480p Ultra-Fast", w: 854, h: 480, aspect: "16:9", label: "Draft Speed" },
      { name: "Square 1:1", w: 1080, h: 1080, aspect: "1:1", label: "Instagram / Square" },
      { name: "Reels / Shorts", w: 1080, h: 1920, aspect: "9:16", label: "Vertical Video" }
    ];
    this.exportQualityPass = 1; // 1: Crisp (pass=1), 2: Fast (pass=2)
    
    this.exportBuffer = null;
    this.exportCam = null;
  }
  
  toggle() {
    this.active = !this.active;
  }
  
  captureState() {
    let f = fractals[currentFractalIndex];
    let state = {
      cx: cam.targetCx, cy: cam.targetCy, zoom: cam.targetZoom,
      params: {}
    };
    for (let p of f.parameters) {
      state.params[p.name] = p.value;
    }
    return state;
  }
  
  addKeyframe() {
    this.keyframes = this.keyframes.filter(k => k.f !== this.playhead);
    this.keyframes.push({ f: this.playhead, state: this.captureState() });
    this.keyframes.sort((a, b) => a.f - b.f);
  }
  
  applyState(state) {
    cam.setView(state.cx, state.cy, state.zoom);
    if (this.isRendering) {
      cam.cx = state.cx; cam.cy = state.cy; cam.zoom = state.zoom;
    }
    let f = fractals[currentFractalIndex];
    for (let p of f.parameters) {
      if (state.params[p.name] !== undefined) {
        p.value = state.params[p.name];
      }
    }
    globalDirty = true;
  }
  
  lerpState(s1, s2, t) {
    let state = { params: {} };
    state.cx = s1.cx + (s2.cx - s1.cx) * t;
    state.cy = s1.cy + (s2.cy - s1.cy) * t;
    let logZ1 = Math.log(s1.zoom);
    let logZ2 = Math.log(s2.zoom);
    state.zoom = Math.exp(logZ1 + (logZ2 - logZ1) * t);
    
    for (let k in s1.params) {
      state.params[k] = s1.params[k] + (s2.params[k] - s1.params[k]) * t;
    }
    return state;
  }
  
  update() {
    if (this.isPlaying && !this.isRendering) {
      this.playhead++;
      if (this.playhead > this.frames) this.playhead = 0;
      this.evaluatePlayhead();
    }
  }

  evaluatePlayhead() {
      if (this.keyframes.length > 0) {
        let state = null;
        if (this.keyframes.length === 1) {
          state = this.keyframes[0].state;
        } else {
          let k1 = this.keyframes[0];
          let k2 = this.keyframes[this.keyframes.length - 1];
          for (let i = 0; i < this.keyframes.length - 1; i++) {
            if (this.playhead >= this.keyframes[i].f && this.playhead <= this.keyframes[i+1].f) {
              k1 = this.keyframes[i];
              k2 = this.keyframes[i+1];
              break;
            }
          }
          if (this.playhead <= k1.f) state = k1.state;
          else if (this.playhead >= k2.f) state = k2.state;
          else {
            let t = (this.playhead - k1.f) / (k2.f - k1.f);
            t = t * t * (3 - 2 * t);
            state = this.lerpState(k1.state, k2.state, t);
          }
        }
        
        if (this.loopColors) {
          state.params["color_shift"] = this.playhead / this.frames;
        }
        this.applyState(state);
      } else if (this.loopColors) {
         let f = fractals[currentFractalIndex];
         let p = f.getParam("color_shift");
         if (p) { p.value = this.playhead / this.frames; globalDirty = true; }
      }
  }
  
  draw() {
    if (!this.active) return;
    
    let x = hideUI ? 20 : 300;
    let w = hideUI ? width - 40 : width - 320;
    let y = height - this.h - 20;
    
    push();
    fill(Theme.PANEL_BG);
    stroke(Theme.BORDER);
    strokeWeight(1);
    rect(x, y, w, this.h, 12);
    
    // Timeline Track Header
    let trackX = x + 150;
    let trackY = y + 24;
    let trackW = w - 170;
    
    stroke(Theme.BORDER);
    strokeWeight(6);
    strokeCap(ROUND);
    line(trackX, trackY, trackX + trackW, trackY);
    
    // Keyframe Markers
    noStroke();
    for (let k of this.keyframes) {
      let kx = trackX + (k.f / this.frames) * trackW;
      fill(Theme.ACCENT);
      push();
      translate(kx, trackY);
      rotate(PI/4);
      rectMode(CENTER);
      rect(0, 0, 9, 9);
      pop();
    }
    
    // Playhead Needle
    let px = trackX + (this.playhead / this.frames) * trackW;
    stroke(Theme.TEXT_COLOR);
    strokeWeight(2);
    line(px, trackY - 10, px, trackY + 10);
    fill(Theme.TEXT_COLOR);
    noStroke();
    triangle(px - 4, trackY - 10, px + 4, trackY - 10, px, trackY - 3);
    
    // Playhead Label
    fill(Theme.TEXT_COLOR);
    textAlign(LEFT, CENTER);
    textSize(Theme.FONT_SIZE_SMALL);
    text("Frame: " + Math.round(this.playhead) + " / " + this.frames, x + 15, trackY);
    
    // Controls Row (Aligned to Theme UI style)
    let btnY = y + 62;
    
    // Group 1: Playback Actions
    this.drawButton("+ Keyframe", x + 15, btnY, 90, 32);
    this.drawButton(this.isPlaying ? "⏸ Stop" : "▶ Play", x + 112, btnY, 65, 32);
    
    let loopActive = this.loopColors;
    this.drawButton("🎨 Loop", x + 184, btnY, 75, 32, loopActive ? Theme.ACCENT : null);
    
    // Group 2: Steppers
    this.drawStepper("Len:", this.lengthSec + "s", x + 280, btnY);
    this.drawStepper("FPS:", this.fps, x + 395, btnY);
    
    // Group 3: Format & Render Studio CTA
    let isGif = this.exportFormat === 'gif';
    this.drawButton("Fmt: " + this.exportFormat.toUpperCase(), x + 500, btnY, 80, 32, isGif ? Theme.ACCENT : null);
    
    this.drawButton(this.isRendering ? "Rendering..." : "🎬 Render Studio", x + 590, btnY, 130, 32, Theme.ACCENT);
    
    pop();
    
    // Draw Viewport Framing Preview Box when Render Modal is open
    if (this.showRenderModal) {
      this.drawFramingOverlay();
      this.drawRenderModal();
    }
  }
  
  drawStepper(label, valStr, bx, by) {
    fill(Theme.TEXT_COLOR);
    noStroke();
    textAlign(RIGHT, CENTER);
    textSize(Theme.FONT_SIZE_SMALL);
    text(label, bx, by + 16);
    
    this.drawButton("-", bx + 6, by, 26, 32);
    
    fill(Theme.TEXT_COLOR);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(12);
    text(valStr, bx + 48, by + 16);
    
    this.drawButton("+", bx + 68, by, 26, 32);
  }
  
  drawButton(txt, bx, by, bw, bh, activeCol = null) {
    let isHover = mouseX >= bx && mouseX <= bx + bw && mouseY >= by && mouseY <= by + bh;
    
    if (activeCol === Theme.ACCENT) {
      fill(Theme.ACCENT);
      stroke(Theme.ACCENT);
    } else {
      fill(isHover ? "rgba(0, 0, 0, 0.06)" : "rgba(0, 0, 0, 0.03)");
      stroke(Theme.BORDER);
    }
    
    strokeWeight(1);
    rect(bx, by, bw, bh, 6);
    
    fill(activeCol === Theme.ACCENT ? Theme.BG : Theme.TEXT_COLOR);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(12);
    text(txt, bx + bw/2, by + bh/2);
  }
  
  drawFramingOverlay() {
    let cvsX = hideUI ? 0 : 280;
    let cvsY = hideUI ? 0 : 60;
    let cvsW = hideUI ? width : width - 280;
    let cvsH = hideUI ? height : height - 60;
    
    let preset = this.exportPresets[this.selectedPresetIdx];
    let targetAspect = preset.w / preset.h;
    let canvasAspect = cvsW / cvsH;
    
    let frameW, frameH;
    if (targetAspect > canvasAspect) {
      frameW = cvsW - 60;
      frameH = frameW / targetAspect;
    } else {
      frameH = cvsH - 60;
      frameW = frameH * targetAspect;
    }
    
    let frameX = cvsX + (cvsW - frameW) / 2;
    let frameY = cvsY + (cvsH - frameH) / 2;
    
    push();
    // Semi-transparent viewport mask (soft slate dimming matching Theme)
    fill(43, 45, 66, 120);
    noStroke();
    // Top
    rect(cvsX, cvsY, cvsW, frameY - cvsY);
    // Bottom
    rect(cvsX, frameY + frameH, cvsW, cvsY + cvsH - (frameY + frameH));
    // Left
    rect(cvsX, frameY, frameX - cvsX, frameH);
    // Right
    rect(frameX + frameW, frameY, cvsX + cvsW - (frameX + frameW), frameH);
    
    // Framing Box Border
    noFill();
    stroke(Theme.ACCENT);
    strokeWeight(2);
    rect(frameX, frameY, frameW, frameH, 4);
    
    // Label Badge
    fill(Theme.ACCENT);
    noStroke();
    rect(frameX, frameY - 24, 210, 24, 4);
    fill(Theme.BG);
    textAlign(LEFT, CENTER);
    textSize(11);
    text(`📐 Framing: ${preset.name} (${preset.w}×${preset.h})`, frameX + 8, frameY - 12);
    pop();
  }
  
  drawRenderModal() {
    push();
    // Soft Dim Backdrop
    fill(43, 45, 66, 140);
    noStroke();
    rect(0, 0, width, height);
    
    // Dialog Window
    let modalW = 540;
    let modalH = 430;
    let mx = width / 2 - modalW / 2;
    let my = height / 2 - modalH / 2;
    
    fill(Theme.PANEL_BG);
    stroke(Theme.BORDER);
    strokeWeight(1);
    rect(mx, my, modalW, modalH, 14);
    
    // Header
    fill(Theme.TEXT_COLOR);
    noStroke();
    textAlign(LEFT, TOP);
    textSize(18);
    text("🎬 Render Studio Setup", mx + 25, my + 22);
    
    textSize(13);
    fill(Theme.TEXT_DIM);
    text("Configure video framing, export resolution, and format settings.", mx + 25, my + 48);
    
    // Preset Resolution Options
    let py = my + 78;
    text("EXPORT RESOLUTION PRESETS", mx + 25, py);
    
    let chipY = py + 18;
    let chipH = 34;
    for (let i = 0; i < this.exportPresets.length; i++) {
      let preset = this.exportPresets[i];
      let pYPos = chipY + i * (chipH + 6);
      let isSel = i === this.selectedPresetIdx;
      
      fill(isSel ? "rgba(255, 107, 107, 0.12)" : "rgba(0, 0, 0, 0.03)");
      stroke(isSel ? Theme.ACCENT : Theme.BORDER);
      strokeWeight(isSel ? 1.5 : 1);
      rect(mx + 25, pYPos, modalW - 50, chipH, 8);
      
      fill(Theme.TEXT_COLOR);
      noStroke();
      textAlign(LEFT, CENTER);
      textSize(13);
      text(`${preset.name} (${preset.w} × ${preset.h})`, mx + 40, pYPos + chipH / 2);
      
      textAlign(RIGHT, CENTER);
      fill(Theme.TEXT_DIM);
      textSize(11);
      text(preset.label, mx + modalW - 40, pYPos + chipH / 2);
    }
    
    // Format & Quality Controls Row
    let cfgY = chipY + this.exportPresets.length * (chipH + 6) + 14;
    fill(Theme.TEXT_DIM);
    textAlign(LEFT, TOP);
    textSize(11);
    text("FORMAT & QUALITY", mx + 25, cfgY);
    
    let rowY = cfgY + 18;
    // Format toggle
    let isWebm = this.exportFormat === 'webm';
    this.drawButton(isWebm ? "Format: WebM Video" : "Format: Animated GIF", mx + 25, rowY, 180, 32, isWebm ? Theme.ACCENT : null);
    
    // Quality pass toggle
    let isCrisp = this.exportQualityPass === 1;
    this.drawButton(isCrisp ? "Quality: Crisp Math (Pass 1)" : "Quality: Fast (Pass 2)", mx + 220, rowY, 180, 32);
    
    // Action Buttons Row (Start Baking Video / Cancel)
    let actY = my + modalH - 55;
    stroke(Theme.BORDER);
    strokeWeight(1);
    line(mx + 25, actY - 12, mx + modalW - 25, actY - 12);
    
    this.drawButton("✕ Cancel", mx + 25, actY, 100, 36);
    this.drawButton("🚀 Start Baking Video", mx + 140, actY, modalW - 165, 36, Theme.ACCENT);
    
    pop();
  }
  
  mousePressed() {
    if (this.isRendering) {
       let boxW = 500;
       let boxH = 260;
       let bx = width/2 - boxW/2;
       let by = height/2 - boxH/2;
       let btnW = 140;
       let btnH = 35;
       let btnX = width/2 - btnW/2;
       let btnY = by + 200;
       if (mouseX > btnX && mouseX < btnX + btnW && mouseY > btnY && mouseY < btnY + btnH) {
           this.cancelRender();
       }
       return true;
    }
    
    // Handle Render Modal Interaction
    if (this.showRenderModal) {
      let modalW = 540;
      let modalH = 430;
      let mx = width / 2 - modalW / 2;
      let my = height / 2 - modalH / 2;
      
      let chipY = my + 96;
      let chipH = 34;
      
      // Preset Selection
      for (let i = 0; i < this.exportPresets.length; i++) {
        let pYPos = chipY + i * (chipH + 6);
        if (mouseX >= mx + 25 && mouseX <= mx + modalW - 25 && mouseY >= pYPos && mouseY <= pYPos + chipH) {
          this.selectedPresetIdx = i;
          return true;
        }
      }
      
      // Format & Quality Toggles
      let cfgY = chipY + this.exportPresets.length * (chipH + 6) + 14;
      let rowY = cfgY + 18;
      if (mouseX >= mx + 25 && mouseX <= mx + 205 && mouseY >= rowY && mouseY <= rowY + 32) {
        this.exportFormat = this.exportFormat === 'webm' ? 'gif' : 'webm';
        return true;
      }
      if (mouseX >= mx + 220 && mouseX <= mx + 400 && mouseY >= rowY && mouseY <= rowY + 32) {
        this.exportQualityPass = this.exportQualityPass === 1 ? 2 : 1;
        return true;
      }
      
      // Actions
      let actY = my + modalH - 55;
      // Cancel
      if (mouseX >= mx + 25 && mouseX <= mx + 125 && mouseY >= actY && mouseY <= actY + 36) {
        this.showRenderModal = false;
        return true;
      }
      // Start Baking Video
      if (mouseX >= mx + 140 && mouseX <= mx + modalW - 25 && mouseY >= actY && mouseY <= actY + 36) {
        this.showRenderModal = false;
        this.startRender();
        return true;
      }
      
      return true; // Trap clicks inside modal
    }
    
    if (!this.active) return false;
    let x = hideUI ? 20 : 300;
    let w = hideUI ? width - 40 : width - 320;
    let y = height - this.h - 20;
    let trackX = x + 150;
    let trackY = y + 24;
    let trackW = w - 170;
    let btnY = y + 62;
    
    if (this.isInside(mouseX, mouseY, x + 15, btnY, 90, 32)) { this.addKeyframe(); return true; }
    if (this.isInside(mouseX, mouseY, x + 112, btnY, 65, 32)) { this.isPlaying = !this.isPlaying; return true; }
    if (this.isInside(mouseX, mouseY, x + 184, btnY, 75, 32)) { this.loopColors = !this.loopColors; return true; }
    
    // Length Stepper
    let lenStepX = x + 280;
    if (this.isInside(mouseX, mouseY, lenStepX + 6, btnY, 26, 32)) {
       this.lengthSec = Math.max(1, this.lengthSec - 1);
       this.updateFrames(); return true;
    }
    if (this.isInside(mouseX, mouseY, lenStepX + 68, btnY, 26, 32)) {
       this.lengthSec = Math.min(60, this.lengthSec + 1);
       this.updateFrames(); return true;
    }
    
    // FPS Stepper
    let fpsStepX = x + 395;
    if (this.isInside(mouseX, mouseY, fpsStepX + 6, btnY, 26, 32)) {
       if (this.fps === 60) this.fps = 30;
       else if (this.fps === 30) this.fps = 24;
       else if (this.fps === 24) this.fps = 12;
       this.updateFrames(); return true;
    }
    if (this.isInside(mouseX, mouseY, fpsStepX + 68, btnY, 26, 32)) {
       if (this.fps === 12) this.fps = 24;
       else if (this.fps === 24) this.fps = 30;
       else if (this.fps === 30) this.fps = 60;
       this.updateFrames(); return true;
    }
    
    // Format Toggle
    if (this.isInside(mouseX, mouseY, x + 500, btnY, 80, 32)) {
      this.exportFormat = this.exportFormat === 'webm' ? 'gif' : 'webm';
      return true;
    }
    
    // Open Render Studio Modal
    if (this.isInside(mouseX, mouseY, x + 590, btnY, 130, 32)) {
      this.showRenderModal = true;
      return true;
    }
    
    // Playhead Dragging
    if (mouseY > trackY - 15 && mouseY < trackY + 15 && mouseX > trackX - 15 && mouseX < trackX + trackW + 15) {
      this.draggingPlayhead = true;
      this.isPlaying = false;
      this.playhead = Math.round(constrain(mouseX - trackX, 0, trackW) / trackW * this.frames);
      this.evaluatePlayhead();
      return true;
    }
    
    return false;
  }
  
  mouseDragged() {
    if (this.draggingPlayhead) {
        let x = hideUI ? 20 : 300;
        let w = hideUI ? width - 40 : width - 320;
        let trackX = x + 150;
        let trackW = w - 170;
        this.playhead = Math.round(constrain(mouseX - trackX, 0, trackW) / trackW * this.frames);
        this.evaluatePlayhead();
        return true;
    }
    return false;
  }
  
  mouseReleased() {
    if (this.draggingPlayhead) {
      this.draggingPlayhead = false;
      return true;
    }
    return false;
  }
  
  isInside(mx, my, bx, by, bw, bh) {
    return mx >= bx && mx <= bx + bw && my >= by && my <= by + bh;
  }
  
  updateFrames() {
    let oldFrames = this.frames;
    this.frames = this.lengthSec * this.fps;
    
    let ratio = this.frames / oldFrames;
    for (let k of this.keyframes) {
      k.f = Math.round(k.f * ratio);
    }
    this.playhead = Math.round(this.playhead * ratio);
    this.evaluatePlayhead();
    globalDirty = true;
  }
  
  startRender() {
    if (typeof CCapture === 'undefined') {
       alert("CCapture.js not loaded! Ensure you are connected to the internet.");
       return;
    }
    if (this.isRendering) return;
    
    let preset = this.exportPresets[this.selectedPresetIdx];
    
    // Create dedicated off-screen buffer at exact target resolution!
    if (this.exportBuffer) this.exportBuffer.remove();
    this.exportBuffer = createGraphics(preset.w, preset.h);
    this.exportBuffer.pixelDensity(1);
    
    this.exportCam = new Camera(preset.w, preset.h);
    
    this.isRendering = true;
    this.isPlaying = false;
    this.playhead = 0;
    this.renderStartTime = millis();
    this.evaluatePlayhead();
    
    let options = { framerate: this.fps, display: false };
    if (this.exportFormat === 'gif') {
      options.format = 'gif';
      options.workersPath = 'https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/';
      options.quality = 10;
    } else {
      options.format = 'webm';
    }
    
    this.capturer = new CCapture(options);
    this.capturer.start();
  }
  
  renderFrame() {
    if (!this.isRendering || !this.capturer) return;
    
    this.evaluatePlayhead();
    let pal = paletteManager.current();
    let f = fractals[currentFractalIndex];
    
    // Force quality pass
    f.resolution = this.exportQualityPass;
    
    // Match camera coordinates
    this.exportCam.cx = cam.cx;
    this.exportCam.cy = cam.cy;
    this.exportCam.zoom = cam.zoom;
    
    // Render fractal into target export buffer
    f.render(this.exportBuffer, this.exportCam, pal);
    
    // Capture target buffer canvas element
    this.capturer.capture(this.exportBuffer.elt);
    
    this.playhead++;
    if (this.playhead > this.frames) {
      this.finishRender();
    }
  }
  
  cancelRender() {
    if (!this.isRendering) return;
    this.isRendering = false;
    if (this.capturer) {
      this.capturer.stop();
      this.capturer = null;
    }
    if (this.exportBuffer) {
      this.exportBuffer.remove();
      this.exportBuffer = null;
    }
    globalDirty = true;
  }
  
  finishRender() {
    this.isRendering = false;
    if (this.capturer) {
      this.capturer.stop();
      this.capturer.save();
      this.capturer = null;
    }
    if (this.exportBuffer) {
      this.exportBuffer.remove();
      this.exportBuffer = null;
    }
  }
  
  drawRenderProgress() {
    if (!this.isRendering) return;
    
    fill(43, 45, 66, 140);
    rect(0, 0, width, height);
    
    let boxW = 520;
    let boxH = 270;
    let bx = width/2 - boxW/2;
    let by = height/2 - boxH/2;
    
    fill(Theme.PANEL_BG);
    stroke(Theme.BORDER);
    strokeWeight(1);
    rect(bx, by, boxW, boxH, 14);
    
    fill(Theme.TEXT_COLOR);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(20);
    let preset = this.exportPresets[this.selectedPresetIdx];
    text(`Baking Video (${preset.name} - ${this.exportFormat.toUpperCase()})`, width/2, by + 40);
    
    let barW = 420;
    let barH = 20;
    let barX = width/2 - barW/2;
    let barY = by + 95;
    
    fill("rgba(0, 0, 0, 0.05)");
    stroke(Theme.BORDER);
    strokeWeight(1);
    rect(barX, barY, barW, barH, 10);
    
    let pct = this.playhead / this.frames;
    if (pct > 0) {
      fill(Theme.ACCENT);
      noStroke();
      rect(barX, barY, barW * pct, barH, 10);
    }
    
    textSize(13);
    fill(Theme.TEXT_COLOR);
    text(`Frame: ${this.playhead} / ${this.frames} (${Math.round(pct * 100)}%)`, width/2, barY + 40);
    
    let elapsed = millis() - this.renderStartTime;
    if (this.playhead > 0) {
      let timePerFrame = elapsed / this.playhead;
      let framesLeft = this.frames - this.playhead;
      let etaMs = timePerFrame * framesLeft;
      
      let etaSec = Math.round(etaMs / 1000);
      let mins = Math.floor(etaSec / 60);
      let secs = etaSec % 60;
      text(`Estimated Time Remaining: ${mins}m ${secs}s`, width/2, barY + 70);
    } else {
      text("Calculating time remaining...", width/2, barY + 70);
    }
    
    let btnW = 140;
    let btnH = 36;
    let btnX = width/2 - btnW/2;
    let btnY = by + 205;
    
    this.drawButton("Cancel Render", btnX, btnY, btnW, btnH);
  }
}
