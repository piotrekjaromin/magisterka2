var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var app = express();
var cors = require('cors');

var http       = require('http');
var path       = require('path');
var server     = http.createServer(app);

app.use(express.static(path.join(__dirname, 'dist')));


// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json()); // parse application/
app.use(cors());

var roadRouter = require('./routes/roadRoutes')
app.use('/roads', roadRouter);

var objectRouter = require('./routes/objectRoutes')
app.use('/objects', objectRouter);

var markerRouter = require('./routes/markerRoutes')
app.use('/markers', markerRouter);


//mongodb://<dbuser>:<dbpassword>@ds233748.mlab.com:33748/speed_limit
//password1233
mongoose.connect('mongodb://piotrekjaromin:password@ds233748.mlab.com:33748/speed_limit')
  .then(console.log('Start'))
  .catch(err => { // if error we will be here
  console.error('App starting error:', err.stack);
process.exit(1);
});

server.listen(5000, function () {
  console.log('Server is running on Port: ', 5000);
});
