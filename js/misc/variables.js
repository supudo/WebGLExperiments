var availableDemos = [
  // 'Demo Name', 'Function Prefix', 'TS', '', '', 'Hide Options'
  [ 'Select Demo', '', 0, '', false, false ],
  [ 'Stars', 'Stars', 0, '', false, false ],
  [ 'Falling Star', 'FallingStar', 0, '', false, false ],
  [ 'Starfield', 'Starfield', 0, '', false, false ],
  [ 'TexAnim', 'TexAnim', 0, '', false, false ],
  [ '2D Rotation', 'Rotate2D', 0, '', false, false ],
  [ 'Starfield TS', 'StarfieldTS', 1, 'WebGLDemos', false, false ],
  [ 'Complex 3D', 'Complex3D', 0, '', false, false ],
  [ 'OBJ Loader', 'OBJLoader', 0, '', true, false ],
  [ 'OBJ Loader 2', 'OBJLoader2', 0, '', true, false ],
  [ '! Hypersuit', 'Hypersuit', 0, '', false, false ]
];

var demoIndex = 0;
var animatationFrameID;

var globalDebug = false;
var logCalls = true;
var logInfo = false;
var glDebug = false;
var noExceptions = true;
var logReversed = true;
var slowMo = false;
var slowMoFrames = 20;
var limitLog = true;
var logLength = 10000000;

var gl = null;

var timeAtLastFrame = new Date().getTime();
var idealTimePerFrame = 1000 / 30;
var leftover = 0.0;
var frames = 0;
var maxFPS = 100;

var pMatrix = mat4.create();
var starsBuffer;

var STARS_NUM = 10;
var STARS_FRAME_LIMIT = 16;
var STARS_MOVEMENT = 2;
var STARS_SIZE = (STARS_NUM > 1 ? 50 : 100);
var STARS_VELOCITY = 10;
var STARS_ROTATION_SPEED = 10;
var STARS_DO_ROTATION = true;

var PlayerSize = 40;
var PlayerMovement = 10;

var stars = Array();
var starsVertices = Array();

var gameUI_PressedKeys = {};

/*
8 - "backspace"; //  backspace
9 - "tab"; //  tab
13 - "enter"; //  enter
16 - "shift"; //  shift
17 - "ctrl"; //  ctrl
18 - "alt"; //  alt
19 - "pause/break"; //  pause/break
20 - "caps lock"; //  caps lock
27 - "escape"; //  escape
32 - "spacebar" // space
33 - "page up"; // page up, to avoid displaying alternate character and confusing people           
34 - "page down"; // page down
35 - "end"; // end
36 - "home"; // home
37 - "left arrow"; // left arrow
38 - "up arrow"; // up arrow
39 - "right arrow"; // right arrow
40 - "down arrow"; // down arrow
45 - "insert"; // insert
46 - "delete"; // delete
91 - "left window"; // left window
92 - "right window"; // right window
93 - "select key"; // select key
96 - "numpad 0"; // numpad 0
97 - "numpad 1"; // numpad 1
98 - "numpad 2"; // numpad 2
99 - "numpad 3"; // numpad 3
100 - "numpad 4"; // numpad 4
101 - "numpad 5"; // numpad 5
102 - "numpad 6"; // numpad 6
103 - "numpad 7"; // numpad 7
104 - "numpad 8"; // numpad 8
105 - "numpad 9"; // numpad 9
106 - "multiply"; // multiply
107 - "add"; // add
109 - "subtract"; // subtract
110 - "decimal point"; // decimal point
111 - "divide"; // divide
112 - "F1"; // F1
113 - "F2"; // F2
114 - "F3"; // F3
115 - "F4"; // F4
116 - "F5"; // F5
117 - "F6"; // F6
118 - "F7"; // F7
119 - "F8"; // F8
120 - "F9"; // F9
121 - "F10"; // F10
122 - "F11"; // F11
123 - "F12"; // F12
144 - "num lock"; // num lock
145 - "scroll lock"; // scroll lock
186 - ";"; // semi-colon
187 - "="; // equal-sign
188 - ","; // comma
189 - "-"; // dash
190 - "."; // period
191 - "/"; // forward slash
192 - "`"; // grave accent
219 - "["; // open bracket
220 - "\\"; // back slash
221 - "]"; // close bracket
222 - "'"; // single quote
*/