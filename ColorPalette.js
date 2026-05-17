class ColorStop {
  constructor(t, c) {
    this.t = t;
    this.c = c;
  }
}

class ColorPalette {
  constructor() {
    this.name = "";
    this.stops = [];
  }
  
  sample(t) {
    t = constrain(t, 0, 1);
    if (this.stops.length === 0) return color(0);
    if (this.stops.length === 1) return this.stops[0].c;
    
    if (t <= this.stops[0].t) return this.stops[0].c;
    if (t >= this.stops[this.stops.length-1].t) return this.stops[this.stops.length-1].c;
    
    for (let i=0; i<this.stops.length-1; i++) {
        let s1 = this.stops[i];
        let s2 = this.stops[i+1];
        if (t >= s1.t && t <= s2.t) {
            let range = s2.t - s1.t;
            if (range <= 0) return s1.c;
            let normT = (t - s1.t) / range;
            return lerpColor(s1.c, s2.c, normT);
        }
    }
    return this.stops[this.stops.length-1].c;
  }
}

class SunsetPalette extends ColorPalette {
  constructor() { 
    super();
    this.name = "Sunset Pop"; 
    this.stops.push(new ColorStop(0.00, color(253, 226, 228)));
    this.stops.push(new ColorStop(0.25, color(255, 181, 167)));
    this.stops.push(new ColorStop(0.50, color(255, 137, 137)));
    this.stops.push(new ColorStop(0.75, color(252, 255, 178)));
    this.stops.push(new ColorStop(1.00, color(0, 204, 255)));
  }
}

class OceanBreezePalette extends ColorPalette {
  constructor() { 
    super();
    this.name = "Ocean Breeze"; 
    this.stops.push(new ColorStop(0.00, color(224, 251, 252)));
    this.stops.push(new ColorStop(0.25, color(152, 193, 217)));
    this.stops.push(new ColorStop(0.50, color(61, 90, 128)));
    this.stops.push(new ColorStop(0.75, color(238, 108, 77)));
    this.stops.push(new ColorStop(1.00, color(41, 50, 65)));
  }
}

class CottonCandyPalette extends ColorPalette {
  constructor() { 
    super();
    this.name = "Cotton Candy"; 
    this.stops.push(new ColorStop(0.00, color(255, 209, 220)));
    this.stops.push(new ColorStop(0.25, color(203, 195, 227)));
    this.stops.push(new ColorStop(0.50, color(174, 217, 224)));
    this.stops.push(new ColorStop(0.75, color(255, 105, 180)));
    this.stops.push(new ColorStop(1.00, color(106, 13, 173)));
  }
}

class CosmicPopPalette extends ColorPalette {
  constructor() { 
    super();
    this.name = "Cosmic Pop"; 
    this.stops.push(new ColorStop(0.00, color(43, 45, 66)));
    this.stops.push(new ColorStop(0.25, color(141, 153, 174)));
    this.stops.push(new ColorStop(0.50, color(237, 242, 244)));
    this.stops.push(new ColorStop(0.75, color(239, 35, 60)));
    this.stops.push(new ColorStop(1.00, color(217, 4, 41)));
  }
}
