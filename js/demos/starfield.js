function Starfield(gl, gameCanvas) {

  //
  // Variables =================================================
  //

  var texturesLoaded = false;
  var yTranslation = -1;

  var starTextures = [];
  var glTextures = [];
  var starTexturesCount = 5;

  var bufferTextures, bufferDrawing;

  var positionLocation, texCoordLocation, resolutionLocation;
  var translationLocation, rotationLocation;

  var shaderProgram;
  var shaderVertex, shaderFragment;

  //
  // Public =================================================
  //

  this.init = function() {
    showMessageInfo('[Starfield] - init');
    //$('#game_background').css("background-image", "url(../images/background0.png)");  

    yTranslation = -1;
    stars = new Array();
    starsVertices = new Array();

    this.initVertices();
    this.initTextures();
    this.initShaders();

    loadImages(
      [
        "../images/star0.png",
        "../images/star1.png",
        "../images/star2.png",
        "../images/star3.png",
        "../images/star4.png"
      ],
      this.starTexturesLoaded
    );
  };

  this.changeSettings = function() {
    showMessageInfo('[Starfield] - changeSettings');
    starsVertices = this.initVertices();
  };

  this.run = function(frames) {
    if (texturesLoaded) {
      showMessageInfo('[Starfield] - run');
      yTranslation = frames;
      this.drawScene();
    }
  };

  this.release = function() {
    for (var i=0; i<glTextures.length; i++) {
      gl.deleteTexture(glTextures[i]);
    }
    gl.deleteShader(shaderFragment);
    gl.deleteShader(shaderVertex);
    gl.deleteBuffer(bufferTextures);
    gl.deleteBuffer(bufferDrawing);
    gl.deleteProgram(shaderProgram);
  };

  //
  // Private =================================================
  //

  this.starTexturesLoaded = function(images) {
    showMessageInfo('[Starfield] - StarTexturesLoaded - init - image loaded');
    starTextures = images;
    texturesLoaded = true;
  };

  this.initShaders = function() {
    showMessageInfo('[Starfield] - InitShaders');
    shaderFragment = compileShaderFromSource(gl, "../shaders/starfield.fs", gl.FRAGMENT_SHADER);
    shaderVertex = compileShaderFromSource(gl, "../shaders/starfield.vs", gl.VERTEX_SHADER);

    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, shaderVertex);
    gl.attachShader(shaderProgram, shaderFragment);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS))
      showMessage("Could not initialise shaders");

    gl.useProgram(shaderProgram);

    positionLocation = gl.getAttribLocation(shaderProgram, "a_position");
    texCoordLocation = gl.getAttribLocation(shaderProgram, "a_texCoord");
    resolutionLocation = gl.getUniformLocation(shaderProgram, "u_resolution");
    translationLocation = gl.getUniformLocation(shaderProgram, "u_translation");
    rotationLocation = gl.getUniformLocation(shaderProgram, "u_rotation");

    bufferTextures = gl.createBuffer();
    bufferDrawing = gl.createBuffer();
  };

  this.drawScene = function() {
    showMessageInfo('[Starfield] - DrawScene');
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferTextures);

    var textureVertices = this.buildStarTextureBuffer();
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureVertices), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(texCoordLocation);
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

    gl.uniform2f(resolutionLocation, gameCanvas.width, gameCanvas.height);

    gl.bindBuffer(gl.ARRAY_BUFFER, bufferDrawing);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    this.updateVertices();
  };

  this.updateVertices = function() {
    showMessageInfo('[Starfield] - UpdateVertices');
    for (var i=0; i<STARS_NUM; i++) {
      star = stars[i];

      var velocity = star.velocity;
      var starSize = star.starSize;
      var texture = star.texture;
      var rotationSpeed = star.rotationSpeed;
      var rotationDirection = star.rotationDirection;
      var rotationAngle = 0;
      if (rotationDirection == 0)
        rotationAngle = star.rotationAngle + 1;
      else
        rotationAngle = star.rotationAngle - 1;
      if (rotationAngle >= 360 || rotationAngle <= -360)
        rotationAngle = 0;

      //star.ranslation[1] = star.translation[1] + 1;
      star.translation[0] = star.x;
      star.translation[1] = star.translation[1] + velocity + 1;
      if (star.translation[1] > gameCanvas.height) {
        star.x = parseInt(getRandom(gameCanvas.width));
        star.y = -1;
        velocity = parseInt(getRandom(STARS_VELOCITY));
        starSize = parseInt(getRandom(STARS_SIZE));
        texture = parseInt(getRandomFromZero(5));
        rotationAngle = 0;
        rotationDirection = parseInt(getRandomFromZero(2));
      }

      this.updateRotation(rotationAngle, rotationDirection, star.rotation);

      star = new Star(star.x, star.y, star.translation, star.rotation, velocity, starSize, texture, rotationSpeed, rotationAngle, rotationDirection);
      stars[i] = star;

      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, starTextures[texture]);

      gl.uniform2fv(translationLocation, star.translation);
      gl.uniform2fv(rotationLocation, star.rotation);

      this.setStarGeometry(star);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      printStar('UPDATE', i, star);
      showMessage('translation = ' + star.translation);
      showMessage('rotation = ' + star.rotation);
    }
  };

  this.initVertices = function() {
    showMessageInfo('[Starfield] - InitVertices');

    var vertices = [];
    for (var i=0; i<STARS_NUM; i++) {
      x = parseInt(getRandom(gameCanvas.width));
      y = parseInt(getRandom(gameCanvas.height));
      var velocity = parseInt(getRandom(STARS_VELOCITY));
      var starSize = (STARS_NUM > 1 ? parseInt(getRandom(STARS_SIZE)) : STARS_SIZE);
      var texture = parseInt(getRandomFromZero(5));
      var rotationSpeed = parseInt(getRandomFromZero(STARS_ROTATION_SPEED));
      var rotationDirection = parseInt(getRandomFromZero(2));
      var translation = [x, y];
      var rotation = [0, 1];

      var star = new Star(x, y, translation, rotation, velocity, starSize, texture, rotationSpeed, 0, rotationDirection);
      stars.push(star);
      //printStar('INIT', i, star);
    }
  };

  this.setStarGeometry = function(star) {
    var x = 0;
    var y = 0;
    var x1 = x;
    var x2 = x + star.starSize;
    var y1 = y;
    var y2 = y + star.starSize;

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
  };

  this.initTextures = function() {
    for (var i=0; i<starTexturesCount; i++) {
      var texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      glTextures[i] = texture;
    }
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  };

  this.buildStarTextureBuffer = function() {
    showMessageInfo('[Starfield] - BuildStarTextureBuffer');
    var vertices = [];
    for (var i=0; i<STARS_NUM; i++) {
      vertices.push(0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0);
    }
    return vertices;
  };

  this.updateRotation = function(angleValue, direction, rotation) {
    var angleInDegrees = 360 - angleValue;
    var angleInRadians = angleInDegrees * Math.PI / 180;
    if (direction == 0) {
      rotation[0] = Math.sin(angleInRadians);
      rotation[1] = Math.cos(angleInRadians);
    }
    else {
      rotation[0] = Math.sin(angleInRadians);
      rotation[1] = Math.cos(angleInRadians);
    }
    return rotation;
  };
};