// globals

// Enums
var X = 0, Y = 1, Z = 2, H = 3, P = 4;
// gl context
var gl;
// the canvas we're working with
var canvas;
// application var holder
var app = {};
  // mesh holder
  app.meshes = {};
  // model holder
  app.models = {};
  // this model has a single texture image,
  // so there is no need to have more than one
  // texture holder
  app.textures = {};
  // keyboard key ids
  app.keys = { W: 87, A: 65, S: 83, D: 68 };
  app.keys.pressed = {};
  for( key in app.keys ){
    app.keys.pressed[ app.keys[ key ] ] = false;
  }
  // camera
  app.camera = {};
  app.camera.position = [0,0.3,3.7];
  app.camera.inversePosition = vec3.create();
  app.camera.heading = 0;
  app.camera.pitch = 0;
  app.camera.walkSpeed = 0.001;
  app.camera.runSpeed = 0.002;
  app.camera.speed = app.camera.walkSpeed;
  app.camera.sensitivity = 10;
  app.camera.disable = false;
  app.camera.shake = false;
  app.camera.shakeTimer = 0;
  app.camera.shakeFrequency = 100;
  app.camera.shakeAmplitude = 0.01;
  // matrices
  app.elapsed = 0;
  // which function to use to draw
  app.drawScene;
  app.scenechange = false;
  // room light
  app.lightLocationStatic = [0,2,0];
  app.lightVectorStatic = [0,-1,0];
  app.lightLocation = vec3.create();
  app.lightVector = vec3.create();
  app.ambientIntensity = 0.5;
  app.diffuseIntensity = 2.0;
  app.hasFlashlight = false;
  app.mvMatrix = mat4.create();
  app.mvMatrixStack = [];
  app.pMatrix = mat4.create();
  // animation references
  app.lastTime = 0;
  app.elapsed = 0;
  // which function to use to draw
  app.drawScene;
  app.scenechange = false;
  // room light
  app.lightLocationStatic = [0,2,0];
  app.lightVectorStatic = [0,-1,0];
  app.lightLocation = vec3.create();
  app.lightVector = vec3.create();
  app.ambientIntensity = 0.5;
  app.diffuseIntensity = 2.0;
  app.hasFlashlight = false;
  // particles
  app.particles = {};
  app.particles.min = [-0.5,0.3,-0.1];
  app.particles.max = [0.5,0.7,0.1];
  app.particles.maxVector = 1;
  app.particles.TTL = 1;
  app.particles.rate = 1000; // current time rate ( real time vs slow mo )
  // monkey
  app.monkey = {};
  app.monkey.position = [0,0,0]
  // boulder
  app.boulder = {};
  app.boulder.position = [0,0.245,-2.21];
  app.boulder.rotation = 0;
  // animations
  app.animate = false;
  app.animations = {};
  app.animations.currentAnimation = 0;
    // move to the monkey
    app.animations.moveToMonkeyTime = 2; // framelength in seconds
    app.animations.moveToMonkeyStartTime = 0;
    app.animations.moveToMonkeyStartPosition = [];
    app.animations.moveToMonkeyStartHeadingPitch = [];
    app.animations.moveToMonkeyEndPosition = [0,0.3,0.3];
    // take the monkey
    app.animations.takeMonkeyTime = 1; // framelength in seconds
    app.animations.takeMonkeyStartTime = 0;
    app.animations.takeMonkeyStartPosition = [];
    app.animations.takeMonkeyEndPosition = [0,0,-0.2];
    // walls
    app.breakWalls = false;
    app.wallScale = 1;
    app.animations.boulderCrashStartTime = 0;
    // turn around
    app.animations.turnAroundTime = 1; // framelength in seconds
    app.animations.turnAroundStartTime = 0;

var shaderProgram;
var particleShaderProgram;
var light = 0;
var angle = 0;

function getPercentage(frameLength, startTime, timeNow){
  var time = frameLength * 1000;
  timeNow = timeNow - startTime;
  return timeNow / time;
}

function startAnimations(){
  app.animate = true;
  app.camera.disable = true;
  setupForMoveCameraToMonkey();
  app.animations.currentAnimation = moveCameraToMokey;
  if( !app.hasFlashlight ){
    app.hasFlashlight = true;
  }
}

function setupForMoveCameraToMonkey(){
  app.animations.moveToMonkeyStartTime = app.timeNow;
  app.animations.moveToMonkeyStartPosition = app.camera.position;
  app.animations.moveToMonkeyStartHeadingPitch = [app.camera.heading, app.camera.pitch, 0, 0];
}

// keyframes
function moveCameraToMokey(){
  var percentage = getPercentage(app.animations.moveToMonkeyTime, app.animations.moveToMonkeyStartTime, app.timeNow);
  if( percentage > 1.0 ){
    setupForTakeMonkey();
  }
  vec3.lerp( app.animations.moveToMonkeyStartPosition, app.animations.moveToMonkeyEndPosition, percentage/10, app.camera.position );
  var temp = quat4.create();
  quat4.slerp( app.animations.moveToMonkeyStartHeadingPitch, [0,0,0,0], percentage, temp );
  app.camera.heading = temp[0];
  app.camera.pitch = temp[1];
}

function setupForTakeMonkey(){
  app.animations.takeMonkeyStartTime = app.timeNow;
  app.animations.currentAnimation = takeMonkey;
  app.animations.takeMonkeyStartPosition = app.monkey.position;
}

