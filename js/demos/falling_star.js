function FallingStar(gl, gameCanvas) {

  //
  // Variables =================================================
  //

  var yTranslation = -1;
  var starSize = 10;
  var vertices = null;
  var singleX = -1;

  //
  // Public =================================================
  //

  this.init = function() {
    yTranslation = -1;
    singleX = -1;
    this.initShaders();
  };

  this.run = function(frames) {
    yTranslation = frames;
    this.drawScene();
  };

  this.changeSettings = function() {
  };

  this.release = function() {
    //gl.deleteBuffer(someArrayBuffer);
    //gl.deleteTexture(someTexture);
  };

  this.gameUI_handleKey = function(charCode) {
  };

  //
  // Private =================================================
  //

  this.initShaders = function() {
    var fragmentShader = compileShaderFromSource(gl, "../shaders/falling_star.fs", gl.FRAGMENT_SHADER);
    var vertexShader = compileShaderFromSource(gl, "../shaders/falling_star.vs", gl.VERTEX_SHADER);

    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS))
      showMessage("Could not initialise shaders");

    gl.useProgram(shaderProgram);

    var positionLocation = gl.getAttribLocation(shaderProgram, "a_position");
    var resolutionLocation = gl.getUniformLocation(shaderProgram, "u_resolution");
    var colorLocation = gl.getUniformLocation(shaderProgram, "u_color");

    gl.uniform2f(resolutionLocation, gameCanvas.width, gameCanvas.height);

    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.uniform4f(colorLocation, Math.random(), Math.random(), Math.random(), 1);

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.BLEND);

    this.drawScene();
  };

  this.drawScene = function() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    this.setRectangle(yTranslation, starSize, starSize);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  };

  this.setRectangle = function(y, width, height) {
    if (singleX < 0)
      singleX = parseInt(getRandom(gameCanvas.width));
    var x = singleX;
    var x1 = x;
    var x2 = x + width;
    var y1 = y;
    var y2 = y + height;

    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
          x1, y1,
          x2, y1,
          x1, y2,
          x1, y2,
          x2, y1,
          x2, y2
      ]),
      gl.STATIC_DRAW
    );
    //showMessage('update = ' + x1 + ' - ' + y1 + ' - ' + x2 + ' - ' + y2);
  };
}