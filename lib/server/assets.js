var express = require('express');
var path = require('path');
var publicRoot = path.normalize(__dirname + '../../../public/');

var assetManager = require('connect-assetmanager');
var assetManagerGroups = {
  'js': {
    'route': /\/js\/[0-9]+\/minified\.js/,
    'path': publicRoot+'js/',
    'dataType': 'javascript',
    'files': ['application.js','lobby.js','drama.js','cookie.js','audio.js','facebook.js']
  }, 
  'css': {
    'route': /\/css\/[0-9]+\/minified\.css/,
    'path': publicRoot+'css/',
    'dataType': 'css',
    'files': ['reset.css','layout.css','lobby.css','drama.css','shop.css','profile.css']
  }
};

exports.init = function(app){
  function developmentConfig() {
    assetManagerGroups['js']['debug'] = true;
    assetManagerGroups['css']['debug'] = false;

    assetManagerGroups['js']['files'].splice(0,0,'jquery.js');
  }
  function productionConfig() {
	assetManagerGroups['js']['debug'] = false;
	assetManagerGroups['css']['debug'] = false;
  }
  	
  app.configure('development', developmentConfig);
  app.configure('production', productionConfig);
	
  app.use(express.favicon());
  app.use(assetManager(assetManagerGroups));
  app.use(express.static(publicRoot));
};