function takeMonkey(){
  var percentage = getPercentage(app.animations.takeMonkeyTime, app.animations.takeMonkeyStartTime, app.timeNow);
  if( percentage > 1.0 ){
    setupForBeginShake();
    app.monkey.position = [1000,1000,1000];
    return;
  }
  vec3.lerp( app.animations.takeMonkeyStartPosition, app.animations.takeMonkeyEndPosition, percentage/10, app.monkey.position );
}

function setupForBeginShake(){
  app.animations.currentAnimation = beginShake;
  app.camera.shake = true;
}

function beginShake(){
  if( app.camera.shakeAmplitude > 0.3 ){
    setupWalkBackwards();
    return;
  }
  app.camera.shakeAmplitude += 0.001;
}

function setupWalkBackwards(){
  app.animations.currentAnimation = walkBackwards;
}

function walkBackwards(){
  app.camera.position[Z] += 0.01;
  if( app.camera.position[Z] > 1.0 ){
    setupBoulderCrash();
    return;
  }
}

function setupBoulderCrash(){
  app.startAnimateTime = app.timeNow;
  app.breakWalls = true;
  app.animations.currentAnimation = boulderCrash;
  app.animations.boulderCrashStartTime = app.timeNow;
}

function boulderCrash(){
  app.camera.position[Z] += 0.01;
  app.boulder.position[Z] += 0.02;
  app.wallScale += 0.1;
  app.boulder.rotation = app.boulder.rotation > 360 ? 0 : app.boulder.rotation + 2;
  
  mvPushMatrix();
    mat4.translate( app.mvMatrix, [0,0.4,-4] );
    drawParticles( app.particles );
  mvPopMatrix();
  
  mvPushMatrix()
    mat4.scale( app.mvMatrix, [app.wallScale,app.wallScale,app.wallScale] );
    drawObject( app.models.room_wall_broken, 0 );
  mvPopMatrix();
  
  mvPushMatrix()
    mat4.translate( app.mvMatrix, app.boulder.position );
    mat4.rotate( app.mvMatrix, degToRad( app.boulder.rotation ), [1,0,0] )
    drawObject( app.models.boulder, 0 );
  mvPopMatrix();
  
  if( app.camera.position[Z] > 2.0 ){
    setupTurnAround();
    return;
  }
}

function setupTurnAround(){
  app.animations.currentAnimation = turnAround;
  app.animations.turnAroundStartTime = app.timeNow;
}

function turnAround(){
  mvPushMatrix()
    mat4.translate( app.mvMatrix, app.boulder.position );
    mat4.rotate( app.mvMatrix, degToRad( app.boulder.rotation ), [1,0,0] )
    drawObject( app.models.boulder, 0 );
  mvPopMatrix();
  
  app.camera.position[Z] += 0.01;
  app.boulder.position[Z] += 0.02;
  app.boulder.rotation = app.boulder.rotation > 360 ? 0 : app.boulder.rotation + 2;
  
  var percentage = getPercentage(app.animations.turnAroundTime, app.animations.turnAroundStartTime, app.timeNow);
  var temp = quat4.create();
  quat4.slerp( [0,0,0,0], [180,0,0,0], percentage, temp );
  app.camera.heading = temp[0];
  if( percentage > 1.0 ){
    setupFadeOut();
    return;
  }
}

function setupFadeOut(){
  app.animations.currentAnimation = fadeOut;
  app.ambientIntensityStart = app.ambientIntensity;
  app.diffuseIntensityStart = app.diffuseIntensity;
}

function fadeOut(){
  app.camera.position[Z] += 0.02;
  app.ambientIntensity -= 0.05;
  app.diffuseIntensity -= 0.05;
  
  if( app.ambientIntensity < 0 && app.diffuseIntensity < 0 ){
    app.hasFlashlight = false;
    app.ambientIntensity = 0;
    app.diffuseIntensity = 0;
    setupFadeIn();
    return;
  }
}

function setupFadeIn(){
  app.animations.currentAnimation = fadeIn;
//  app.ambientIntensity = app.ambientIntensityStart;
//  app.diffuseIntensity = app.diffuseIntensityStart;
  app.drawScene = drawTunnelScene;
}

function fadeIn(){
  if( app.ambientIntensity < app.ambientIntensityStart )
  app.ambientIntensity += 0.025;
  if( app.diffuseIntensity < app.diffuseIntensityStart )
  app.diffuseIntensity += 0.025;
  if( app.ambientIntensity > app.ambientIntensityStart && app.diffuseIntensity > app.diffuseIntensityStart ){
  setupTunnelRun();
    return;
  }
}

function setupTunnelRun() {
  app.animations.currentAnimation = tunnelRun;
  app.hasFlashlight = true;
}

function tunnelRun() {
  app.animate = false;
}

