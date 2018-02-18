var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var geometrySchema = new Schema({
  type: String,
  coordinates: [[Number, Number]]
});

var Road = new Schema({
  id: String,
  type: String,
  properties: {
    highway: String,
    surface: String
  },
  geometry: geometrySchema,
  markers: [{
    lat: Number,
    long: Number,
    speed: Number,
    description: String
  }]
});

module.exports = mongoose.model("Road", Road);
