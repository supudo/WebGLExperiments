var availableDemos = [
  [ '- None -', '' ],
  [ 'Stars', 'Stars' ],
  [ 'Falling Star', 'FallingStar' ],
  [ 'Starfield', 'Starfield' ],
  [ 'TexAnim', 'TexAnim' ],
  [ '2D Rotation', 'Rotate2D' ]
];

var demoIndex = 0;

var logCalls = true;
var glDebug = false;
var slowMo = false;
var logInfo = false;
var slowMoFrames = 20;
var limitLog = true;
var logLength = 10000;

var gl = null;

var timeAtLastFrame = new Date().getTime();
var idealTimePerFrame = 1000 / 30;
var leftover = 0.0;
var frames = 0;

var pMatrix = mat4.create();
var starsBuffer;

var STARS_NUM = 1;
var STARS_FRAME_LIMIT = 16;
var STARS_MOVEMENT = 2;
var STARS_SIZE = (STARS_NUM > 1 ? 50 : 100);
var STARS_VELOCITY = -1;//5;
var STARS_ROTATION_SPEED = 10;
var STARS_DO_ROTATION = true;

var stars = Array();
var starsVertices = Array();