function drawObject( model, shininess, color ){
  /*
    Takes in a model that points to a mesh and draws the object on the scene.
    Assumes that the setMatrixUniforms function exists
    as well as the shaderProgram has a uniform attribute called "samplerUniform"
  */
  gl.useProgram( shaderProgram );
  
  gl.bindBuffer(gl.ARRAY_BUFFER, model.mesh.vertexBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, model.mesh.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, model.mesh.textureBuffer);
  gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, model.mesh.textureBuffer.itemSize, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, model.mesh.normalBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, model.mesh.normalBuffer.itemSize, gl.FLOAT, false, 0, 0);

  if( 'texture' in model ){
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, model.texture);
    gl.uniform1i(shaderProgram.samplerUniform, 0);
    gl.uniform1i(shaderProgram.hasTexure, true);
  }
  else{
    gl.uniform1i(shaderProgram.hasTexure, false);
    gl.uniform4fv( shaderProgram.modelColor, color );
  }
  
  if( shininess ){
    gl.uniform1f( shaderProgram.materialShininessUniform, shininess );
  }
  else{
    gl.uniform1f( shaderProgram.materialShininessUniform, 0 );
  }

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.mesh.indexBuffer);
  setMatrixUniforms();
  gl.drawElements(gl.TRIANGLES, model.mesh.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
}

function drawParticles( particles ){
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
  gl.disable(gl.DEPTH_TEST);

  gl.useProgram( particleShaderProgram );

  gl.bindBuffer(gl.ARRAY_BUFFER, particles.locationsBuffer);
  gl.vertexAttribPointer(particleShaderProgram.particlePosition, particles.locationsBuffer.itemSize, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, particles.vectorsBuffer);
  gl.vertexAttribPointer(particleShaderProgram.particleVector, particles.vectorsBuffer.itemSize, gl.FLOAT, false, 0, 0);
  
  gl.bindBuffer(gl.ARRAY_BUFFER, particles.ttlBuffer);
  gl.vertexAttribPointer(particleShaderProgram.particleTTL, particles.ttlBuffer.itemSize, gl.FLOAT, false, 0, 0);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, particles.texture);
  gl.uniform1i(particleShaderProgram.samplerUniform, 0);
  
  gl.uniform1f( particleShaderProgram.time, ( app.timeNow - app.startAnimateTime ) / app.particles.rate );
  gl.uniformMatrix4fv(particleShaderProgram.pMatrixUniform, false, app.pMatrix);
  gl.uniformMatrix4fv(particleShaderProgram.mvMatrixUniform, false, app.mvMatrix);

  gl.drawArrays(gl.POINTS, 0, particles.locationsBuffer.numItems);
  
  gl.disable(gl.BLEND);
  gl.enable(gl.DEPTH_TEST);
}

function mvPushMatrix() {
    var copy = mat4.create();
    mat4.set(app.mvMatrix, copy);
    app.mvMatrixStack.push(copy);
}

function mvPopMatrix() {
  if (app.mvMatrixStack.length == 0) {
      throw "Invalid popMatrix!";
  }
  app.mvMatrix = app.mvMatrixStack.pop();
}

function setMatrixUniforms() {
  gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, app.pMatrix);
  gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, app.mvMatrix);

  var normalMatrix = mat3.create();
  mat4.toInverseMat3(app.mvMatrix, normalMatrix);
  mat3.transpose(normalMatrix);
  gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, normalMatrix);
}

function lightIntesity( i, r, g, b){
  return [ i*r, i*g, i*b ];
}

function setUniforms(){
  gl.uniform3fv( shaderProgram.ambientColorUniform, lightIntesity( app.ambientIntensity, 0.3, 0.3, 0.3 ) );
  gl.uniform3fv( shaderProgram.lightSpecularColor, lightIntesity( 0.5, 1.0, 1.0, 1.0 ) );
  gl.uniform3fv( shaderProgram.lightDiffuseColor, lightIntesity( app.diffuseIntensity, 1.0, 1.0, 1.0 ) );
  gl.uniform1i( shaderProgram.hasFlashlight, app.hasFlashlight );
}

function degToRad(degrees) {
    return degrees * Math.PI / 180;
}

function Array2Buffer(array, iSize, nSize) {
  var buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(array), gl.STATIC_DRAW);
  buffer.itemSize = iSize;
  buffer.numItems = nSize;
  return buffer;
}

function Array2EBuffer(array, iSize, nSize) {
  var buffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(array), gl.STATIC_DRAW);
  buffer.itemSize = iSize;
  buffer.numItems = nSize;
  return buffer;
}

function drawBuffer(vpbuf, vcbuf, start, nitems, gltype) {
  gl.bindBuffer(gl.ARRAY_BUFFER, vpbuf);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, vpbuf.itemSize, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, vcbuf);
  gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, vcbuf.itemSize, gl.FLOAT, false, 0, 0);
  setMatrixUniforms();
  gl.drawArrays(gltype, start, nitems);
}

function initGL(canvas) {
  try {
    gl = canvas.getContext("experimental-webgl");
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;
  } catch (e) {
  }
  if (!gl) {
    alert("Could not initialise WebGL, sorry :-(");
  }
}

function getShader(gl, id) {
  var shaderScript = document.getElementById(id);
  if (!shaderScript) {
    return null;
  }

  var str = "";
  var k = shaderScript.firstChild;
  while (k) {
    if (k.nodeType == 3) {
      str += k.textContent;
    }
    k = k.nextSibling;
  }

  var shader;
  if (shaderScript.type == "x-shader/x-fragment") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (shaderScript.type == "x-shader/x-vertex") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
    return null;
  }

  gl.shaderSource(shader, str);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  }

  return shader;
}

