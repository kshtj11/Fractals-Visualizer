class Animator {
  constructor() {
    this.active = false;
    this.h = 130;
    this.lengthSec = 4;
    this.fps = 30;
    this.frames = this.lengthSec * this.fps;
    this.playhead = 0;
    this.keyframes = []; 
    this.isPlaying = false;
    this.loopColors = false;
    
    this.capturer = null;
    this.isRendering = false;
    this.renderStartTime = 0;
    
    this.draggingPlayhead = false;
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
    
    fill(Theme.PANEL_BG);
    noStroke();
    rect(x, y, w, this.h, 8);
    
    let trackX = x + 150;
    let trackY = y + 40;
    let trackW = w - 180;
    
    stroke(Theme.BORDER);
    strokeWeight(10);
    strokeCap(ROUND);
    line(trackX, trackY, trackX + trackW, trackY);
    
    noStroke();
    for (let k of this.keyframes) {
      let kx = trackX + (k.f / this.frames) * trackW;
      fill(Theme.ACCENT);
      if (k.f === this.keyframes[0]?.f) fill('#00FF00');
      else if (k.f === this.keyframes[this.keyframes.length-1]?.f) fill('#FF0000');
      push();
      translate(kx, trackY);
      rotate(PI/4);
      rectMode(CENTER);
      rect(0, 0, 12, 12);
      pop();
    }
    
    let px = trackX + (this.playhead / this.frames) * trackW;
    stroke(Theme.TEXT_COLOR);
    strokeWeight(2);
    line(px, trackY - 15, px, trackY + 15);
    fill(Theme.TEXT_COLOR);
    noStroke();
    triangle(px - 5, trackY - 15, px + 5, trackY - 15, px, trackY - 5);
    
    fill(Theme.TEXT_COLOR);
    textAlign(LEFT, CENTER);
    textSize(Theme.FONT_SIZE_NORMAL);
    text("Frame: " + Math.round(this.playhead) + " / " + this.frames, x + 20, trackY);
    
    this.drawButton("Add Keyframe", x + 20, y + 80, 110, 30);
    this.drawButton(this.isPlaying ? "Stop" : "Play", trackX, y + 80, 80, 30);
    
    let loopCol = this.loopColors ? Theme.ACCENT : Theme.BORDER;
    this.drawButton("Loop Colors", trackX + 100, y + 80, 100, 30, loopCol);
    
    let renderCol = this.isRendering ? '#FF0000' : Theme.BG;
    this.drawButton(this.isRendering ? "Rendering..." : "Render Video", trackX + 220, y + 80, 140, 30, renderCol);
    
    let stepX = trackX + 390;
    this.drawStepper("Length:", this.lengthSec + "s", stepX, y + 80);
    this.drawStepper("FPS:", this.fps, stepX + 170, y + 80);
  }
  
  drawStepper(label, valStr, bx, by) {
    fill(Theme.TEXT_COLOR);
    noStroke();
    textAlign(RIGHT, CENTER);
    text(label, bx - 10, by + 15);
    
    this.drawButton("-", bx, by, 30, 30);
    
    fill(Theme.TEXT_COLOR);
    noStroke();
    textAlign(CENTER, CENTER);
    text(valStr, bx + 55, by + 15);
    
    this.drawButton("+", bx + 80, by, 30, 30);
  }
  
  drawButton(txt, bx, by, bw, bh, col = Theme.BG) {
    fill(col);
    stroke(Theme.BORDER);
    strokeWeight(1);
    rect(bx, by, bw, bh, 4);
    fill(col === Theme.ACCENT || col === '#FF0000' ? '#FFFFFF' : Theme.TEXT_COLOR);
    noStroke();
    textAlign(CENTER, CENTER);
    text(txt, bx + bw/2, by + bh/2);
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
    
    if (!this.active) return false;
    let x = hideUI ? 20 : 300;
    let w = hideUI ? width - 40 : width - 320;
    let y = height - this.h - 20;
    let trackX = x + 150;
    let trackY = y + 40;
    let trackW = w - 180;
    
    if (this.isInside(mouseX, mouseY, x + 20, y + 80, 110, 30)) { this.addKeyframe(); return true; }
    if (this.isInside(mouseX, mouseY, trackX, y + 80, 80, 30)) { this.isPlaying = !this.isPlaying; return true; }
    if (this.isInside(mouseX, mouseY, trackX + 100, y + 80, 100, 30)) { this.loopColors = !this.loopColors; return true; }
    if (this.isInside(mouseX, mouseY, trackX + 220, y + 80, 140, 30)) { this.startRender(); return true; }
    
    let stepX = trackX + 390;
    if (this.isInside(mouseX, mouseY, stepX, y + 80, 30, 30)) {
       this.lengthSec = Math.max(1, this.lengthSec - 1);
       this.updateFrames(); return true;
    }
    if (this.isInside(mouseX, mouseY, stepX + 80, y + 80, 30, 30)) {
       this.lengthSec = Math.min(60, this.lengthSec + 1);
       this.updateFrames(); return true;
    }
    
    let stepX2 = stepX + 170;
    if (this.isInside(mouseX, mouseY, stepX2, y + 80, 30, 30)) {
       if (this.fps === 60) this.fps = 30;
       else if (this.fps === 30) this.fps = 24;
       else if (this.fps === 24) this.fps = 12;
       this.updateFrames(); return true;
    }
    if (this.isInside(mouseX, mouseY, stepX2 + 80, y + 80, 30, 30)) {
       if (this.fps === 12) this.fps = 24;
       else if (this.fps === 24) this.fps = 30;
       else if (this.fps === 30) this.fps = 60;
       this.updateFrames(); return true;
    }
    
    if (mouseY > trackY - 20 && mouseY < trackY + 20 && mouseX > trackX - 20 && mouseX < trackX + trackW + 20) {
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
        let trackW = w - 180;
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
    this.isRendering = true;
    this.isPlaying = false;
    this.playhead = 0;
    this.renderStartTime = millis();
    this.evaluatePlayhead();
    this.capturer = new CCapture({ format: 'webm', framerate: this.fps, display: false });
    this.capturer.start();
  }
  
  cancelRender() {
    if (!this.isRendering) return;
    this.isRendering = false;
    this.capturer.stop();
    this.capturer = null;
    globalDirty = true;
  }
  
  finishRender() {
    this.isRendering = false;
    this.capturer.stop();
    this.capturer.save();
    this.capturer = null;
  }
  
  drawRenderProgress() {
    if (!this.isRendering) return;
    
    fill(0, 0, 0, 150);
    rect(0, 0, width, height);
    
    let boxW = 500;
    let boxH = 260;
    let bx = width/2 - boxW/2;
    let by = height/2 - boxH/2;
    
    fill(Theme.BG);
    stroke(Theme.BORDER);
    strokeWeight(1);
    rect(bx, by, boxW, boxH, 12);
    
    fill(Theme.TEXT_COLOR);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(24);
    text("Rendering Video...", width/2, by + 40);
    
    let barW = 400;
    let barH = 20;
    let barX = width/2 - barW/2;
    let barY = by + 90;
    
    fill(Theme.PANEL_BG);
    stroke(Theme.BORDER);
    strokeWeight(1);
    rect(barX, barY, barW, barH, 10);
    
    let pct = this.playhead / this.frames;
    if (pct > 0) {
      fill(Theme.ACCENT);
      noStroke();
      rect(barX, barY, barW * pct, barH, 10);
    }
    
    textSize(14);
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
    let btnH = 35;
    let btnX = width/2 - btnW/2;
    let btnY = by + 200;
    
    fill('#FF3333');
    rect(btnX, btnY, btnW, btnH, 8);
    fill('#FFF');
    text("Cancel Render", btnX + btnW/2, btnY + btnH/2);
  }
}
