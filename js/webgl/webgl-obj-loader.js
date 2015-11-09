// https://en.wikipedia.org/wiki/Wavefront_.obj_file#File_format
'use strict';

function WebGLObjLoader(gl) {

  //
  // Public variables =================================================
  //

  // scene
  this.objScene = {}
  // object title
  this.objTitle = '';

  //
  // Private variables =================================================
  //

  var objString, objFilePath, objFilename;
  var objImagePath, objTextureImages, objModels;
  var objHasTextureImages;

  var objMaterials = [];
  var geometricVertices = [];
  var textureCoordinates = [];
  var vertexNormals = [];
  var spaceVertices = [];
  var polygonalFaces = [];

  var regex_comment = /^#\s/;
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
    this.objScene = {};
    this.objTitle = fileName.replace('.obj', '');

    objFilePath = filePath;
    objFilename = fileName;
    objImagePath = imagePath;
    objModels = [];
    objHasTextureImages = false;

    objString = this.loadFile(objFilePath, objFilename);
    this.processOBJ();
  };

  WebGLObjLoader.prototype.preloadTextureImages = function(callback) {
    objTextureImages = {};
    var allMaterialImages = [];
    for (var i=0; i<this.objScene.materials.length; i++) {
      var mat = this.objScene.materials[i];

      if (mat.hasTextureImages) {
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
    }
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
    var singleModel = null;
    var currentMaterial = null;
    var geometricVerticesCountTotal = 0;
    var textureCoordinatesCountTotal = 0;
    var normalVerticesCountTotal = 0;
    for (var i=0; i<objLines.length; i++) {
      var singleLine = objLines[i];
      var lineElements = singleLine.split(regex_whiteSpace);
      lineElements.shift();

      if (singleLine == '' || regex_comment.test(singleLine))
        continue;

      if (regex_objTitle.test(singleLine) || regex_materialFile.test(singleLine)) {
        singleModel = {};
        if (regex_objTitle.test(singleLine)) {
          singleModel.id = lineElements.join(' ');
          singleModel.faces = [];
          singleModel.geometricVerticesCount = 0;
          singleModel.textureCoordinatesCount = 0;
          singleModel.normalVerticesCount = 0;
          objModels.push(singleModel);
        }
      }

      if (regex_materialFile.test(singleLine))
        this.loadMaterial(lineElements[0]);
      else if (regex_geometricVertices.test(singleLine))
        geometricVertices.push.apply(geometricVertices, lineElements);
      else if (regex_textureCoordinates.test(singleLine))
        textureCoordinates.push.apply(textureCoordinates, lineElements);
      else if (regex_vertexNormals.test(singleLine))
        vertexNormals.push.apply(vertexNormals, lineElements);
      else if (regex_spaceVertices.test(singleLine))
        spaceVertices.push.apply(spaceVertices, lineElements);
      else if (regex_useMaterial.test(singleLine)) {
        currentMaterial = {};
        currentMaterial.materialID = lineElements.join(' ');
        currentMaterial.geometricVerticesCount = 0;
        currentMaterial.textureCoordinatesCount = 0;
        currentMaterial.normalVerticesCount = 0;
        currentMaterial.verts = [];
        currentMaterial.textures = [];
        currentMaterial.norms = [];
        currentMaterial.norms = [];
        currentMaterial.solidColor = [100, 100, 100];
        singleModel.faces.push(currentMaterial);
      }
      else if (regex_polygonalFaces.test(singleLine)) {
        var singleFaceElements = singleLine.split(regex_whiteSpace);
        singleFaceElements.shift();
        for (var j=0; j<singleFaceElements.length; j++) {
          var face = singleFaceElements[j].split('/');

          var v_idx = (face[0] - 1) * 3;
          currentMaterial.verts.push(geometricVertices[v_idx + 0]);
          currentMaterial.verts.push(geometricVertices[v_idx + 1]);
          currentMaterial.verts.push(geometricVertices[v_idx + 2]);
          geometricVerticesCountTotal += 3;
          singleModel.geometricVerticesCount += 3;
          currentMaterial.geometricVerticesCount += 3;

          if (textureCoordinates.length && face[1] != '') {
            var t_idx = (face[1] - 1) * 2;
            currentMaterial.textures.push(textureCoordinates[t_idx + 0]);
            currentMaterial.textures.push(textureCoordinates[t_idx + 1]);
            textureCoordinatesCountTotal += 2;
            singleModel.textureCoordinatesCount += 2;
            currentMaterial.textureCoordinatesCount += 2;
          }

          var n_idx = (face[2] - 1) * 3;
          currentMaterial.norms.push(vertexNormals[n_idx + 0]);
          currentMaterial.norms.push(vertexNormals[n_idx + 1]);
          currentMaterial.norms.push(vertexNormals[n_idx + 2]);
          normalVerticesCountTotal += 3;
          singleModel.normalVerticesCount += 3;
          currentMaterial.normalVerticesCount += 3;
        }
      }
    }
    this.objScene.objHasTextureImages = objHasTextureImages;
    this.objScene.objTotalCountGeometricVertices = geometricVerticesCountTotal;
    this.objScene.objTotalCountTextureCoordinates = textureCoordinatesCountTotal;
    this.objScene.objTotalCountNormalVertices = normalVerticesCountTotal;
    this.objScene.models = objModels;
    this.objScene.materials = objMaterials;
  };

  this.loadMaterial = function(mtlFile) {
    var materialFileContents = this.loadFile(objFilePath, mtlFile);
    var matLines = materialFileContents.split('\n');
    var singleMaterial;
    for (var i=0; i<matLines.length; i++) {
      var singleLine = matLines[i];
      var lineElements = singleLine.split(regex_whiteSpace);
      lineElements.shift();

      if (singleLine == '' || regex_comment.test(singleLine))
        continue;

      if (regex_materialNew.test(singleLine)) {
        singleMaterial = {};
        singleMaterial.id = lineElements.join(' ');
        singleMaterial.hasTextureImages = false;
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

      if (
          (singleMaterial.textures.ambient && singleMaterial.textures.ambient.length > 0) ||
          (singleMaterial.textures.density && singleMaterial.textures.density.length > 0) ||
          (singleMaterial.textures.specular && singleMaterial.textures.specular.length > 0) ||
          (singleMaterial.textures.specularExp && singleMaterial.textures.specularExp.length > 0) ||
          (singleMaterial.textures.dissolve && singleMaterial.textures.dissolve.length > 0)
         )
        singleMaterial.hasTextureImages = true;
    }
  };

  this.parseTexture = function(textureLine) {
    objHasTextureImages = true;
    var texture = {};
    var lineElements;
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
    for (var i=0; i<this.objScene.materials.length; i++) {
      var mat = this.objScene.materials[i];
      var img;

      for (var j=0; j<mat.textures.ambient.length; j++) {
        img = mat.textures.ambient[j].image;
        this.objScene.materials[i].textures.ambient[j].loadedImage = objTextureImages[img];
      }
      
      for (var j=0; j<mat.textures.density.length; j++) {
        img = mat.textures.density[j].image;
        this.objScene.materials[i].textures.density[j].loadedImage = objTextureImages[img];
      }
      
      for (var j=0; j<mat.textures.specular.length; j++) {
        img = mat.textures.specular[j].image;
        this.objScene.materials[i].textures.specular[j].loadedImage = objTextureImages[img];
      }
      
      for (var j=0; j<mat.textures.specularExp.length; j++) {
        img = mat.textures.specularExp[j].image;
        this.objScene.materials[i].textures.specularExp[j].loadedImage = objTextureImages[img];
      }
      
      for (var j=0; j<mat.textures.dissolve.length; j++) {
        img = mat.textures.dissolve[j].image;
        this.objScene.materials[i].textures.dissolve[j].loadedImage = objTextureImages[img];
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