function OBJLoader(gl, gameCanvas) {

  //
  // Variables =================================================
  //

  var objLoader, mesh;
  var matrixLocation, positionLocation, resolutionLocation;
  var shaderProgram, shaderVertex, shaderFragment;
  var bufferVertices;

  var coords = [
    1.000000, -1.000000,
    -1.000000, 1.000000,
    -1.000000, 1.000000,
    -1.000000, -1.000000,
    1.000000, -1.000000,
    -1.000000, -1.000000,
    1.000000, 1.000000,
    -0.999999, 0.999999,
    1.000000, 1.000001,
    -1.000000, 1.000000,
    1.000000, -1.000000,
    1.000000, -1.000000
  ];

  //
  // Public =================================================
  //

  this.init = function() {
    showMessageInfo('[OBJLoader] - init');

    objLoader = new WebGLObjLoader(gl);
    objLoader.parseObject('../../objects/cube.obj');
    mesh = objLoader.setupBuffers();
    showMessage('[OBJLoader] Rendering object - ' + objLoader.objTitle);

    this.initShaders();

    gl.enable(gl.DEPTH_TEST);
  };

  this.changeSettings = function() {
  };

  this.run = function(frames) {
    this.drawScene();
  };

  this.release = function() {
    objLoader.release();
    gl.deleteShader(shaderFragment);
    gl.deleteShader(shaderVertex);
    gl.deleteProgram(shaderProgram);
  };

  this.gameUI_handleKey = function(charCode) {
  };

  //
  // Private =================================================
  //

  this.initShaders = function() {
    showMessageInfo('[OBJLoader] - InitShaders');
    shaderFragment = compileShaderFromSource(gl, "../shaders/objloader.fs", gl.FRAGMENT_SHADER);
    shaderVertex = compileShaderFromSource(gl, "../shaders/objloader.vs", gl.VERTEX_SHADER);

    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, shaderVertex);
    gl.attachShader(shaderProgram, shaderFragment);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS))
      showMessage("Could not initialise shaders");

    gl.useProgram(shaderProgram);

    positionLocation = gl.getAttribLocation(shaderProgram, "a_position");
    resolutionLocation = gl.getUniformLocation(shaderProgram, "u_resolution");

    bufferVertices = gl.createBuffer();
  };

  this.drawScene = function() {
    showMessageInfo('[OBJLoader] - DrawScene');

    gl.uniform2f(resolutionLocation, gameCanvas.width, gameCanvas.height);

    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        1.000000, -1.000000,
        -1.000000, 1.000000,
        -1.000000, 1.000000,
        -1.000000, -1.000000,
        1.000000, -1.000000,
        -1.000000, -1.000000,
        1.000000, 1.000000,
        -0.999999, 0.999999,
        1.000000, 1.000001,
        -1.000000, 1.000000,
        1.000000, -1.000000,
        1.000000, -1.000000
      ]),
      gl.STATIC_DRAW
    );

    gl.drawArrays(gl.TRIANGLES, 0, 12);
    //gl.drawArrays(gl.POINTS, 0, coords.length / 3);
    //gl.drawElements(gl.TRIANGLES, mesh.bufferGeometricVertices.numItems, gl.UNSIGNED_SHORT, 0);
  };
};