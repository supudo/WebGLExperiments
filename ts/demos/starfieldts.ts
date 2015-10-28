declare function $(obj);
declare function showMessage(message);
declare function showMessageInfo(message);
declare function loadImages(urls, callback);
declare function compileShaderFromSource(gl, uri, type);
declare function getRandom(max);
declare function getRandomFromZero(max);
declare function printStar(action, position, star);
declare function Star(x, y, translation, rotation, velocity, starSize, texture, rotationSpeed, rotationAngle, rotationDirection);
declare function listObjectProperties(obj);
declare var stars: any;
declare var starsVertices: any;
declare var STARS_NUM: number;
declare var STARS_VELOCITY: number;
declare var STARS_SIZE: number;
declare var STARS_ROTATION_SPEED: number;

module WebGLDemos {

  class StarShape {
    public x: number = 0;
    public y: number = 0;
    public translation: number[] = [0, 0];
    public rotation: number[] = [0, 0];
    public velocity: number = 0;
    public starSize: number = 0;
    public texture: number = 0;
    public rotationSpeed: number = 0;
    public rotationAngle: number = 0;
    public rotationDirection: number = 0;

    constructor(x, y, translation, rotation, velocity, starSize, texture, rotationSpeed, rotationAngle, rotationDirection) {
      this.x = (typeof x == "undefined") ? 0 : x;
      this.y = (typeof y == "undefined") ? 0 : y;
      this.translation = (typeof translation == "undefined") ? [x, y] : translation;
      this.rotation = (typeof rotation == "undefined") ? [0, 0] : rotation;
      this.velocity = (typeof velocity == "undefined") ? 0 : velocity;
      this.starSize = (typeof starSize == "undefined") ? 0 : starSize;
      this.texture = (typeof texture == "undefined") ? 0 : texture;
      this.rotationSpeed = (typeof rotationSpeed == "undefined") ? 0 : rotationSpeed;
      this.rotationAngle = (typeof rotationAngle == "undefined") ? 0 : rotationAngle;
      this.rotationDirection = (typeof rotationDirection == "undefined") ? 0 : rotationDirection;
    }
  }

  export class StarfieldTS {

    //
    // Variables =================================================
    //

    private gl: any;
    private gameCanvas: any;

    private texturesLoaded: boolean = false;
    private yTranslation: number = -1;

    private starTextures: any[];
    private glTextures: any[];
    private stars: Array<StarShape>;
    private starTexturesCount: number = 5;

    private bufferTextures: any;
    private bufferDrawing: any;

    private positionLocation: any;
    private resolutionLocation: any;
    private texCoordLocation: any;
    private matrixLocation: any;

    private shaderProgram: any;
    private shaderVertex: any;
    private shaderFragment: any;

    //
    // Constructor =================================================
    //

    constructor(gl: any, gameCanvas: any) {
      showMessageInfo('[StarfieldTS] - ()');
      this.gl = gl;
      this.gameCanvas = gameCanvas;
    }

    //
    // Public =================================================
    //

    public init(): void {
      showMessageInfo('[StarfieldTS] - init');
      $('#game_background').css("background-image", "url(../images/background0.png)");

      this.yTranslation = -1;
      this.stars = new Array<StarShape>();
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
        this.starTexturesLoaded.bind(this)
      );
    }

    public changeSettings(): void {
      showMessageInfo('[StarfieldTS] - changeSettings');
      starsVertices = this.initVertices();
    }

    public run(frames): void {
      if (this.texturesLoaded) {
        showMessageInfo('[StarfieldTS] - run');
        this.yTranslation = frames;
        this.drawScene();
      }
    }

    public release(): void {
      if (this.glTextures != null) {
        for (var i = 0; i < this.glTextures.length; i++) {
          this.gl.deleteTexture(this.glTextures[i]);
        }
      }
      this.gl.deleteShader(this.shaderFragment);
      this.gl.deleteShader(this.shaderVertex);
      this.gl.deleteBuffer(this.bufferTextures);
      this.gl.deleteBuffer(this.bufferDrawing);
      this.gl.deleteProgram(this.shaderProgram);
    }

    //
    // Private =================================================
    //

    private starTexturesLoaded(images) {
      showMessageInfo('[StarfieldTS] - StarTexturesLoaded - init - image loaded');
      this.starTextures = images;
      this.texturesLoaded = true;
    }

    private initShaders(): void {
      showMessageInfo('[StarfieldTS] - InitShaders');
      this.shaderFragment = compileShaderFromSource(this.gl, "../shaders/starfield-ts.fs", this.gl.FRAGMENT_SHADER);
      this.shaderVertex = compileShaderFromSource(this.gl, "../shaders/starfield-ts.vs", this.gl.VERTEX_SHADER);

      this.shaderProgram = this.gl.createProgram();
      this.gl.attachShader(this.shaderProgram, this.shaderVertex);
      this.gl.attachShader(this.shaderProgram, this.shaderFragment);
      this.gl.linkProgram(this.shaderProgram);

      if (!this.gl.getProgramParameter(this.shaderProgram, this.gl.LINK_STATUS))
        showMessage("Could not initialise shaders");

      this.gl.useProgram(this.shaderProgram);

      this.positionLocation = this.gl.getAttribLocation(this.shaderProgram, "a_position");
      this.texCoordLocation = this.gl.getAttribLocation(this.shaderProgram, "a_texCoord");
      this.resolutionLocation = this.gl.getUniformLocation(this.shaderProgram, "u_resolution");
      this.matrixLocation = this.gl.getUniformLocation(this.shaderProgram, "u_matrix");

      this.bufferTextures = this.gl.createBuffer();
      this.bufferDrawing = this.gl.createBuffer();
    }

