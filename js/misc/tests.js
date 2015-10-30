function Tests(gl, gameCanvas) {

  this.runTests = function() {
    //this.runObjLoader();
  };

  this.runObjLoader = function() {
    var objLoader = new WebGLObjLoader(gl);
    objLoader.parseObject('../../objects/complex.obj');
    objLoader.setupBuffers();
  };

}