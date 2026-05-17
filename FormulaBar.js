class FormulaBar {
  
  getBounds() {
    let f = fractals[currentFractalIndex];
    let ctaW = 100;
    let ctaSpace = 20;
    
    if (!f.formulas || f.formulas.length <= 1) {
       let cx = 280 + (width - 280) / 2.0;
       let cy = height - 50;
       if (typeof animator !== 'undefined' && animator.active) cy -= (animator.h + 10);
       return { fX: cx, fW: 0, ctaX: cx - ctaW/2, y: cy };
    }
    
    let chipSpace = 16;
    let chipPaddingX = 24;
    textSize(Theme.FONT_SIZE_NORMAL);
    let totalW = 0;
    for (let i=0; i<f.formulas.length; i++) {
        totalW += textWidth(f.formulas[i]) + chipPaddingX * 2;
    }
    totalW += chipSpace * (f.formulas.length - 1);
    
    let groupW = totalW + ctaSpace + ctaW;
    let groupStartX = 280 + (width - 280) / 2.0 - groupW / 2.0;
    
    let y = height - 50;
    if (typeof animator !== 'undefined' && animator.active) y -= (animator.h + 10);
    
    return { fX: groupStartX, fW: totalW, ctaX: groupStartX + totalW + ctaSpace, y: y };
  }

  draw() {
    let f = fractals[currentFractalIndex];
    if (!f.formulas || f.formulas.length <= 1) return;
    
    let b = this.getBounds();
    let chipSpace = 16;
    let chipPaddingX = 24;
    
    textSize(Theme.FONT_SIZE_NORMAL);
    fill(Theme.PANEL_BG);
    noStroke();
    rect(b.fX - 15, b.y - 24, b.fW + 30, 48, 24);
    
    textAlign(CENTER, CENTER);
    let cx = b.fX;
    for (let i=0; i<f.formulas.length; i++) {
        let cw = textWidth(f.formulas[i]) + chipPaddingX * 2;
        if (i === f.currentFormula) {
            fill(Theme.ACCENT);
            rect(cx, b.y - 18, cw, 36, 18);
            fill(Theme.BG); 
        } else {
            if (mouseX > cx && mouseX < cx + cw && mouseY > b.y - 18 && mouseY < b.y + 18) {
                fill("rgba(0, 0, 0, 0.2)"); 
                rect(cx, b.y - 18, cw, 36, 18);
            }
            fill(Theme.TEXT_COLOR);
        }
        text(f.formulas[i], cx + cw/2.0, b.y - 2);
        cx += cw + chipSpace;
    }
  }
  
  mousePressed() {
    let f = fractals[currentFractalIndex];
    if (!f.formulas || f.formulas.length <= 1) return false;
    
    let b = this.getBounds();
    let chipSpace = 16;
    let chipPaddingX = 24;
    textSize(Theme.FONT_SIZE_NORMAL);
    
    let cx = b.fX;
    for (let i=0; i<f.formulas.length; i++) {
        let cw = textWidth(f.formulas[i]) + chipPaddingX * 2;
        if (mouseX > cx && mouseX < cx + cw && mouseY > b.y - 18 && mouseY < b.y + 18) {
            f.setFormula(i);
            return true;
        }
        cx += cw + chipSpace;
    }
    return false;
  }
}
