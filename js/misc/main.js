var currentDemo = null;
var g_fpsCounter = null;

// WebGL Inspector fix
setDemo(7);

document.onkeydown = gameUI_KeyDown;
document.onkeyup = gameUI_KeyUp;

function gameUI_KeyDown(event) {
  gameUI_PressedKeys[event.keyCode] = true;
  var charCode = (event.which) ? event.which : event.keyCode;
  if (currentDemo != null && typeof currentDemo != "undefined")
    currentDemo.gameUI_handleKey(charCode);
}

function gameUI_KeyUp(event) {
  gameUI_PressedKeys[event.keyCode] = false;
}

function setDemo(index) {
  demoIndex = index;
  showMessage("<u>..... DEMO CHANGED TO " + availableDemos[demoIndex][0] + " .....</u>");
  $('#demo_title').html(availableDemos[demoIndex][0]);
  startGame(demoIndex);
}

function changeSettingsDemo() {
  if (demoIndex > 0)
    currentDemo.changeSettings();
}

function startGame(demoIndex) {
  var gameCanvasJQ = $("#game_canvas");
  var gameCanvas = gameCanvasJQ.get(0);

  gameCanvas.width = gameCanvasJQ.parent().width();
  gameCanvas.height = gameCanvasJQ.parent().height();
  gl = getWebGLContext(gameCanvas);
  gl = WebGLDebugUtils.makeDebugContext(gl, throwOnGLError, logAndValidate);

  if (!gl)
    showMessage("WebGL Context was lost and is NULL!");
  else {
    gl.viewport(0, 0, gameCanvas.width, gameCanvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.BLEND);
    if (availableDemos[demoIndex][4])
      gl.enable(gl.DEPTH_TEST);

    var testsRoutines = new Tests();
    testsRoutines.runTests(gl, gameCanvas);

    mat4.ortho(0, gameCanvas.width, 0, gameCanvas.height, -1, 1, pMatrix);
    if (demoIndex > 0) 
      runGame(gameCanvas);
    else
      release();
  }
}

function release() {
  gameAnimateStop();
  $('#game_background').css("background-image", "url()");
  gl.canvas.width = 1;
  gl.canvas.height = 1;
  if (currentDemo != null && typeof currentDemo != "undefined") {
    currentDemo.release();
    currentDemo = null;
    g_fpsCounter.release();
    g_fpsCounter = null;
  }
}

function runGame(gameCanvas) {
  gl.viewport(0, 0, gameCanvas.width, gameCanvas.height);
  gl.clearColor(0.0, 0.0, 0.0, 0.0);

  if (demoIndex > 0) {
    if (currentDemo != null && typeof currentDemo != "undefined")
      currentDemo.release();
    if (availableDemos[demoIndex][2] == 0)
      eval('currentDemo = new ' + availableDemos[demoIndex][1] + '(gl, gameCanvas);');
    else
      eval('currentDemo = new ' + availableDemos[demoIndex][3] + '.' + availableDemos[demoIndex][1] + '(gl, gameCanvas);');
    currentDemo.init();

    g_fpsCounter = new FPSCounter(10);
    g_fpsCounter.init();
  }
  frames = 0;
  gameAnimateStart(gameCanvas);
  
  //setInterval(function() {
  //  tick(gameCanvas);
  //}, 1000 / maxFPS);
}

function gameAnimateStart(gameCanvas) {
  animatationFrameID = window.requestAnimationFrame(function() {
    tick(gameCanvas);
  });
}

function gameAnimateStop() {
  cancelAnimationFrame(animatationFrameID);
}

function tick(gameCanvas) {
  var timeAtThisFrame = new Date().getTime();
  var timeSinceLastDoLogic = (timeAtThisFrame - timeAtLastFrame) + leftover;
  var catchUpFrameCount = Math.floor(timeSinceLastDoLogic / idealTimePerFrame);

  for (i=0 ; i<catchUpFrameCount; i++) {
    frames++;
  }

  var runCycle = true;
  if (slowMo && (frames % slowMoFrames))
    runCycle = false;

  if (runCycle && demoIndex > 0)
    currentDemo.run(frames);

  if (g_fpsCounter)
    g_fpsCounter.update();

  leftover = timeSinceLastDoLogic - (catchUpFrameCount * idealTimePerFrame);
  timeAtLastFrame = timeAtThisFrame;

  gameAnimateStart(gameCanvas);
}