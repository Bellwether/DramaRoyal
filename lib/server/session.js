var express = require('express');
var mongoStore = require('connect-mongo');

var SECRET = 'boo you whore!1!1'

exports.init = function(app, config){
  config.collection= 'sessions';
  var sessionStore = new mongoStore(config);
  var maxSessionAge = new Date(Date.now() + (3600000 * 2)); // 2 Hours

  app.use(express.cookieParser());
  app.use(express.session({
    secret: SECRET,
    maxAge: maxSessionAge,
    store: sessionStore,
    key: 'dramaroyal'
  }));
};