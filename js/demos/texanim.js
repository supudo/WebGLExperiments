function TexAnim(gl, gameCanvas) {

  //
  // Variables =================================================
  //

  var texImage = null;
  var yTranslation = -1;
  var texturesLoaded = false;
  var positionLocation, texCoordLocation, resolutionLocation;

  //
  // Public =================================================
  //

  this.init = function() {
    showMessageInfo('[TexAnim] - init');
    yTranslation = -1;
    this.initShaders();

    loadImages(
      [
        "../images/nebulae0.png"
      ],
      this.initFinished
    );
  };

  this.run = function(frames) {
    if (texturesLoaded) {
      showMessageInfo('[TexAnim] - run');
      yTranslation = frames;
      this.drawScene();
    }
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

  this.initFinished = function(images) {
    showMessageInfo('[TexAnim] - initFinished');
    texImage = images[0];
    texturesLoaded = true;
  };

  this.initShaders = function(gameCanvas) {
    showMessageInfo('[TexAnim] - InitShaders');
    var fragmentShader = compileShaderFromSource(gl, "../shaders/texanim.fs", gl.FRAGMENT_SHADER);
    var vertexShader = compileShaderFromSource(gl, "../shaders/texanim.vs", gl.VERTEX_SHADER);

    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS))
      showMessage("Could not initialise shaders");

    gl.useProgram(shaderProgram);

    positionLocation = gl.getAttribLocation(shaderProgram, "a_position");
    texCoordLocation = gl.getAttribLocation(shaderProgram, "a_texCoord");
    resolutionLocation = gl.getUniformLocation(shaderProgram, "u_resolution");
  };

  this.drawScene = function() {
    showMessageInfo('[TexAnim] - DrawScene');
    var texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        0.0,  0.0,
        1.0,  0.0,
        0.0,  1.0,
        0.0,  1.0,
        1.0,  0.0,
        1.0,  1.0
      ]),
      gl.STATIC_DRAW
    );
    gl.enableVertexAttribArray(texCoordLocation);
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texImage);

    gl.uniform2f(resolutionLocation, gameCanvas.width, gameCanvas.height);

    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    this.setRectangle(0, 0, texImage.width, texImage.height);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  };

  this.setRectangle = function(x, y, width, height) {
    showMessageInfo('[TexAnim] - SetRectangle');
    var x1 = x;
    var x2 = x + 50;
    var y1 = y + yTranslation;
    var y2 = y + yTranslation + 50;

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      x1, y1,
      x2, y1,
      x1, y2,
      x1, y2,
      x2, y1,
      x2, y2]), gl.STATIC_DRAW);
  };
};