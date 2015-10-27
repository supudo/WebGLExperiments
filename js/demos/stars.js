function Stars(gl, gameCanvas) {

  //
  // Public =================================================
  //

  this.init = function() {
    this.initShaders();
  };

  this.run = function(frames) {
    this.initBuffers();
    this.drawScene();
  };

  this.changeSettings = function() {
  };

  this.release = function() {
    //gl.deleteBuffer(someArrayBuffer);
    //gl.deleteTexture(someTexture);
  };

  //
  // Private =================================================
  //

  this.initShaders = function() {
    var fragmentShader = compileShaderFromSource(gl, "../shaders/stars.fs", gl.FRAGMENT_SHADER);
    var vertexShader = compileShaderFromSource(gl, "../shaders/stars.vs", gl.VERTEX_SHADER);

    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS))
      showMessage("Could not initialise shaders");

    gl.useProgram(shaderProgram);

    shaderProgram.vertexPositionLoc = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(shaderProgram.vertexPositionLoc);

    shaderProgram.pMatrixLoc = gl.getUniformLocation(shaderProgram, "uPMatrix"); 
  };

  this.initBuffers = function() {
    var vertices = this.starsResetVertices();

    starsBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, starsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    starsBuffer.itemSize = 3;
    starsBuffer.numItems = STARS_NUM / 3;
  };

  this.drawScene = function() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.bindBuffer(gl.ARRAY_BUFFER, starsBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionLoc, starsBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.uniformMatrix4fv(shaderProgram.pMatrixLoc, 0, pMatrix);

    gl.drawArrays(gl.POINTS, 0, starsBuffer.numItems);
  };

  this.starsResetVertices = function() {
    var vertices = [];
    for (var i=0; i<STARS_NUM; i++) {
      var star = new Point(parseInt(getRandom(gameCanvas.width)), parseInt(getRandom(gameCanvas.height)), 0);
      vertices.push(star.x, star.y, star.z);
    }
    return vertices;
  };
};