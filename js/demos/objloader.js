function OBJLoader(gl, gameCanvas) {

  //
  // Variables =================================================
  //

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

    everythingInitalized = false;
    meshes = {};
    models = {};
    objLoader = new WebGLObjLoader(gl);
    objLoader.parseObject('../../objects', 'cube.obj', '/objects');
    objLoader.initMeshBuffers();
    if (objLoader.objMesh.hasTextureImages)
      objLoader.preloadTextureImages(this.imageTexturesLoaded.bind(this));
    else
      this.imageTexturesLoaded();
  };
   
  this.changeSettings = function() {
  };

  this.run = function(frames) {
    if (everythingInitalized) {
      showMessageInfo('[OBJLoader] - run');
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
  // Private =================================================
  //

  this.imageTexturesLoaded = function() {
    meshes['spaceship'] = objLoader.objMesh;

    showMessage('[OBJLoader] Rendering object - ' + objLoader.objTitle);

    this.initShaders();
    this.initBuffers();
    everythingInitalized = true;
  };

  this.initShaders = function() {
    showMessageInfo('[OBJLoader] - InitShaders');
    shaderFragment = compileShaderFromSource(gl, "../shaders/objloader.fs", gl.FRAGMENT_SHADER);
    shaderVertex = compileShaderFromSource(gl, "../shaders/objloader.vs", gl.VERTEX_SHADER);

    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, shaderVertex);
    gl.attachShader(shaderProgram, shaderFragment);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS))
      showMessage("Could not initialise shaders");

    gl.useProgram(shaderProgram);

    vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(vertexPositionAttribute);

    vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
    gl.enableVertexAttribArray(vertexNormalAttribute);

    textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
    gl.enableVertexAttribArray(textureCoordAttribute);

    pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
    nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
    samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");
    modelColor = gl.getUniformLocation(shaderProgram, "uColor");
    materialShininessUniform = gl.getUniformLocation(shaderProgram, "uMaterialShininess");
    useTexturesUniform = gl.getUniformLocation(shaderProgram, "uUseTextures");
    ambientColorUniform = gl.getUniformLocation(shaderProgram, "uAmbientColor");
    hasTexure = gl.getUniformLocation(shaderProgram, "uHasTexure");
    hasFlashlight = gl.getUniformLocation(shaderProgram, "uHasFlashlight");
    lightLocation = gl.getUniformLocation(shaderProgram, "uLightLocation");
    lightVector = gl.getUniformLocation(shaderProgram, "uSpotDirection");
    lightSpecularColor = gl.getUniformLocation(shaderProgram, "uLightSpecularColor");
    lightDiffuseColor = gl.getUniformLocation(shaderProgram, "uLightDiffuseColor");

    //gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);

    gl.viewportWidth = gameCanvas.width;
    gl.viewportHeight = gameCanvas.height;
  };

  this.drawScene = function() {
    showMessageInfo('[OBJLoader] - DrawScene');

    gl.viewport(0, 0, gameCanvas.width, gameCanvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.01, 1000.0, pMatrix);
    mat4.identity(mvMatrix);

    mat4.translate(mvMatrix, [100, 0, 1]);
  
    this.setUniforms();
    mat4.translate(mvMatrix, [0, .1, -.5]);
    this.drawSpaceship();
  };

  this.drawSpaceship = function() {
    this.drawObject(models['spaceship']);
  };

  this.initBuffers = function() {
    for (mesh in meshes) {
      objLoader.initMeshBuffers(meshes[mesh]);
      models[mesh] = {};
      models[mesh] = meshes[mesh];
    }
  };

  this.drawObject = function(model, shininess, color) {
    gl.bindBuffer(gl.ARRAY_BUFFER, model.bufferVertex);
    gl.vertexAttribPointer(vertexPositionAttribute, model.bufferVertex.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, model.bufferTexture);
    gl.vertexAttribPointer(textureCoordAttribute, model.bufferTexture.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, model.bufferNormal);
    gl.vertexAttribPointer(vertexNormalAttribute, model.bufferNormal.itemSize, gl.FLOAT, false, 0, 0);

    if (!model.textureCoordinates.length) {
      var t = models['spaceship'].materials.textures.density[0].loadedImage;
      printData(t);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, model);
      gl.uniform1i(samplerUniform, 0);
      gl.uniform1i(hasTexure, true);
    }
    else {
      gl.uniform1i(hasTexure, false);
      gl.uniform4f(modelColor, Math.random(), Math.random(), Math.random(), 1);
    }

    if (shininess)
      gl.uniform1f(materialShininessUniform, shininess);
    else
      gl.uniform1f(materialShininessUniform, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.bufferIndex);
    this.setMatrixUniforms();
    gl.drawElements(gl.TRIANGLES, model.bufferIndex.numItems, gl.UNSIGNED_SHORT, 0);
  };

  this.setMatrixUniforms = function() {
    gl.uniformMatrix4fv(pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(mvMatrixUniform, false, mvMatrix);

    var normalMatrix = mat3.create();
    mat4.toInverseMat3(mvMatrix, normalMatrix);
    mat3.transpose(normalMatrix);
    gl.uniformMatrix3fv(nMatrixUniform, false, normalMatrix);
  };

  this.setUniforms = function() {
    var ambientIntensity = 0.5;
    var diffuseIntensity = 2.0;
    gl.uniform3fv(ambientColorUniform, this.lightIntesity(ambientIntensity, 0.3, 0.3, 0.3));
    gl.uniform3fv(lightSpecularColor, this.lightIntesity(0.5, 1.0, 1.0, 1.0));
    gl.uniform3fv(lightDiffuseColor, this.lightIntesity(diffuseIntensity, 1.0, 1.0, 1.0));
    gl.uniform1i(hasFlashlight, 0);
  };

  this.lightIntesity = function(i, r, g, b) {
    return [i * r, i * g, i * b];
  };
};