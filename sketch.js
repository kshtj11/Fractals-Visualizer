let cam;
let fractals = [];
let currentFractalIndex = 0;
let paletteManager;
let paramPanel;
let switcher;
let dimDisplay;
let infoOverlay;
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
  
  mainCanvas.background(Theme.BG);
  fractals[currentFractalIndex].render(mainCanvas, cam, paletteManager.current());
  
  image(mainCanvas, cvsX, cvsY);
  
  if (!hideUI) {
    infoOverlay.draw();
    paramPanel.draw();
    switcher.draw();
    dimDisplay.draw();
    formulaBar.draw();
    gradientEditor.draw();
  }
  
  globalDirty = false;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function resetCam() {
  let f = fractals[currentFractalIndex];
  let dv = f.defaultView();
  cam.setView(dv[0], dv[1], dv[2]);
}

function keyPressed() {
  if (key === 'r' || key === 'R') {
    resetCam();
    fractals[currentFractalIndex].reset();
  }
  if (key === 'h' || key === 'H') {
    hideUI = !hideUI;
  }
}

function mousePressed() {
  if (!hideUI) {
    paramPanel.mousePressed();
    switcher.mousePressed();
    formulaBar.mousePressed();
    gradientEditor.mousePressed();
    infoOverlay.mousePressed();
  }
}

function mouseDragged() {
  if (!hideUI && gradientEditor.draggingStop != null) {
    gradientEditor.mouseDragged();
    return;
  }
  if (!hideUI && paramPanel.draggingParam != null) {
    paramPanel.mouseDragged();
    return; 
  }
  if (!hideUI && infoOverlay.draggingZoom) {
    infoOverlay.mouseDragged();
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
    paramPanel.mouseReleased();
    gradientEditor.mouseReleased();
    infoOverlay.mouseReleased();
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
