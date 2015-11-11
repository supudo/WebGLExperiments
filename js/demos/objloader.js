function OBJLoader(gl, gameCanvas) {

  //
  // Variables =================================================
  //

  var animFrames;
  var objLoader, everythingInitalized;
  var shaderProgram, shaderVertex, shaderFragment;
  var vertexPositionAttribute, textureCoordAttribute, vertexNormalAttribute;
  var mvMatrixStack = [];
  var glBuffers = [];

  var sceneRotation = 0.0;
  var lastSceneUpdateTime = 0;

  var mvMatrix, perspectiveMatrix;

  //
  // Public =================================================
  //

  this.init = function() {
    showMessageInfo('[OBJLoader] - init');

    var that = this;
    $.when(
      $.getScript("js/webgl/sylvester.js"),
      $.getScript("js/webgl/gl-utils.js"),
      $.Deferred(function(deferred) {
        $(deferred.resolve);
      })
      ).done(function() {
        that.postInit();
    });
  };

  this.postInit = function() {
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
      this.imageTexturesLoaded().bind(this);
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
      for (var i=0; i<glBuffers.length; i++) {
        var faceBuffers = glBuffers[i];
        gl.deleteBuffer(faceBuffers.bufferVertices);
        gl.deleteBuffer(faceBuffers.bufferTextures);
        gl.deleteTexture(faceBuffers.textures);
        gl.deleteBuffer(faceBuffers.bufferIndices);
      }
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
    this.initBuffersAndTextures();

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

    vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "a_vertexPosition");
    gl.enableVertexAttribArray(vertexPositionAttribute);

    textureCoordAttribute = gl.getAttribLocation(shaderProgram, "a_textureCoord");
    gl.enableVertexAttribArray(textureCoordAttribute);

    vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "a_vertexNormal");
    gl.enableVertexAttribArray(vertexNormalAttribute);

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    //gl.enable(gl.CULL_FACE);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
  };

  this.initBuffersAndTextures = function() {
    glBuffers = [];
    for (var i=0; i<objLoader.objScene.models.length; i++) {
      var model = objLoader.objScene.models[i];
      for (var j=0; j<model.faces.length; j++) {
        var face = model.faces[j];
        var faceBuffers = {};

        var bufferVertices = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, bufferVertices);
        var vv = [];
        for (var vi=0; vi<face.verts.length; vi++) {
          var v = face.verts[vi];
          vv.push(v);
        }
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vv), gl.STATIC_DRAW);
        faceBuffers.bufferVertices = bufferVertices;
        faceBuffers.verticesCount = face.verts.length;

        var bufferNormals = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, bufferNormals);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(face.normals), gl.STATIC_DRAW);
        faceBuffers.bufferNormals = bufferNormals;

        if (face.textures && face.textures.length > 0) {
          var bufferTextures = gl.createBuffer();
          gl.bindBuffer(gl.ARRAY_BUFFER, bufferTextures);
          gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(face.textures), gl.STATIC_DRAW);
          faceBuffers.bufferTextures = bufferTextures;
        }
        else {
          var whiteTexture = gl.createTexture();
          gl.bindTexture(gl.TEXTURE_2D, whiteTexture);
          var whitePixel = new Uint8Array([255, 255, 255, 255]);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, whitePixel);
          gl.bindTexture(gl.TEXTURE_2D, whiteTexture); 
          faceBuffers.bufferTextures = bufferTextures;
        }

        var bufferIndices = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufferIndices);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(face.indices), gl.STATIC_DRAW);
        faceBuffers.bufferIndices = bufferIndices;

        var textures = [];
        var texImages = this.getMaterialTextureImage(face.materialID);
        if (this.hasMaterialImages(texImages)) {
          hasTextures = true;
          for (var ti=0; ti<texImages.ambient.length; ti++) {
            if (texImages.ambient[ti])
              textures.push(this.putTexture(texImages.ambient[ti]));
          }
          for (var ti=0; ti<texImages.density.length; ti++) {
            if (texImages.density[ti])
              textures.push(this.putTexture(texImages.density[ti]));
          }
          for (var ti=0; ti<texImages.specular.length; ti++) {
            if (texImages.specular[ti])
              textures.push(this.putTexture(texImages.specular[ti]));
          }
          for (var ti=0; ti<texImages.shininess.length; ti++) {
            if (texImages.shininess[ti])
              textures.push(this.putTexture(texImages.shininess[ti]));
          }
          for (var ti=0; ti<texImages.dissolve.length; ti++) {
            if (texImages.dissolve[ti])
              textures.push(this.putTexture(texImages.dissolve[ti]));
          }
        }
        faceBuffers.textures = [];
        faceBuffers.textures.push.apply(faceBuffers.textures, textures);

        glBuffers.push(faceBuffers);
      }
    }
  };

  this.putTexture = function(image) {
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindTexture(gl.TEXTURE_2D, null);
    return texture;
  };

  this.drawScene = function() {
    showMessageInfo('[OBJLoader] - drawScene');
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    perspectiveMatrix = makePerspective(45, gameCanvas.width / gameCanvas.height, 0.1, 100.0);

    this.loadIdentity();
    this.mvTranslate([-0.0, 0.0, -6.0]);
    this.mvPushMatrix();
    this.mvRotate(sceneRotation, [1, 0, 1]);

    for (var i=0; i<glBuffers.length; i++) {
      var faceBuffers = glBuffers[i];

      gl.bindBuffer(gl.ARRAY_BUFFER, faceBuffers.bufferVertices);
      gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, faceBuffers.bufferTextures);
      gl.vertexAttribPointer(textureCoordAttribute, 2, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, faceBuffers.bufferNormals);
      gl.vertexAttribPointer(vertexNormalAttribute, 3, gl.FLOAT, false, 0, 0);

      for (var j=0; j<faceBuffers.textures.length; j++) {
        gl.activeTexture(gl.TEXTURE0 + j);
        gl.bindTexture(gl.TEXTURE_2D, faceBuffers.textures[j]);
        gl.uniform1i(gl.getUniformLocation(shaderProgram, "u_sampler"), 0);
      }

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, faceBuffers.bufferIndices);
      this.setMatrixUniforms();
      gl.drawElements(gl.TRIANGLES, faceBuffers.verticesCount / 3, gl.UNSIGNED_SHORT, 0);
    }

    this.mvPopMatrix();

    var currentTime = (new Date).getTime();
    if (lastSceneUpdateTime) {
      var delta = currentTime - lastSceneUpdateTime;
      sceneRotation += (30 * delta) / 1000.0;
    }

    lastSceneUpdateTime = currentTime;
  };

  this.getMaterialTextureImage = function(materialID) {
    var textureImages = {};
    var ambient, density, specular, shininess, dissolve;
    for (var i=0; i<objLoader.objScene.materials.length; i++) {
      var mat = objLoader.objScene.materials[i];
      if (mat.id == materialID) {
        if (mat.textures.ambient) {
          ambient = [];
          for (var j=0; j<mat.textures.ambient.length; j++) {
            ambient.push(mat.textures.ambient[0].loadedImage);
          }
        }
        if (mat.textures.density) {
          density = []
          for (var j=0; j<mat.textures.density.length; j++) {
            density.push(mat.textures.density[0].loadedImage);
          }
        }
        if (mat.textures.specular) {
          specular = [];
          for (var j=0; j<mat.textures.specular.length; j++) {
            specular.push(mat.textures.specular[0].loadedImage);
          }
        }
        if (mat.textures.shininess) {
          shininess = [];
          for (var j=0; j<mat.textures.shininess.length; j++) {
            shininess.push(mat.textures.shininess[0].loadedImage);
          }
        }
        if (mat.textures.dissolve) {
          dissolve = [];
          for (var j=0; j<mat.textures.dissolve.length; j++) {
            dissolve.push(mat.textures.dissolve[0].loadedImage);
          }
        }
      }
    }
    textureImages.ambient = ambient;
    textureImages.density = density;
    textureImages.specular = specular;
    textureImages.shininess = shininess;
    textureImages.dissolve = dissolve;
    return textureImages;
  };

  this.hasMaterialImages = function(materialTextures) {
    var hasImages = false;
    if (materialTextures.ambient && materialTextures.ambient.length)
      hasImages = true;
    else if (materialTextures.density && materialTextures.density.length)
      hasImages = true;
    else if (materialTextures.specular && materialTextures.specular.length)
      hasImages = true;
    else if (materialTextures.shininess && materialTextures.shininess.length)
      hasImages = true;
    else if (materialTextures.dissolve && materialTextures.dissolve.length)
      hasImages = true;
    return hasImages;
  };

  //
  // Math =================================================
  //

  this.loadIdentity = function() {
    mvMatrix = Matrix.I(4);
  };

  this.multMatrix = function(m) {
    mvMatrix = mvMatrix.x(m);
  };

  this.mvTranslate = function(v) {
    this.multMatrix(Matrix.Translation($V([v[0], v[1], v[2]])).ensure4x4());
  };

  this.setMatrixUniforms = function() {
    var pUniform = gl.getUniformLocation(shaderProgram, "u_PMatrix");
    gl.uniformMatrix4fv(pUniform, false, new Float32Array(perspectiveMatrix.flatten()));

    var mvUniform = gl.getUniformLocation(shaderProgram, "u_MVMatrix");
    gl.uniformMatrix4fv(mvUniform, false, new Float32Array(mvMatrix.flatten()));

    var normalMatrix = mvMatrix.inverse();
    normalMatrix = normalMatrix.transpose();
    var nUniform = gl.getUniformLocation(shaderProgram, "u_NormalMatrix");
    gl.uniformMatrix4fv(nUniform, false, new Float32Array(normalMatrix.flatten()));
  };

  this.mvPushMatrix = function(m) {
    if (m) {
      mvMatrixStack.push(m.dup());
      mvMatrix = m.dup();
    }
    else
      mvMatrixStack.push(mvMatrix.dup());
  };

  this.mvPopMatrix = function() {
    if (!mvMatrixStack.length)
      throw("Can't pop from an empty matrix stack.");

    mvMatrix = mvMatrixStack.pop();
    return mvMatrix;
  };

  this.mvRotate = function(angle, v) {
    var inRadians = angle * Math.PI / 180.0;
    var m = Matrix.Rotation(inRadians, $V([v[0], v[1], v[2]])).ensure4x4();
    this.multMatrix(m);
  };

  //
  // UI =================================================
  //

  this.showLoading = function() {
    showMessage('Loading....');
    var css_style = '';
    css_style += 'display: block; background-color: #ababab; position:absolute;';
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
    $('#objloaderloading').remove();
  };
};