var globals = {};

function main() {

  globals.root = document.documentElement;

  globals.rectStrokeWidth = 1;
  globals.rectWidth = 25;
  globals.rectHeight = 25;
  globals.rectStrokeColor = getComputedStyle(globals.root).getPropertyValue('--bg-color');
  globals.gapBetweenRects = 50;

  if (window.matchMedia('(max-width: 600px)').matches) {
    globals.rectWidth = 20;
    globals.rectHeight = 20;
    globals.gapBetweenRects = 40;
  }

  globals.htmlCanvas = document.querySelector("canvas");
  globals.ctx = globals.htmlCanvas.getContext("2d");

  globals.currentMouseX = 0;
  globals.currentMouseY = 0;
  globals.offsetMultipler = 0.05;
  globals.maxOffset = globals.gapBetweenRects * 0.5;

  globals.navItems = document.querySelectorAll('.main--sidenav ul li');
  globals.mainContentItems = document.querySelectorAll('.main--content-item');
  globals.cursor = document.querySelector('#cursor');

  globals.navItemList = document.querySelector('.main--sidenav ul').children;
  globals.numNavItems = globals.navItemList.length;
  let li = document.querySelector('.main--sidenav ul li.selected');
  globals.currentNavItemIndex = [...globals.navItemList].indexOf(li);

  globals.currentlyExpanded = () => document.querySelector('.main').classList.contains('expanded')

  initialize();
  toggleDarkMode(); // swap on first load to initialize state
  moveCursor(document.querySelector('.main--sidenav ul li.selected'));
}

function initialize() {

  window.addEventListener('resize', resizeCanvas, false);

  ['touchstart','touchmove','touchend','mousemove'].forEach(function(e) {
    window.addEventListener(e, movementHandler);
  });

  window.addEventListener('keyup', event => {
    if (event.code === 'Space') {
      toggleDarkMode();
    }
    if (event.code === 'Enter') {
      if (!globals.currentlyExpanded()) toggleMainContent();
      if (globals.currentlyExpanded()) {
        showContentCorrespondingToNavItem(globals.navItemList[globals.currentNavItemIndex]);
      }
    }
    if (event.code === 'Escape') {
      if (globals.currentlyExpanded()) toggleMainContent();
    }
    if (event.code === 'ArrowDown') {
      if (globals.currentNavItemIndex < globals.numNavItems-1) globals.currentNavItemIndex++;
      moveCursor(globals.navItemList[globals.currentNavItemIndex]);
    }
    if (event.code === 'ArrowUp') {
      if (globals.currentNavItemIndex > 0) globals.currentNavItemIndex--;
      moveCursor(globals.navItemList[globals.currentNavItemIndex]);
    }
  })

  globals.navItems.forEach(item => {
    item.addEventListener('click', (e) => showContentCorrespondingToNavItem(e.currentTarget));
    item.addEventListener('touchstart', (e) => showContentCorrespondingToNavItem(e.currentTarget));
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

  let width = document.documentElement.scrollWidth; // rather than window.innerWidth/Height
  let height = document.documentElement.scrollHeight;

  // center coordinates
  let cx = width/2;
  let cy = height/2;

  // draw a rectangle in the exact center
  drawRectangleFromCenter(cx, cy, globals.rectWidth, globals.rectHeight, 'blue', 1);

  // draw mouse rectangle
  // drawRectangle(currentMouseX - rectWidth/2, currentMouseY - rectHeight/2, rectWidth, rectHeight);

  // the math is more complicated here because we always want one rectangle in the exact center; we aren't simply trying to see how many would fit
  let numCols = Math.floor((cx-(globals.rectWidth/2))/(globals.gapBetweenRects+globals.rectWidth))*2+1;
  let numRows = Math.floor((cy-(globals.rectHeight/2))/(globals.gapBetweenRects+globals.rectHeight))*2+1;

  // extend beyond edges of page
  numCols+=2;
  numRows+=2;

  let initialOffsetFromLeft = (width - numCols*globals.rectWidth - (numCols-1)*globals.gapBetweenRects)/2;
  let initialOffsetFromTop = (height - numRows*globals.rectHeight - (numRows-1)*globals.gapBetweenRects)/2;

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
  let width = document.documentElement.scrollWidth; // rather than window.innerWidth/Height
  let height = document.documentElement.scrollHeight;
  globals.htmlCanvas.width = Math.round(width * window.devicePixelRatio);
  globals.htmlCanvas.height = Math.round(height * window.devicePixelRatio);
  globals.htmlCanvas.style.width = `${width}px`;
  globals.htmlCanvas.style.height = `${height}px`;
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
  if (globals.rectStrokeColor.trim() == 'black') {
    globals.root.style.setProperty('--fg-color', 'white');
    globals.root.style.setProperty('--bg-color', 'black');
    globals.rectStrokeColor = 'white';
    document.querySelector('html').classList.add('dark-mode');
    document.querySelector('html').classList.remove('light-mode');
  } else if (globals.rectStrokeColor.trim() == 'white') {
    globals.root.style.setProperty('--fg-color', 'black');
    globals.root.style.setProperty('--bg-color', 'white');
    globals.rectStrokeColor = 'black';
    document.querySelector('html').classList.add('light-mode');
    document.querySelector('html').classList.remove('dark-mode');
  } else {
    console.log('Something is broken with light/dark mode!');
  }
  redraw();
}

function toggleMainContent() {
  let mainContent = document.querySelector('.main');
  if (mainContent.classList.contains('compressed')) {
    mainContent.classList.remove('compressed')
    mainContent.classList.add('expanded')
  } else if (mainContent.classList.contains('expanded')) {
    mainContent.classList.remove('expanded')
    mainContent.classList.add('compressed')
  } else {
    console.log('Something is broken with main content!');
  }
}

function openResume() {
  window.open('./kyle_dumovic_resume_9.11.20.pdf');
}

function showContentCorrespondingToNavItem(listItem) {
  if (listItem.dataset.id == 'resume') {
    openResume();
    return;
  }
  globals.navItems.forEach(item => item.classList.remove('selected'));
  globals.mainContentItems.forEach(content => {
    if (content.dataset.id == listItem.dataset.id) {
      listItem.classList.add('selected');
      globals.currentNavItemIndex = [...globals.navItemList].indexOf(listItem);
      content.classList.remove('hidden');
      content.classList.add('visible');
    } else {
      content.classList.remove('visible');
      content.classList.add('hidden');}
  });
  moveCursor(listItem);
}

function moveCursor(li) {
  if (li.classList.contains('selected')) {
    globals.cursor.classList.add('inverted')
  } else {
    globals.cursor.classList.remove('inverted')
  }
  [...globals.navItemList].forEach(item => item.classList.remove('underline'))
  li.classList.add('underline');
  const elem = li.querySelector('.nav-item--name');
  const linkCoords = elem.getBoundingClientRect();
  const coords = {
    width: linkCoords.width,
    height: linkCoords.height,
    top: linkCoords.top + window.scrollY,
    left: linkCoords.left + window.scrollX
  };
  globals.cursor.style.transform = `translate(${coords.left+coords.width}px, ${coords.top}px)`;
}

window.onload = main();