function initShaders() {
  initParticleShaders();

  var fragmentShader = getShader(gl, "shader-fs");
  var vertexShader = getShader(gl, "shader-vs");

  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Could not initialise shaders");
  }

  gl.useProgram(shaderProgram);

  shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

  shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
  gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);

  shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
  gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);

  shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
  shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
  shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
  shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");
  shaderProgram.modelColor = gl.getUniformLocation(shaderProgram, "uColor");
  shaderProgram.materialShininessUniform = gl.getUniformLocation(shaderProgram, "uMaterialShininess");
  shaderProgram.useTexturesUniform = gl.getUniformLocation(shaderProgram, "uUseTextures");
  shaderProgram.ambientColorUniform = gl.getUniformLocation(shaderProgram, "uAmbientColor");
  shaderProgram.hasTexure = gl.getUniformLocation(shaderProgram, "uHasTexure");
  shaderProgram.hasFlashlight = gl.getUniformLocation(shaderProgram, "uHasFlashlight");
  shaderProgram.lightLocation = gl.getUniformLocation(shaderProgram, "uLightLocation");
  shaderProgram.lightVector = gl.getUniformLocation(shaderProgram, "uSpotDirection");
  shaderProgram.lightSpecularColor = gl.getUniformLocation(shaderProgram, "uLightSpecularColor");
  shaderProgram.lightDiffuseColor = gl.getUniformLocation(shaderProgram, "uLightDiffuseColor");
}

function initParticleShaders() {
  var fragmentShader = getShader(gl, "particle-shader-fs");
  var vertexShader = getShader(gl, "particle-shader-vs");

  particleShaderProgram = gl.createProgram();
  gl.attachShader(particleShaderProgram, vertexShader);
  gl.attachShader(particleShaderProgram, fragmentShader);
  gl.linkProgram(particleShaderProgram);

  if (!gl.getProgramParameter(particleShaderProgram, gl.LINK_STATUS)) {
    alert("Could not initialise shaders");
  }

  particleShaderProgram.particlePosition = gl.getAttribLocation(particleShaderProgram, "aParticlePosition");
  gl.enableVertexAttribArray(particleShaderProgram.particlePosition);

  particleShaderProgram.particleVector = gl.getAttribLocation(particleShaderProgram, "aParticleVector");
  gl.enableVertexAttribArray(particleShaderProgram.particleVector);

  particleShaderProgram.particleTTL = gl.getAttribLocation(particleShaderProgram, "aParticleTTL");
  gl.enableVertexAttribArray(particleShaderProgram.particleTTL);

  particleShaderProgram.time = gl.getUniformLocation(particleShaderProgram, "time");
  particleShaderProgram.samplerUniform = gl.getUniformLocation(particleShaderProgram, "uSampler");
  particleShaderProgram.pMatrixUniform = gl.getUniformLocation(particleShaderProgram, "uPMatrix");
  particleShaderProgram.mvMatrixUniform = gl.getUniformLocation(particleShaderProgram, "uMVMatrix");
}

function handleLoadedTexture(texture) {
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
  gl.generateMipmap(gl.TEXTURE_2D);

  gl.bindTexture(gl.TEXTURE_2D, null);
}

function initTexture( object, url) {
  object.texture = gl.createTexture();
  object.texture.image = new Image();
  object.texture.image.crossOrigin = "anonymous";
  object.texture.image.onload = function () {
    handleLoadedTexture( object.texture );
  }
  object.texture.image.src = url;
}

function initTextures(){
  initTexture( app.models.room_ceiling, "stony_ground.jpg" );
  initTexture( app.models.room_walls, "stone_wall.png" );
  initTexture( app.models.room_floor, "room_floor.jpg" );
  app.models.room_tunnel_walls.texture = app.models.room_walls.texture;
  app.models.room_wall_broken.texture = app.models.room_walls.texture;
  app.models.room_wall_unbroken.texture = app.models.room_walls.texture;
  app.models.room_tunnel_ceiling.texture = app.models.room_ceiling.texture;
  app.models.boulder.texture = app.models.room_ceiling.texture;
  initTexture( app.particles, "smoke.png" );
}

function initBuffers() {
  // initialize the mesh's buffers
  for( mesh in app.meshes ){
    OBJ.initMeshBuffers( gl, app.meshes[ mesh ] );
    // this loops through the mesh names and creates new
    // model objects and setting their mesh to the current mesh
    app.models[ mesh ] = {};
    app.models[ mesh ].mesh = app.meshes[ mesh ];
  }
  app.models.skylight = {};
  app.models.skylight.mesh = app.models.room_floor.mesh;
  createParticles( 100000, app.particles.min, app.particles.max, app.particles.maxVector, app.particles.TTL, app.particles );
}

function initPointerLock() {
  // Start by going fullscreen with the element.  Current implementations
  // require the element to be in fullscreen before requesting pointer
  // lock--something that will likely change in the future.
  canvas.requestFullscreen = canvas.requestFullscreen    ||
                             canvas.mozRequestFullscreen ||
                             canvas.mozRequestFullScreen || // Older API upper case 'S'.
                             canvas.webkitRequestFullscreen;
  canvas.addEventListener('click', canvas.requestFullscreen, false);

  document.addEventListener('fullscreenchange', fullscreenChange, false);
  document.addEventListener('mozfullscreenchange', fullscreenChange, false);
  document.addEventListener('webkitfullscreenchange', fullscreenChange, false);

  document.addEventListener('pointerlockchange', pointerLockChange, false);
  document.addEventListener('mozpointerlockchange', pointerLockChange, false);
  document.addEventListener('webkitpointerlockchange', pointerLockChange, false);
}

