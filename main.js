var globals = {};

function main() {

  globals.root = document.documentElement;

  globals.widthForMobile = 768; // defaults to width of iPad (768px x 1024px)

  globals.rectStrokeWidth = 1;
  globals.rectStrokeColor = 'white'; // defaults to dark mode

  if (matchMedia) {
    const mq = window.matchMedia('(max-width: 600px)');
    mq.addEventListener('change', setDynamicRectGlobals);
    setDynamicRectGlobals(mq);
  }

  function setDynamicRectGlobals(e) { // TODO: Rename -> onResponsiveSwap() e.g.
    if (e.matches) {
      // window width is <600px
      globals.rectWidth = 20;
      globals.rectHeight = 20;
      globals.gapBetweenRects = 40;
    } else {
      // default
      globals.rectWidth = 25;
      globals.rectHeight = 25;
      globals.gapBetweenRects = 50;
    }
    if (globals.htmlCanvas) { // only run on subsequent calls
      resetCanvas();
      resizeCanvas();
    }
  }

  // adjust viewpoint height CSS var (also called in resizeCanvas())
  globals.root.style.setProperty('--vh', `${window.innerHeight/100}px`);

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

  globals.currentlyExpanded = () => document.querySelector('.page--content-container').classList.contains('expanded');

  // Test via a getter in the options object to see if the passive property is accessed
  globals.supportsPassive = false;
  try {
    var opts = Object.defineProperty({}, 'passive', {
      get: function() {
        globals.supportsPassive = true;
      }
    });
    window.addEventListener("testPassive", null, opts);
    window.removeEventListener("testPassive", null, opts);
  } catch (e) {}

  initialize();
}

// TODO: Add Event Listeners for all clickable DOM elements instead of using onclick
function initialize() {

  window.addEventListener('resize', resizeCanvas, false);

  ['touchstart','touchmove','touchend','mousemove'].forEach(function(e) {
    window.addEventListener(e, movementHandler, globals.supportsPassive ? { passive: true } : false);
    // passive for better scroll performance on modern browsers; more here: https://github.com/WICG/EventListenerOptions/blob/gh-pages/explainer.md
  });

  window.addEventListener('keyup', event => {
    if (event.code === 'Space') {
      toggleDarkMode();
    }
    if (event.code === 'Enter') {
      if (!globals.currentlyExpanded()) togglePageContent();
      if (globals.currentlyExpanded()) {
        showContentCorrespondingToNavItem(globals.navItemList[globals.currentNavItemIndex]);
      }
    }
    if (event.code === 'Escape') {
      if (globals.currentlyExpanded()) togglePageContent();
    }
    if (event.code === 'ArrowRight') {
      showContentCorrespondingToNavItem(globals.navItemList[globals.currentNavItemIndex]);
    }
    if (event.code === 'ArrowDown') {
      if (globals.currentNavItemIndex < globals.numNavItems-1) globals.currentNavItemIndex++;
      moveCursorToNavItem(globals.navItemList[globals.currentNavItemIndex]);
    }
    if (event.code === 'ArrowUp') {
      if (globals.currentNavItemIndex > 0) globals.currentNavItemIndex--;
      moveCursorToNavItem(globals.navItemList[globals.currentNavItemIndex]);
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
  drawRectangleFromCenter(cx, cy, globals.rectWidth, globals.rectHeight, globals.rectStrokeColor, globals.rectStrokeWidth);

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

function resetCanvas() {
  globals.htmlCanvas.width = 0;
  globals.htmlCanvas.height = 0;
  globals.htmlCanvas.style.width = '0px';
  globals.htmlCanvas.style.height = '0px';
}

function resizeCanvas() {
  let width = document.documentElement.scrollWidth; // rather than window.innerWidth/Height
  let height = document.documentElement.scrollHeight;
  globals.htmlCanvas.width = Math.round(width * window.devicePixelRatio);
  globals.htmlCanvas.height = Math.round(height * window.devicePixelRatio);
  globals.htmlCanvas.style.width = `${width}px`;
  globals.htmlCanvas.style.height = `${height}px`;
  globals.ctx.scale(window.devicePixelRatio,window.devicePixelRatio); // adjust for retina displays

  // keep cursor in the correct place (may slow things down)
  if (window.innerWidth < globals.widthForMobile) {
    globals.cursor.classList.add('hidden');
  } else if (globals.currentlyExpanded()) {
    globals.cursor.classList.remove('hidden');
    moveCursorToNavItem(globals.navItemList[globals.currentNavItemIndex]);
  }

  // adjust viewpoint height CSS var
  globals.root.style.setProperty('--vh', `${window.innerHeight/100}px`);

  // adjust ascii text size
  let parentWidth = document.querySelector('.main--content').offsetWidth;
  globals.root.style.setProperty('--ascii-font-size', `${parentWidth/215}px`);

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
    console.log('Something is broken swapping between light/dark mode!');
  }
  redraw();
}

function togglePageContent() {
  let pageContentContainer = document.querySelector('.page--content-container');
  if (pageContentContainer.classList.contains('compressed')) {
    globals.cursor.classList.remove('hidden'); // show cursor
    pageContentContainer.classList.remove('compressed');
    pageContentContainer.classList.add('expanded');
    showContentCorrespondingToNavItem(globals.navItemList[globals.currentNavItemIndex]);
  } else if (pageContentContainer.classList.contains('expanded')) {
    globals.cursor.classList.add('hidden'); // hide cursor
    pageContentContainer.classList.remove('expanded');
    pageContentContainer.classList.add('compressed');
  } else {
    console.log('Something is broken with page content container!');
  }
  resetCanvas(); // for mobile edge case
  resizeCanvas(); // for mobile edge case
}

function openResume() {
  window.open('./kyle_dumovic_resume_3.11.21_public.pdf');
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
  moveCursorToNavItem(listItem);
}

function moveCursorToNavItem(listItem) {
  if (listItem.classList.contains('selected')) {
    globals.cursor.classList.add('inverted')
  } else {
    globals.cursor.classList.remove('inverted')
  }
  [...globals.navItemList].forEach(li => li.classList.remove('underline'))
  listItem.classList.add('underline');
  const elem = listItem.querySelector('.nav-item--name');
  moveCursorTo(elem);
}

function moveCursorTo(elem) {
  const linkCoords = elem.getBoundingClientRect();
  const coords = {
    width: linkCoords.width,
    height: linkCoords.height,
    top: linkCoords.top + window.scrollY,
    left: linkCoords.left + window.scrollX
  };
  globals.cursor.style.transform = `translate(${coords.left+coords.width}px, ${coords.top}px)`;
}

main();
