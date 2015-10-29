function Hypersuit(gl, gameCanvas) {

  //
  // Variables =================================================
  //

  var texturesLoaded = false;
  var yTranslation = -1;

  var allTexturesImages = 
    [
      "../images/star0.png",
      "../images/star1.png",
      "../images/star2.png",
      "../images/star3.png",
      "../images/star4.png",
      "../images/bullet1_1.png",
      "../images/player1.png"
    ];

  var allTextures = [];
  var glTextures = [];

  var player, bullets, bulletsCounter = 0;

  var bufferTextures, bufferDrawingStars, bufferDrawingPlayer;

  var positionLocation, resolutionLocation, texCoordLocation, matrixLocation;

  var shaderProgram;
  var shaderVertex, shaderFragment;

  //
  // Public =================================================
  //

  this.init = function() {
    showMessageInfo('[Hypersuit] - init');
    $('#game_background').css("background-image", "url(../images/background0.png)");  

    yTranslation = -1;
    stars = new Array();
    starsVertices = new Array();

    this.initStars();
    this.initPlayer();
    this.initBullets();
    this.initTextures();
    this.initShaders();

    loadImages(allTexturesImages, this.starTexturesLoaded);
  };

  this.changeSettings = function() {
    showMessageInfo('[Hypersuit] - changeSettings');
    starsVertices = this.initVertices();
  };

  this.run = function(frames) {
    if (texturesLoaded) {
      showMessageInfo('[Hypersuit] - run');
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
    gl.deleteBuffer(bufferDrawingStars);
    gl.deleteBuffer(bufferDrawingPlayer);
    gl.deleteProgram(shaderProgram);
  };

  this.gameUI_handleKey = function(charCode) {
    if (texturesLoaded) {
      if (charCode == 32) // spacebar
        bulletsCounter++;
      else if (charCode == 37) // left
        this.player.x = this.player.x - PlayerMovement;
      else if (charCode == 38) // up
        this.player.y = this.player.y - PlayerMovement;
      else if (charCode == 39) // right
        this.player.x = this.player.x + PlayerMovement;
      else if (charCode == 40) // down
        this.player.y = this.player.y + PlayerMovement;
      this.updateBullets();
      this.updatePlayer(true);
    }
  };

  //
  // Private =================================================
  //

  this.starTexturesLoaded = function(images) {
    showMessageInfo('[Hypersuit] - StarTexturesLoaded - init - image loaded');
    allTextures = images;
    texturesLoaded = true;
  };

  this.initShaders = function() {
    showMessageInfo('[Hypersuit] - InitShaders');
    shaderFragment = compileShaderFromSource(gl, "../shaders/hypersuit.fs", gl.FRAGMENT_SHADER);
    shaderVertex = compileShaderFromSource(gl, "../shaders/hypersuit.vs", gl.VERTEX_SHADER);

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
    matrixLocation = gl.getUniformLocation(shaderProgram, "u_matrix");

    bufferTextures = gl.createBuffer();
    bufferDrawingStars = gl.createBuffer();
    bufferDrawingPlayer = gl.createBuffer();
  };

  this.drawScene = function() {
    showMessageInfo('[Hypersuit] - DrawScene');
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferTextures);

    var textureVertices = this.buildStarTextureBuffer();
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureVertices), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(texCoordLocation);
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

    gl.uniform2f(resolutionLocation, gameCanvas.width, gameCanvas.height);

    gl.bindBuffer(gl.ARRAY_BUFFER, bufferDrawingStars);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    this.updateStars();
    this.updateBullets();
    this.updatePlayer(false);
  };

  /*
   *
   * Bullets =================================================
   *
   */

  this.updateBullets = function() {
    showMessageInfo('[Hypersuit] - fireBullet');

    for (var i=0; i<bulletsCounter; i++) {
      var bullet = bullets[i];

      if (bullet == null || (typeof bullet == "undefined"))
        bullet = this.initBullet();
      else
        bullet.y -= 1;
      bullet.y -= bullet.speed;

      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, allTextures[allTextures.length - 2]);

      var matrix = this.makeTranslation((bullet.bulletSize / 2) * -1, (bullet.bulletSize / 2) * -1);
      var translationMatrix = this.makeTranslation(bullet.x, bullet.y);

      matrix = this.matrixMultiply(matrix, translationMatrix);

      gl.uniformMatrix3fv(matrixLocation, false, matrix);

      this.setBulletGeometry(bullet);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      bullets[i] = bullet;
    }
    bullets = bullets.slice(0, bulletsCounter);
  };

  /*
   *
   * Player =================================================
   *
   */

  this.updatePlayer = function(movePlayer) {
    showMessageInfo('[Hypersuit] - updatePlayer');

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, allTextures[allTextures.length - 1]);

    if (movePlayer) {
      if (this.player.x >= gameCanvas.width)
        this.player.x = 0;
      else if (this.player.x <= 0)
        this.player.x = gameCanvas.width;
      else if (this.player.y >= gameCanvas.height)
        this.player.y = 0;
      else if (this.player.y <= 0)
        this.player.y = gameCanvas.height;

      this.player.translation[0] = this.player.x;
      this.player.translation[1] = this.player.y;

      //printPlayer(this.player);
    }

    var moveOriginMatrix = this.makeTranslation((this.player.playerSize / 2) * -1, (this.player.playerSize / 2) * -1);
    var translationMatrix = this.makeTranslation(this.player.translation[0], this.player.translation[1]);

    var matrix = this.matrixMultiply(moveOriginMatrix, translationMatrix);

    gl.uniformMatrix3fv(matrixLocation, false, matrix);

    this.setPlayerGeometry();

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    //printPlayer(this.player);
  };

  /*
   *
   * Stars =================================================
   *
   */

  this.updateStars = function() {
    showMessageInfo('[Hypersuit] - updateStars');
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

      star.translation[0] = star.x;
      star.translation[1] = star.translation[1] + velocity + 1;
      if (star.translation[1] > gameCanvas.height) {
        star.x = parseInt(getRandom(gameCanvas.width));
        star.y = -1;
        velocity = parseInt(getRandom(STARS_VELOCITY));
        starSize = parseInt(getRandom(STARS_SIZE));
        texture = parseInt(getRandomFromZero(5));
        rotationSpeed = parseInt(getRandomFromZero(STARS_ROTATION_SPEED));
        rotationAngle = 0;
        rotationDirection = parseInt(getRandomFromZero(2));
        star.translation = [x, y];
        star.rotation = [0, 1];
      }

      this.updateRotation(rotationAngle, rotationDirection, star.rotation);

      star = new Star(star.x, star.y, star.translation, star.rotation, velocity, starSize, texture, rotationSpeed, rotationAngle, rotationDirection);
      stars[i] = star;

      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, allTextures[texture]);

      var angleInRadians = this.getAngleInRadians(star.rotationAngle);
      var moveOriginMatrix = this.makeTranslation((star.starSize / 2) * -1, (star.starSize / 2) * -1);
      var translationMatrix = this.makeTranslation(star.translation[0], star.translation[1]);
      var rotationMatrix = this.makeRotation(angleInRadians);

      var matrix = moveOriginMatrix;
      matrix = this.matrixMultiply(matrix, rotationMatrix);
      matrix = this.matrixMultiply(matrix, translationMatrix);

      gl.uniformMatrix3fv(matrixLocation, false, matrix);

      this.setStarGeometry(star);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      //printStar('UPDATE', i, star);
    }
  };

  /*
   *
   * Init =================================================
   *
   */

  this.initTextures = function() {
    showMessageInfo('[Hypersuit] - initTextures');
    for (var i=0; i<allTexturesImages.length; i++) {
      var texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      glTextures[i] = texture;
    }
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  };

  this.initStars = function() {
    showMessageInfo('[Hypersuit] - initStars');

    var vertices = [];
    for (var i=0; i<STARS_NUM; i++) {
      x = parseInt(getRandom(gameCanvas.width));
      y = -1;
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

  this.initPlayer = function() {
    var x = parseInt(getRandom(gameCanvas.width));
    var y = gameCanvas.height - PlayerSize;
    var translation = [x, y];
    var pSize = PlayerSize;
    this.player = new Player(x, y, pSize, translation);
  };

  this.initBullet = function() {
    var x = this.player.x;
    var y = this.player.y;
    var bSize = 10 + getRandom(PlayerSize);
    var translation = [x, y];
    var texture = parseInt(getRandomFromZero(6));
    var speed = parseInt(getRandom(10));
    var bullet = new Bullet(x, y, bSize, translation, texture, speed);
    return bullet;
  };

  this.initBullets = function() {
    bullets = Array();
  };

  this.buildStarTextureBuffer = function() {
    showMessageInfo('[Hypersuit] - buildStarTextureBuffer');
    var vertices = [];
    // Stars
    for (var i=0; i<STARS_NUM; i++) {
      vertices = vertices.concat(this.getSingleTextureMatrix());
    }
    // Player
    vertices = vertices.concat(this.getSingleTextureMatrix());
    return vertices;
  };

  this.buildStarTextureBuffer = function() {
    showMessageInfo('[Hypersuit] - buildStarTextureBuffer');
    var vertices = [];
    // Stars
    for (var i=0; i<STARS_NUM; i++) {
      vertices = vertices.concat(this.getSingleTextureMatrix());
    }
    // Player
    vertices = vertices.concat(this.getSingleTextureMatrix());
    return vertices;
  };

  this.getSingleTextureMatrix = function() {
    showMessageInfo('[Hypersuit] - getSingleTextureMatrix');
    return [0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0];
  }

  /*
   *
   * Geometries =================================================
   *
   */

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

  this.setPlayerGeometry = function() {
    var x = 0;
    var y = 0;
    var x1 = x;
    var x2 = x + PlayerSize;
    var y1 = y;
    var y2 = y + PlayerSize;

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

  this.setBulletGeometry = function(bullet) {
    var x = 0;
    var y = 0;
    var x1 = x;
    var x2 = x + (bullet.bulletSize * 2);
    var y1 = y;
    var y2 = y + (bullet.bulletSize * 2);

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

  /*
   *
   * Calculations =================================================
   *
   */

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

  this.getAngleInRadians = function(angle, direction) {
    var angleInDegrees = 360 - angle;
    angleInRadians = angleInDegrees * Math.PI / 180;
    return angleInRadians;
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
    return [
      a00 * b00 + a01 * b10 + a02 * b20,
      a00 * b01 + a01 * b11 + a02 * b21,
      a00 * b02 + a01 * b12 + a02 * b22,
      a10 * b00 + a11 * b10 + a12 * b20,
      a10 * b01 + a11 * b11 + a12 * b21,
      a10 * b02 + a11 * b12 + a12 * b22,
      a20 * b00 + a21 * b10 + a22 * b20,
      a20 * b01 + a21 * b11 + a22 * b21,
      a20 * b02 + a21 * b12 + a22 * b22
    ];
  };
};