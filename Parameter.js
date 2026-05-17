class Parameter {
  constructor(name, min, max, value, isInt = false) {
    this.name = name;
    this.min = min;
    this.max = max;
    this.value = value;
    this.isInt = isInt;
  }
}
