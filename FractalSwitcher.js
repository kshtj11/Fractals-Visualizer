class FractalSwitcher {
  
  draw() {
    let chipSpace = 16;
    let chipPaddingX = 20;
    
    textSize(Theme.FONT_SIZE_NORMAL);
    let totalW = 0;
    let chipWidths = new Array(fractals.length);
    for (let i = 0; i < fractals.length; i++) {
        chipWidths[i] = textWidth(fractals[i].name) + chipPaddingX * 2;
        totalW += chipWidths[i];
    }
    totalW += chipSpace * (fractals.length - 1);
    
    let startX = width / 2.0 - totalW / 2.0;
    let y = 30; 
    
    noStroke();
    textAlign(CENTER, CENTER);
    
    let cx = startX;
    for (let i = 0; i < fractals.length; i++) {
        let cw = chipWidths[i];
        
        if (i === currentFractalIndex) {
            fill(Theme.ACCENT);
        } else {
            if (mouseX > cx && mouseX < cx + cw && mouseY > y - 18 && mouseY < y + 18) {
                fill("rgba(0, 0, 0, 0.2)");
            } else {
                fill("rgba(0, 0, 0, 0.04)");
            }
        }
        
        rect(cx, y - 18, cw, 36, 18);
        
        if (i === currentFractalIndex) {
            fill(Theme.BG);
        } else {
            fill(Theme.TEXT_COLOR);
        }
        text(fractals[i].name, cx + cw / 2.0, y - 2);
        
        cx += cw + chipSpace;
    }
    
    fill(Theme.TEXT_COLOR);
    textSize(Theme.FONT_SIZE_NORMAL);
    textAlign(RIGHT, CENTER);
    let palName = paletteManager.current().name;
    let palNameWidth = textWidth(palName);
    
    text("Palette: ", width - palNameWidth - 25, 42);
    
    fill(Theme.ACCENT);
    textAlign(RIGHT, CENTER);
    text(palName, width - 20, 42);
  }
  
  mousePressed() {
    let chipSpace = 16;
    let chipPaddingX = 20;
    textSize(Theme.FONT_SIZE_NORMAL);
    let totalW = 0;
    let chipWidths = new Array(fractals.length);
    for (let i = 0; i < fractals.length; i++) {
        chipWidths[i] = textWidth(fractals[i].name) + chipPaddingX * 2;
        totalW += chipWidths[i];
    }
    totalW += chipSpace * (fractals.length - 1);
    
    let startX = width / 2.0 - totalW / 2.0;
    let y = 30;
    
    let cx = startX;
    for (let i = 0; i < fractals.length; i++) {
        let cw = chipWidths[i];
        if (mouseX > cx && mouseX < cx + cw && mouseY > y - 18 && mouseY < y + 18) {
            currentFractalIndex = i;
            resetCam();
            return;
        }
        cx += cw + chipSpace;
    }
    
    if (mouseX > width - 200 && mouseX < width && mouseY > 30 && mouseY < 60) {
        paletteManager.nextPalette();
    }
  }
}
