class DimensionDisplay {
  
  draw() {
    let boxTargetW = 280;
    let boxH = 65;
    let x = width - boxTargetW - 20;
    let y = 145;
    
    fill(Theme.PANEL_BG);
    noStroke();
    rect(x, y, boxTargetW, boxH, 8);
    
    let f = fractals[currentFractalIndex];
    
    fill(Theme.TEXT_COLOR);
    textAlign(LEFT, TOP);
    textSize(Theme.FONT_SIZE_NORMAL);
    text("Dimension: " + nf(f.theoreticalDimension, 0, 4), x + 15, y + 10);
    
    fill(Theme.TEXT_DIM);
    textSize(Theme.FONT_SIZE_SMALL);
    
    let formulaMsg = "";
    if (f.name === "Koch Snowflake") formulaMsg = "Formula: log(4) / log(3) @ 60°";
    else if (f.name === "Newton Fractal") formulaMsg = "Root Attractor Boundaries";
    else if (f.name === "Barnsley Fern") formulaMsg = "Approx IFS Dimension: 1.45";
    else if (f.name === "Sierpinski Triangle") formulaMsg = "Formula: log(3) / log(2)";
    else if (f.name === "Mandelbrot Set") formulaMsg = "Boundary is fractal (dim=2)";
    else if (f.name === "Julia Set") formulaMsg = "Varies by parameter c";
    
    text(formulaMsg, x + 15, y + 35);
  }
}
