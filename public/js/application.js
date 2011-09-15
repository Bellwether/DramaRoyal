$(document).ready(function() {
  // support for HTTP PUT and DELETE methods on buttons and anchors via a 'data-method' attribute
  function LiveClick(event) {
	event.preventDefault();

	var link = $(this);
    var href = link.attr('href') || link.attr('action');
    var method = link.attr('data-method');
    var form = $('<form method="post" action="' + href + '"></form>');
	var metadata = '<input name="_method" value="' + method + '" type="hidden" />';
    form.hide().append(metadata).appendTo('body');
    form.submit();

	return false;	
  }
  $('a[data-method="delete"], button[data-method="delete"]').live('click', LiveClick);

  function onFacebookScriptLoaded(data, textStatus) {
	console.log("loaded facebook script")
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
	  console.log("clicked invite friends")
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
  }

  // load remote facebook connect script
  var facebookScriptUrl = document.location.protocol + '//connect.facebook.net/en_US/all.js';
  $.getScript(facebookScriptUrl, onFacebookScriptLoaded);
});