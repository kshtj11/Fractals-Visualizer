let cam;
let fractals = [];
let currentFractalIndex = 0;
let paletteManager;
let paramPanel;
let switcher;
let dimDisplay;
let infoOverlay;
let zoomDisplay;
let animator;
let formulaBar;
let gradientEditor;

let hideUI = false;
let globalDirty = false;
let mainCanvas;

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(displayDensity());
  smooth();
  
  fractals.push(new Mandelbrot());
  fractals.push(new JuliaSet());
  fractals.push(new NewtonFractal());
  fractals.push(new BarnsleyFern());
  fractals.push(new KochSnowflake());
  fractals.push(new SierpinskiTriangle());
  
  cam = new Camera(width, height);
  
  paletteManager = new PaletteManager();
  paletteManager.init();
  paramPanel = new ParameterPanel();
  switcher = new FractalSwitcher();
  dimDisplay = new DimensionDisplay();
  infoOverlay = new InfoOverlay();
  zoomDisplay = new ZoomDisplay();
  animator = new Animator();
  formulaBar = new FormulaBar();
  gradientEditor = new GradientEditor();
  
  resetCam(); 
}

function draw() {
  background(Theme.BG);
  
  let cvsX = hideUI ? 0 : 280;
  let cvsY = hideUI ? 0 : 60;
  let cvsW = hideUI ? width : width - 280;
  let cvsH = hideUI ? height : height - 60;
  
  if (!mainCanvas || mainCanvas.width !== cvsW || mainCanvas.height !== cvsH) {
    if (mainCanvas) mainCanvas.remove();
    mainCanvas = createGraphics(cvsW, cvsH);
  }
  
  cam.width = cvsW;
  cam.height = cvsH;
  cam.update();
  
  if (typeof animator !== 'undefined') animator.update();
  
  mainCanvas.background(Theme.BG);
  fractals[currentFractalIndex].render(mainCanvas, cam, paletteManager.current());
  
  image(mainCanvas, cvsX, cvsY);
  
  if (!hideUI) {
    infoOverlay.draw();
    paramPanel.draw();
    switcher.draw();
    zoomDisplay.draw();
    dimDisplay.draw();
    formulaBar.draw();
    gradientEditor.draw();
    
    let b = formulaBar.getBounds();
    let ctaW = 100;
    let ctaH = 40;
    let ctaX = b.ctaX;
    let ctaY = b.y - ctaH / 2;
    
    fill(Theme.PANEL_BG);
    stroke(Theme.BORDER);
    strokeWeight(1);
    rect(ctaX, ctaY, ctaW, ctaH, 20);
    fill(Theme.TEXT_COLOR);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(Theme.FONT_SIZE_NORMAL);
    text("Animate", ctaX + ctaW / 2, ctaY + ctaH / 2);
    
    animator.draw();
  }
  
  if (typeof animator !== 'undefined' && animator.isRendering) {
     animator.capturer.capture(mainCanvas.elt);
     animator.playhead++;
     if (animator.playhead > animator.frames) {
        animator.finishRender();
     } else {
        animator.evaluatePlayhead();
     }
     
     animator.drawRenderProgress();
  }
  
  globalDirty = false;
}

function windowResized() {
  if (typeof animator !== 'undefined' && animator.isRendering) return;
  resizeCanvas(windowWidth, windowHeight);
}

function resetCam() {
  let f = fractals[currentFractalIndex];
  let dv = f.defaultView();
  cam.setView(dv[0], dv[1], dv[2]);
}

function keyPressed() {
  if (typeof animator !== 'undefined' && animator.isRendering) return;
  
  if (key === 'r' || key === 'R') {
    resetCam();
    fractals[currentFractalIndex].reset();
  }
  if (key === 'h' || key === 'H') {
    hideUI = !hideUI;
  }
}

function mousePressed() {
  if (typeof animator !== 'undefined' && animator.isRendering) {
    animator.mousePressed();
    return;
  }
  
  if (!hideUI) {
    let b = formulaBar.getBounds();
    let ctaW = 100;
    let ctaH = 40;
    let ctaX = b.ctaX;
    let ctaY = b.y - ctaH / 2;
    if (mouseX > ctaX && mouseX < ctaX + ctaW && mouseY > ctaY && mouseY < ctaY + ctaH) {
      animator.toggle();
      return;
    }
    
    if (animator.mousePressed()) return;
    if (formulaBar.mousePressed()) return;
    
    paramPanel.mousePressed();
    switcher.mousePressed();
    gradientEditor.mousePressed();
    zoomDisplay.mousePressed();
  }
}

function mouseDragged() {
  if (!hideUI && animator.mouseDragged()) return;
  if (!hideUI && gradientEditor.draggingStop != null) {
    gradientEditor.mouseDragged();
    return;
  }
  if (!hideUI && paramPanel.draggingParam != null) {
    paramPanel.mouseDragged();
    return; 
  }
  if (!hideUI && zoomDisplay.draggingZoom) {
    zoomDisplay.mouseDragged();
    return;
  }
  
  let cvsX = hideUI ? 0 : 280;
  let cvsY = hideUI ? 0 : 40;
  let cvsW = hideUI ? width : width - 280;
  let cvsH = hideUI ? height : height - 100;
  
  if (mouseX >= cvsX && mouseX <= cvsX + cvsW && mouseY >= cvsY && mouseY <= cvsY + cvsH) {
    cam.pan(mouseX - pmouseX, mouseY - pmouseY);
  }
}

function mouseReleased() {
  if (!hideUI) {
    if (animator.mouseReleased()) return;
    paramPanel.mouseReleased();
    gradientEditor.mouseReleased();
    zoomDisplay.mouseReleased();
  }
}

function mouseWheel(event) {
  let e = event.delta;
  let factor = Math.exp(-e * 0.005);
  let cvsX = hideUI ? 0 : 280;
  let cvsY = hideUI ? 0 : 60;
  
  let cvsW = hideUI ? width : width - 280;
  let cvsH = hideUI ? height : height - 60;
  
  if (mouseX >= cvsX && mouseX <= cvsX + cvsW && mouseY >= cvsY && mouseY <= cvsY + cvsH) {
    cam.zoomAt(mouseX - cvsX, mouseY - cvsY, factor);
  }
  
  return false; // Prevents default browser scroll/zoom
}
