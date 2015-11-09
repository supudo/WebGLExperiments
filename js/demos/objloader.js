function OBJLoader(gl, gameCanvas) {

  //
  // Variables =================================================
  //

  var animFrames;
  var translation = [150, 250, 0];
  var rotation = [0, 0, 0];
  var scale = [1, 1, 1];
  var objLoader, everythingInitalized;
  var shaderProgram, shaderVertex, shaderFragment;
  var positionLocation, colorLocation, matrixLocation;
  var texCoordLocation, useTextureLocation;
  var whiteColor = new Float32Array([1, 1, 1, 1]);

  //
  // Public =================================================
  //

  this.init = function() {
    showMessageInfo('[OBJLoader] - init');

    /*
    $("#game_canvas").prependTo("body");
    $("#game_canvas").css('position', 'absolute');
    $("#game_canvas").css('top', '0px');
    $("#game_canvas").css('left', '0px');
    $("#game_canvas").css('z-index', '-1000');
    */

    animFrames = 0;
    everythingInitalized = false;

    this.showLoading();

    objLoader = new WebGLObjLoader(gl);
    objLoader.parseObject('../../objects', 'planet2.obj', '/objects');
    //objLoader.parseObject('../../objects', 'robot.obj', '/objects');
    if (objLoader.objScene.objHasTextureImages)
      objLoader.preloadTextureImages(this.imageTexturesLoaded.bind(this));
    else
      this.imageTexturesLoaded();
  };
   
  this.changeSettings = function() {
  };

  this.run = function(frames) {
    animFrames = frames;
    if (everythingInitalized) {
      this.drawScene();
    }
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
  // Drawing =================================================
  //

  this.imageTexturesLoaded = function() {
    //showMessage('[OBJLoader] Rendering object - ' + objLoader.objTitle);

    this.initShaders();
    everythingInitalized = true;
    this.hideLoading();
  };

  this.initShaders = function() {
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
    matrixLocation = gl.getUniformLocation(shaderProgram, "u_matrix");
    colorLocation = gl.getUniformLocation(shaderProgram, "u_color");
    useTextureLocation = gl.getUniformLocation(shaderProgram, "u_useTexture");
    texCoordLocation = gl.getAttribLocation(shaderProgram, "a_texCoord");

    gl.bindAttribLocation(shaderProgram, 0, positionLocation);

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.BLEND);

    //gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);

    printJSONData(objLoader.objScene);
  };

  this.drawScene = function() {
    showMessageInfo('[OBJLoader] - DrawScene');
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //this.drawModel(objLoader.objScene.models[1].faces[0]);

    for (var i=0; i<objLoader.objScene.models.length; i++) {
      var model = objLoader.objScene.models[i];
      for (var j=0; j<model.faces.length; j++) {
        var face = model.faces[j];
        this.drawModel(face);
      }
    }
  };

  this.drawModel = function(model) {
    showMessageInfo('[OBJLoader] - drawModel - ' + model.materialID);
    var bufferVertices, bufferColors;
    var bufferTextures = [];

    gl.bindAttribLocation(shaderProgram, 0, positionLocation);

    // vertices
    bufferVertices = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferVertices);
    var vv = [];
    for (var i=0; i<model.verts.length; i++) {
      var v = model.verts[i] * 100;
      vv.push(v);
    }
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLocation);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vv), gl.STATIC_DRAW);

    // texture & color
    var hasTextures = false;
    if (model.textures && model.textures.length > 0) {
      var texImages = this.getMaterialTextureImage(model.materialID);
      if (this.hasMaterialImages(texImages)) {
        hasTextures = true;
        for (var i=0; i<texImages.density.length; i++) {
          var img = texImages.density[i];

          var texCoordBuffer = gl.createBuffer();
          bufferTextures.push(texCoordBuffer);
          gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
          gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model.textures), gl.STATIC_DRAW);
          gl.enableVertexAttribArray(texCoordLocation);
          gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

          var texture = gl.createTexture();
          gl.uniform4fv(colorLocation, whiteColor);
          gl.bindTexture(gl.TEXTURE_2D, texture);

          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        }
      }
    }
    if (!hasTextures) {
      var whiteTexture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, whiteTexture);
      var whitePixel = new Uint8Array([255, 255, 255, 255]);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, whitePixel);

      gl.uniform4fv(colorLocation, whiteColor);
      gl.bindTexture(gl.TEXTURE_2D, whiteTexture); 
    }

    rotation = [this.degToRad(40), this.degToRad(25), this.degToRad(325)];

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

    gl.drawArrays(gl.TRIANGLES, 0, model.verts.length / 3);

    gl.deleteBuffer(bufferVertices);
    if (bufferColors)
      gl.deleteBuffer(bufferColors);
    if (bufferTextures) {
      for (var i=0; i<bufferTextures.length; i++) {
        gl.deleteBuffer(bufferTextures[i]);
      }
    }
  };

  this.hasMaterialImages = function(materialTextures) {
    var hasImages = false;
    if (materialTextures.ambient && materialTextures.ambient.length)
      hasImages = true;
    else if (materialTextures.density && materialTextures.density.length)
      hasImages = true;
    else if (materialTextures.specular && materialTextures.specular.length)
      hasImages = true;
    else if (materialTextures.specularExp && materialTextures.specularExp.length)
      hasImages = true;
    else if (materialTextures.dissolve && materialTextures.dissolve.length)
      hasImages = true;
    return hasImages;
  };

  this.getMaterialTextureImage = function(materialID) {
    var textureImages = {};
    var ambient = density = specular = specularExp = dissolve = [];
    for (var i=0; i<objLoader.objScene.materials.length; i++) {
      var mat = objLoader.objScene.materials[i];
      if (mat.id == materialID) {
        if (mat.textures.ambient) {
          for (var j=0; j<mat.textures.ambient.length; j++) {
            ambient.push(mat.textures.ambient[0].loadedImage);
          }
        }
        if (mat.textures.density) {
          for (var j=0; j<mat.textures.density.length; j++) {
            density.push(mat.textures.density[0].loadedImage);
          }
        }
        if (mat.textures.specular) {
          for (var j=0; j<mat.textures.specular.length; j++) {
            specular.push(mat.textures.specular[0].loadedImage);
          }
        }
        if (mat.textures.specularExp) {
          for (var j=0; j<mat.textures.specularExp.length; j++) {
            specularExp.push(mat.textures.specularExp[0].loadedImage);
          }
        }
        if (mat.textures.dissolve) {
          for (var j=0; j<mat.textures.dissolve.length; j++) {
            dissolve.push(mat.textures.dissolve[0].loadedImage);
          }
        }
      }
    }
    textureImages.ambient = ambient;
    textureImages.density = density;
    textureImages.specular = specular;
    textureImages.specularExp = specularExp;
    textureImages.dissolve = dissolve;
    return textureImages;
  };

  this.getProgramInfo = function(program) {
    var result = {
      attributes: [],
      uniforms: [],
      attributeCount: 0,
      uniformCount: 0
    },
    activeUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS),
    activeAttributes = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);

    var enums = {
      0x8B50: 'FLOAT_VEC2',
      0x8B51: 'FLOAT_VEC3',
      0x8B52: 'FLOAT_VEC4',
      0x8B53: 'INT_VEC2',
      0x8B54: 'INT_VEC3',
      0x8B55: 'INT_VEC4',
      0x8B56: 'BOOL',
      0x8B57: 'BOOL_VEC2',
      0x8B58: 'BOOL_VEC3',
      0x8B59: 'BOOL_VEC4',
      0x8B5A: 'FLOAT_MAT2',
      0x8B5B: 'FLOAT_MAT3',
      0x8B5C: 'FLOAT_MAT4',
      0x8B5E: 'SAMPLER_2D',
      0x8B60: 'SAMPLER_CUBE',
      0x1400: 'BYTE',
      0x1401: 'UNSIGNED_BYTE',
      0x1402: 'SHORT',
      0x1403: 'UNSIGNED_SHORT',
      0x1404: 'INT',
      0x1405: 'UNSIGNED_INT',
      0x1406: 'FLOAT'
    };

    for (var i=0; i<activeUniforms; i++) {
      var uniform = gl.getActiveUniform(program, i);
      uniform.typeName = enums[uniform.type];
      result.uniforms.push(uniform);
      result.uniformCount += uniform.size;
    }

    for (var i=0; i<activeAttributes; i++) {
      var attribute = gl.getActiveAttrib(program, i);
      attribute.typeName = enums[attribute.type];
      result.attributes.push(attribute);
      result.attributeCount += attribute.size;
    }

    return result;
  };

  //
  // Math =================================================
  //

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

  //
  // UI =================================================
  //

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