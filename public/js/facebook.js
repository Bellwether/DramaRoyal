$(document).ready(function() {
  function onFacebookScriptLoaded(data, textStatus) {
	var key = '153494728049768';

    FB.init({ 
      appId:key, 
      cookie:true, 
      status:false, 
      xfbml:false,
      oauth:true 
    });

    // Facebook Invite Friends Dialog
    // REF: https://developers.facebook.com/docs/reference/dialogs/requests/
    $('#fb-invite-request').click( function(event) {
	  event.preventDefault();

	  var msg = "I'm pretending to be a scurrilous schoolgirl in the treacherous game of Drama Royal. Won't you pretend on the internets with me?";
	  var title = 'Call Them Out By Luring Them In';
	  var filters = ['app_non_users'];

	  FB.ui({
	    title: title,
	    method: 'apprequests', 
	    message: msg, 
	    filters: filters
      });
	  return false;
    })

    // Initialize in-app like button
    // REF: https://developers.facebook.com/docs/reference/plugins/like/
    FB.XFBML.parse(document.getElementById('like-button', function(){}));
  }

  // load remote facebook connect script
  var facebookScriptUrl = document.location.protocol + '//connect.facebook.net/en_US/all.js';
  $.getScript(facebookScriptUrl, onFacebookScriptLoaded);

});