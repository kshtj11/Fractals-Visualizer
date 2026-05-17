class Fractal {
  constructor() {
    this.name = "";
    this.equation = "";
    this.theoreticalDimension = 0;
    this.parameters = [];
    
    this.formulas = ["Default"];
    this.currentFormula = 0;
  }

  render(g, cam, palette) {}
  
  reset() {}
  
  defaultView() { return [0, 0, 1]; }
  
  setFormula(index) {
      if (index >= 0 && index < this.formulas.length) {
          this.currentFormula = index;
          this.equation = this.formulas[index];
      }
  }

  addParameter(name, min, max, value, isInt = false) {
    let p = new Parameter(name, min, max, value, isInt);
    this.parameters.push(p);
    return p;
  }

  getParam(name) {
    for (let p of this.parameters) {
      if (p.name === name) return p;
    }
    return null;
  }
}
