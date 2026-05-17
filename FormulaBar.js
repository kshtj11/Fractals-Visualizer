class FormulaBar {
  
  draw() {
    let f = fractals[currentFractalIndex];
    if (!f.formulas || f.formulas.length <= 1) return;
    
    let chipSpace = 16;
    let chipPaddingX = 24;
    
    textSize(Theme.FONT_SIZE_NORMAL);
    let totalW = 0;
    let chipWidths = new Array(f.formulas.length);
    for (let i=0; i<f.formulas.length; i++) {
        chipWidths[i] = textWidth(f.formulas[i]) + chipPaddingX * 2;
        totalW += chipWidths[i];
    }
    totalW += chipSpace * (f.formulas.length - 1);
    
    let startX = 280 + (width - 280) / 2.0 - totalW / 2.0;
    let y = height - 50; 
    
    fill(Theme.PANEL_BG);
    noStroke();
    rect(startX - 15, y - 24, totalW + 30, 48, 24);
    
    textAlign(CENTER, CENTER);
    
    let cx = startX;
    for (let i=0; i<f.formulas.length; i++) {
        let cw = chipWidths[i];
        
        if (i === f.currentFormula) {
            fill(Theme.ACCENT);
            rect(cx, y - 18, cw, 36, 18);
            fill(Theme.BG); 
        } else {
            if (mouseX > cx && mouseX < cx + cw && mouseY > y - 18 && mouseY < y + 18) {
                fill("rgba(0, 0, 0, 0.2)"); 
                rect(cx, y - 18, cw, 36, 18);
            }
            fill(Theme.TEXT_COLOR);
        }
        
        text(f.formulas[i], cx + cw/2.0, y - 2);
        cx += cw + chipSpace;
    }
  }
  
  mousePressed() {
    let f = fractals[currentFractalIndex];
    if (!f.formulas || f.formulas.length <= 1) return;
    
    let chipSpace = 16;
    let chipPaddingX = 24;
    textSize(Theme.FONT_SIZE_NORMAL);
    let totalW = 0;
    let chipWidths = new Array(f.formulas.length);
    for (let i=0; i<f.formulas.length; i++) {
        chipWidths[i] = textWidth(f.formulas[i]) + chipPaddingX * 2;
        totalW += chipWidths[i];
    }
    totalW += chipSpace * (f.formulas.length - 1);
    
    let startX = 280 + (width - 280) / 2.0 - totalW / 2.0;
    let y = height - 50;
    
    let cx = startX;
    for (let i=0; i<f.formulas.length; i++) {
        let cw = chipWidths[i];
        if (mouseX > cx && mouseX < cx + cw && mouseY > y - 18 && mouseY < y + 18) {
            f.setFormula(i);
            return;
        }
        cx += cw + chipSpace;
    }
  }
}
