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
  
  createCustomPalette(name = null) {
    let cp = new ColorPalette();
    cp.name = name || ("Custom Palette " + (this.palettes.length + 1));
    cp.addStop(0.0, color(40, 40, 60));
    cp.addStop(0.5, color(240, 100, 120));
    cp.addStop(1.0, color(255, 220, 180));
    this.palettes.push(cp);
    this.currentIndex = this.palettes.length - 1;
    globalDirty = true;
    return cp;
  }

  createPaletteFromImageFile(file) {
    let reader = new FileReader();
    let self = this;
    reader.onload = function(e) {
      let img = new Image();
      img.onload = function() {
        let canvas = document.createElement('canvas');
        let ctx = canvas.getContext('2d');
        canvas.width = 80;
        canvas.height = 80;
        ctx.drawImage(img, 0, 0, 80, 80);
        let data = ctx.getImageData(0, 0, 80, 80).data;
        
        let buckets = {};
        for (let i = 0; i < data.length; i += 4) {
          let r = data[i], g = data[i+1], b = data[i+2], a = data[i+3];
          if (a < 128) continue;
          let key = `${(r >> 4) << 4},${(g >> 4) << 4},${(b >> 4) << 4}`;
          if (!buckets[key]) buckets[key] = { r: r, g: g, b: b, count: 0 };
          buckets[key].count++;
        }
        
        let sorted = Object.values(buckets).sort((a, b) => b.count - a.count);
        let selected = [];
        for (let item of sorted) {
          let distinct = true;
          for (let s of selected) {
            let dist = Math.abs(item.r - s.r) + Math.abs(item.g - s.g) + Math.abs(item.b - s.b);
            if (dist < 75) { distinct = false; break; }
          }
          if (distinct) {
            selected.push(item);
            if (selected.length >= 8) break; // Enforce 8 max colors
          }
        }
        
        if (selected.length < 2) {
          selected = sorted.slice(0, Math.min(8, sorted.length));
        }
        if (selected.length === 0) return;
        
        let imgPal = new ColorPalette();
        imgPal.name = "Auto: " + file.name.substring(0, 10);
        for (let k = 0; k < selected.length; k++) {
          let t = k / (selected.length - 1 || 1);
          imgPal.addStop(t, color(selected[k].r, selected[k].g, selected[k].b));
        }
        
        self.palettes.push(imgPal);
        self.currentIndex = self.palettes.length - 1;
        globalDirty = true;
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
}
