class Parameter {
  constructor(name, min, max, value, isInt = false) {
    this.name = name;
    this.min = min;
    this.max = max;
    this.value = value;
    this.isInt = isInt;
  }
  
  getNormalized(val) {
    if (this.max === this.min) return 0;
    return (val - this.min) / (this.max - this.min);
  }
}
