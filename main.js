var rectStrokeWidth = 1;
var rectWidth = 25;
var rectHeight = 25;
var rectStrokeColor = '#000';

var gapBetweenRects = 50;

var htmlCanvas = document.querySelector("canvas");
var ctx = htmlCanvas.getContext("2d");

var currentMouseX = 0;
var currentMouseY = 0;
var offsetMultipler = 0.05;
var maxOffset = gapBetweenRects * 0.5;

initialize();

function initialize() {

  window.addEventListener('resize', resizeCanvas, false);

  ['touchstart','touchmove','touchend','mousemove'].forEach(function(e) {
    window.addEventListener(e, movementHandler.bind(this), false);
  });

  function movementHandler(e, currentMouseX, currentMouseY) {
    if (e.type == 'touchstart' || e.type == 'touchmove' || e.type == 'touchend') {
        var evt = (typeof e.originalEvent === 'undefined') ? e : e.originalEvent;
        var touch = evt.touches[0] || evt.changedTouches[0];
        this.currentMouseX = touch.pageX;
        this.currentMouseY = touch.pageY;
        redraw();
    } else if (e.type == 'mousemove') {
        // currentMouseX_perc = evt.clientX / innerWidth;
        // currentMouseY_perc = evt.clientY / innerHeight;
        this.currentMouseX = e.clientX;
        this.currentMouseY = e.clientY;
        redraw();
    }
  }

  // set default to center
  currentMouseX = window.innerWidth/2;
  currentMouseY = window.innerHeight/2;

  resizeCanvas();
}

function redraw() {

  // clear canvas
  ctx.clearRect(0, 0, htmlCanvas.width, htmlCanvas.height);

  // center coordinates
  let cx = window.innerWidth/2;
  let cy = window.innerHeight/2;

  // draw a rectangle in the exact center
  drawRectangleFromCenter(cx, cy, rectWidth, rectHeight, 'blue', 1);

  // draw mouse rectangle
  // drawRectangle(currentMouseX - rectWidth/2, currentMouseY - rectHeight/2, rectWidth, rectHeight);

  // the math is more complicated here because we always want one rectangle in the exact center; we aren't simply trying to see how many would fit
  let numCols = Math.floor((cx-(rectWidth/2))/(gapBetweenRects+rectWidth))*2+1;
  let numRows = Math.floor((cy-(rectHeight/2))/(gapBetweenRects+rectHeight))*2+1;

  let initialOffsetFromLeft = (window.innerWidth - numCols*rectWidth - (numCols-1)*gapBetweenRects)/2;
  let initialOffsetFromTop = (window.innerHeight - numRows*rectHeight - (numRows-1)*gapBetweenRects)/2;

  // draw rows of rectangles from top left
  for (let rowNum = 0; rowNum < numRows; rowNum++) {
    for (let colNum = 0; colNum < numCols; colNum++) {
      let x1 = initialOffsetFromLeft + (colNum * (rectWidth + gapBetweenRects));
      let y1 = initialOffsetFromTop + (rowNum * (rectHeight + gapBetweenRects));
      drawRectanglePair(x1, y1);
    }
  }
}

function resizeCanvas() {
  htmlCanvas.width = window.innerWidth;
  htmlCanvas.height = window.innerHeight;
  redraw();
}

function drawRectangle(x1, y1, width, height, strokeColor, strokeWidth) {
  ctx.beginPath();
  ctx.rect(x1, y1, width, height);
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = strokeWidth;
  ctx.stroke();
}

function drawRectangleFromCenter(cx, cy, width, height, strokeColor, strokeWidth) {
  let x1 = cx - width/2;
  let y1 = cy - height/2;
  drawRectangle(x1, y1, width, height, strokeColor, strokeWidth);
}

// draw a pair of rectangles, starting with a fixed rectangle whose top left corner starts at x1,y1
function drawRectanglePair(f_x1, f_y1) {

  // calculate the offset as a function of current mouse placement by getting the distance between the fixed rectangle and the mouse position

  // dynamic offset
  let xOffset = (currentMouseX - rectWidth/2 - f_x1) * offsetMultipler,
      yOffset = (currentMouseY - rectHeight/2 - f_y1) * offsetMultipler;

  // apply caps to offsets
  xOffset = (Math.abs(xOffset) > maxOffset) ? (Math.sign(xOffset) * maxOffset) : xOffset;
  yOffset = (Math.abs(yOffset) > maxOffset) ? (Math.sign(yOffset) * maxOffset) : yOffset;

  // draw fixed rectangle
  drawRectangle(f_x1, f_y1, rectWidth, rectHeight, rectStrokeColor, rectStrokeWidth);

  // draw offset rectangle
  drawRectangle(f_x1 + xOffset, f_y1 + yOffset, rectWidth, rectHeight, rectStrokeColor, rectStrokeWidth);

  let f_corners = [[f_x1, f_y1],
                   [f_x1 + rectWidth, f_y1],
                   [f_x1 + rectWidth, f_y1 + rectHeight],
                   [f_x1, f_y1 + rectHeight]];

  // connect the corners of each rectange
  f_corners.forEach(drawLineToOffsetCorner);

  function drawLineToOffsetCorner(cornerPair) {
    let startx = cornerPair[0],
        starty = cornerPair[1];
    ctx.beginPath();
    ctx.moveTo(startx, starty);
    ctx.lineTo(startx + xOffset, starty + yOffset);
    ctx.stroke();
  }

}

function toggleDarkMode() {
  if (rectStrokeColor == '#000') {
    rectStrokeColor = '#fff';
    htmlCanvas.style['background-color'] = '#000';
    document.getElementById('dark-mode-btn').innerHTML = 'Light mode!';
  } else {
    rectStrokeColor = '#000';
    htmlCanvas.style['background-color'] = '#fff';
    document.getElementById('dark-mode-btn').innerHTML = 'Dark mode!';
  }
  redraw();
}
