// https://en.wikipedia.org/wiki/Wavefront_.obj_file#File_format
'use strict';

function WebGLObjLoader(gl) {

  //
  // Public variables =================================================
  //

  // object title
  this.objTitle = '';
  // final mesh
  this.objMesh = {};

  //
  // Private variables =================================================
  //

  var objString, objFilePath, objFilename, objImagePath, objTextureImages;

  var objMaterials = [];
  var geometricVertices = [];
  var textureCoordinates = [];
  var vertexNormals = [];
  var spaceVertices = [];
  var polygonalFaces = [];
  var unpacked = {};
  var hasTextureImages = false;

  var regex_objTitle = /^o\s/;
  var regex_geometricVertices = /^v\s/;
  var regex_textureCoordinates = /^vt\s/;
  var regex_vertexNormals = /^vn\s/;
  var regex_spaceVertices = /^vp\s/;
  var regex_polygonalFaces = /^f\s/;
  var regex_polygonalFacesSingle = "/";
  var regex_materialFile = /^mtllib\s/;
  var regex_whiteSpace = /\s+/;
  var regex_useMaterial = /^usemtl\s/;

  var regex_materialNew = /^newmtl\s/;
  var regex_materialAmbient = /^Ka\s/;
  var regex_materialDiffuse = /^Kd\s/;
  var regex_materialSpecular = /^Ks\s/;
  var regex_materialSpecularExp = /^Ns\s/;
  var regex_materialTransperant1 = /^Tr\s/;
  var regex_materialTransperant2 = /^d\s/;
  var regex_materialOpticalDensity = /^Ni\s/;
  var regex_materialIllumination = /^illum\s/;
  var regex_materialTextureAmbient = /^map_Ka\s/;
  var regex_materialTextureDensity = /^map_Kd\s/;
  var regex_materialTextureSpecular = /^map_Ks\s/;
  var regex_materialTextureSpecularExp = /^map_Ns\s/;
  var regex_materialTextureDissolve = /^map_d\s/;

  var illuminationModes = [
    'Color on and Ambient off',
    'Color on and Ambient on',
    'Highlight on',
    'Reflection on and Ray trace on',
    'Transparency: Glass on, Reflection: Ray trace on',
    'Reflection: Fresnel on and Ray trace on',
    'Transparency: Refraction on, Reflection: Fresnel off and Ray trace on',
    'Transparency: Refraction on, Reflection: Fresnel on and Ray trace on',
    'Reflection on and Ray trace off',
    'Transparency: Glass on, Reflection: Ray trace off',
    'Casts shadows onto invisible surfaces'
  ];

  //
  // Public =================================================
  //

  WebGLObjLoader.prototype.parseObject = function(filePath, fileName, imagePath) {
    this.objMesh = {};
    objFilePath = filePath;
    objFilename = fileName;
    objImagePath = imagePath;
    unpacked.verts = [];
    unpacked.norms = [];
    unpacked.textures = [];
    unpacked.hashIndices = {};
    unpacked.indices = [];
    unpacked.index = 0;
    hasTextureImages = false;
    objString = this.loadFile(objFilePath, objFilename);
    this.processOBJ();
  };

  WebGLObjLoader.prototype.initMeshBuffers = function() {
    this.objMesh.bufferNormal = this.buildBuffer(gl.ARRAY_BUFFER, this.objMesh.vertexNormals, 3);
    this.objMesh.bufferTexture = this.buildBuffer(gl.ARRAY_BUFFER, this.objMesh.textureCoordinates, 2);
    this.objMesh.bufferVertex = this.buildBuffer(gl.ARRAY_BUFFER, this.objMesh.geometricVertices, 3);
    this.objMesh.bufferIndex = this.buildBuffer(gl.ELEMENT_ARRAY_BUFFER, this.objMesh.indices, 1);
  };

  WebGLObjLoader.prototype.preloadTextureImages = function(callback) {
    objTextureImages = {};
    var allMaterialImages = [];
    for (var i=0; i<this.objMesh.materials.length; i++) {
      var mat = this.objMesh.materials[i];

      for (var j=0; j<mat.textures.ambient.length; j++) {
        allMaterialImages.push(objImagePath + '/' + mat.textures.ambient[j].image);
      }
      
      for (var j=0; j<mat.textures.density.length; j++) {
        allMaterialImages.push(objImagePath + '/' + mat.textures.density[j].image);
      }
      
      for (var j=0; j<mat.textures.specular.length; j++) {
        allMaterialImages.push(objImagePath + '/' + mat.textures.specular[j].image);
      }
      
      for (var j=0; j<mat.textures.specularExp.length; j++) {
        allMaterialImages.push(objImagePath + '/' + mat.textures.specularExp[j].image);
      }
      
      for (var j=0; j<mat.textures.dissolve.length; j++) {
        allMaterialImages.push(objImagePath + '/' + mat.textures.dissolve[j].image);
      }
    }
    this.objMesh.hasTextures = true;
    var that = this;
    this.preloadImages(allMaterialImages, function(images) {
      that.textureImagesLoaded(images, callback);
    });
  };

  //
  // Private =================================================
  //

  this.processOBJ = function() {
    var objLines = objString.split('\n');
    for (var i=0; i<objLines.length; i++) {
      var singleLine = objLines[i];
      var lineElements = singleLine.split(regex_whiteSpace);
      lineElements.shift();

      if (regex_objTitle.test(singleLine))
        this.objTitle = lineElements.join(' ');
      else if (regex_materialFile.test(singleLine))
        this.loadMaterial(lineElements[0]);
      else if (regex_geometricVertices.test(singleLine))
        geometricVertices.push.apply(geometricVertices, lineElements);
      else if (regex_textureCoordinates.test(singleLine))
        textureCoordinates.push.apply(textureCoordinates, lineElements);
      else if (regex_vertexNormals.test(singleLine))
        vertexNormals.push.apply(vertexNormals, lineElements);
      else if (regex_spaceVertices.test(singleLine))
        spaceVertices.push.apply(spaceVertices, lineElements);
      else if (regex_polygonalFaces.test(singleLine)) {
        /*
         * Quad triangulation for faces
         * 
         * from quad
         * 'f v0/t0/vn0 v1/t1/vn1 v2/t2/vn2 v3/t3/vn3/'
         * 
         * we get triangles
         * 'f v0/t0/vn0 v1/t1/vn1 v2/t2/vn2'
         * 'f v2/t2/vn2 v3/t3/vn3 v0/t0/vn0'
         *
         */
        // quads ...
        var quad = false;
        for (var j=0; j<lineElements.length; j++) {
          if (j === 3 && !quad) {
            j = 2;
            quad = true;
          }

          if (lineElements[j] in unpacked.hashIndices)
            unpacked.indices.push(unpacked.hashIndices[lineElements[j]]);
          else {
            var singleFace = lineElements[j].split('/');

            var v_idx = ((singleFace[0] - 1) * 3);
            unpacked.verts.push(+geometricVertices[v_idx + 0]);
            unpacked.verts.push(+geometricVertices[v_idx + 1]);
            unpacked.verts.push(+geometricVertices[v_idx + 2]);

            if (textureCoordinates.length) {
              var t_idx = ((singleFace[1] - 1) * 2);
              unpacked.textures.push(+textureCoordinates[t_idx + 0]);
              unpacked.textures.push(+textureCoordinates[t_idx + 1]);
            }

            var n_idx = ((singleFace[2] - 1) * 3);
            unpacked.norms.push(+vertexNormals[n_idx + 0]);
            unpacked.norms.push(+vertexNormals[n_idx + 1]);
            unpacked.norms.push(+vertexNormals[n_idx + 2]);

            unpacked.hashIndices[lineElements[j]] = unpacked.index;
            unpacked.indices.push(unpacked.index);
            unpacked.index += 1;
          }
          if (j === 3 && quad)
            unpacked.indices.push(unpacked.hashIndices[lineElements[0]]);
        }
      }
    }
    this.objMesh.geometricVertices = unpacked.verts;
    this.objMesh.textureCoordinates = unpacked.textures;
    this.objMesh.vertexNormals = unpacked.norms;
    this.objMesh.indices = unpacked.indices;
    this.objMesh.materials = objMaterials;
    this.objMesh.hasTextureImages = hasTextureImages;
  };

  this.loadMaterial = function(mtlFile) {
    var materialFileContents = this.loadFile(objFilePath, mtlFile);
    var matLines = materialFileContents.split('\n');
    var singleMaterial;
    for (var i=0; i<matLines.length; i++) {
      var singleLine = matLines[i];
      var lineElements = singleLine.split(regex_whiteSpace);
      lineElements.shift();

      if (singleLine == '')
        continue;

      if (regex_materialNew.test(singleLine)) {
        singleMaterial = {};
        singleMaterial.id = lineElements.join(' ');
        singleMaterial.ambient = [];
        singleMaterial.diffuse = [];
        singleMaterial.specular = [];
        singleMaterial.specularExp = [];
        singleMaterial.transparent = [];
        singleMaterial.opticalDensity = -1.0;
        singleMaterial.illumination = -1.0;
        singleMaterial.textures = {};
        singleMaterial.textures.ambient = [];
        singleMaterial.textures.density = [];
        singleMaterial.textures.specular = [];
        singleMaterial.textures.specularExp = [];
        singleMaterial.textures.dissolve = [];

        objMaterials.push(singleMaterial);
      }

      if (regex_materialAmbient.test(singleLine))
        singleMaterial.ambient.push.apply(singleMaterial.ambient, lineElements);
      else if (regex_materialDiffuse.test(singleLine))
        singleMaterial.diffuse.push.apply(singleMaterial.diffuse, lineElements);
      else if (regex_materialSpecular.test(singleLine))
        singleMaterial.specular.push.apply(singleMaterial.specular, lineElements);
      else if (regex_materialSpecularExp.test(singleLine))
        singleMaterial.specularExp.push.apply(singleMaterial.specularExp, lineElements);
      else if (regex_materialTransperant1.test(singleLine) || regex_materialTransperant2.test(singleLine))
        singleMaterial.transparent.push.apply(singleMaterial.transparent, lineElements);
      else if (regex_materialOpticalDensity.test(singleLine))
        singleMaterial.opticalDensity = lineElements[0];
      else if (regex_materialIllumination.test(singleLine))
        singleMaterial.illumination = lineElements[0];
      else if (regex_materialTextureAmbient.test(singleLine))
        singleMaterial.textures.ambient.push(this.parseTexture(lineElements.join(' ')));
      else if (regex_materialTextureDensity.test(singleLine))
        singleMaterial.textures.density.push(this.parseTexture(lineElements.join(' ')));
      else if (regex_materialTextureSpecular.test(singleLine))
        singleMaterial.textures.specular.push(this.parseTexture(lineElements.join(' ')));
      else if (regex_materialTextureSpecularExp.test(singleLine))
        singleMaterial.textures.specularExp.push(this.parseTexture(lineElements.join(' ')));
      else if (regex_materialTextureDissolve.test(singleLine))
        singleMaterial.textures.dissolve.push(this.parseTexture(lineElements.join(' ')));
    }
  };

  this.parseTexture = function(textureLine) {
    var texture = {};
    var lineElements;
    hasTextureImages = true;
    if (textureLine.indexOf('-') > -1) {
      lineElements = textureLine.split('-');

      var img = lineElements[lineElements.length - 1].split(' ');
      texture.image = img[img.length - 1];
      img.pop();

      lineElements[lineElements.length - 1] = img.join(' ');

      texture.commands = [];
      lineElements.shift();
      for (var i=0; i<lineElements.length; i++) {
        var comArr = lineElements[i].split(' ');
        var singleCommand = {};
        singleCommand.command = comArr[0];
        comArr.shift();
        singleCommand.arguments = comArr.join(' ');
        texture.commands.push(singleCommand);
      }
    }
    else
      texture.image = textureLine;
    return texture;
  };

  //
  // Texture Preloading =================================================
  //

  this.preloadImages = function(imgs, callback) {
    var loaded = 0;
    var images = [];
    imgs = Object.prototype.toString.apply( imgs ) === '[object Array]' ? imgs : [imgs];
    var inc = function() {
      loaded += 1;
      if (loaded === imgs.length && callback)
        callback(images);
    };
    for (var i=0; i<imgs.length; i++) {
      images[i] = new Image();
      images[i].id = imgs[i].replace(objImagePath, '').replace('/', '');
      images[i].onabort = inc;
      images[i].onerror = inc;
      images[i].onload = inc;
      images[i].src = imgs[i];
      objTextureImages[images[i].id] = images[i];
    }
  };

  this.textureImagesLoaded = function(images, callback) {
    for (var i=0; i<this.objMesh.materials.length; i++) {
      var mat = this.objMesh.materials[i];
      var img;

      for (var j=0; j<mat.textures.ambient.length; j++) {
        img = mat.textures.ambient[j].image;
        this.objMesh.materials[i].textures.ambient[j].loadedImage = objTextureImages[img];
      }
      
      for (var j=0; j<mat.textures.density.length; j++) {
        img = mat.textures.density[j].image;
        this.objMesh.materials[i].textures.density[j].loadedImage = objTextureImages[img];
      }
      
      for (var j=0; j<mat.textures.specular.length; j++) {
        img = mat.textures.specular[j].image;
        this.objMesh.materials[i].textures.specular[j].loadedImage = objTextureImages[img];
      }
      
      for (var j=0; j<mat.textures.specularExp.length; j++) {
        img = mat.textures.specularExp[j].image;
        this.objMesh.materials[i].textures.specularExp[j].loadedImage = objTextureImages[img];
      }
      
      for (var j=0; j<mat.textures.dissolve.length; j++) {
        img = mat.textures.dissolve[j].image;
        this.objMesh.materials[i].textures.dissolve[j].loadedImage = objTextureImages[img];
      }
    }
    callback();
  };

  //
  // Utilities =================================================
  //

  this.buildBuffer = function(type, data, itemSize) {
    var buffer = gl.createBuffer();
    var arrayView = type === gl.ARRAY_BUFFER ? Float32Array : Uint16Array;
    gl.bindBuffer(type, buffer);
    gl.bufferData(type, new arrayView(data), gl.STATIC_DRAW);
    buffer.itemSize = itemSize;
    buffer.numItems = data.length / itemSize;
    return buffer;
  };

  this.loadFile = function(objFilePath, fileName) {
    var fileURL = objFilePath + ((objFilePath.indexOf('/', objFilePath.length - 1) !== -1) ? '' : '/') + fileName;
    var req = new XMLHttpRequest();
    req.open("GET", fileURL, false);
    req.send(null);
    showMessageInfo('External source loaded : <br /><pre><code>' + req.responseText + '</code></pre>');
    if (req.status == 200)
      return req.responseText;
    else
      throw "Cannot load obj file! (" + fileURL + ")";
  };

}