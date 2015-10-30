// https://en.wikipedia.org/wiki/Wavefront_.obj_file#File_format

function WebGLObjLoader(gl) {

  //
  // Variables =================================================
  //

  var objString;
  var mesh = {};

  var objTitle = '';

  // geometric vertices
  var geometricVertices = [];
  // texture coordinates
  var textureCoordinates = [];
  // vertex normals
  var vertexNormals = [];
  // space vertices
  var spaceVertices = [];
  // polygonal faces
  var polygonalFaces = [];

  // regex for line identifiers
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

  this.parseObject = function(objFileURL) {
    this.initLoader(objFileURL);
  };

  this.setupBuffers = function() {
    return this.initBuffers();
  };

  this.release = function() {
    this.objString = '';
    geometricVertices = [];
    textureCoordinates = [];
    vertexNormals = [];
    spaceVertices = [];
    polygonalFaces = [];
    this.deleteBuffers();
  };

  //
  // Parsing =================================================
  //

  this.processOBJ = function() {
    var objLines = objString.split('\n');
    for (var i=0; i<objLines.length; i++) {
      // single line
      var singleLine = objLines[i];
      // line elements
      var lineElements = singleLine.split(regex_whiteSpace);
      // remove line identifier
      lineElements.shift();

      // check which section we're in
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
        // TODO: ...
        // f 1/1/1 2/2/1 3/3/1 4/4/1
        var lineFaces = singleLine.split(regex_whiteSpace);
        lineFaces.shift();
        for (var f=0; f<lineFaces.length; f++) {
          polygonalFaces.push.apply(polygonalFaces, lineFaces[f].split(regex_polygonalFacesSingle));
        }
      }
    }
  };

  this.initBuffers = function() {
    showMessage(geometricVertices);
    mesh.bufferGeometricVertices = this.buildBuffer(gl.ARRAY_BUFFER, geometricVertices, 3);
    mesh.bufferTextureCoordinates = this.buildBuffer(gl.ARRAY_BUFFER, textureCoordinates, 3);
    mesh.bufferVertexNormals = this.buildBuffer(gl.ARRAY_BUFFER, vertexNormals, 3);
    mesh.bufferSpaceVertices = this.buildBuffer(gl.ARRAY_BUFFER, spaceVertices, 3);
    mesh.bufferPolygonalFaces = this.buildBuffer(gl.ARRAY_BUFFER, polygonalFaces, 3);
    return mesh;
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


  this.deleteBuffers = function() {
    gl.deleteBuffer(mesh.bufferGeometricVertices);
    gl.deleteBuffer(mesh.bufferTextureCoordinates);
    gl.deleteBuffer(mesh.bufferVertexNormals);
    gl.deleteBuffer(mesh.bufferSpaceVertices);
    gl.deleteBuffer(mesh.bufferPolygonalFaces);
  };

  //
  // Utilities =================================================
  //

  this.initLoader = function(objFileURL) {
    var req = new XMLHttpRequest();
    req.open("GET", objFileURL, false);
    req.send(null);
    showMessage('External source loaded : <br /><pre><code>' + req.responseText + '</code></pre>');
    if (req.status == 200) {
      objString = req.responseText;
      this.processOBJ();
    }
    else
      throw "Cannot load obj file! (" + objFileURL + ")";
  };

}