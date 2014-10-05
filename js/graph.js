var city = 'Columbus';
var state = 'OH';
var apiKey = 'e7abc77487d7e3eb';
var callbackName = 'callback';
var wuPrefix = 'http://api.wunderground.com/api/';
var weatherRequest = wuPrefix + apiKey + '/hourly/forecast/almanac/q/' + city + ',%20' + state + '.json?callback=' + callbackName;

//jQuery ajax request for the weather data.
//This calls the 
$.ajax({
  url: weatherRequest,
 
    // the name of the callback function
    jsonp: callbackName,
 
    // tell jQuery we're expecting JSONP
    dataType: 'jsonp',
 
    // create a graph with the response
    success: function( response ) {
      makeGraph(response.hourly_forecast, response.almanac, response.forecast);
    }
});

//Set up the svg on the page without waiting for data
var margin = {top: 75, right: 75, bottom: 75, left: 100};
var height = 500 - margin.top - margin.bottom;
var width = 800 - margin.left - margin.right;

var svgSelection = d3.select('#graph')
  .append('svg')
  .attr('height', height + margin.top + margin.bottom)
  .attr('width', width + margin.left + margin.right)
  .append('g')
  .attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');

//makeGraph function is called from success function of ajax call.
function makeGraph(hourlyDataArray, historicalData, forecastDataArray) {
  var parseDate = d3.time.format('%H %d %m %Y').parse;
  var dateFormat = d3.time.format('%I %p');

  //Historical data from almanac, parse temperatures as integers
  var high = historicalData.temp_high;
  var low = historicalData.temp_low;
  
  var normalHigh = parseInt(high.normal.F, 10);
  var recordHigh = parseInt(high.record.F, 10);
  var normalLow = parseInt(low.normal.F, 10);
  var recordLow = parseInt(low.record.F, 10);

  //Puts the dates in the proper format
  hourlyDataArray.forEach(function(item) {
    var timeBase = item.FCTTIME;

    var hour = timeBase.hour_padded;
    var day = timeBase.mday_padded;
    var month = timeBase.mon_padded;
    var year = timeBase.year;

    var date = [hour, day, month, year].join(' ');
    item.time = parseDate(date);

    item.temp = parseInt(item.temp.english, 10);
  });

  var startDateBase = hourlyDataArray[0].FCTTIME;
  var endDateBase = hourlyDataArray[35].FCTTIME;
  var startDate = startDateBase.mon_abbrev + ' ' + startDateBase.mday;
  var endDate = endDateBase.mon_abbrev + ' ' + endDateBase.mday;
  var endYear = endDateBase.year;
  
  var xRange = d3.extent(hourlyDataArray, function(d) { return d.time; });

  //We need to find max and min temps for the hourly and the historical data.
  //First find max and min for hourly, then put values in array and find overall range.
  var hourlyMax = d3.max(hourlyDataArray, function(d) { return d.temp });
  var hourlyMin = d3.min(hourlyDataArray, function(d) { return d.temp });
  var tempMaxMinArray = [hourlyMax, hourlyMin, recordHigh, normalHigh, recordLow, normalLow];
  var yRange = d3.extent(tempMaxMinArray, function(d) { return d });

  var xScale = d3.time.scale()
    .domain(xRange).nice()
    .range([0, width]);
  var yScale = d3.scale.linear()
    .domain(yRange).nice() 
    .range([height, 0]);

  var line = d3.svg.line()
    .interpolate('basis')
    .x(function(d) { return xScale(d.time); })
    .y(function(d) { return yScale(d.temp); });
      
  svgSelection.append('path')
    .datum(hourlyDataArray)
    .attr('class', 'line')
    .attr('d', line);

  var xAxis = d3.svg.axis()
    .scale(xScale)
    .orient('bottom')
    .ticks(d3.time.hours(xRange[0], xRange[1]).length)
    .tickFormat(dateFormat)
    .ticks(8);

  var yAxis = d3.svg.axis()
    .scale(yScale)
    .orient('left')
    .ticks(8);
  
  svgSelection.append('g')
    .attr('class', 'axis')
    .attr('transform', 'translate(0, ' + height + ')')
    .call(xAxis);

  svgSelection.append('g')
    .attr('class', 'axis')
    .call(yAxis);

  svgSelection.append('text') // Add title, simply append and define text 
    .attr('class', 'title')   // attributes and position
    .attr('x', (width/2))
    .attr('y', 0 - (margin.top/2))
    .attr('text-anchor', 'middle')
    .style('font-size', '20px') 
    .text(city + ', ' + state + ' hourly temperature');

  svgSelection.append('text') // Add x-axis label, similar to title
    .attr('class', 'label')
    .attr('x', (width/2))
    .attr('y', height + margin.bottom/2)
    .attr('dy', '16')
    .attr('text-anchor', 'middle')  
    .style('font-size', '16px') 
    .text(startDate + ' to ' + endDate + ', ' + endYear);

  svgSelection.append('text') // Add y-axis label, similar to above, but with transform
    .attr('class', 'label')
    .attr('transform', 'rotate(-90)')
    .attr('y', 0 - margin.left/2)
    .attr('x', 0 - height/2)
    .attr('dy', '-20')
    .attr('text-anchor', 'middle')  
    .style('font-size', '16px') 
    .html('Temperature &deg;F'); 

}