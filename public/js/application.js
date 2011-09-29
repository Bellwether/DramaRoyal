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

  function DialogClick(event) {
	event.preventDefault();

	var link = $(this);
    var href = link.attr('href') || link.attr('action');	
	var title = link.data('title');
 
    var maskHeight = $(document).height();
    var maskWidth = $(window).width();

    var mask = $("<div id='mask'></div>");
    mask.css({'width':maskWidth,'height':maskHeight});
    $('body').append(mask);
    mask.show();    
    mask.fadeTo(400, 0.3);  
 
    var winH = $(window).height();
    var winW = $(window).width();
    
    var dialog = $("<div class='dialog'></div>").hide();
    $('body').append(dialog);
    dialog.css('top',  winH/2-dialog.height()/2);
    dialog.css('left', winW/2-dialog.width()/2);

	$.ajax({
	  url: href,
	  dataType: 'html',
	  success: function(data, textStatus) {
        dialog.html(data);
	    dialog.fadeIn(500);		
        mask.click(MaskClick);
	  },
	  error: function() {
	    MaskHide();	
	  }
	});

	return false;
  };
  function DialogHide() {
    $('.dialog').fadeTo(200, 0, function(){
	  $('.dialog').remove();
    });
  }
  function MaskHide() {
    $('#mask').fadeTo(300, 0, function(){
	  $('#mask').remove();
    });
  }
  function MaskClick(event) {	
	MaskHide();
    DialogHide();
  }
  function CloseDialogClick(event) {
    e.preventDefault();
    $('#mask, .dialog').hide();
    return false;
  }

  $('.popup').live('click', DialogClick);
  $('.dialog .close').live('click', CloseDialogClick);

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