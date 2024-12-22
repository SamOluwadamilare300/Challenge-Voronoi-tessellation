let points = [];
let delaunay, voronoi;
let gloria;
let useColor = false; // Boolean to track color mode
let button;

function preload() {
  gloria = loadImage("verono.png");
}

function setup() {
  createCanvas(600, 532);
  generateRandomPoints(10000); // Increase the number of points for better detail
  delaunay = calculateDelaunay(points);
  voronoi = delaunay.voronoi([0, 0, width, height]);

  // Create a button to toggle color mode
  button = createButton('Toggle Color Mode');
  button.position(10, height + 10);
  button.mousePressed(toggleColorMode);
}

function draw() {
  background(255);
  displayVoronoi();
  updatePoints();
}

function generateRandomPoints(n) {
  for (let i = 0; i < n; i++) {
    let x = random(width);
    let y = random(height);
    let col = gloria.get(x, y);
    if (random(100) > brightness(col)) { // Adjust point generation based on brightness
      points.push(createVector(x, y));
    } else {
      i--;
    }
  }
}

function displayVoronoi() {
  noStroke();
  for (let i = 0; i < points.length; i++) {
    let cell = voronoi.cellPolygon(i);
    if (cell) {
      let col = gloria.get(points[i].x, points[i].y); // Sample color from image at seed point
      if (!useColor) {
        let bright = brightness(col); // Convert to grayscale
        col = color(bright);
      }
      fill(col);
      beginShape();
      for (let [x, y] of cell) {
        vertex(x, y);
      }
      endShape(CLOSE);
    }
  }
}

function updatePoints() {
  let polygons = voronoi.cellPolygons();
  let cells = Array.from(polygons);
  
  let centroids = new Array(cells.length);
  let weights = new Array(cells.length).fill(0);
  for (let i = 0; i < centroids.length; i++) {
    centroids[i] = createVector(0, 0);
  }
  
  gloria.loadPixels();
  let delaunayIndex = 0;
  for (let i = 0; i < width; i++) {
    for (let j = 0; j < height; j++) {
      let index = (i + j * width) * 4;
      let r = gloria.pixels[index + 0];
      let g = gloria.pixels[index + 1];
      let b = gloria.pixels[index + 2];
      let bright = (r + g + b) / 3;
      let weight = 1 - bright / 255;
      delaunayIndex = delaunay.find(i, j, delaunayIndex);
      centroids[delaunayIndex].x += i * weight;
      centroids[delaunayIndex].y += j * weight;
      weights[delaunayIndex] += weight;
    }
  }
  
  for (let i = 0; i < centroids.length; i++) {
    if (weights[i] > 0) {
      centroids[i].div(weights[i]);
    } else {
      centroids[i] = points[i].copy();
    }
  }
  
  for (let i = 0; i < points.length; i++) {
    points[i].lerp(centroids[i], 0.1);
  }
  
  delaunay = calculateDelaunay(points);
  voronoi = delaunay.voronoi([0, 0, width, height]);
}

function calculateDelaunay(points) {
  let pointsArray = [];
  for (let v of points) {
    pointsArray.push(v.x, v.y);
  }
  return new d3.Delaunay(pointsArray);
}

function toggleColorMode() {
  useColor = !useColor; // Toggle the color mode
}