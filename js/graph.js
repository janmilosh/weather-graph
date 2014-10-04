var city = 'Columbus';
var state = 'Ohio';
var apiKey = 'e7abc77487d7e3eb';
var callbackName = 'callback';
var weatherRequest = 'http://api.wunderground.com/api/' + apiKey + '/hourly/q/' + city+ ',%20' +state + '.json?callback=' + callbackName;

$.ajax({
  url: weatherRequest,
 
    // the name of the callback function
    jsonp: callbackName,
 
    // tell jQuery we're expecting JSONP
    dataType: 'jsonp',
 
    // work with the response
    success: function( response ) {
      console.log( response ); // server response
    }
});
