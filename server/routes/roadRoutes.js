var express = require('express');
var app = express();

var roadRouter = express.Router();

var Road = require('../models/road');
var User = require('../models/road');

/////////////////////////////////////////////////////////

roadRouter.get('/', function (req, res) {

  Road.find(function (err, roads) {
    if (err) throw err;
    res.status(200).send(roads).end();
  })
});

/////////////////////////////////////////////////////////

roadRouter.get('/fullnames', function (req, res) {
  Road.find().distinct('fullName', function (error, fullnames) {
    res.status(200).send(fullnames).end();
  });
});

//////////////////////////////////////////////////////////

roadRouter.get('/realized', function (req, res) {
  User.find({token: req.headers['token']}, function (err, user) {
      if (user.length !== 0 && user[0].role === 'Admin') {
        Road.find({isRealised: true}, function (error, fullnames) {
          res.status(200).send(fullnames).end();
        });
      } else {
        res.status(200).send()
      }
    }
  );
});


////////////////////////////////////////////////////////////

roadRouter.get('/notrealized', function (req, res) {
  User.find({token: req.headers['token'], role: 'Admin'}, function (err, user) {
      console.log(user);
      if (user.length !== 0) {
        Road.find({isRealised: false}, function (error, fullnames) {
          console.log(fullnames);
          res.status(200).send(fullnames).end();
        });
      } else {
        res.status(401).send().end();
      }
    }
  );
});

//////////////////////////////////////////////////////////

roadRouter.get('/realized/users/:login', function (req, res) {
  Road.find({isRealised: true, login: req.params.login}, function (error, fullnames) {
    res.status(200).send(fullnames).end();
  });
});


////////////////////////////////////////////////////////////

roadRouter.get('/notrealized/users/:login', function (req, res) {
  Road.find({isRealised: false, login: req.params.login}, function (error, fullnames) {
    res.status(200).send(fullnames).end();
  });
});

/////////////////////////////////////////////////////////

roadRouter.get('/:id', function (req, res) {
  Road.findById(req.params.id, function (err, road) {
    if (err) throw err;
    res.status(200).send(road).end();
  });
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

/////////////////////////////////////////////////////////

roadRouter.put('/approve', function (req, res) {
  User.find({token: req.headers['token']}, function (err, user) {
    if (user.length !== 0 && user[0].role === 'Admin') {
      Road.findById(req.body._id, function (err, ord) {
        console.log(ord);
        ord.isRealised = true;
        ord.save(function (err) {
          console.log('Updated road.');
        })
      })
      res.status(200).send('Added road.').end();
    } else {
      res.status(401).send().end();
    }
  });
});

module.exports = roadRouter;
