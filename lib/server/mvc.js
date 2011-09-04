var fs = require('fs');
var path = require('path');

var controllersPath = path.normalize(__dirname + '../../../controllers')
var viewsPath = path.normalize(__dirname + '../../../views')

function handleNotFound(app) {
  app.use(function(req, res, next){
	console.log("### HTTP 404 NOT FOUND")
    res.render('http/404', { status: 404, url: req.url });
  });
}

function handleServerError(app) {
  app.configure('production', function(){	
    app.use(function (err, req, res, next) {
	  console.log("### HTTP 500 SERVER ERROR "+err)
      res.render('http/500', {status: err.status || 500, error: err});
    });	
  });	
}

function isRootController(controllerName) {
  return controllerName == 'app';
}

function bootControllers(app) {
  console.log("loading controllers from "+controllersPath);

  fs.readdir(controllersPath, function(err, files) {
    if (err) throw err;
    files.forEach(function(file) {
      bootController(app, file);
    })
  });	
}

function isHelperAction(action) { return action.substr(0,1) === '_'; };
function isBeforeAction(action) { return action === 'before_filter'; };
function isRestyAction(action) { return isRestyGetAction(action) || isRestyPostAction(action); };
function isRestyGetAction(action) { return action.indexOf('get_') === 0; };
function isRestyPostAction(action) { return action.indexOf('post_') === 0; };

function controllerAction(controllerName, action, actionFunction) {
  return function(req, res, next){	
    var render = res.render
    var format = req.params.format
    var path = viewsPath+'/'+controllerName+'/'+action+'.html';
	
    res.render = function(obj, options, fn){
	  res.render = render;

      function wantsTemplate(obj) { return typeof obj === 'string'; };

      if (wantsTemplate(obj)) {
        return res.render(obj, options, fn);
      }	else {
		options = options || {};
		return res.render(path, options, fn);	
      }
	};
	
	actionFunction.apply(this, arguments);
  };
}

function bootController(app, file) {
  var controllerName = file.replace('.js', '');
  var controllerActions = require(controllersPath + '/' + controllerName);
  var folderPrefix = isRootController(controllerName) ? '/' : ('/'+controllerName+'s');

  function mapBeforeFilter(action, actionFunction) {
	var routePaths = [folderPrefix+'/*', folderPrefix+'/', folderPrefix]; // apply to all express routes
    for(var idx = 0; idx < routePaths.length; idx++) {
      app.all( routePaths[idx], function (req, res, next) {
 	    // before_filter action is responsible for handling next()
        controllerActions['before_filter'](req, res, next); 
      });
    }	
  }
  function mapRestyAction(action, actionFunction) {
    var actionPath = folderPrefix+ (folderPrefix.length > 1 ? '/' : '') + action.replace('get_','').replace('post_','');

    if (isRestyGetAction(action)) {
      app.get(actionPath, actionFunction);
    }
    else if (isRestyPostAction(action)) {
      app.post(actionPath, actionFunction);
    };
  }
  function mapRestfulAction(action, actionFunction) {
    switch(action) {
      case 'index':
        app.get(folderPrefix + '.:format?', actionFunction);
        break;
      case 'show':
        app.get(folderPrefix + '/:id.:format?', actionFunction);
        break;
      case 'new':
        app.get(folderPrefix + '/new', actionFunction);
        break;
      case 'create':
        app.post(folderPrefix, actionFunction);
        break;
      case 'edit':
        app.get(folderPrefix + '/:id/edit', actionFunction);
        break;
      case 'update':
        app.put(folderPrefix + '/:id', actionFunction);
        break;
      case 'destroy':
        app.del(folderPrefix + '/:id', actionFunction);
        break;	
    }
  }

  Object.keys(controllerActions).map( function(action){	
	if (isHelperAction(action)) next;
	
	var callbackFunction = controllerActions[action];
	var actionFunction = controllerAction(controllerName, action, callbackFunction);
	
	if (isBeforeAction(action)) { 
	  mapBeforeFilter();
	} else if (isRestyAction(action)) {
	  mapRestyAction(action, actionFunction);
	} else {
	  mapRestfulAction(action, actionFunction);
	}
  });	
}

exports.boot = function(app){
  app.use(app.router);

  bootControllers(app);
  handleNotFound(app);
  handleServerError(app)

  app.set('views', viewsPath);
};