function fullscreenChange() {
  if ( document.webkitFullscreenElement === canvas ||
       document.mozFullscreenElement === canvas ||
       document.mozFullScreenElement === canvas ) { // Older API upper case 'S'.
    // Element is fullscreen, now we can request pointer lock
    canvas.requestPointerLock = canvas.requestPointerLock    ||
                                canvas.mozRequestPointerLock ||
                                canvas.webkitRequestPointerLock;
    canvas.requestPointerLock();
    gl.viewportWidth = canvas.width = window.innerWidth;
    gl.viewportHeight = canvas.height = window.innerHeight;
  }
  else{
    gl.viewportWidth = canvas.width = 500;
    gl.viewportHeight = canvas.height = 500;
  }
}

function pointerLockChange( e ){
  if ( document.pointerLockElement === canvas ||
       document.mozPointerLockElement === canvas ||
       document.webkitPointerLockElement === canvas )
  {
    document.addEventListener("mousemove", moveCallback, false);
  }
  else{
    document.removeEventListener("mousemove", moveCallback, false);
  }
}

function moveCallback( e ){
  if( !app.camera.disable ){
    var movementX = e.movementX       ||
                    e.mozMovementX    ||
                    e.webkitMovementX ||
                    0,
        movementY = e.movementY       ||
                    e.mozMovementY    ||
                    e.webkitMovementY ||
                    0;

  app.camera.heading += movementX / app.camera.sensitivity;
  app.camera.pitch += movementY / app.camera.sensitivity;

    if( app.camera.pitch < -90 )
      app.camera.pitch = -90;
    if( app.camera.pitch > 90 )
      app.camera.pitch = 90;
    if( app.camera.heading < -180 )
      app.camera.heading += 360
    if( app.camera.heading > 180 )
      app.camera.heading -= 360
  }
}

function cameraKeyDownHandler( e ){
  app.keys.pressed[ e.which ] = true;
  if( e.which === 16 ){
    app.camera.speed = app.camera.runSpeed;
  }
  // f
  if( e.which === 70 ){
    app.hasFlashlight = !app.hasFlashlight;
  }
  // e
  if( e.which === 69  && !app.animate && vec3.length( app.camera.position ) < 1 ){
    startAnimations();
  }
}

function cameraKeyUpHandler( e ){
  app.keys.pressed[ e.which ] = false;
  if( e.which == 16 ){
    app.camera.speed = app.camera.walkSpeed;
  }
}

function cameraShake(){
  app.camera.shakeTimer = app.camera.shakeTimer > Math.PI * 2 ? 0 : app.camera.shakeTimer + 0.01;
  app.camera.heading += app.camera.shakeAmplitude * Math.sin( app.camera.shakeTimer * app.camera.shakeFrequency );
  app.camera.pitch += app.camera.shakeAmplitude * Math.sin( app.camera.shakeTimer * app.camera.shakeFrequency );
}

function cameraMove(){
  var distance = app.elapsed * app.camera.speed;
  var camX = 0, camZ = 0;
  var pitchFactor = 1;//Math.cos( degToRad( app.camera.pitch ) );
  // forward
  if( app.keys.pressed[ app.keys.W ] ){
    camX += distance * Math.sin( degToRad( app.camera.heading ) ) * pitchFactor;
    camZ += distance * Math.cos( degToRad( app.camera.heading ) ) * pitchFactor * -1.0;
  }
  // backward
  if( app.keys.pressed[ app.keys.S ] ){
    camX += distance * Math.sin( degToRad( app.camera.heading ) ) * pitchFactor * -1.0;
    camZ += distance * Math.cos( degToRad( app.camera.heading ) ) * pitchFactor;
  }
  // strafing right
  if( app.keys.pressed[ app.keys.D ] ){
    camX += distance * Math.cos( degToRad( app.camera.heading ) );
    camZ += distance * Math.sin( degToRad( app.camera.heading ) );
  }
  // strafing left
  if( app.keys.pressed[ app.keys.A ] ){
    camX += -distance * Math.cos( degToRad( app.camera.heading ) );
    camZ += -distance * Math.sin( degToRad( app.camera.heading ) );
  }

  if( camX > distance )
    camX = distance;
  if( camX < -distance )
    camX = -distance;
  if( camZ > distance )
    camZ = distance;
  if( camZ < -distance )
    camZ = -distance;

  app.camera.position[ X ] += camX;
  app.camera.position[ Z ] += camZ;
}

app.tunneldata = {};
app.tunneldata.length = 10;
app.tunneldata.angleRange = 12;
app.tunneldata.angleMin = -app.tunneldata.angleRange/2;
app.tunneldata.angle = {};
app.tunneldata.ground = {};
app.tunneldata.groundSpace = {};
app.tunneldata.groundTexture = "stony_ground.jpg";
app.tunneldata.wall = {};
app.tunneldata.celling = {};
app.tunneldata.cellingSpace = {};
app.tunneldata.cellingTexture = "stony_ground.jpg"
app.tunneldata.space = {};

