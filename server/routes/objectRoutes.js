var express = require('express');
var app = express();

var objectRouter = express.Router();

var Object = require('../models/object');
var User = require('../models/object');

/////////////////////////////////////////////////////////

objectRouter.get('/', function (req, res) {

  Object.find(function (err, roads) {
    if (err) throw err;
    res.status(200).send(roads).end();
  })
});

/////////////////////////////////////////////////////////

objectRouter.get('/fullnames', function (req, res) {
  Object.find().distinct('fullName', function (error, fullnames) {
    res.status(200).send(fullnames).end();
  });
});

//////////////////////////////////////////////////////////

objectRouter.get('/realized', function (req, res) {
  User.find({token: req.headers['token']}, function (err, user) {
      if (user.length !== 0 && user[0].role === 'Admin') {
        Object.find({isRealised: true}, function (error, fullnames) {
          res.status(200).send(fullnames).end();
        });
      } else {
        res.status(200).send()
      }
    }
  );
});


////////////////////////////////////////////////////////////

objectRouter.get('/notrealized', function (req, res) {
  User.find({token: req.headers['token'], role: 'Admin'}, function (err, user) {
      console.log(user);
      if (user.length !== 0) {
        Object.find({isRealised: false}, function (error, fullnames) {
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

objectRouter.get('/realized/users/:login', function (req, res) {
  Object.find({isRealised: true, login: req.params.login}, function (error, fullnames) {
    res.status(200).send(fullnames).end();
  });
});


////////////////////////////////////////////////////////////

objectRouter.get('/notrealized/users/:login', function (req, res) {
  Object.find({isRealised: false, login: req.params.login}, function (error, fullnames) {
    res.status(200).send(fullnames).end();
  });
});

/////////////////////////////////////////////////////////

objectRouter.get('/:id', function (req, res) {
  Object.findById(req.params.id, function (err, road) {
    if (err) throw err;
    res.status(200).send(road).end();
  });
});

objectRouter.post('/', function (req, res) {
  var road = new Object(req.body);

  Object.find({id: req.body.id}, function (err, foundedRoutes) {
      if (foundedRoutes.length === 0) {
        road.save(function (err) {
          if (err) throw err;
          console.log('Added road.');
        });
        res.status(200).send('Added road.').end();
      } else {
        res.status(200).send('Object exists')
      }
    }
  );


});

/////////////////////////////////////////////////////////

objectRouter.put('/approve', function (req, res) {
  User.find({token: req.headers['token']}, function (err, user) {
    if (user.length !== 0 && user[0].role === 'Admin') {
      Object.findById(req.body._id, function (err, ord) {
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

module.exports = objectRouter;
