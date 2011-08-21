$(document).ready(function() {
  // support for HTTP PUT and DELETE methods on buttons and anchors via a 'data-method' attribute
  $('a[data-method="delete"], button[data-method="delete"]').live('click', function(event) {
	event.preventDefault();
	
	var link = $(this);
    var href = link.attr('href') || link.attr('action');
    var method = link.attr('data-method');
    var form = $('<form method="post" action="' + href + '"></form>');
	var metadata = '<input name="_method" value="' + method + '" type="hidden" />';
    form.hide().append(metadata).appendTo('body');
    form.submit();
	
	return false;
  });
});