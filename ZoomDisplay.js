class ZoomDisplay {
  constructor() {
    this.draggingZoom = false;
  }
  
  draw() {
    let boxTargetW = 280;
    let boxH = 65;
    let x = width - boxTargetW - 20;
    let y = 70;
    
    fill(Theme.PANEL_BG);
    noStroke();
    rect(x, y, boxTargetW, boxH, 8);
    
    fill(Theme.TEXT_COLOR);
    textAlign(LEFT, TOP);
    textSize(Theme.FONT_SIZE_NORMAL);
    
    let zoomLabel = (cam.zoom > 1000) ? nfc(Math.round(cam.zoom)) : nf(cam.zoom, 0, 1);
    text("Zoom: " + zoomLabel + "×", x + 15, y + 10);
    
    let sliderW = boxTargetW - 30;
    let sliderX = x + 15;
    let sliderY = y + 40;
    
    stroke(Theme.BORDER);
    strokeWeight(2);
    line(sliderX, sliderY, sliderX + sliderW, sliderY);
    
    let minLog = 2.4; 
    let maxLog = 15; 
    let logZ = Math.log10(cam.zoom);
    if (logZ < minLog) logZ = minLog;
    let t = constrain((logZ - minLog) / (maxLog - minLog), 0, 1);
    let handleX = sliderX + t * sliderW;
    
    stroke(Theme.ACCENT);
    line(sliderX, sliderY, handleX, sliderY);
    
    fill(Theme.ACCENT);
    noStroke();
    ellipse(handleX, sliderY, 12, 12);
  }

  mousePressed() {
    if (hideUI) return;
    let boxTargetW = 280;
    let x = width - boxTargetW - 20;
    let y = 70;
    
    let sliderW = boxTargetW - 30;
    let sliderX = x + 15;
    let sliderY = y + 40;
    
    if (mouseY > sliderY - 15 && mouseY < sliderY + 15 && mouseX > sliderX - 15 && mouseX < sliderX + sliderW + 15) {
      this.draggingZoom = true;
    }
  }
  
  mouseDragged() {
    if (this.draggingZoom) {
      let boxTargetW = 280;
      let x = width - boxTargetW - 20;
      let sliderW = boxTargetW - 30;
      let sliderX = x + 15;
      
      let relativeX = constrain(mouseX - sliderX, 0, sliderW);
      let t = relativeX / sliderW;
      
      let minLog = 2.4;
      let maxLog = 15;
      let targetLog = minLog + t * (maxLog - minLog);
      let newZoom = Math.pow(10, targetLog);
      
      let cvsW = hideUI ? width : width - 280;
      let cvsH = hideUI ? height : height - 60;
      let factor = newZoom / cam.targetZoom;
      cam.zoomAt(cvsW/2, cvsH/2, factor);
    }
  }
  
  mouseReleased() {
    this.draggingZoom = false;
  }
}
