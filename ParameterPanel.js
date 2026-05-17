class ParameterPanel {
  constructor() {
    this.paramWidth = 180;
    this.draggingParam = null;
  }
  
  calculateParamCenter(target) {
      let f = fractals[currentFractalIndex];
      let py = 80;
      let sortedParams = [...f.parameters];
      sortedParams.sort((a, b) => b.max - a.max);
      
      for (let p of sortedParams) {
          if (p === target) {
              if (p.name.toLowerCase().includes("angle")) return py + 45;
              return py + 25;
          }
          if (p.name.toLowerCase().includes("angle")) py += 85; else py += 55;
      }
      return py;
  }
  
  draw() {
    fill(Theme.PANEL_BG);
    noStroke();
    rect(0, 60, 280, height - 60);
    
    let f = fractals[currentFractalIndex];
    let py = 80; 
    
    let sortedParams = [...f.parameters];
    sortedParams.sort((a, b) => b.max - a.max);
    
    for (let p of sortedParams) {
      fill(Theme.TEXT_COLOR);
      textSize(Theme.FONT_SIZE_NORMAL);
      textAlign(LEFT, TOP);
      
      let valStr = p.isInt ? Math.round(p.value).toString() : nf(p.value, 0, 3);
      
      if (p.name.toLowerCase().includes("angle")) {
          text(p.name + ":", 20, py);
          
          let cx = 50;
          let cy = py + 45;
          let r = 24;
          
          noFill();
          strokeWeight(4);
          stroke(Theme.BORDER);
          ellipse(cx, cy, r*2, r*2); 
          
          let normVal = (p.value - p.min) / (p.max - p.min);
          stroke(Theme.ACCENT);
          if (normVal > 0) {
              arc(cx, cy, r*2, r*2, -HALF_PI, -HALF_PI + normVal * TWO_PI);
          }
          
          let kx = cx + r * cos(-HALF_PI + normVal * TWO_PI);
          let ky = cy + r * sin(-HALF_PI + normVal * TWO_PI);
          fill(Theme.ACCENT);
          noStroke();
          ellipse(kx, ky, 12, 12);
          
          fill(Theme.TEXT_COLOR);
          textAlign(LEFT, CENTER);
          textSize(Theme.FONT_SIZE_NORMAL);
          text(valStr + "°", cx + r + 20, cy);
          
          py += 85;
      } else {
          text(p.name + ": " + valStr, 20, py);
          
          let sx = 20;
          let sy = py + 25;
          let sw = this.paramWidth;
          
          stroke(Theme.BORDER);
          strokeWeight(4);
          strokeCap(ROUND);
          line(sx, sy, sx + sw, sy);
          
          if (typeof animator !== 'undefined' && animator.active && animator.keyframes.length > 0) {
             let startVal = animator.keyframes[0].state.params[p.name];
             let endVal = animator.keyframes[animator.keyframes.length - 1].state.params[p.name];
             if (startVal !== undefined && endVal !== undefined && startVal !== endVal) {
                let tStart = p.getNormalized(startVal);
                let tEnd = p.getNormalized(endVal);
                let xStart = sx + tStart * sw;
                let xEnd = sx + tEnd * sw;
                
                let ctx = drawingContext;
                let grad = ctx.createLinearGradient(xStart, sy, xEnd, sy);
                grad.addColorStop(0, '#00FF00'); // Green
                grad.addColorStop(0.5, '#FFFF00'); // Yellow
                grad.addColorStop(1, '#FF0000'); // Red
                
                ctx.strokeStyle = grad;
                ctx.beginPath();
                ctx.moveTo(xStart, sy);
                ctx.lineTo(xEnd, sy);
                ctx.stroke();
                
                noStroke();
                fill('#00FF00'); ellipse(xStart, sy, 6, 6);
                fill('#FF0000'); ellipse(xEnd, sy, 6, 6);
             }
          }
          
          let t = (p.value - p.min) / (p.max - p.min);
          let handleX = 20 + this.paramWidth * t;
          
          stroke(Theme.ACCENT);
          noStroke();
          ellipse(handleX, sy, 12, 12);
          
          py += 55;
      }
    }
  }

  mousePressed() {
    if (hideUI) return;
    
    if (mouseX > 0 && mouseX < 280 && mouseY > 60) {
      let f = fractals[currentFractalIndex];
      let py = 80;
      
      let sortedParams = [...f.parameters];
      sortedParams.sort((a, b) => b.max - a.max);
      
      for (let p of sortedParams) {
        if (p.name.toLowerCase().includes("angle")) {
            let cx = 50;
            let cy = py + 45;
            if (dist(mouseX, mouseY, cx, cy) < 35) { 
                this.draggingParam = p;
                break;
            }
            py += 85;
        } else {
            let sliderY = py + 25;
            if (mouseY > sliderY - 15 && mouseY < sliderY + 15 && mouseX < 20 + this.paramWidth + 15) {
              this.draggingParam = p;
              break;
            }
            py += 55;
        }
      }
    }
  }

  mouseDragged() {
    if (this.draggingParam != null) {
      if (this.draggingParam.name.toLowerCase().includes("angle")) {
          let cy = this.calculateParamCenter(this.draggingParam);
          let cx = 50;
          
          let a = atan2(mouseY - cy, mouseX - cx); 
          let mappedValue = degrees(a + HALF_PI);
          if (mappedValue < 0) mappedValue += 360; 
          
          let normAngle = mappedValue / 360.0;
          let val = this.draggingParam.min + normAngle * (this.draggingParam.max - this.draggingParam.min);
          
          if (this.draggingParam.isInt) val = Math.round(val);
          this.draggingParam.value = constrain(val, this.draggingParam.min, this.draggingParam.max);
      } else {
          let relativeX = constrain(mouseX - 20, 0, this.paramWidth);
          let t = relativeX / this.paramWidth;
          let val = lerp(this.draggingParam.min, this.draggingParam.max, t);
          if (this.draggingParam.isInt) val = Math.round(val);
          this.draggingParam.value = constrain(val, this.draggingParam.min, this.draggingParam.max);
      }
    }
  }

  mouseReleased() {
    this.draggingParam = null;
  }
}
