/*
 *
 * Log
 *
 */

window.onerror = function (em, url, ln) {
  showException(em, url, ln);
  return false;
}

function clearLog() {
  var msgs = $('#game_messages');
  msgs.html('');
}

function clearExceptions() {
  var exps = $('#game_exceptions');
  exps.html('');
}

function showException(msg, url, lineNumber) {
  var msgs = $('#game_exceptions');
  if (!msgs)
    alert("Exception occured at " + url + " on line " + lineNumber + ": " + msg);
  else {
    url = (typeof url == "undefined") ? ' n/a ' : url;
    lineNumber = (typeof lineNumber == "undefined") ? -1 : lineNumber;
    var d = new Date();
    var exceptionDate = d.getHours() + ':' + d.getMinutes() + '.' + d.getSeconds() + '.' + d.getMilliseconds();
    str = '';
    str += "<p class='game_messages_exception'>";
    str += "<u>[" + exceptionDate + "] Exception occured at " + url + " on line " + lineNumber + ":</u> " + msg;
    str += "<br />------------------------------------</p>";
    str += msgs.html();
    msgs.html(str);
    console.log("[" + exceptionDate + "] Exception occured at " + url + " on line " + lineNumber + ": " + msg);
  }
}

function showMessage(msg) {
  if (logCalls) {
    var msgs = $('#game_messages');
    if (!msgs)
      alert(msg);
    else {
      var d = new Date();
      str = '';
      str += '<u>' + d.getHours() + ':' + d.getMinutes() + '.' + d.getSeconds() + '.' + d.getMilliseconds() + '</u> - ' + msg;
      str += "<br/>------------------------------------<br />";
      str += msgs.html();
      if (limitLog && str.length > logLength)
        str = str.substring(0, logLength);
      msgs.html(str);
    }
  }
}

function showMessageInfo(msg) {
  if (logInfo) {
    var msgs = $('#game_messages');
    str = msg + "<br/>------------------------------------<br />" + msgs.html();
    msgs.html(str);
  }
}

function listObjectProperties(obj) {
  var keys = '';
  for (var key in obj) {
    keys += key + " <-> " + obj[key] + '<br />\n';
  }
  showMessage('<pre><code>' + keys + '</code></pre>');
}

function getRandom(max) {
  return (Math.random() * max) + 1;
}

function getRandomFromZero(max) {
  return Math.floor((Math.random() * max));
}

/*
 *
 * WebGL Utilities
 *
 */

function getShader(gl, id) {
  var shaderScript = document.getElementById(id);
  if (!shaderScript)
    return null;

  var str = "";
  var k = shaderScript.firstChild;
    
  while (k) {
    if (k.nodeType == 3)
      str += k.textContent;
    k = k.nextSibling;
  }

  var shader;
    
  if (shaderScript.type == "x-shader/x-fragment")
    shader = gContext.createShader(gContext.FRAGMENT_SHADER);
  else if (shaderScript.type == "x-shader/x-vertex")
    shader = gContext.createShader(gContext.VERTEX_SHADER);
  else
    return null;

  gContext.shaderSource(shader, str);
  gContext.compileShader(shader);

  if (!gContext.getShaderParameter(shader, gContext.COMPILE_STATUS)) {
    showException(gContext.getShaderInfoLog(shader));
    return null;
  }

  return shader;
}

function createWebGLContext(canvas) {
  var names = ["webgl", "experimental-webgl", "webkit-3d", "moz-webgl"];
  var context = null;
  for (var ii = 0; ii < names.length; ++ii) {
    try {
      context = canvas.getContext(names[ii]);
    }
    catch(e) {
      showException(e);
    }
    if (context)
      break;
  }
  return context;
}

var getSourceSynch = function(url) {
  var req = new XMLHttpRequest();
  req.open("GET", url, false);
  req.send(null);
  showMessage('External source loaded : <br /><pre><code>' + req.responseText + '</code></pre>');
  return (req.status == 200) ? req.responseText : null;
};

function compileShaderFromSource(gl, fileUrl, shaderType) {
  var shaderSrc = getSourceSynch(fileUrl);
  var shader = gl.createShader(shaderType);
  gl.shaderSource(shader, shaderSrc);
  gl.compileShader(shader);
  return shader;
}

/*
 *
 * WeGL Debug
 *
 */

function throwOnGLError(err, funcName, args) {
  showException(WebGLDebugUtils.glEnumToString(err) + " was caused by call to: " + funcName);
  //throw WebGLDebugUtils.glEnumToString(err) + " was caused by call to: " + funcName;
};

function logAndValidate(functionName, args) {
   logGLCall(functionName, args);
   validateNoneOfTheArgsAreUndefined (functionName, args);
}

function logGLCall(functionName, args) {
  if (glDebug)
    showMessage("<pre><code>gl." + functionName + "(" + WebGLDebugUtils.glFunctionArgsToString(functionName, args) + ")</code></pre>");
}

function validateNoneOfTheArgsAreUndefined(functionName, args) {
  for (var ii = 0; ii < args.length; ++ii) {
    if (args[ii] === undefined)
      showMessage("Undefined passed to gl." + functionName + "(" + WebGLDebugUtils.glFunctionArgsToString(functionName, args) + ")");
  }
}

function printStar(op, i, star) {
  var output = '\n';
  output += 'x = ' + star.x + ', y = ' + star.y + '\n';
  output += 'velocity = [' + star.velocity + ']\n';
  output += 'size = [' + star.starSize + ']\n';
  output += 'texture = [' + star.texture + ']\n';
  output += 'rotation speed = [' + star.rotationSpeed + ']\n';
  output += 'rotation angle = ' + star.rotationAngle + '&deg; - ' + (star.rotationDirection == 0 ? 'clockwise' : 'anti-clockwise') +  '\n';
  showMessage('<pre><code>[Star # ' + i + ' - ' + op + ']' + output + '</code></pre>');
}

function printPlayer(player) {
  var output = '\n';
  output += 'x = ' + player.x + ', y = ' + player.y + '\n';
  output += 'size = [' + player.playerSize + ']\n';
  output += 'translation = [' + player.translation + ']\n';
  showMessage('<pre><code>[ -- Player -- ]' + output + '</code></pre>');
}

function printStar2(op, i, star) {
  var output = '\n';
  output += 'p1 = [' + star.x1 + ', ' + star.y1 + ']\n';
  output += 'p2 = [' + star.x2 + ', ' + star.y1 + ']\n';
  output += 'p3 = [' + star.x1 + ', ' + star.y2 + ']\n';
  output += '-\n';
  output += 'p1 = [' + star.x1 + ', ' + star.y2 + ']\n';
  output += 'p2 = [' + star.x2 + ', ' + star.y1 + ']\n';
  output += 'p3 = [' + star.x2 + ', ' + star.y2 + ']\n';
  output += 'velocity = [' + star.velocity + ']\n';
  output += 'size = [' + star.starSize + ']\n';
  output += 'texture = [' + star.texture + ']\n';
  output += 'rotation speed = [' + star.rotationSpeed + ']\n';
  output += 'rotation angle = ' + star.rotationAngle + '&deg; - ' + (star.rotationDirection == 0 ? 'clockwise' : 'anti-clockwise') +  '\n';
  showMessage('<pre><code>[Star # ' + i + ' - ' + op + ']' + output + '</code></pre>');
}