function FPSCounter(opt_numSamples) {
  this.init = function() {
    this.timeStart = new Date();
    if (opt_numSamples)
      this.samplingInterval = opt_numSamples;
    else
      this.samplingInterval = 200;
    this.currentSamplingInterval = 0;
    this.currentFPS = 0;
  };

  this.update = function() {
    if (++this.currentSamplingInterval >= this.samplingInterval) {
      var curTime = new Date();
      var startTime = this.timeStart;
      var diff = curTime.getTime() - startTime.getTime();
      this.currentFPS = (1000.0 * this.samplingInterval / diff);
      var f = this.currentFPS.toFixed(2);
      $('#fps').text("   " + f);
      $('#fps').css("width", f + "%");
      $('#fps').css("color", "#ffffff");
      if (f < 10)
        $('#fps').css("color", "#000000");
      this.currentSamplingInterval = 0;
      this.timeStart = curTime;
      return true;
    }
    return false;
  };

  this.getFPS = function() {
    return this.currentFPS;
  };

  this.reset = function() {
    this.currentSamplingInterval = 0;
    this.currentFPS = 0;
  };

  this.release = function() {
    $('#fps').text("");
    $('#fps').css("width", "0%");
    $('#fps').html('<span style="color: #000000; font-weight: bold">FPS</span>');
  }
}