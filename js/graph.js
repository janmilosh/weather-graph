var city = 'Columbus';
var state = 'Ohio';
var apiKey = 'e7abc77487d7e3eb';
var callbackName = 'callback';
var weatherRequest = 'http://api.wunderground.com/api/' + apiKey + '/hourly/q/' + city+ ',%20' +state + '.json?callback=' + callbackName;


//Get hourly data from weather underground.

$.ajax({
  url: weatherRequest,
 
    // the name of the callback function
    jsonp: callbackName,
 
    // tell jQuery we're expecting JSONP
    dataType: 'jsonp',
 
    // work with the response
    success: function( response ) {
      makeGraph(response.hourly_forecast);
    }
});


function makeGraph(dataArray) {

  var parseDate = d3.time.format('%H %d %m %Y').parse;
  var dateFormat = d3.time.format('%I %p');

  //Puts the dates in the proper format
  dataArray.forEach(function(item) {
    var hour = item.FCTTIME.hour_padded;
    var day = item.FCTTIME.mday_padded;
    var month = item.FCTTIME.mon_padded;
    var year = item.FCTTIME.year;
    var date = [hour, day, month, year].join(' ');
    console.log('date', date);
    item.time = parseDate(date);
  });

  var today = dataArray[0].FCTTIME;
  
  var xRange = d3.extent(dataArray, function(d) { return d.time; });
  var yMax = d3.max(dataArray, function(d) { return d.temp.english; })

  var margin = {top: 75, right: 75, bottom: 75, left: 100};
  var height = 500 - margin.top - margin.bottom;
  var width = 750 - margin.left - margin.right;
  var svgColor = '#f8f8f8';

  var svgSelection = d3.select('#hourly')
    .append('svg')
    .attr('height', height)
    .attr('width', width)
    .style('background', svgColor);

  
}