function drawTunnelScene() {
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 1000.0, app.pMatrix);

  mat4.identity(app.mvMatrix);

  mat4.translate(app.mvMatrix, [app.movement.current.px, 0, app.movement.current.pz]);
  
  setUniforms();
  mat4.translate(app.mvMatrix, [0,.1,-.5]);
  drawTunnel();

  if( app.animate ){
    app.animations.currentAnimation();
  }
}

function initTunnel() {
  //initBuffers
  app.tunneldata.square = {};
  app.tunneldata.square.VPB = Array2Buffer([ .5, 0,  .5,
                                            .5, 0, -.5,
                                           -.5, 0, -.5,
                                           -.5, 0,  .5], 3, 4);
  app.tunneldata.square.VTB = Array2Buffer([ 1.0, 0.0,
                                            1.0, 1.0,
                                            0.0, 1.0,
                                            0.0, 0.0], 2, 4);
  app.tunneldata.square.VNB = Array2Buffer([ 0.0, 1.0, 0.0,
                                            0.0, 1.0, 0.0,
                                            0.0, 1.0, 0.0,
                                            0.0, 1.0, 0.0,], 3, 4);
  app.tunneldata.square.VIB = Array2EBuffer([ 0, 1, 2, 0, 2, 3 ], 1, 6);

  for(i = app.tunneldata.angleMin; i < app.tunneldata.angleMin + app.tunneldata.angleRange; i++) {
    app.tunneldata.groundSpace[i] = genGroundSpace(i, app.tunneldata.groundTexture);
    app.tunneldata.cellingSpace[i] = genGroundSpace(i, app.tunneldata.cellingTexture);
  }
  
  //tunnel variance
  for(i = 0; i < app.tunneldata.length; i++) {
    app.tunneldata.angle[i] = Math.floor(Math.random()*app.tunneldata.angleRange)+app.tunneldata.angleMin;
  }

  app.tunneldata.ground = initModel(app.tunneldata.square, app.tunneldata.groundTexture);
  app.tunneldata.wall = initModel(app.tunneldata.square, "textures/stone_wall.png");
  app.tunneldata.celling = initModel(app.tunneldata.square, app.tunneldata.cellingTexture);
}

function genGroundSpace(angle, url) {
  var model = {};
  model.mesh = {};
  angle = degToRad(angle);
  if (angle > 0) {
    model.mesh.vertexBuffer = Array2Buffer([ -.5+Math.cos(angle), 0, -.5-Math.sin(angle),
                                           .5, 0, -.5,
                                           -.5, 0, -.5], 3, 3);
    model.mesh.textureBuffer = Array2Buffer([ Math.cos(angle), Math.sin(angle),
                                          1.0, 0.0,
                                          0.0, 0.0], 2, 3);
  }
  else if (angle < 0) {
    model.mesh.vertexBuffer = Array2Buffer([ .5-Math.cos(angle), 0, -.5+Math.sin(angle),
                                           .5, 0, -.5,
                                           -.5, 0, -.5], 3, 3);
    model.mesh.textureBuffer = Array2Buffer([ 1-Math.cos(angle), Math.sin(angle),
                                          1.0, 0.0,
                                          0.0, 0.0], 2, 3);
  }
  else
    return null;
  model.mesh.normalBuffer = Array2Buffer([ 0.0, 1.0, 0.0,
                                         0.0, 1.0, 0.0,
                                         0.0, 1.0, 0.0], 3, 3);
  model.mesh.indexBuffer = Array2EBuffer([ 0, 1, 2 ], 1, 3);
  initTexture( model, url );
  return model;
}

function initModel(obj, url) {
  var model = {};
  model.mesh = {};
  model.mesh.vertexBuffer = obj.VPB;
  model.mesh.textureBuffer = obj.VTB;
  model.mesh.normalBuffer = obj.VNB;
  model.mesh.indexBuffer = obj.VIB;
  initTexture( model,  url );
  return model;
}

function updateTunnel() {
  for(i = 0; i < app.tunneldata.length-1; i++) {
    app.tunneldata.angle[i] = app.tunneldata.angle[i+1];
  }
  app.tunneldata.angle[app.tunneldata.length-1] = Math.floor(Math.random()*app.tunneldata.angleRange)+app.tunneldata.angleMin;
}

