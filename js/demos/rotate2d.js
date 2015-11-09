function Rotate2D(gl, gameCanvas) {

  //
  // Variables =================================================
  //

  var translation = [100, 150];
  var rotation = [0, 1];
  var scale = [1, 1];
  var animAngle = 0;
  var animFrames = 0;
  var positionLocation, resolutionLocation, colorLocation;
  var translationLocation, rotationLocation, newRotationLocation, matrixLocation;

  //
  // Public =================================================
  //

  this.init = function() {
    showMessageInfo('[Rotate2D] - init');
    this.initShaders();
    translation = [gameCanvas.width / 2, gameCanvas.height / 2];
  };

  this.run = function(frames) {
    showMessageInfo('[Rotate2D] - run');
    animFrames = frames;
    animAngle++;
    if (animAngle >= 360)
      animAngle = 0;
    this.updateAngle(animAngle);
    //drawScene();
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
    showMessageInfo('[Rotate2D] - InitShaders');
    var fragmentShader = compileShaderFromSource(gl, "../shaders/rotate2d.fs", gl.FRAGMENT_SHADER);
    var vertexShader = compileShaderFromSource(gl, "../shaders/rotate2d.vs", gl.VERTEX_SHADER);

    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS))
      showMessage("Could not initialise shaders");

    gl.useProgram(shaderProgram);

    positionLocation = gl.getAttribLocation(shaderProgram, "a_position");
    resolutionLocation = gl.getUniformLocation(shaderProgram, "u_resolution");
    colorLocation = gl.getUniformLocation(shaderProgram, "u_color");
    translationLocation = gl.getUniformLocation(shaderProgram, "u_translation");
    rotationLocation = gl.getUniformLocation(shaderProgram, "u_rotation");
    newRotationLocation = gl.getUniformLocation(shaderProgram, "u_newrotation");
    matrixLocation = gl.getUniformLocation(shaderProgram, "u_matrix");

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.BLEND);
  };

  this.drawScene = function() {
    showMessageInfo('[Rotate2D] - DrawScene');
    gl.uniform2f(resolutionLocation, gameCanvas.clientWidth, gameCanvas.clientHeight);

    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    var v = this.setGeometry(0);
    //gl.uniform1i(newRotationLocation, STARS_DO_ROTATION);
    gl.uniform1i(newRotationLocation, false);

    gl.uniform4f(colorLocation, 1, 1, 1, 1);

    var rads = this.getAngleInRadians(animAngle);

    //translation = [translation[0], translation[1]];
    var moveOriginMatrix = this.makeTranslation(200, 300);
    var translationMatrix = this.makeTranslation(translation[0], translation[1]);
    var rotationMatrix = this.makeRotation(rads);

    var matrix = moveOriginMatrix;
    matrix = this.matrixMultiply(matrix, translationMatrix);
    matrix = this.matrixMultiply(matrix, rotationMatrix);

    gl.uniformMatrix3fv(matrixLocation, false, matrix);

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2fv(translationLocation, translation);
    gl.uniform2fv(rotationLocation, rotation);
    gl.drawArrays(gl.TRIANGLES, 0, v);
  };

  this.getAngleInRadians = function(angle) {
    var angleInDegrees = 360 - angle;
    return angleInDegrees * Math.PI / 180;
  };

  this.updateAngle = function(angle) {
    var angleInDegrees = 360 - angle;
    var angleInRadians = angleInDegrees * Math.PI / 180;
    rotation[0] = Math.sin(angleInRadians);
    rotation[1] = Math.cos(angleInRadians);
    this.drawScene();
  };

  this.setGeometry = function(shapeNum) {
    var v = 0;
    if (shapeNum == 1) {
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([
          // left column
          0, 0,
          30, 0,
          0, 150,
          0, 150,
          30, 0,
          30, 150,

          // top rung
          30, 0,
          100, 0,
          30, 30,
          30, 30,
          100, 0,
          100, 30,

          // middle rung
          30, 60,
          67, 60,
          30, 90,
          30, 90,
          67, 60,
          67, 90]),
        gl.STATIC_DRAW
      );
      v = 18;
    }
    else {
      var x = 0;
      var y = 0;

      var x1 = x;
      var x2 = x + 60;
      var y1 = y;
      var y2 = y + 60;

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
      var output = '';
      output += 'p1 = [' + x1 + ', ' + y1 + ']\n';
      output += 'p2 = [' + x2 + ', ' + y1 + ']\n';
      output += 'p3 = [' + x1 + ', ' + y2 + ']\n';
      output += '-\n';
      output += 'p1 = [' + x1 + ', ' + y2 + ']\n';
      output += 'p2 = [' + x2 + ', ' + y1 + ']\n';
      output += 'p3 = [' + x2 + ', ' + y2 + ']\n';
      showMessage('<pre><code>[Object]' + output + '</code></pre>');
      v = 6;
    }
    return v;
  };

  this.makeTranslation = function(tx, ty) {
    return [
      1, 0, 0,
      0, 1, 0,
      tx, ty, 1
    ];
  };

  this.makeRotation = function(angleInRadians) {
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);
    return [
      c,-s, 0,
      s, c, 0,
      0, 0, 1
    ];
  };

  this.matrixMultiply = function(a, b) {
    var a00 = a[0 * 3 + 0];
    var a01 = a[0 * 3 + 1];
    var a02 = a[0 * 3 + 2];
    var a10 = a[1 * 3 + 0];
    var a11 = a[1 * 3 + 1];
    var a12 = a[1 * 3 + 2];
    var a20 = a[2 * 3 + 0];
    var a21 = a[2 * 3 + 1];
    var a22 = a[2 * 3 + 2];
    var b00 = b[0 * 3 + 0];
    var b01 = b[0 * 3 + 1];
    var b02 = b[0 * 3 + 2];
    var b10 = b[1 * 3 + 0];
    var b11 = b[1 * 3 + 1];
    var b12 = b[1 * 3 + 2];
    var b20 = b[2 * 3 + 0];
    var b21 = b[2 * 3 + 1];
    var b22 = b[2 * 3 + 2];
    return [a00 * b00 + a01 * b10 + a02 * b20,
            a00 * b01 + a01 * b11 + a02 * b21,
            a00 * b02 + a01 * b12 + a02 * b22,
            a10 * b00 + a11 * b10 + a12 * b20,
            a10 * b01 + a11 * b11 + a12 * b21,
            a10 * b02 + a11 * b12 + a12 * b22,
            a20 * b00 + a21 * b10 + a22 * b20,
            a20 * b01 + a21 * b11 + a22 * b21,
            a20 * b02 + a21 * b12 + a22 * b22];
  };
}