var globals = {};

function main() {

  globals.rectStrokeWidth = 1;
  globals.rectWidth = 25;
  globals.rectHeight = 25;
  globals.rectStrokeColor = '#000';

  globals.gapBetweenRects = 50;

  globals.htmlCanvas = document.querySelector("canvas");
  globals.ctx = globals.htmlCanvas.getContext("2d");

  globals.currentMouseX = 0;
  globals.currentMouseY = 0;
  globals.offsetMultipler = 0.05;
  globals.maxOffset = globals.gapBetweenRects * 0.5;

  initialize();
  toggleDarkMode();
}

function initialize() {

  window.addEventListener('resize', resizeCanvas, false);

  ['touchstart','touchmove','touchend','mousemove'].forEach(function(e) {
    window.addEventListener(e, movementHandler);
  });

  function movementHandler(e, currentMouseX, currentMouseY) {
    if (e.type == 'touchstart' || e.type == 'touchmove' || e.type == 'touchend') {
        var evt = (typeof e.originalEvent === 'undefined') ? e : e.originalEvent;
        var touch = evt.touches[0] || evt.changedTouches[0];
        globals.currentMouseX = touch.pageX;
        globals.currentMouseY = touch.pageY;
        redraw();
    } else if (e.type == 'mousemove') {
        // currentMouseX_perc = evt.clientX / innerWidth;
        // currentMouseY_perc = evt.clientY / innerHeight;
        globals.currentMouseX = e.clientX;
        globals.currentMouseY = e.clientY;
        redraw();
    }
  }

  // set default to center
  globals.currentMouseX = window.innerWidth/2;
  globals.currentMouseY = window.innerHeight/2;

  resizeCanvas();
}

function redraw() {

  // clear canvas
  globals.ctx.clearRect(0, 0, globals.htmlCanvas.width, globals.htmlCanvas.height);

  // center coordinates
  let cx = window.innerWidth/2;
  let cy = window.innerHeight/2;

  // draw a rectangle in the exact center
  drawRectangleFromCenter(cx, cy, globals.rectWidth, globals.rectHeight, 'blue', 1);

  // draw mouse rectangle
  // drawRectangle(currentMouseX - rectWidth/2, currentMouseY - rectHeight/2, rectWidth, rectHeight);

  // the math is more complicated here because we always want one rectangle in the exact center; we aren't simply trying to see how many would fit
  let numCols = Math.floor((cx-(globals.rectWidth/2))/(globals.gapBetweenRects+globals.rectWidth))*2+1;
  let numRows = Math.floor((cy-(globals.rectHeight/2))/(globals.gapBetweenRects+globals.rectHeight))*2+1;

  let initialOffsetFromLeft = (window.innerWidth - numCols*globals.rectWidth - (numCols-1)*globals.gapBetweenRects)/2;
  let initialOffsetFromTop = (window.innerHeight - numRows*globals.rectHeight - (numRows-1)*globals.gapBetweenRects)/2;

  // draw rows of rectangles from top left
  for (let rowNum = 0; rowNum < numRows; rowNum++) {
    for (let colNum = 0; colNum < numCols; colNum++) {
      let x1 = initialOffsetFromLeft + (colNum * (globals.rectWidth + globals.gapBetweenRects));
      let y1 = initialOffsetFromTop + (rowNum * (globals.rectHeight + globals.gapBetweenRects));
      drawRectanglePair(x1, y1);
    }
  }
}

function resizeCanvas() {
  globals.htmlCanvas.width = Math.round(window.innerWidth * window.devicePixelRatio);
  globals.htmlCanvas.height = Math.round(window.innerHeight * window.devicePixelRatio);
  globals.htmlCanvas.style.width = `${window.innerWidth}px`;
  globals.htmlCanvas.style.height = `${window.innerHeight}px`;
  globals.ctx.scale(window.devicePixelRatio,window.devicePixelRatio); // adjust for retina displays

  redraw();
}

function drawRectangle(x1, y1, width, height, strokeColor, strokeWidth) {
  globals.ctx.beginPath();
  globals.ctx.rect(x1, y1, width, height);
  globals.ctx.strokeStyle = strokeColor;
  globals.ctx.lineWidth = strokeWidth;
  globals.ctx.stroke();
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
  let xOffset = (globals.currentMouseX - globals.rectWidth/2 - f_x1) * globals.offsetMultipler,
      yOffset = (globals.currentMouseY - globals.rectHeight/2 - f_y1) * globals.offsetMultipler;

  // apply caps to offsets
  xOffset = (Math.abs(xOffset) > globals.maxOffset) ? (Math.sign(xOffset) * globals.maxOffset) : xOffset;
  yOffset = (Math.abs(yOffset) > globals.maxOffset) ? (Math.sign(yOffset) * globals.maxOffset) : yOffset;

  // draw fixed rectangle
  drawRectangle(f_x1, f_y1, globals.rectWidth, globals.rectHeight, globals.rectStrokeColor, globals.rectStrokeWidth);

  // draw offset rectangle
  drawRectangle(f_x1 + xOffset, f_y1 + yOffset, globals.rectWidth, globals.rectHeight, globals.rectStrokeColor, globals.rectStrokeWidth);

  let f_corners = [[f_x1, f_y1],
                   [f_x1 + globals.rectWidth, f_y1],
                   [f_x1 + globals.rectWidth, f_y1 + globals.rectHeight],
                   [f_x1, f_y1 + globals.rectHeight]];

  // connect the corners of each rectange
  f_corners.forEach(drawLineToOffsetCorner);

  function drawLineToOffsetCorner(cornerPair) {
    let startx = cornerPair[0],
        starty = cornerPair[1];
    globals.ctx.beginPath();
    globals.ctx.moveTo(startx, starty);
    globals.ctx.lineTo(startx + xOffset, starty + yOffset);
    globals.ctx.stroke();
  }

}

function toggleDarkMode() {
  if (globals.rectStrokeColor == '#000') {
    globals.rectStrokeColor = '#fff';
    document.getElementById('dark-mode-btn').innerHTML = 'Light mode!';
    document.querySelector('html').classList.add('dark-mode');
    document.querySelector('html').classList.remove('light-mode');
  } else {
    globals.rectStrokeColor = '#000';
    document.getElementById('dark-mode-btn').innerHTML = 'Dark mode!';
    document.querySelector('html').classList.add('light-mode');
    document.querySelector('html').classList.remove('dark-mode');
  }
  redraw();
}

window.onload = main();
