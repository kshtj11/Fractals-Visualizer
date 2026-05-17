# Fractal Visualizer 3000

**Fractal Visualizer 3000** is a highly interactive, web-based tool for exploring, manipulating, and understanding complex mathematical fractals. Originally built in Processing (Java), it has been ported 1:1 to **p5.js (JavaScript)**, making it instantly accessible in modern web browsers without requiring local installations.

The product allows users to pan, zoom, tweak parameters, shift formulas, and dynamically remap color palettes across multiple famous fractals in real-time. It's designed to be both aesthetically beautiful—featuring a clean, translucent "glass-like" UI—and highly performant, utilizing off-screen rendering buffers.

---

## 🎨 What Does the Product Do?

- **Real-Time Interactive Exploration**: Pan and zoom smoothly around infinite geometric planes.
- **Multiple Supported Fractals**: Explore the Mandelbrot Set, Julia Set, Newton Fractal, Barnsley Fern, Koch Snowflake, Sierpinski Triangle, and Cantor Set.
- **Live Formula Switching**: Change the underlying mathematical equations (e.g., $z^2+c$ vs. $z^3+c$, or classic vs. slender fern) and watch the shape morph.
- **Interactive Tweakable Parameters**: Adjust iterations, escape radii, complex constants ($C$), jump ratios, or bump angles dynamically using sliders and intuitive radial dials. 
- **Dynamic Gradient Editor**: Interact with color palettes (Sunset Pop, Ocean Breeze, Cotton Candy, Cosmic Pop). Drag and drop color stops directly in the UI to change the rendering mapping instantly.
- **Mathematical Feedback**: Read theoretical fractional dimensions and geometric properties dynamically depending on the current fractal settings.
- **Cinematic Camera Easing (New)**: Panning and zooming now utilize logarithmic easing physics, adding a momentum-driven, buttery smooth feel when navigating the fractal plane. Trackpad pinch-zooming is seamlessly integrated using an exponential curve to match perfectly with your finger velocity without abrupt jumps.
- **Interactive Logarithmic Zoom HUD (New)**: The top navigation bar now features an interactive logarithmic zoom slider. You can visualize the deep zoom level or grab the handle to dynamically teleport into trillions-of-times magnification.
- **Keyframe Animation Studio (New)**: A minimalist Blender-style timeline at the bottom of the screen. Add keyframes to animate your fractal exploration. You can preview animations, loop colors endlessly, and see the exact trajectory of animated sliders directly on the UI via green-to-red gradient markers.
- **High-Definition Video Export (New)**: Completely integrated with `CCapture.js` to render flawless, lag-free 60 FPS WebM animations directly from your browser. The engine automatically freezes interactions and bakes each frame at maximum mathematical resolution.
- **Stretch-and-Refine Caching (New)**: Smooth 60 FPS affine transformations while panning and zooming, with progressive high-definition pixel refinement kicking in exactly when you stop moving.
- **High-DPI Antialiasing (New)**: Native integration with Retina and 4K displays (`pixelDensity`) ensuring perfectly crisp typography and smooth fractal line art without native browser pinch-zooming conflicts.
- **Extreme Performance Boost (New)**: Completely bypasses native p5.js shape rendering (`rect()`) for fractals like Mandelbrot, Julia, and Newton, utilizing direct `loadPixels()` and byte-array memory manipulation coupled with cached Color Lookup Tables (LUTs). This results in near-instant 60 FPS resolution-refinement even on complex fractals.

---

## 💻 How It Works (Code Architecture)

The codebase is built on **p5.js** and adopts a robust **Object-Oriented Design (OOP)**. It separates mathematics, rendering, and UI into modular classes.

### 1. The Core Loop & State (`sketch.js`)
This is the entry point. It initializes all classes, arrays, and UI panels. 
- **`setup()`**: Instantiates the fractals, camera, palette manager, and UI overlays.
- **`draw()`**: Composed of two layers:
  1. The **Fractal Canvas Layer**: Renders the current fractal onto an off-screen `p5.Graphics` buffer. This prevents unnecessary re-draws when UI updates occur.
  2. The **UI Layer**: Renders the HUD, Parameter Panel, Switchers, and Gradient Editor on top of the main canvas.