function drawTunnel() {
  mvPushMatrix();
  mat4.translate(app.mvMatrix, [0, -.25, 0]);
  drawTunnelSegment();
  if (app.tunneldata.angle[0] !== 0) {
    drawObject ( app.tunneldata.groundSpace[app.tunneldata.angle[0]] );
    mvPushMatrix();
    mat4.translate(app.mvMatrix, [0, .5, 0]);
    drawObject ( app.tunneldata.cellingSpace[app.tunneldata.angle[0]] );
    mvPopMatrix();
  }
  for( i = 0; i < app.tunneldata.length; i++ ){
    if (app.tunneldata.angle[i] > 0) {
      mvPushMatrix();
      mat4.translate(app.mvMatrix, [.5, 0, -.5]);
      mat4.rotateY(app.mvMatrix, degToRad(-app.tunneldata.angle[i])/2.0);
      mat4.translate(app.mvMatrix, [0, 0, -.5]);
      mat4.rotateZ(app.mvMatrix, Math.PI/2.0);
      drawObject( app.tunneldata.wall );
      mvPopMatrix();
      mat4.translate(app.mvMatrix, [-.5, 0, -.5]);
      mat4.rotateY(app.mvMatrix, degToRad(app.tunneldata.angle[i]));
      mat4.translate(app.mvMatrix, [.5,0,-.5]);
    }
    else if (app.tunneldata.angle[i] < 0) {
      mvPushMatrix();
      mat4.translate(app.mvMatrix, [-.5, 0, -.5]);
      mat4.rotateY(app.mvMatrix, degToRad(-app.tunneldata.angle[i])/2.0);
      mat4.translate(app.mvMatrix, [0, 0, -.5]);
      mat4.rotateZ(app.mvMatrix, -Math.PI/2.0);
      drawObject( app.tunneldata.wall );
      mvPopMatrix();
      mat4.translate(app.mvMatrix, [.5, 0, -.5]);
      mat4.rotateY(app.mvMatrix, degToRad(app.tunneldata.angle[i]));
      mat4.translate(app.mvMatrix, [-.5, 0,-.5]);
    }
    else
      mat4.translate(app.mvMatrix, [0,0, -1]);
    drawTunnelSegment();
    if (i < app.tunneldata.length-1 && app.tunneldata.angle[i+1] !== 0) {
      drawObject ( app.tunneldata.groundSpace[app.tunneldata.angle[i+1]] );
      mvPushMatrix();
      mat4.translate(app.mvMatrix, [0, .5, 0]);
      drawObject ( app.tunneldata.cellingSpace[app.tunneldata.angle[i+1]] );
      mvPopMatrix();
    }
  }
  mvPopMatrix();
  updateMovement();
}

function drawTunnelSegment() {
  drawObject( app.tunneldata.ground );
    
  mvPushMatrix();
  mat4.translate(app.mvMatrix, [-.5, 0, 0]);
  mat4.rotateZ(app.mvMatrix, -Math.PI/2);
  drawObject( app.tunneldata.wall );
  mvPopMatrix();

  mvPushMatrix();
  mat4.translate(app.mvMatrix, [.5, 0, 0]);
  mat4.rotateZ(app.mvMatrix, Math.PI/2);
  drawObject( app.tunneldata.wall );
  mvPopMatrix();

  mvPushMatrix();
  mat4.translate(app.mvMatrix, [0, .5, 0]);
  drawObject( app.tunneldata.celling );
  mvPopMatrix();
 }

 app.movement = {};
app.movement.current = {};
app.movement.current.px = 0;
app.movement.current.pz = 0;
app.movement.current.ry = 0;
app.movement.target = {};
app.movement.target.px = 0;
app.movement.target.pz = 0;
app.movement.target.ry = 0;
app.movement.speed = 25; //smaller faster

function updateMovement() {
  if (app.movement.current.pz > 1) {
    app.movement.current.pz -= 1;
    app.movement.target.pz -= 1;
    updateTunnel();
  }
  app.movement.target.pz += .1*app.elapsed/app.movement.speed;
  app.movement.current.pz = interpolate(app.movement.current.pz, app.movement.target.pz);
}

//target will keep moving past boundry
//tunnel update when current reaches boundry
//advance tunnel, save current x
//current will start behind boundry with angle, view and x offset
//target will adjust

function interpolate(f, t) {
  var speed = app.movement.speed;
  var x = t;
  if (Math.abs(f-t) < .1)
  x = t;
  else if (f>t)
    x = f - (f-t)/speed * app.elapsed;
  else if (f<t)
    x = f + (t-f)/speed * app.elapsed;
  return x;
}

app.monkeyPositionTimer = 0;

function floatMonkey(){
  app.monkeyPositionTimer = app.monkeyPositionTimer > Math.PI * 2 ? 0 : app.monkeyPositionTimer + 0.05;
  app.monkey.position[Y] = Math.sin( app.monkeyPositionTimer ) / 1000;
}
app.monkeyRoomCollision = 3.95;
function roomCollisionCheck(){
  if( app.camera.position[X] > app.monkeyRoomCollision ){
    app.camera.position[X] = app.monkeyRoomCollision
  }
  if( app.camera.position[X] < -app.monkeyRoomCollision ){
    app.camera.position[X] = -app.monkeyRoomCollision
  }
  if( app.camera.position[Z] > app.monkeyRoomCollision ){
    app.camera.position[Z] = app.monkeyRoomCollision
  }
  if( app.camera.position[Z] < -app.monkeyRoomCollision ){
    app.camera.position[Z] = -app.monkeyRoomCollision
  }
}

