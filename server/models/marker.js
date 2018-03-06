var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var Marker = new Schema({
    lat: Number,
    long: Number,
    speed: Number,
    type: String
});

module.exports = mongoose.model("Marker", Marker);
