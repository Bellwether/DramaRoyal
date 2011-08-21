var express = require('express');
var path = require('path');
var publicRoot = path.normalize(__dirname + '../../../public/');

var assetManager = require('connect-assetmanager');
var assetManagerGroups = {
  'js': {
    'route': /\/js\/minified\.js/,
    'path': publicRoot+'js/',
    'dataType': 'javascript',
    'files': ['jquery.js','application.js','lobby.js','drama.js']
  }, 
  'css': {
    'route': /\/css\/minified\.css/,
    'path': publicRoot+'css/',
    'dataType': 'css',
    'files': ['reset.css','layout.css','lobby.css','drama.css']
  }
};

exports.init = function(app){
  app.configure('development', function () {
   assetManagerGroups['js']['debug'] = true;
   assetManagerGroups['css']['debug'] = false;
   assetManagerGroups['js']['files'].push('jquery.js');
  });	

  app.configure('production', function () {
	assetManagerGroups['js']['debug'] = false;
	assetManagerGroups['css']['debug'] = false;
  });
	
  app.use(express.favicon());
  app.use(assetManager(assetManagerGroups));
  app.use(express.static(publicRoot));
};