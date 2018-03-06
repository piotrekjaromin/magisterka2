var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var geometrySchema = new Schema({
  type: String,
  coordinates: [[[Number, Number]]]
});

var Object = new Schema({
  id: String,
  type: String,
  geometry: geometrySchema
});

module.exports = mongoose.model("Object", Object);
