<?php
//$passdata = $_POST["data"];



function httpPost($data)
{
    //$url = "http://partners.api.skyscanner.net/apiservices/browsequotes/v1.0/US/usd/en-US/" . $data["origin"] . "/" . $data["locations"] . "/anytime/anytime?apikey=prtl6749387986743898559646983194";
    $url = "http://partners.api.skyscanner.net/apiservices/browsequotes/v1.0/US/usd/en-US/sea/hnl/anytime/anytime?apikey=prtl6749387986743898559646983194";
    $curl = curl_init($url);
    curl_setopt($curl, CURLOPT_POST, true);
    curl_setopt($curl, CURLOPT_POSTFIELDS, http_build_query($data));
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
    $response = curl_exec($curl);
    curl_close($curl);
    return $response;
}
echo "hello";
echo httpPost("hi");

?>