$(function() {
  var wuApiKey = 'e7abc77487d7e3eb';
  var wuPrefix = 'http://api.wunderground.com/api/';
  var locationInput = $('#location-input');

  getWeatherData('/q/zmw:43085.2.99999', 'Columbus, Ohio');

  locationInput.keyup(function() {
    var query = locationInput.val();
    var cityRequest = 'http://autocomplete.wunderground.com/aq?query=' + query;
    if (query.length < 2) {
      $('#location-results').empty();
    } else {
    
      //jQuery ajax request for the location data.
      
      $.ajax({
        url: cityRequest,
        
        jsonp: 'cb',
        dataType: 'jsonp',
        
        success: function(data) {
          var locations = data.RESULTS;
          showCities(locations);
        },

        error: function (XMLHttpRequest, textStatus, errorThrown) {
             console.log(textStatus, errorThrown);
        }
      });
    }  
  });

  function showCities(locations) {
    var items = [];
    $('#location-results').empty();
    $.each(locations, function(index, location) {
      items.push('<li data-location="' + location.l + '">' + location.name + '</li>');
    });
    $('<ul/>', {
      'class': 'location-list',
      html: items.join('')
    }).appendTo('#location-results');
  };

  $('body').on('click', '.location-list li', function() {
    var location = $(this).data('location');
    var locationText = $(this).text();
    $('#location-results').empty();
    $('#graph').empty();
    locationInput.val(null);
    getWeatherData(location, locationText);
  });

  function getWeatherData(location, locationText) {
    var weatherRequest = wuPrefix + wuApiKey + '/hourly/forecast/almanac/' + location + '.json';

    //jQuery ajax request for the weather data.
    $.ajax({
      url: weatherRequest,

        dataType: 'jsonp',

        success: function( response ) {
          showThreeDayForecast(response.forecast.txt_forecast.forecastday, locationText);
          makeGraph(response, locationText);
        },

        error: function (XMLHttpRequest, textStatus, errorThrown) {
             console.log(textStatus, errorThrown);
        }
    });
  }

  function showThreeDayForecast(forecastData, locationText) {
    var items = [];
    $('#three-day-weather').empty();
    $('#location-results').empty();
    items.push(
        '<thead>' +
          '<tr>' +
            '<td colspan="2">' +
              '<h3>' + locationText + ' Forecast</h3>' +
            '</td>' +
          '</tr>' +
        '</thead>' +
      '<tbody>');
    $.each(forecastData, function(index, data) {
      items.push(
        '<tr>' +
          '<td class="icon">' +
            '<img src="http://icons.wxug.com/i/c/c/' + data.icon + '.gif">' +
          '</td>' +
          '<td class="text-forecast">' +
            '<strong>' + data.title + ':</strong> ' + data.fcttext +
          '</td>' +
        '</tr>');
      });
    items.push('</tbody>')
    var tableString = items.join('');
    $('#three-day-weather').append(tableString);
  };

  //makeGraph function is called from success function of ajax call.
  function makeGraph(response, locationText) {

    var margin = {top: 70, right: 45, bottom: 75, left: 75};
    var height = 500 - margin.top - margin.bottom;
    var width = 800 - margin.left - margin.right;

    var svgSelection = d3.select('#graph')
      .append('svg')
      .attr('height', height + margin.top + margin.bottom)
      .attr('width', width + margin.left + margin.right)
      .append('g')
      .attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');

    //Process graph data inside a try/catch block in case there isn't any
    try {

      var parseDate = d3.time.format('%H %d %m %Y').parse;
      var dateFormat = d3.time.format('%I %p');

      //Historical data from almanac, parse temperatures as integers
      var high = response.almanac.temp_high;
      var low = response.almanac.temp_low;
      
      var normalHigh = parseInt(high.normal.F, 10);
      var recordHigh = parseInt(high.record.F, 10);
      var normalLow = parseInt(low.normal.F, 10);
      var recordLow = parseInt(low.record.F, 10);
      var recordHighYear = high.recordyear;
      var recordLowYear = low.recordyear;

      //Puts the dates in the proper format
      var hourlyDataArray = response.hourly_forecast;
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

    } catch(e) {
      //If there's a problem with the data, log out the error and print a message
      console.log(e);

      svgSelection.append('text')
        .attr('class', 'title')
        .attr('x', (width/2 - 13))
        .attr('y', (height/2))
        .attr('text-anchor', 'middle')
        .text('There is no data for this location. Please try another.');
    }

    if (yRange[0] > 0) {
      yRange[0] = 0;
    }
    if (yRange[1] < 90) {
      yRange[1] = 90;
    }
    var xScale = d3.time.scale()
      .domain(xRange).nice()
      .range([0, width]);
    var yScale = d3.scale.linear()
      .domain(yRange).nice() 
      .range([height, 0]);

    //Add line for the record high
    svgSelection.append('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y2', yScale(recordHigh))
      .attr('y1', yScale(recordHigh))
      .style('stroke-dasharray', ('3, 3'))
      .attr('class', 'record-line');

    //Add line for the record low
    svgSelection.append('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y2', yScale(recordLow))
      .attr('y1', yScale(recordLow))
      .style('stroke-dasharray', ('3, 3'))
      .attr('class', 'record-line');

    //Add text for record high
    svgSelection.append('text')
      .attr('class', 'record-text')
      .attr('x', width)
      .attr('y', yScale(recordHigh))
      .attr('text-anchor', 'end')
      .attr('dy', '-8')  
      .text('Record high in ' + recordHighYear);

    //Add text for record low
    svgSelection.append('text')
      .attr('class', 'record-text')
      .attr('x', width)
      .attr('y', yScale(recordLow))
      .attr('text-anchor', 'end')
      .attr('dy', '18')  
      .text('Record low in ' + recordLowYear);

    //Bound the normal temps by a rectangle
    svgSelection.append('rect')
      .attr('x', 0)
      .attr('y', yScale(normalHigh))
      .attr('height', yScale(normalLow)-yScale(normalHigh))
      .attr('width', width)
      .attr('class', 'normal-rect');

    //Add line for the normal high
    svgSelection.append('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y2', yScale(normalHigh))
      .attr('y1', yScale(normalHigh))
      .style('stroke-dasharray', ('3, 3'))
      .attr('class', 'normal-line');

    //Add line for the normal low
    svgSelection.append('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y2', yScale(normalLow))
      .attr('y1', yScale(normalLow))
      .style('stroke-dasharray', ('3, 3'))
      .attr('class', 'normal-line');

    //Add text for normal high
    svgSelection.append('text')
      .attr('class', 'normal-text')
      .attr('x', 0)
      .attr('y', yScale(normalHigh))
      .attr('text-anchor', 'left')
      .attr('dy', '-8')
      .attr('dx', '8')
      .text('Normal high');

    //Add text for normal low
    svgSelection.append('text')
      .attr('class', 'normal-text')
      .attr('x', 0)
      .attr('y', yScale(normalLow))
      .attr('text-anchor', 'left')
      .attr('dy', '18')
      .attr('dx', '8') 
      .text('Normal low');

    //Define and add hourly temperature as a line 
    var line = d3.svg.line()
      .interpolate('basis')
      .x(function(d) { return xScale(d.time); })
      .y(function(d) { return yScale(d.temp); });

    svgSelection.append('path')
      .datum(hourlyDataArray)
      .attr('class', 'line')
      .attr('d', line);

    //Add x and y axis
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

    //Add title and label text
    svgSelection.append('text')
      .attr('class', 'title')
      .attr('x', (width/2))
      .attr('y', 0 - (margin.top/2))
      .attr('text-anchor', 'middle')
      .text(locationText + ' Hourly Forecast');

    svgSelection.append('text')
      .attr('class', 'label')
      .attr('x', 0)
      .attr('y', height + margin.bottom/2)
      .attr('dy', '16')
      .attr('text-anchor', 'left')  
      .text(startDate);

    svgSelection.append('text')
      .attr('class', 'label')
      .attr('x', width)
      .attr('y', height + margin.bottom/2)
      .attr('dy', '16')
      .attr('text-anchor', 'end')  
      .text(endDate);

    svgSelection.append('text')
      .attr('class', 'label')
      .attr('x', width/2)
      .attr('y', height + margin.bottom/2)
      .attr('dy', '16')
      .attr('text-anchor', 'middle')  
      .text(locationText + ' Local Time');

    svgSelection.append('text')
      .attr('class', 'label')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - margin.left/2)
      .attr('x', 0 - height/2)
      .attr('dy', '-6')
      .attr('text-anchor', 'middle')  
      .html('Temperature &deg;F');

  };
});