function OBJLoader(gl, gameCanvas) {

  //
  // Variables =================================================
  //

  var animFrames;
  var translation = [150, 250, 0];
  var rotation = [0, 0, 0];
  var scale = [1, 1, 1];

  var objLoader, meshes, models, everythingInitalized;

  var vertexPositionAttribute, vertexNormalAttribute, textureCoordAttribute;
  var pMatrixUniform, mvMatrixUniform, nMatrixUniform;
  var samplerUniform, modelColor, materialShininessUniform;
  var useTexturesUniform, ambientColorUniform;
  var hasTexure, hasFlashlight, lightLocation;
  var lightVector, lightSpecularColor, lightDiffuseColor;

  var shaderProgram, shaderVertex, shaderFragment;

  var pMatrix = mat4.create();
  var mvMatrix = mat4.create();

  //
  // Public =================================================
  //

  this.init = function() {
    showMessageInfo('[OBJLoader] - init');

    animFrames = 0;
    everythingInitalized = false;
    meshes = {};
    models = {};

    this.showLoading();
    objLoader = new WebGLObjLoader(gl);
    objLoader.parseObject('../../objects', 'planet.obj', '/objects');
    if (objLoader.objScene.objHasTextureImages)
      objLoader.preloadTextureImages(this.imageTexturesLoaded.bind(this));
    else
      this.imageTexturesLoaded();
  };
   
  this.changeSettings = function() {
  };

  this.run = function(frames) {
    animFrames = frames;
    if (everythingInitalized)
      this.drawScene();
  };

  this.release = function() {
    showMessageInfo('[OBJLoader] - release');
    try {
      objLoader.release();
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

  this.imageTexturesLoaded = function() {
    meshes['spaceship'] = objLoader.objMesh;

    showMessage('[OBJLoader] Rendering object - ' + objLoader.objTitle);
    printJSONData(objLoader.objScene);

    this.initShaders();
    everythingInitalized = true;
    this.hideLoading();
  };

  this.initShaders = function() {
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

    this.setGeometry();

    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(colorLocation);
    gl.vertexAttribPointer(colorLocation, 3, gl.UNSIGNED_BYTE, true, 0, 0);
    this.setColors();
  };

  this.drawScene = function() {
    showMessageInfo('[OBJLoader] - DrawScene');

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

    gl.drawArrays(gl.TRIANGLES, 0, (90) / 3);
  };

  this.setGeometry = function() {
    var v = objLoader.objScene.models[0].faces[0].verts;
    for (var i=0; i<v.length; i++) {
      v[i] = v[i] * 100;
    }
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(v), gl.STATIC_DRAW);
  };

  this.setColors = function() {
    var colors = [];
    for (var i=0; i<90; i++) {
      colors.push(200 + i,  70 + i, 120 + i);
      //colors.push(200,  70, 120);
    }
    gl.bufferData(gl.ARRAY_BUFFER, new Uint8Array(colors), gl.STATIC_DRAW);
  };

  this.setGeometries = function() {
    for (var i=0; i<objLoader.objScene.models.length; i++) {
      var model = objLoader.objScene.models[i];
      for (var j=0; j<model.faces.length; j++) {
        var face = model.faces[j];

        var v = face.verts;
        for (var f=0; f<v.length; f++) {
          v[f] = v[f] * 100;
        }
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(v), gl.STATIC_DRAW);
      }
    }
  };

  this.buildBuffer = function(type, data, itemSize) {
    var buffer = gl.createBuffer();
    var arrayView = type === gl.ARRAY_BUFFER ? Float32Array : Uint16Array;
    gl.bindBuffer(type, buffer);
    gl.bufferData(type, new arrayView(data), gl.STATIC_DRAW);
    buffer.itemSize = itemSize;
    buffer.numItems = data.length / itemSize;
    return buffer;
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

  this.showLoading = function() {
    showMessage('Loading....');
    var css_style = '';
    css_style += 'display: visible; background-color: #ababab; position:absolute;';
    css_style += 'top: 0%; left: 0%; width: 100%; height: 100%;';
    css_style += 'z-index: 1001; -moz-opacity: 0.8; opacity: .90; filter: alpha(opacity=80);';
    var element_style = 'position: absolute; top: 40%; left: 40%;';
    var text_style = 'color: #ffffff; font-size: 26px; font-weight: bold;';
    var loading_html = '';
    loading_html += "<div style='" + element_style + "'><img src='/images/loadingspinner.gif' /><br /><br />";
    loading_html += "<span style='" + text_style + "'>Loading OBJ ...</span></div>";
    $('#main_view').append(
      $('<div/>')
        .attr('id', 'objloaderloading')
        .attr('style', css_style)
        .html(loading_html)
    );
  };

  this.hideLoading = function() {
    $('#objloaderloading').hide();
  };
};