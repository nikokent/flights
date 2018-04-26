import urllib2
import json

def flight(start, end):
    contents = urllib2.urlopen("http://partners.api.skyscanner.net/apiservices/browsequotes/v1.0/US/usd/en-US/"+start+"/"+end+"/anytime/anytime?apikey=prtl6749387986743898559646983194").read()
    data = json.loads(contents)
    deals = data["Quotes"]
    places = data["Places"]
    airline = data["Carriers"]
    minPrice = deals[0]["MinPrice"]

    result = 0
    for i in range(0,len(deals)):
        if deals[i]["MinPrice"] < minPrice:
            result = i
            minPrice = deals[i]["MinPrice"]

    #print(deals[result])
    #print(airline)
    departDate = deals[result]["OutboundLeg"]["DepartureDate"]
    returnDate = deals[result]["InboundLeg"]["DepartureDate"]

    originID = deals[result]["OutboundLeg"]["OriginId"]
    destinationID = deals[result]["InboundLeg"]["OriginId"]

    for i in range(0,len(places)):
        if originID == places[i]["PlaceId"]:
            result = i
    origin = places[result]["Name"]
    for i in range(0,len(places)):
        if destinationID == places[i]["PlaceId"]:
            result = i
    destination = places[result]["Name"]
    return( "Cheapest Flight Round trip from ({0}) to ({1}) will cost {2} on leaving: {3} and returning: {4}".format(origin, destination, minPrice, departDate[:10], returnDate[:10]))

destinations = ["lih", "sju", "del", "JP", "IE", "PT", "sjd", "MX", "NL", "DK", "FR", "HR", "TH", "TR", "IT", "GR", "IS" ]
for val in destinations:
    print(flight("sea", val))
#flight("sea", "BNE");