    private drawScene(): void {
      showMessageInfo('[StarfieldTS] - DrawScene');
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.bufferTextures);

      var textureVertices = this.buildStarTextureBuffer();
      this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(textureVertices), this.gl.STATIC_DRAW);
      this.gl.enableVertexAttribArray(this.texCoordLocation);
      this.gl.vertexAttribPointer(this.texCoordLocation, 2, this.gl.FLOAT, false, 0, 0);

      this.gl.uniform2f(this.resolutionLocation, this.gameCanvas.width, this.gameCanvas.height);

      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.bufferDrawing);
      this.gl.enableVertexAttribArray(this.positionLocation);
      this.gl.vertexAttribPointer(this.positionLocation, 2, this.gl.FLOAT, false, 0, 0);

      this.updateVertices();
    }

    private updateVertices(): void {
      showMessageInfo('[StarfieldTS] - UpdateVertices');
      for (var i = 0; i < STARS_NUM; i++) {
        var star: StarShape = this.stars[i];

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
        if (star.translation[1] > this.gameCanvas.height) {
          star.x = parseInt(getRandom(this.gameCanvas.width));
          star.y = -1;//parseInt(getRandom(gameCanvas.height));
          velocity = parseInt(getRandom(STARS_VELOCITY));
          starSize = parseInt(getRandom(STARS_SIZE));
          texture = parseInt(getRandomFromZero(5));
          rotationSpeed = parseInt(getRandomFromZero(STARS_ROTATION_SPEED));
          rotationAngle = 0;
          rotationDirection = parseInt(getRandomFromZero(2));
          star.translation = [star.x, star.y];
          star.rotation = [0, 1];
        }

        this.updateRotation(rotationAngle, rotationDirection, star.rotation);

        star = new StarShape(star.x, star.y, star.translation, star.rotation, velocity, starSize, texture, rotationSpeed, rotationAngle, rotationDirection);
        stars[i] = star;

        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.starTextures[texture]);

        var angleInRadians = this.getAngleInRadians(star.rotationAngle, star.rotationDirection);
        var moveOriginMatrix = this.makeTranslation((star.starSize / 2) * -1, (star.starSize / 2) * -1);
        var translationMatrix = this.makeTranslation(star.translation[0], star.translation[1]);
        var rotationMatrix = this.makeRotation(angleInRadians);

        var matrix = moveOriginMatrix;
        matrix = this.matrixMultiply(matrix, rotationMatrix);
        matrix = this.matrixMultiply(matrix, translationMatrix);

        this.gl.uniformMatrix3fv(this.matrixLocation, false, matrix);

        this.setStarGeometry(star);

        this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);

        printStar('UPDATE', i, star);
      }
    }

    private setStarGeometry(star): void {
      var x = 0;
      var y = 0;
      var x1 = x;
      var x2 = x + star.starSize;
      var y1 = y;
      var y2 = y + star.starSize;

      this.gl.bufferData(
        this.gl.ARRAY_BUFFER,
        new Float32Array([
          x1, y1,
          x2, y1,
          x1, y2,
          x1, y2,
          x2, y1,
          x2, y2
        ]),
        this.gl.STATIC_DRAW
      );
    }

    private initVertices(): void {
      showMessageInfo('[StarfieldTS] - InitVertices');

      for (var i = 0; i < STARS_NUM; i++) {
        var x: number = parseInt(getRandom(this.gameCanvas.width));
        var y: number = -1;//parseInt(getRandom(gameCanvas.height));
        var velocity: number = parseInt(getRandom(STARS_VELOCITY));
        var starSize: number = (STARS_NUM > 1 ? parseInt(getRandom(STARS_SIZE)) : STARS_SIZE);
        var texture: number = parseInt(getRandomFromZero(5));
        var rotationSpeed: number = parseInt(getRandomFromZero(STARS_ROTATION_SPEED));
        var rotationDirection: number = parseInt(getRandomFromZero(2));
        var translation: number[] = [x, y];
        var rotation: number[] = [0, 1];

        var star = new StarShape(x, y, translation, rotation, velocity, starSize, texture, rotationSpeed, 0, rotationDirection);
        this.stars.push(star);
        printStar('INIT', i, star);
      }
    }

    private initTextures(): void {
      this.glTextures = new Array(this.starTexturesCount);
      for (var i = 0; i < this.starTexturesCount; i++) {
        var texture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        this.glTextures[i] = texture;
      }
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
    }

    private buildStarTextureBuffer(): any {
      showMessageInfo('[StarfieldTS] - BuildStarTextureBuffer');
      var vertices = [];
      for (var i = 0; i < STARS_NUM; i++) {
        vertices.push(0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0);
      }
      return vertices;
    }

    private updateRotation(angleValue: number, direction: number, rotation: any): number[] {
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
    }

    private getAngleInRadians(angle: number, direction: number): number {
      var angleInDegrees = 360 - angle;
      var angleInRadians = angleInDegrees * Math.PI / 180;
      return angleInRadians;
    }

    private makeTranslation(tx: number, ty: number): any {
      return [
        1, 0, 0,
        0, 1, 0,
        tx, ty, 1
      ];
    }

    private makeRotation(angleInRadians: number): any {
      var c = Math.cos(angleInRadians);
      var s = Math.sin(angleInRadians);
      return [
        c, -s, 0,
        s, c, 0,
        0, 0, 1
      ];
    }

    private matrixMultiply(a: any, b: any): any {
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
    }

  }
}