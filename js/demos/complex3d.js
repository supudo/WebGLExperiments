function Complex3D(gl, gameCanvas) {

  //
  // Variables =================================================
  //

  var animFrames;
  var matrixLocation, positionLocation, colorLocation;
  var shaderProgram, shaderVertex, shaderFragment;
  var translation = [150, 250, 0];
  var rotation = [0, 0, 0];
  var scale = [1, 1, 1];

  //
  // Public =================================================
  //

  this.init = function() {
    showMessageInfo('[Complex3D] - init');
    animFrames = 0;
    this.initShaders();
  };
   
  this.changeSettings = function() {
  };

  this.run = function(frames) {
    animFrames = frames;
    this.drawScene();
  };

  this.release = function() {
    try {
      gl.deleteShader(shaderFragment);
      gl.deleteShader(shaderVertex);
      gl.deleteProgram(shaderProgram);
    }
    catch (e) {}
  };

  this.gameUI_handleKey = function(charCode) {
  };

  //
  // Private =================================================
  //

  this.initShaders = function() {
    showMessageInfo('[Complex3D] - InitShaders');
    shaderFragment = compileShaderFromSource(gl, "../shaders/complex3d.fs", gl.FRAGMENT_SHADER);
    shaderVertex = compileShaderFromSource(gl, "../shaders/complex3d.vs", gl.VERTEX_SHADER);

    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, shaderVertex);
    gl.attachShader(shaderProgram, shaderFragment);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS))
      showMessage("Could not initialise shaders");

    gl.useProgram(shaderProgram);

    positionLocation = gl.getAttribLocation(shaderProgram, "a_position");
    colorLocation = gl.getAttribLocation(shaderProgram, "a_color");
    matrixLocation = gl.getUniformLocation(shaderProgram, "u_matrix");

    //gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);

    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
    //this.setGeometry3D2();
    //this.setGeometry3D();
    //this.setGeometryComplex();
    //this.setGeometryComplex2();
    //this.setGeometryCube();
    //this.setGeometryX();
    this.setGeometryTorus();

    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(colorLocation);
    gl.vertexAttribPointer(colorLocation, 3, gl.UNSIGNED_BYTE, true, 0, 0);
    this.setColors();
  };

  this.drawScene = function() {
    showMessageInfo('[Complex3D] - DrawScene');

    rotation = [this.degToRad(40), this.degToRad(25), this.degToRad(325)];

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var projectionMatrix = this.make2DProjection(gameCanvas.width, gameCanvas.height, 400);
    var translationMatrix = this.makeTranslation(translation[0], translation[1], translation[2]);
    var rotationXMatrix = this.makeXRotation(rotation[0]);
    var rotationYMatrix = this.makeYRotation(rotation[1] + animFrames / 40);
    var rotationZMatrix = this.makeZRotation(rotation[2] + animFrames / 40);
    var scaleMatrix = this.makeScale(scale[0], scale[1], scale[2]);

    var matrix = this.matrixMultiply(scaleMatrix, rotationZMatrix);
    matrix = this.matrixMultiply(matrix, rotationYMatrix);
    matrix = this.matrixMultiply(matrix, rotationXMatrix);
    matrix = this.matrixMultiply(matrix, translationMatrix);
    matrix = this.matrixMultiply(matrix, projectionMatrix);

    gl.uniformMatrix4fv(matrixLocation, false, matrix);

    //gl.drawArrays(gl.TRIANGLES, 0, 6);
    //gl.drawArrays(gl.TRIANGLES, 0, 16 * 6);
    //gl.drawArrays(gl.TRIANGLES, 0, 20);
    //gl.drawArrays(gl.TRIANGLES, 0, 8);
    //gl.drawArrays(gl.TRIANGLES, 0, 6 * 6);

    var t = 0;
    t = 576;
    //t *= 3;
    gl.drawArrays(gl.TRIANGLES, 0, t);

    //576 / 6 = 96
  };

  this.setGeometryTorus = function() {
    eval(getSourceSynch('../../objects/torus.vertices'));
    var vv = [];
    for (var i=0; i<torusVertices.length; i++) {
      vv.push(torusVertices[i] * 60);
    }
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vv), gl.STATIC_DRAW);
  };

  this.setGeometryX = function() {
    var v = [
      0, 0, 0,
      100, 0, 0,
      0, 100, 0,
      100, 0, 0,
      0, 100, 0,
      100, 100, 0,

      0, 0, 0,
      0, 0, 100,
      0, 100, 0,
      0, 0, 100,
      0, 100, 0,
      0, 100, 100,

      0, 0, 0,
      100, 0, 0,
      0, 0, 100,
      100, 0, 0,
      0, 0, 100,
      100, 0, 100,

      100, 0, 0,
      100, 0, 100,
      100, 100, 0,
      100, 0, 100,
      100, 100, 0,
      100, 100, 100,

      0, 100, 0,
      0, 100, 100,
      100, 100, 0,
      100, 100, 0,
      0, 100, 100,
      100, 100, 100,

      0, 0, 10,
      100, 0, 100,
      0, 100, 100,
      100, 0, 100,
      0, 100, 100,
      100, 100, 100
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(v), gl.STATIC_DRAW);
  };

  this.setGeometryCube = function() {
    var v = [
      1.000000, -1.000000, -1.000000,
      1.000000, -1.000000, 1.000000,
      -1.000000, -1.000000, 1.000000,
      -1.000000, -1.000000, -1.000000,
      1.000000, 1.000000, -0.999999,
      0.999999, 1.000000, 1.000001,
      -1.000000, 1.000000, 1.000000,
      -1.000000, 1.000000, -1.000000
    ];
    var vv = [];
    for (var i=0; i<v.length; i++) {
      vv.push(v[i] * 100);
    }
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vv), gl.STATIC_DRAW);
  };

  this.setGeometryComplex2 = function() {
    var v = [
      0.778618, 0.192053, -1.027196,
      0.778618, -0.544732, 0.972804,
      -1.221382, 0.043105, 0.972804,
      -1.221381, -0.544732, -1.027197,
      0.778619, 1.017574, -1.027196,
      0.778618, 1.455268, 0.972804,
      -1.431565, 1.020429, 1.343192,
      -1.221382, 1.455268, -1.027196,
      0.778618, 0.192053, -1.027196,
      0.778618, -0.544732, 0.972804,
      0.778619, 1.017574, -1.027196,
      0.778618, 1.455268, 0.972804,
      1.240047, 0.192053, -1.027196,
      1.240047, -0.544732, 0.972804,
      1.240048, 1.017574, -1.027196,
      1.240047, 1.455268, 0.972804,
      1.240047, 0.192053, -1.027196,
      1.240047, -0.544732, 0.972804,
      1.240048, 1.017574, -1.027196,
      1.240047, 1.455268, 0.972804
    ];
    var vv = [];
    for (var i=0; i<v.length; i++) {
      vv.push(v[i] * 100);
    }
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vv), gl.STATIC_DRAW);
  };

  this.setGeometryComplex = function() {
    var v = [
      1.072691, 0.144023, -0.134595,
      1.162406, -0.098378, 1.140344,
      -0.521349, 0.128786, 1.687642,
      -0.801506, -0.217783, -0.467189,
      1.162406, 0.681864, -0.379040,
      0.920209, 1.094372, 1.180243,
      -0.789996, 0.681864, 1.140344,
      -0.471252, 1.040888, -0.324441
    ];
    var vv = [];
    for (var i=0; i<v.length; i++) {
      vv.push(v[i] * 100);
    }
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vv), gl.STATIC_DRAW);
    showMessage(vv);
  };

  this.setGeometry3D2 = function() {
   gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        0,   0,  0,
        0, 150,  0,
        30,   0,  0,
        0, 150,  0,
        30, 150,  0,
        30,   0,  0]),
      gl.STATIC_DRAW
    );
  };

  this.setGeometry3D = function() {
   gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        // left column front
        // left column front
          0,   0,  0,
          0, 150,  0,
          30,   0,  0,
          0, 150,  0,
          30, 150,  0,
          30,   0,  0,

          // top rung front
          30,   0,  0,
          30,  30,  0,
          100,   0,  0,
          30,  30,  0,
          100,  30,  0,
          100,   0,  0,

          // middle rung front
          30,  60,  0,
          30,  90,  0,
          67,  60,  0,
          30,  90,  0,
          67,  90,  0,
          67,  60,  0,

          // left column back
            0,   0,  30,
           30,   0,  30,
            0, 150,  30,
            0, 150,  30,
           30,   0,  30,
           30, 150,  30,

          // top rung back
           30,   0,  30,
          100,   0,  30,
           30,  30,  30,
           30,  30,  30,
          100,   0,  30,
          100,  30,  30,

          // middle rung back
           30,  60,  30,
           67,  60,  30,
           30,  90,  30,
           30,  90,  30,
           67,  60,  30,
           67,  90,  30,

          // top
            0,   0,   0,
          100,   0,   0,
          100,   0,  30,
            0,   0,   0,
          100,   0,  30,
            0,   0,  30,

          // top rung front
          100,   0,   0,
          100,  30,   0,
          100,  30,  30,
          100,   0,   0,
          100,  30,  30,
          100,   0,  30,

          // under top rung
          30,   30,   0,
          30,   30,  30,
          100,  30,  30,
          30,   30,   0,
          100,  30,  30,
          100,  30,   0,

          // between top rung and middle
          30,   30,   0,
          30,   60,  30,
          30,   30,  30,
          30,   30,   0,
          30,   60,   0,
          30,   60,  30,

          // top of middle rung
          30,   60,   0,
          67,   60,  30,
          30,   60,  30,
          30,   60,   0,
          67,   60,   0,
          67,   60,  30,

          // front of middle rung
          67,   60,   0,
          67,   90,  30,
          67,   60,  30,
          67,   60,   0,
          67,   90,   0,
          67,   90,  30,

          // bottom of middle rung.
          30,   90,   0,
          30,   90,  30,
          67,   90,  30,
          30,   90,   0,
          67,   90,  30,
          67,   90,   0,

          // front of bottom
          30,   90,   0,
          30,  150,  30,
          30,   90,  30,
          30,   90,   0,
          30,  150,   0,
          30,  150,  30,

          // bottom
          0,   150,   0,
          0,   150,  30,
          30,  150,  30,
          0,   150,   0,
          30,  150,  30,
          30,  150,   0,

          // left side
          0,   0,   0,
          0,   0,  30,
          0, 150,  30,
          0,   0,   0,
          0, 150,  30,
          0, 150,   0]),
      gl.STATIC_DRAW
    );
  };

  this.setColors = function() {
    var colors = [];
    for (var i=0; i<100000; i++) {
      colors.push(200 + i,  70 + i, 120 + i);
      //colors.push(200,  70, 120);
    }
    gl.bufferData(gl.ARRAY_BUFFER, new Uint8Array(colors), gl.STATIC_DRAW);
  };

  this.make2DProjection = function(width, height, depth) {
    return [
       2 / width, 0, 0, 0,
       0, -2 / height, 0, 0,
       0, 0, 2 / depth, 0,
      -1, 1, 0, 1,
    ];
  };

  this.makeTranslation = function(tx, ty, tz) {
    return [
      1,  0,  0,  0,
      0,  1,  0,  0,
      0,  0,  1,  0,
      tx, ty, tz,  1
    ];
  };

  this.makeScale = function(sx, sy, sz) {
    return [
      sx, 0,  0,  0,
      0, sy,  0,  0,
      0,  0, sz,  0,
      0,  0,  0,  1,
    ];
  };

  this.makeXRotation = function(angleInRadians) {
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);
    return [
      1, 0, 0, 0,
      0, c, s, 0,
      0, -s, c, 0,
      0, 0, 0, 1
    ];
  };

  this.makeYRotation = function(angleInRadians) {
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);
    return [
      c, 0, -s, 0,
      0, 1, 0, 0,
      s, 0, c, 0,
      0, 0, 0, 1
    ];
  };

  this.makeZRotation = function(angleInRadians) {
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);
    return [
       c, s, 0, 0,
      -s, c, 0, 0,
       0, 0, 1, 0,
       0, 0, 0, 1,
    ];
  };

  this.radToDeg = function(r) {
    return r * 180 / Math.PI;
  };

  this.degToRad = function(d) {
    return d * Math.PI / 180;
  };

  this.matrixMultiply = function(a, b) {
    var a00 = a[0 * 4 + 0];
    var a01 = a[0 * 4 + 1];
    var a02 = a[0 * 4 + 2];
    var a03 = a[0 * 4 + 3];
    var a10 = a[1 * 4 + 0];
    var a11 = a[1 * 4 + 1];
    var a12 = a[1 * 4 + 2];
    var a13 = a[1 * 4 + 3];
    var a20 = a[2 * 4 + 0];
    var a21 = a[2 * 4 + 1];
    var a22 = a[2 * 4 + 2];
    var a23 = a[2 * 4 + 3];
    var a30 = a[3 * 4 + 0];
    var a31 = a[3 * 4 + 1];
    var a32 = a[3 * 4 + 2];
    var a33 = a[3 * 4 + 3];
    var b00 = b[0 * 4 + 0];
    var b01 = b[0 * 4 + 1];
    var b02 = b[0 * 4 + 2];
    var b03 = b[0 * 4 + 3];
    var b10 = b[1 * 4 + 0];
    var b11 = b[1 * 4 + 1];
    var b12 = b[1 * 4 + 2];
    var b13 = b[1 * 4 + 3];
    var b20 = b[2 * 4 + 0];
    var b21 = b[2 * 4 + 1];
    var b22 = b[2 * 4 + 2];
    var b23 = b[2 * 4 + 3];
    var b30 = b[3 * 4 + 0];
    var b31 = b[3 * 4 + 1];
    var b32 = b[3 * 4 + 2];
    var b33 = b[3 * 4 + 3];
    return [
      a00 * b00 + a01 * b10 + a02 * b20 + a03 * b30,
      a00 * b01 + a01 * b11 + a02 * b21 + a03 * b31,
      a00 * b02 + a01 * b12 + a02 * b22 + a03 * b32,
      a00 * b03 + a01 * b13 + a02 * b23 + a03 * b33,
      a10 * b00 + a11 * b10 + a12 * b20 + a13 * b30,
      a10 * b01 + a11 * b11 + a12 * b21 + a13 * b31,
      a10 * b02 + a11 * b12 + a12 * b22 + a13 * b32,
      a10 * b03 + a11 * b13 + a12 * b23 + a13 * b33,
      a20 * b00 + a21 * b10 + a22 * b20 + a23 * b30,
      a20 * b01 + a21 * b11 + a22 * b21 + a23 * b31,
      a20 * b02 + a21 * b12 + a22 * b22 + a23 * b32,
      a20 * b03 + a21 * b13 + a22 * b23 + a23 * b33,
      a30 * b00 + a31 * b10 + a32 * b20 + a33 * b30,
      a30 * b01 + a31 * b11 + a32 * b21 + a33 * b31,
      a30 * b02 + a31 * b12 + a32 * b22 + a33 * b32,
      a30 * b03 + a31 * b13 + a32 * b23 + a33 * b33
    ];
  };
};