function createParticles( num, min, max, maxVector, maxTTL, particles ){
  var rangeX = max[X] - min[X];
  var halfRangeX = rangeX/2;
  var rangeY = max[Y] - min[Y];
  var halfRangeY = rangeY/2;
  var rangeZ = max[Z] - min[Z];
  var halfRangeZ = rangeZ/2;
  
  var halfMaxVector = maxVector / 2;
  
  // holds single dimension array of x,y,z coords
  particles.locations = [];
  // holds single dimension array of vector direction using x,y,z coords
  particles.vectors = [];
  // holds a single float for the particle's time to live
  particles.ttl = [];
  for(i=0;i<num;i+=1){
    // push x
    particles.locations.push( (Math.random() *  rangeX) - halfRangeX );
    // push y
    particles.locations.push( (Math.random() *  rangeY) - halfRangeY );
    // push z
    particles.locations.push( (Math.random() *  rangeZ) - halfRangeZ );
    // vectors
    particles.vectors.push( (Math.random() *  maxVector) - halfMaxVector );
    particles.vectors.push( (Math.random() *  maxVector) - halfMaxVector );
    particles.vectors.push( (Math.random() *  maxVector) - halfMaxVector + 3);
    // TTL
    particles.ttl.push( Math.random() * maxTTL );
  }
  
  particles.locationsBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, particles.locationsBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array( particles.locations ), gl.STATIC_DRAW);
  particles.locationsBuffer.itemSize = 3;
  particles.locationsBuffer.numItems = particles.locations.length / 3;
  
  particles.vectorsBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, particles.vectorsBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array( particles.vectors ), gl.STATIC_DRAW);
  particles.vectorsBuffer.itemSize = 3;
  particles.vectorsBuffer.numItems = particles.vectors.length / 3;
  
  particles.ttlBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, particles.ttlBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array( particles.ttl ), gl.STATIC_DRAW);
  particles.ttlBuffer.itemSize = 1;
  particles.ttlBuffer.numItems = particles.ttl.length;
  
}

function drawMonkeyRoom(){
  floatMonkey();
  roomCollisionCheck();
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.01, 1000.0, app.pMatrix);
  
  vec3.negate( app.camera.position, app.camera.inversePosition )
  
  mat4.identity( app.mvMatrix )
  // camera position and rotations
  mat4.rotate( app.mvMatrix, degToRad( app.camera.pitch ), [1,0,0] );
  // account for pitch rotation and light down vector
  mat4.multiplyVec3( app.mvMatrix, app.lightVectorStatic, app.lightVector )
  mat4.rotate( app.mvMatrix, degToRad( app.camera.heading ), [0,1,0] );
  mat4.translate( app.mvMatrix, app.camera.inversePosition );
  
  gl.useProgram( shaderProgram );
  
  mat4.multiplyVec3( app.mvMatrix, app.lightLocationStatic, app.lightLocation )
  gl.uniform3fv( shaderProgram.lightLocation, app.lightLocation );
  gl.uniform3fv( shaderProgram.lightVector, app.lightVector );
  
  setUniforms();
  
  mvPushMatrix();
    mat4.scale( app.mvMatrix, [2,2,2] )
    drawObject( app.models.room_walls, 0 );
    if( !app.breakWalls ){
      drawObject( app.models.room_wall_unbroken, 0 );
    }
    drawObject( app.models.room_floor, 0 );
    drawObject( app.models.room_ceiling, 0 );
    drawObject( app.models.pedestal, 50, [0.75,0.75,0.75,1.0] );
      
      mvPushMatrix();
        mat4.rotate( app.mvMatrix, degToRad( 180 ), [0,1,0] );
        mat4.translate( app.mvMatrix, app.monkey.position );
        drawObject( app.models.suzanne, 100, [0.83,0.69,0.22,1.0] );
      mvPopMatrix();
      
      mvPushMatrix();
        mat4.translate( app.mvMatrix, [0,2,0] );
        gl.uniform3fv( shaderProgram.ambientColorUniform, lightIntesity( 2.0, 1,1,1 ) );
        drawObject( app.models.skylight, 0, [0.53,0.81,0.98,1.0] );
        gl.uniform3fv( shaderProgram.ambientColorUniform, lightIntesity( app.ambientIntensity, 0.3,0.3,0.3 ) );
      mvPopMatrix();
    
    drawObject( app.models.room_tunnel_ceiling, 0 );
    drawObject( app.models.room_tunnel_walls, 0 );
  mvPopMatrix();
  
  // use the particle shaders
  if( app.animate ){
    app.animations.currentAnimation();
  }
}

app.drawScene = drawMonkeyRoom;

function animate() {
  app.timeNow = new Date().getTime();
  app.elapsed = app.timeNow - app.lastTime;
  if (app.lastTime != 0) {
    // animate stuff
    if( !app.camera.disable ){
      cameraMove();
    }
    if( app.camera.shake ){
      cameraShake();
    }
  }
  app.lastTime = app.timeNow;
}

function tick() {
  requestAnimFrame(tick);
  app.drawScene();
  animate();
}

function webGLStart( meshes ) {
  app.meshes = meshes;
  canvas = document.getElementById("mycanvas");
  initGL(canvas);
  initShaders();
  initBuffers();
  initTunnel();
  initPointerLock();
  initTextures();

  document.onkeydown = cameraKeyDownHandler;
  document.onkeyup = cameraKeyUpHandler;

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);

  tick();
}

window.onload = function(){
  OBJ.downloadMeshes({
      'tunnel_ceiling':'tunnel_ceiling.obj',
      'tunnel_walls':'tunnel_walls.obj',
      'room_walls': 'room_walls.obj',
      'room_ceiling': 'room_ceiling.obj',
      'room_floor': 'room_floor.obj',
      'room_tunnel_ceiling': 'room_tunnel_ceiling.obj',
      'room_tunnel_walls': 'room_tunnel_walls.obj',
      'room_wall_broken': 'room_wall_broken.obj',
      'room_wall_unbroken': 'room_wall_unbroken.obj',
      'suzanne': 'suzanne.obj',
      'pedestal': 'pedestal.obj',
      'boulder': 'boulder.obj',
    },
    webGLStart
  );
};

