var express = require('express');
var path = require('path');
var publicRoot = path.normalize(__dirname + '../../../public/');

var assetManager = require('connect-assetmanager');
var assetManagerGroups = {
  'js': {
    'route': /\/js\/minified\.js/,
    'path': publicRoot+'js/',
    'dataType': 'javascript',
    'files': []
  }, 
  'css': {
    'route': /\/css\/minified\.css/,
    'path': publicRoot+'css/',
    'dataType': 'css',
    'files': []
  }
};

exports.init = function(app){
  app.configure('development', function () {
   assetManagerGroups['js']['debug'] = true;
   assetManagerGroups['css']['debug'] = false;
  });	

  app.configure('production', function () {
	assetManagerGroups['js']['debug'] = false;
	assetManagerGroups['css']['debug'] = false;
  });
	
  app.use(express.favicon());
  app.use(assetManager(assetManagerGroups));
  app.use(express.static(publicRoot));
};