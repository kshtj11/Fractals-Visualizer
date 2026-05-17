class GradientEditor {
  constructor() {
    this.draggingStop = null;
  }
  
  draw() {
    let w = 280;
    let h = 80;
    let x = width - w - 20;
    let y = 220; 
    
    fill(Theme.PANEL_BG);
    noStroke();
    rect(x, y, w, h, 8);
    
    fill(Theme.TEXT_COLOR);
    textAlign(LEFT, TOP);
    textSize(Theme.FONT_SIZE_NORMAL);
    text("Gradient Stops", x + 15, y + 10);
    
    let pal = paletteManager.current();
    
    let barX = x + 15;
    let barY = y + 35;
    let barW = w - 30;
    let barH = 20;
    
    for(let i=0; i<=barW; i++) {
       let t = i / barW;
       stroke(pal.sample(t));
       line(barX + i, barY, barX + i, barY + barH);
    }
    
    noFill();
    strokeWeight(1);
    stroke(Theme.BORDER);
    rect(barX, barY, barW, barH);
    
    for (let s of pal.stops) {
        let sx = barX + s.t * barW;
        let sy = barY + barH;
        
        fill(s.c);
        stroke(Theme.TEXT_COLOR);
        strokeWeight(1.5);
        triangle(sx, sy, sx - 5, sy + 6, sx + 5, sy + 6);
        rect(sx - 5, sy + 6, 10, 8);
        
        if (s === this.draggingStop) {
           stroke(Theme.ACCENT);
           rect(sx - 6, sy + 5, 12, 10);
        }
    }
  }
  
  mousePressed() {
    if (hideUI) return;
    let pal = paletteManager.current();
    let w = 280;
    let x = width - w - 20;
    let y = 220;
    
    let barX = x + 15;
    let barW = w - 30;
    let barY = y + 35;
    let barH = 20;
    let sy = barY + barH;
    
    for (let i = pal.stops.length - 1; i >= 0; i--) {
        let s = pal.stops[i];
        let sx = barX + s.t * barW;
        if (mouseX >= sx - 8 && mouseX <= sx + 8 && mouseY >= sy && mouseY <= sy + 18) {
            this.draggingStop = s;
            break;
        }
    }
  }
  
  mouseDragged() {
    if (this.draggingStop != null) {
        let w = 280;
        let x = width - w - 20;
        let barX = x + 15;
        let barW = w - 30;
        
        let newT = (mouseX - barX) / barW;
        this.draggingStop.t = constrain(newT, 0, 1);
        
        paletteManager.current().stops.sort((a, b) => a.t - b.t);
        globalDirty = true;
    }
  }
  
  mouseReleased() {
    this.draggingStop = null;
  }
}
