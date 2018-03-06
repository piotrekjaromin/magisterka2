var express = require('express');
var app = express();

var objectRouter = express.Router();

var Object = require('../models/object');

/////////////////////////////////////////////////////////

objectRouter.get('/', function (req, res) {

  Object.find(function (err, roads) {
    if (err) throw err;
    res.status(200).send(roads).end();
  })
});

objectRouter.post('/', function (req, res) {
  console.log(req.body);
  var object = new Object(req.body);

  Object.find({id: req.body.id}, function (err, foundedRoutes) {
      if (foundedRoutes.length === 0) {
        object.save(function (err) {
          if (err) throw err;
          console.log('Added object.');
        });
        res.status(200).send('Added object.').end();
      } else {
        res.status(200).send('Object exists')
      }
    }
  );

});

module.exports = objectRouter;
