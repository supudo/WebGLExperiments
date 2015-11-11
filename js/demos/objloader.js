function OBJLoader(gl, gameCanvas) {

  //
  // Variables =================================================
  //

  var animFrames;
  var objLoader, everythingInitalized;
  var shaderProgram, shaderVertex, shaderFragment;
  var attributeVertexPosition, attributeTextureCoord, attributeVertexNormal;
  var uniformColor;
  var uniformAmbientColor, uniformLightingDirection, uniformDirectionalColor;
  var uniformAlpha;
  var mvMatrixStack = [];
  var glBuffers = [];
  var whiteColor = new Float32Array([1, 1, 1, 1]);

  var sceneRotation = 0.0;
  var lastSceneUpdateTime = 0;

  var mvMatrix, perspectiveMatrix;
  var currentScene;

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
    //objLoader.parseObject('../../objects', 'planet2.obj', '/objects');
    objLoader.parseObject('../../objects', 'text.obj', '/objects');
    currentScene = objLoader.objScene;
    if (currentScene.objHasTextureImages)
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

    attributeVertexPosition = gl.getAttribLocation(shaderProgram, "a_vertexPosition");
    gl.enableVertexAttribArray(attributeVertexPosition);

    attributeTextureCoord = gl.getAttribLocation(shaderProgram, "a_textureCoord");
    gl.enableVertexAttribArray(attributeTextureCoord);

    attributeVertexNormal = gl.getAttribLocation(shaderProgram, "a_vertexNormal");
    gl.enableVertexAttribArray(attributeVertexNormal);

    uniformColor = gl.getUniformLocation(shaderProgram, "u_color");
    uniformAmbientColor = gl.getUniformLocation(shaderProgram, "u_ambientColor");
    uniformLightingDirection = gl.getUniformLocation(shaderProgram, "u_lightingDirection");
    uniformDirectionalColor = gl.getUniformLocation(shaderProgram, "u_directionalColor");
    uniformAlpha = gl.getUniformLocation(shaderProgram, "u_alpha");

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    //gl.enable(gl.CULL_FACE);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    //printJSONData(currentScene);
  };

  this.initBuffersAndTextures = function() {
    glBuffers = [];
    for (var i=0; i<currentScene.models.length; i++) {
      var model = currentScene.models[i];
      for (var j=0; j<model.faces.length; j++) {
        var face = model.faces[j];
        var faceBuffers = {};

        faceBuffers.material = this.getMaterialByID(face.materialID);

        // vertices
        var bufferVertices = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, bufferVertices);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(face.verts), gl.STATIC_DRAW);
        faceBuffers.bufferVertices = bufferVertices;
        faceBuffers.verticesCount = face.verts.length;

        // normals
        var bufferNormals = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, bufferNormals);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(face.normals), gl.STATIC_DRAW);
        faceBuffers.bufferNormals = bufferNormals;

        // textures & colors
        if (face.textures && face.textures.length > 0) {
          var bufferTextures = gl.createBuffer();
          gl.bindBuffer(gl.ARRAY_BUFFER, bufferTextures);
          gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(face.textures), gl.STATIC_DRAW);
          faceBuffers.bufferTextures = bufferTextures;
        }
        else {
          var whiteCoords = [];
          for (var i=0; i<100000; i++) {
            whiteCoords.push(200 + i,  70 + i, 120 + i);
            //colors.push(200,  70, 120);
          }
          var bufferWhite = gl.createBuffer();
          gl.bindBuffer(gl.ARRAY_BUFFER, bufferWhite);
          gl.bufferData(gl.ARRAY_BUFFER, new Uint8Array(whiteCoords), gl.STATIC_DRAW);
          faceBuffers.bufferTextures = bufferWhite;
       }

        // indices
        var bufferIndices = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufferIndices);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(face.indices), gl.STATIC_DRAW);
        faceBuffers.bufferIndices = bufferIndices;

        // texture images
        var hasTextures = false;
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
        if (hasTextures) {
          faceBuffers.textures = [];
          faceBuffers.textures.push.apply(faceBuffers.textures, textures);
        }
        else {
          var whiteTexture = gl.createTexture();
          gl.bindTexture(gl.TEXTURE_2D, whiteTexture);
          var solidColorTexture = [255, 255, 255, 255];
          if (faceBuffers.material.diffuse && faceBuffers.material.diffuse.length > 0)
            solidColorTexture = [
              Math.round(faceBuffers.material.diffuse[0] * 255),
              Math.round(faceBuffers.material.diffuse[1] * 255),
              Math.round(faceBuffers.material.diffuse[2] * 255),
              255
            ];
          var whitePixel = new Uint8Array(solidColorTexture);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, whitePixel);
          faceBuffers.textures = [];
          faceBuffers.textures.push(whiteTexture);
        }

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

      // vertices
      gl.bindBuffer(gl.ARRAY_BUFFER, faceBuffers.bufferVertices);
      gl.vertexAttribPointer(attributeVertexPosition, 3, gl.FLOAT, false, 0, 0);

      // textures
      gl.bindBuffer(gl.ARRAY_BUFFER, faceBuffers.bufferTextures);
      gl.vertexAttribPointer(attributeTextureCoord, 2, gl.FLOAT, false, 0, 0);

      // normals
      gl.bindBuffer(gl.ARRAY_BUFFER, faceBuffers.bufferNormals);
      gl.vertexAttribPointer(attributeVertexNormal, 3, gl.FLOAT, false, 0, 0);

      // textures
      if (faceBuffers.textures && faceBuffers.textures.length > 0) {
        for (var j=0; j<faceBuffers.textures.length; j++) {
          gl.uniform4fv(uniformColor, whiteColor);
          gl.activeTexture(gl.TEXTURE0 + j);
          gl.bindTexture(gl.TEXTURE_2D, faceBuffers.textures[j]);
          gl.uniform1i(gl.getUniformLocation(shaderProgram, "u_sampler"), 0);
        }
      }
      else {
        gl.activeTexture(gl.TEXTURE0);
        var textureColor = [1, 1, 1, 1];
        if (faceBuffers.material.diffuse && faceBuffers.material.diffuse.length > 0)
          textureColor = [
            faceBuffers.material.diffuse[0],
            faceBuffers.material.diffuse[1],
            faceBuffers.material.diffuse[2]
          ];
        gl.uniform4fv(uniformColor, textureColor);
        gl.bindTexture(gl.TEXTURE_2D, faceBuffers.textures);
        gl.uniform1i(gl.getUniformLocation(shaderProgram, "u_sampler"), 0);
      }

      // blending
      if (faceBuffers.material.transparent < 1) {
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
        gl.enable(gl.BLEND);
        gl.disable(gl.DEPTH_TEST);
        gl.uniform1f(uniformAlpha, faceBuffers.material.transparent);
      }
      else {
        gl.disable(gl.BLEND);
        gl.enable(gl.DEPTH_TEST);
        gl.uniform1f(uniformAlpha, 1.0);
      }

      // Lightning
      gl.uniform3f(
        uniformAmbientColor, 
        faceBuffers.material.ambient[0],
        faceBuffers.material.ambient[1],
        faceBuffers.material.ambient[2]
      );

      var lightingDirection = [-0.25, -0.25, -1.0];
      var adjustedLD = vec3.create();
      vec3.normalize(lightingDirection, adjustedLD);
      vec3.scale(adjustedLD, -1);
      gl.uniform3fv(uniformLightingDirection, adjustedLD);

      gl.uniform3f(uniformDirectionalColor, 0.8, 0.8, 0.8);

      // Indices
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, faceBuffers.bufferIndices);
      // uniforms, matrices
      this.setMatrixUniforms();
      // draw
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

  this.getMaterialByID = function(materialID) {
    var mat = null;
    for (var i=0; i<currentScene.materials.length; i++) {
      if (currentScene.materials[i].id == materialID)
        mat = currentScene.materials[i];
    }
    return mat;
  };

  this.getMaterialTextureImage = function(materialID) {
    var textureImages = {};
    var ambient, density, specular, shininess, dissolve;
    for (var i=0; i<currentScene.materials.length; i++) {
      var mat = currentScene.materials[i];
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

    //var normalMatrix = mvMatrix.inverse();
    //normalMatrix = normalMatrix.transpose();
    //var nUniform = gl.getUniformLocation(shaderProgram, "u_NormalMatrix");
    //gl.uniformMatrix4fv(nUniform, false, new Float32Array(normalMatrix.flatten()));

    var normalMatrix = mat3.create();
    mat4.toInverseMat3(mvMatrix, normalMatrix);
    mat3.transpose(normalMatrix);
    var nUniform = gl.getUniformLocation(shaderProgram, "u_NormalMatrix");
    gl.uniformMatrix3fv(nUniform, false, normalMatrix);
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