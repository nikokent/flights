var express = require('express'); 
var bodyParser = require('body-parser');
const request = require('request');
var https = require('https');

var app = express();
var router = express.Router();
var port = process.env.PORT || 6666;

app.use(bodyParser.json());

var testLocations = ["hnl", "nyc", "CUN", "JP", "IE", "PT", "sjd", "MX", "NL", "DK", "FR", "HR", "TH", "TR", "IT", "GR", "IS" ]

var airport_data = [];

var getIATA = function(origin, completed){
    if(airport_data.length > 100){
        completed(origin);
    }
    else{
        request('https://raw.githubusercontent.com/jbrooksuk/JSON-Airports/master/airports.json', { json: true},function(error, response, body){
            airport_data = body;
            completed(origin);
        });
    }
}

function formatDate(date) {
    var year = date.substring(0,4);
    var mon = date.substring(5,7);
    var day = date.substring(8,10);
    return [mon,day,year].join('/');
}




var main = function(req, res){
    var origin_iata = "";
    var data = [];
    var dealsCounted = 0;
    var found_iata = false;

    var result = function(endData){
        res.send(endData);
    };

    var travelDetails = function(data){
        var myresult = {};
        if(data == null || data['Quotes'] == null){
            res.send("error");
            return {};
        }
        for(var i = 0; i < Object.keys(data['Quotes']).length; i++){
            temp = {}
            for((index) in data['Places']){
                if(data['Places'][index]['PlaceId'] == data['Quotes'][i]['OutboundLeg']['OriginId']){
                    temp['origin-code'] = data['Places'][index]['IataCode'];
                }
                if(data['Places'][index]['PlaceId'] == data['Quotes'][i]['OutboundLeg']['DestinationId']){
                    temp['destination-code'] = data['Places'][index]['IataCode'];
                    temp['location'] = data['Places'][index]['Name'];
                }
            }
            temp['price'] = data['Quotes'][i]['MinPrice'];
            var d = new Date(data['Quotes'][i]['OutboundLeg']['DepartureDate'] + 'Z');
            temp['google-depart-date'] = data['Quotes'][i]['OutboundLeg']['DepartureDate'].substring(0,10);
            temp['depart-date'] = formatDate(data['Quotes'][i]['OutboundLeg']['DepartureDate'].substring(0,10));
            d = new Date(data['Quotes'][i]['InboundLeg']['DepartureDate'] + 'Z');
            temp['arrive-date'] = formatDate(data['Quotes'][i]['InboundLeg']['DepartureDate'].substring(0,10));
            temp['google-arrive-date'] = data['Quotes'][i]['InboundLeg']['DepartureDate'].substring(0,10);
            for((airlines) in data['Carriers']){
                if(data['Carriers'][airlines]['CarrierId'] == data['Quotes'][i]['OutboundLeg']['CarrierIds'][0]){
                    temp['depart-airline'] = data['Carriers'][airlines]['Name'];
                }
                if(data['Carriers'][airlines]['CarrierId'] == data['Quotes'][i]['InboundLeg']['CarrierIds'][0]){
                    temp['arrive-airline'] = data['Carriers'][airlines]['Name'];
                }
            }
            myresult[i] = temp;
            console.log(myresult);
        }
        return myresult;
    }
        

    var flight = function(origin, destination, completion, bad){
        var url = "http://partners.api.skyscanner.net/apiservices/browsequotes/v1.0/US/usd/en-US/"+origin+"/"+destination+"/anytime/anytime?apikey=prtl6749387986743898559646983194";
        request(url, { json: true }, (err, resp, body) => {
            if (err) { return console.log(err); }
            if( body == null || body['Quotes'] == null){
                bad()
                return console.log(err);
            }
            data.push(body);
            completion();
        });
    }

    var removeFluff = function(data){
        myresult = {}
        count = 0;
        for (i in data){
            var date1 = new Date(data[i]['depart-date']);
            var date2 = new Date(data[i]['arrive-date']);
            var timeDiff = Math.abs(date2.getTime() - date1.getTime());
            var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24)); 
            if(diffDays >= 3 && diffDays <= 16){
                myresult[count] = data[i];
                count += 1;
            }
            data[i]['length'] = diffDays;
        }
        return myresult;
    }

    var compileData = function(origin, locations, completion, bad){
        for (index in locations){
            flight(origin, locations[index], function(){
                dealsCounted += 1;
                console.log(String((dealsCounted / locations.length) * 100) + "%");
                if (dealsCounted == locations.length){
                    completion();
                }
            }, function(){
                bad();
                return;
            });
        }
    }

    var shouldStop = false;

    getIATA(req.body.origin, function(place){
        for(var i in airport_data){
            if(String(airport_data[i].name).toLowerCase().includes(place.toLowerCase()) && shouldStop == false){
                found_iata = true;
                origin_iata = airport_data[i]["iata"];
                console.log("Compiling");
                compileData(origin_iata, req.body.locations, function(){
                    console.log(origin_iata);
                    for(var s in data){
                        if(data[s] == null || data[s]['Quotes'] == null){
                            break;
                        }
                        var count = Object.keys(data[s]['Quotes']).length;
                        for(var i = 0; i < count; i++){
                            for(var j = i + 1; j < count;j++){
                                if (data[s]['Quotes'][j]['MinPrice'] < data[s]['Quotes'][i]['MinPrice']){
                                    temp = data[s]['Quotes'][j];
                                    data[s]['Quotes'][j] = data[s]['Quotes'][i];
                                    data[s]['Quotes'][i] = temp;
                                }
                            }
                        }
                    }
                    var final_data = [];
                    for(var i in data){
                        final_data.push(removeFluff(travelDetails(data[i])));
                    }
                    console.log("Sending!");
                    res.send(final_data);
                }, function(){
                    if(shouldStop == false){
                        result("error");
                    }
                    shouldStop = true;
                    found_iata = true;
                });
                break;
            }
        }
        if(found_iata == false){
            result("error");
        }
        
    });
    
}

router.route('/').post(main);//POST Data with Request and Response

app.use(router); //run router


app.listen(port, '0.0.0.0', function(){
    console.log("UP AND RUNNING!");
});