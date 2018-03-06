var express = require('express');
var app = express();

var markerRouter = express.Router();

var Marker = require('../models/marker');

/////////////////////////////////////////////////////////

markerRouter.get('/', function (req, res) {

  Marker.find(function (err, markers) {
    if (err) throw err;
    res.status(200).send(markers).end();
  })
});

markerRouter.post('/', function (req, res) {
  var marker = new Marker(req.body);

  marker.save(function (err) {
    if (err) throw err;
    console.log('Added marker.');
  });
  res.status(200).send('Added marker.').end();
});

module.exports = markerRouter;
