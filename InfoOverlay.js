class InfoOverlay {
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
  }
}
