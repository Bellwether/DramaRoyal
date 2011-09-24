$.playIsMuted = function () {
  return $.cookie('silence') === '1';
}

$.playSound = function (options) {
  if ($.playIsMuted()) return;

  var srcContainerId = 'audio-source';
  $("body").append("<div id='"+srcContainerId+"' class='hidden' hidden='true'></div>");

  var file = options.file;
  var pid = options.pid || 'sfx1';

  var oggSrc = "<source src='"+file+".ogg' type='audio/ogg' />";
  var mp3Src = "<source src='"+file+".mp3' type='audio/mpeg' />";
  var audioEl = "<audio id='"+pid+"' controls='false' autoplay='true'>"+oggSrc+mp3Src+"</audio>";

  $('#'+srcContainerId).append(audioEl);
};

$(document).ready(function() {
  var key = 'silence';

  function controls() {
	return $('#audio-controls');
  }

  function status() {
	return $('#audio-status');
  }

  function OnToggleAudio(event) {
	event.preventDefault();
	if ($.playIsMuted()) {
      $('#audio-controls').removeAttr('disabled');
	  $.cookie(key, null);	
      status().html('on');
	} else {
      $('#audio-controls').attr('disabled','disabled');
      $.cookie(key, '1', { expires: 365});
      status().html('off');
	}
  }
  controls().click(OnToggleAudio);  	

  // set the initial control state 
  if ($.playIsMuted())	{	
    controls().attr('disabled','disabled');
    status().html('off');
  }
});


