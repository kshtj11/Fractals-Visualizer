class InfoOverlay {
  constructor() {
    this.draggingZoom = false;
  }
  
  draw() {
    fill(Theme.PANEL_BG);
    noStroke();
    rect(0, 0, width, 60);
    
    let f = fractals[currentFractalIndex];
    fill(Theme.TEXT_COLOR);
    textAlign(LEFT, CENTER);
    textSize(Theme.FONT_SIZE_NORMAL);
    
    let label = "Eq: " + f.equation;
    text(label, 20, 30);
    
    textAlign(RIGHT, CENTER);
    let zoomLabel = (cam.zoom > 1000) ? nfc(Math.round(cam.zoom)) : nf(cam.zoom, 0, 1);
    text("Zoom: " + zoomLabel + "×", width - 200, 30);
    
    let sliderW = 150;
    let sliderX = width - 180;
    let sliderY = 30;
    
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
    let sliderW = 150;
    let sliderX = width - 180;
    let sliderY = 30;
    if (mouseY > sliderY - 15 && mouseY < sliderY + 15 && mouseX > sliderX - 15 && mouseX < sliderX + sliderW + 15) {
      this.draggingZoom = true;
    }
  }
  
  mouseDragged() {
    if (this.draggingZoom) {
      let sliderW = 150;
      let sliderX = width - 180;
      
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
