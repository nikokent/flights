var express = require('express'); 
var bodyParser = require('body-parser');
const request = require('request');
var cors = require('cors');

var app = express();
var router = express.Router();
var port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(cors());

var testLocations = ["hnl", "nyc", "CUN", "JP", "IE", "PT", "sjd", "MX", "NL", "DK", "FR", "HR", "TH", "TR", "IT", "GR", "IS" ]

var main = function(req, res){
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    var data = [];
    var dealsCounted = 0;
    console.log(req.body);

    var flight = function(origin, destination, completion){
        var url = "http://partners.api.skyscanner.net/apiservices/browsequotes/v1.0/US/usd/en-US/"+origin+"/"+destination+"/anytime/anytime?apikey=prtl6749387986743898559646983194";
        request(url, { json: true }, (err, resp, body) => {
            if (err) { return console.log(err); }
            data.push(body);
            completion();
        });
    }

    var result = function(endData){
        res.send(endData);
    };

    var compileData = function(origin, locations, completion){
        for (index in locations){
            flight(origin, locations[index], function(){
                dealsCounted += 1;
                console.log(String((dealsCounted / locations.length) * 100) + "%");
                if (dealsCounted == locations.length){
                    completion();
                }
            });
        }
    }

    compileData(req.body.origin, req.body.locations, function(){
        result(data);
    });
    
}

var http = require("http");
setInterval(function() {
    http.get("https://niko-flights.herokuapp.com");
}, 300000); // every 5 minutes (300000)



router.route('/').post(main);//POST Data with Request and Response

app.use(router); //run router


app.listen(port, '0.0.0.0', function(){
    console.log("UP AND RUNNING!");
});