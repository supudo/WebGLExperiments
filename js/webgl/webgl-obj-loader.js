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

  var objString;

  var geometricVertices = [];
  var textureCoordinates = [];
  var vertexNormals = [];
  var spaceVertices = [];
  var polygonalFaces = [];
  var unpacked = {};

  var regex_objTitle = /^o\s/;
  var regex_geometricVertices = /^v\s/;
  var regex_textureCoordinates = /^vt\s/;
  var regex_vertexNormals = /^vn\s/;
  var regex_spaceVertices = /^vp\s/;
  var regex_polygonalFaces = /^f\s/;
  var regex_polygonalFacesSingle = "/";
  var regex_whiteSpace = /\s+/;

  //
  // Public =================================================
  //

  WebGLObjLoader.prototype.parseObject = function(objFileURL) {
    this.objMesh = {};
    unpacked.verts = [];
    unpacked.norms = [];
    unpacked.textures = [];
    unpacked.hashIndices = {};
    unpacked.indices = [];
    unpacked.index = 0;
    this.loadFile(objFileURL);
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

            //var dOutput = '[' + j + '] = (' + singleFace + ')\n';
            //dOutput += 'VER = ' + v_idx + ' = ' + (+geometricVertices[v_idx + 0]) + ' ' + (+geometricVertices[v_idx + 1]) + ' ' + (+geometricVertices[v_idx + 2]) + '\n';
            //dOutput += 'TEX = ' + t_idx + ' = ' + (+textureCoordinates[t_idx + 0]) + ' ' + (+textureCoordinates[t_idx + 1]) + '\n';
            //dOutput += 'NOR = ' + n_idx + ' = ' + (+vertexNormals[n_idx + 0]) + ' ' + (+vertexNormals[n_idx + 1]) + '\n';
            //showMessage('<pre><code>' + dOutput + '</code></pre>');
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
  };

  //
  // Utilities =================================================
  //

  this.initMeshBuffers = function() {
    this.objMesh.bufferNormal = this.buildBuffer(gl.ARRAY_BUFFER, this.objMesh.vertexNormals, 3);
    this.objMesh.bufferTexture = this.buildBuffer(gl.ARRAY_BUFFER, this.objMesh.textureCoordinates, 2);
    this.objMesh.bufferVertex = this.buildBuffer(gl.ARRAY_BUFFER, this.objMesh.geometricVertices, 3);
    this.objMesh.bufferIndex = this.buildBuffer(gl.ELEMENT_ARRAY_BUFFER, this.objMesh.indices, 1);
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

  this.loadFile = function(objFileURL) {
    var req = new XMLHttpRequest();
    req.open("GET", objFileURL, false);
    req.send(null);
    showMessageInfo('External source loaded : <br /><pre><code>' + req.responseText + '</code></pre>');
    if (req.status == 200) {
      objString = req.responseText;
      this.processOBJ();
    }
    else
      throw "Cannot load obj file! (" + objFileURL + ")";
  };

}