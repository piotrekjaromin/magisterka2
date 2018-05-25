var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var geometrySchema = new Schema({
  type: String,
  coordinates: [[[Number, Number]]]
});
var propertiesSchema = new Schema({
  surface: String,
  highway: String,
  oneway: String,
  lanes: String,
  description: String

});

var Object = new Schema({
  id: String,
  geometry: geometrySchema,
  properties: propertiesSchema
});

module.exports = mongoose.model("Object", Object);
