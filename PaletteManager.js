class PaletteManager {
  constructor() {
    this.palettes = [];
    this.currentIndex = 0;
  }
  
  init() {
    this.palettes.push(new SunsetPalette());
    this.palettes.push(new OceanBreezePalette());
    this.palettes.push(new CottonCandyPalette());
    this.palettes.push(new CosmicPopPalette());
  }
  
  current() { 
    return this.palettes[this.currentIndex]; 
  }
  
  nextPalette() {
    this.currentIndex = (this.currentIndex + 1) % this.palettes.length;
  }
}
