var express = require('express');
var app = express();

var roadRouter = express.Router();

var Road = require('../models/road');

/////////////////////////////////////////////////////////

roadRouter.get('/', function (req, res) {

  Road.find(function (err, roads) {
    if (err) throw err;
    res.status(200).send(roads).end();
  })
});

roadRouter.post('/', function (req, res) {
  var road = new Road(req.body);

  Road.find({id: req.body.id}, function (err, foundedRoutes) {
      if (foundedRoutes.length === 0) {
        road.save(function (err) {
          if (err) throw err;
          console.log('Added road.');
        });
        res.status(200).send('Added road.').end();
      } else {
        res.status(200).send('Road exists')
      }
    }
  );


});

module.exports = roadRouter;
