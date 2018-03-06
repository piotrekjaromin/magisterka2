var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var geometrySchema = new Schema({
  type: String,
  coordinates: [[Number, Number]]
});

var markersSchema = new Schema({
  lat: Number,
  long: Number,
  speed: Number,
  type: String
});

var Road = new Schema({
  id: String,
  type: String,
  properties: {
    highway: String,
    surface: String
  },
  geometry: geometrySchema,
  markers: [markersSchema]
});

module.exports = mongoose.model("Road", Road);
