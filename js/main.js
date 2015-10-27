var currentDemo = null;

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
  gl = WebGLUtils.setupWebGL(gameCanvas);
  gl = WebGLDebugUtils.makeDebugContext(gl, throwOnGLError, logAndValidate);

  if (!gl)
    showMessage("WebGL Context was lost and is NULL!");
  else {
    gl.viewport(0, 0, gameCanvas.width, gameCanvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.BLEND);

    mat4.ortho(0, gameCanvas.width, 0, gameCanvas.height, -1, 1, pMatrix);
    if (demoIndex > 0)
      runGame(gameCanvas);
    else
      release();
  }
}

function release() {
  gl.canvas.width = 1;
  gl.canvas.height = 1;
  currentDemo.release();
}

function runGame(gameCanvas) {
  gl.viewport(0, 0, gameCanvas.width, gameCanvas.height);
  gl.clearColor(0.0, 0.0, 0.0, 0.0);

  if (demoIndex > 0) {
    eval('currentDemo = new ' + availableDemos[demoIndex][1] + '(gl, gameCanvas);');
    currentDemo.init();
  }
  frames = 0;
  setInterval(function() {
    tick(gameCanvas);
  }, 1000 / 30);
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

  leftover = timeSinceLastDoLogic - (catchUpFrameCount * idealTimePerFrame);
  timeAtLastFrame = timeAtThisFrame;
}