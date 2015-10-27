$('#log_calls1').change(function() {
  updateLogCalls($(this).is(':checked'));
});

$('#log_calls2').change(function() {
  updateLogCalls($(this).is(':checked'));
});

function updateLogCalls(logYn) {
  logCalls = logYn;
  $('#log_calls1').attr("checked", logYn);
  $('#log_calls2').attr("checked", logYn);
}

$('#gl_calls').change(function() {
  glDebug = $(this).is(':checked');
});

$('#log_info').change(function() {
  logInfo = $(this).is(':checked');
});

$('#slowmo').change(function() {
  slowMo = $(this).is(':checked');
});

$('#do_rotation').change(function() {
  STARS_DO_ROTATION = $(this).is(':checked');
});

$('#slowmo_framerate').change(function() {
  slowMoFrames = parseInt($(this).val());
});

$('#star_size').change(function() {
  STARS_SIZE = parseInt($(this).val());
  changeSettingsDemo();
});

$('#star_velocity').change(function() {
  STARS_VELOCITY = parseInt($(this).val());
  changeSettingsDemo();
});

$('#rotation_speed').change(function() {
  STARS_ROTATION_SPEED = parseInt($(this).val());
  changeSettingsDemo();
});

$('#limit_log').change(function() {
  limitLog = $(this).is(':checked');
});

$('#log_length').change(function() {
  logLength = $(this).val();
});

$('#stars_num').change(function() {
  STARS_NUM = parseInt($(this).val());
  changeSettingsDemo();
});

$(document).ready(function() {
  updateLogCalls(logCalls);
  $('#log_info').attr("checked", logInfo);
  $('#gl_calls').attr("checked", glDebug);
  $('#slowmo').attr("checked", slowMo);
  $('#do_rotation').attr("checked", STARS_DO_ROTATION);
  $('#star_size').val(STARS_SIZE);
  $('#limit_log').attr("checked", limitLog);
  $('#slowmo_framerate').val(slowMoFrames);
  $('#log_length').val(logLength);
  $('#stars_num').val(STARS_NUM);
  $('#star_velocity').val(STARS_VELOCITY);
  $('#rotation_speed').val(STARS_ROTATION_SPEED);
  setupAvailableDemos();
});

function setupAvailableDemos() {
  var dd = $('#dd_demos');
  dd.html('');
  var demos_html = '';
  for (var i=0; i<availableDemos.length; i++) {
    demos_html += '<li><a href="#" onclick="setDemo(' + i + ');">' + availableDemos[i][0] + '</a></li>';
  }
  dd.html(demos_html);
}