- Captures global mouse mapping (`mousePressed`, `mouseDragged`, `mouseWheel`) and distributes the events to either the UI elements or the `Camera` (for panning/zooming).

### 2. The Camera System (`Camera.js`)
Manages screen-to-world mapping. Because fractals exist on infinite abstract mathematical planes (e.g., spanning from -2.0 to 2.0), the camera translates literal pixel coordinates into these theoretical ranges and handles scaling (`zoomAt`).

### 3. The Fractal Base Class & Renderers (`Fractal.js` + specific implementations)
Every fractal extends the `Fractal` base class, which establishes a strict contract:
- **`render(g, cam, palette)`**: Computes and draws the math onto the passed `p5.Graphics` buffer.
- **`defaultView()`**: Returns the ideal `[cx, cy, zoom]` starting coordinates.
- **Parameters**: Arrays of `Parameter` objects mapping tweakable properties (e.g., iterations).

**Specific Fractals:**
- **Iterative Escape-Time (`Mandelbrot.js`, `JuliaSet.js`)**: Render pixel-by-pixel using complex mathematics, limiting depth based on iterations and calculating continuous smoothing values for coloring.
- **Root-Finding Attractors (`NewtonFractal.js`)**: Computes polynomial roots and convergence over a grid, drawing hollow cores or vibrant roots.
- **Iterated Function Systems / IFS (`BarnsleyFern.js`, `SierpinskiTriangle.js`)**: Renders thousands of points per frame randomly traversing mathematical maps (Chaos Game).
- **Geometric Recursion (`KochSnowflake.js`, `CantorSet.js`)**: Implements recursive logic over spatial segments.

### 4. Interactive Data & UI Logic
Instead of hardcoding sliders, fractals dynamically register parameters (via `this.addParameter()`).
- **`Parameter.js`**: Data wrapper holding `min`, `max`, `value`, and `isInt`.
- **`ParameterPanel.js`**: Automatically reads the active fractal's parameters. Detects if a parameter represents an "angle" and visually maps it to a radial dial; otherwise, draws a linear slider.
- **`FormulaBar.js` & `FractalSwitcher.js`**: Handle state switches via clickable bounding boxes ("chips").
- **`DimensionDisplay.js` & `InfoOverlay.js`**: Reads static/dynamic attributes (like equations or calculated dimensions) and renders text readouts.

### 5. Color & Aesthetic Pipeline (`ColorPalette.js`, `GradientEditor.js`, `Theme.js`)
- **`Theme.js`**: A static object holding UI colors (Pastel creams, deep slate texts, soft reds).
- **`ColorPalette.js`**: Houses a series of normalized `ColorStop` nodes (0.0 to 1.0). Provides `sample(t)` which natively interpolates between stops using p5.js `lerpColor`.
- **`GradientEditor.js`**: Renders the current color stops as draggable triangles. As users slide a node, `t` values update, instantly sorting the palette array and marking the global state as "dirty" to force a fractal re-render.

---

## 🛠️ Guide for Future Development (AI / Human)

If you wish to modify or extend the app, here are the targeted pipelines:

### Adding a New Fractal
1. **Create `YourFractal.js`**: Extend `Fractal`.
2. **Define Parameters**: Call `this.addParameter("name", min, max, default)` in the constructor.
3. **Write `render()`**: Implement the math logic. Use `cam.screenToWorldX/Y` to convert pixels to the math plane, and map your math results into a normalized $t$ (0 to 1) for the color `palette.sample(t)`. Add optimization flags (`dirty` checking) to only compute pixels when camera or parameters change.
4. **Register**: Add it to `index.html` as a `<script>` tag, and `fractals.push(new YourFractal())` inside `sketch.js`.

### Adding a New Color Palette
1. Open `ColorPalette.js` and extend `ColorPalette`.
2. Push `ColorStop` objects within the constructor.
3. Register your new palette inside `PaletteManager.js` (`this.palettes.push(...)`).

### Modifying the UI
- Global UI styling (fonts, accent colors, panel opacities) is easily modified directly in `Theme.js`.
- For bounding box collisions (like custom buttons), refer to the logic in `mousePressed()` inside components like `FractalSwitcher.js`. The UI does not use DOM buttons; it uses immediate-mode canvas GUI logic.

---
_Converted and Refactored by Antigravity._
