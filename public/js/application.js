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

  function InlineEditClick(event) {
    var el = $(this);
    var target = $('#'+el.data('target'));
    var btn = $('#'+el.data('button'));
    var url = el.data('url');
    var method = el.data('method');

    function disableEdit(useValue) {
      target = $('#'+el.data('target'));
	  var txt = useValue === true ? target.val() : target.text();
	  var lbl = $("<span id='"+target.attr('id')+"'>"+txt+"</span>");
      target.replaceWith(lbl);

	  el.text('[edit]');
      btn.unbind('click');
      btn.hide();	
    }

    function enableEdit() {
      var editArea = $("<textarea id='"+target.attr('id')+"'>"+target.text()+"</textarea>");
      target.replaceWith(editArea);

      btn.click(function (event){
	    $.post(url, {bio: editArea.val(), _method: method});
        disableEdit(true);	
      });

      btn.show();
      el.text('[cancel]')
      editArea.focus();
    }
	
    var isInEditMode = btn.is(":visible");
    if (isInEditMode) {
	  disableEdit();	
    } else {
      enableEdit();
    }

    return el;
  }
  $('.editable').live('click', InlineEditClick);
});