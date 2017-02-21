/**
 * Created by Administrator on 2016/8/21.
 */
var map;
var infoWindow;
var markers = [];
var content;
var prevRating;
var prevPrice;

// initialize the map
function initMap() {
    var pos = {lat: -33.8688, lng: 151.2195};
    map = new google.maps.Map(document.getElementById('map'), {
        center: pos,
        zoom: 15,
        mapTypeId: 'roadmap'
    });
    infoWindow = new google.maps.InfoWindow();
    //locate user if allowed to use navigator
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            infoWindow.setPosition(pos);
            map.setCenter(pos);
            searchNearBy();
        }, function () {
            handleLocationError(true, infoWindow, map.getCenter());
        });
    } else {
        // Browser doesn't support Geolocation
        handleLocationError(false, infoWindow, map.getCenter());
    }

    function handleLocationError(browserHasGeolocation, infoWindow, pos) {
        infoWindow.setPosition(pos);
        infoWindow.setContent(browserHasGeolocation ?
            'Error: The Geolocation service failed.' :
            'Error: Your browser doesn\'t support geolocation.');
    }

    // allow user to drag the map to find restaurant near by
    map.addListener('dragend', function () {
        searchNearBy();
    });

    // when close the info window, clear the info content
    google.maps.event.addListener(infoWindow, 'closeclick', function () {
        cleanInfoWindow();
    });
}

// search by search box
function search() {
    var address = document.getElementById('input_address').value;
    var service = new google.maps.places.PlacesService(map);
    var goecoder = new google.maps.Geocoder();
    geocodeAddress(goecoder, address);
    searchNearBy();
}

// call the Placesservice and return a list of restaurant has found near by
function searchNearBy() {
    var service = new google.maps.places.PlacesService(map);
    service.nearbySearch({
        location: map.getCenter(),
        radius: 600,
        type: ['restaurant']
    }, updateMarkers);
}

// convert address to position
function geocodeAddress(geocoder, address) {
    geocoder.geocode({'address': address}, getLocation);
}

function getLocation(results, status) {
    if (status === 'OK') {
        map.setCenter(results[0].geometry.location);
    } else {
        alert('Please enter a valid address');
    }
}

// Listen for the event fired when the user selects a prediction and retrieve
// more details for that place.
function updateMarkers(results, status) {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
        if (results.length == 0) {
            return;
        }

        // Clear out the old markers and listeners.
        markers.forEach(function (marker) {
            marker.setMap(null);
            google.maps.event.clearListeners(marker);
        });
        markers = [];

        // For each place, get the icon, name and location.
//                var bounds = new google.maps.LatLngBounds();
        results.forEach(function (place) {
            if (!place.geometry) {
                console.log("Returned place contains no geometry");
                return;
            }
            var icon = {
                url: place.icon,
                size: new google.maps.Size(71, 71),
                origin: new google.maps.Point(0, 0),
                anchor: new google.maps.Point(0, 0),
                scaledSize: new google.maps.Size(place.rating * place.rating * place.rating / 3, place.rating * place.rating * place.rating / 3)
            };

            // Create a marker for each place.
            var marker = new google.maps.Marker({
                map: map,
                icon: icon,
                title: place.name,
                position: place.geometry.location
            });

            // Create info window listener for each marker
            // If one marker is selected, show detail of this marked place
            // If two marker are selected, show comparison of these two marked place
            // First selected marked place won't change unless close the info window
            google.maps.event.addListener(marker, 'click', function () {
                infoWindow.setPosition(place.geometry.location);
                var photos = place.photos;
                var url = photos ? photos[0].getUrl({
                    maxWidth: 300,
                    maxHeight: 250
                }) : "";
                var rating = place.rating ? '<label class="alignToBottom"><span class="stars">' + place.rating + '</span></label>&nbsp&nbsp&nbsp' + place.rating : "";
                var price = place.price_level ? "Price Level: " + place.price_level : "";
                var address = place.formatted_address ? "Address: " + place.formatted_address : "";
                var number = place.formatted_phone_number ? "Number: " + place.formatted_phone_number : "";
                if (infoWindow.getContent() == null) {
                    content = '<div class="well row sansserif">' +
                        '<div class="col-sm-6">' +
                        '<h4 id="infohead" class="info">' + place.name + '</h4>' +
                        '<div id = "rating" class = "info">' + rating + '</div>' +
                        '<div id = "price" class = "info">' + price + '</div>' +
                        '<img class="image" src="' + url + '">' + '</img>' +
                        '<div id = "address" class = "info">' + address + '</div>' +
                        '<div id = "number" class = "info">' + number + '</div>' +
                        '</div>' +
                        '</div>';
                    prevPrice = place.price_level;
                    prevRating = place.rating;
                    infoWindow.setContent(content);
                } else {
                    var lastDiv = content.lastIndexOf("</div>");
                    var subContent = content.substring(0, lastDiv);
                    var ratingDiff;
                    var priceDiff;
                    if (prevRating && place.rating) {
                        ratingDiff = Math.round((place.rating - prevRating) * 10) / 10;
                        if (ratingDiff > 0)
                            ratingDiff = ratingDiff.toString().fontcolor("green") + "&#8593";
                        else if(ratingDiff < 0){
                            ratingDiff = Math.abs(ratingDiff).toString().fontcolor("red") + "&#8595";
                        }
                    }
                    if (prevPrice && place.price_level) {
                        priceDiff = Math.round((place.price_level - prevPrice) * 10) / 10;
                        if (priceDiff > 0)
                            priceDiff = "higher price".fontcolor("red");
                        else if(priceDiff < 0){
                            priceDiff = "lower price".fontcolor("green");
                        }else{
                            priceDiff = "the same";
                        }
                    }
                    var compareContent = '<div class="col-sm-6"><h4 id = "compare" class = "infocompare">Comapre to ' + place.name + '</h4>';
                    console.log(ratingDiff+"--"+priceDiff)
                    if (ratingDiff!=null || priceDiff!=null) {
                        compareContent += ratingDiff!=null ? '<div id = "compareRating" class = "infocompare">' + rating + '&nbsp&nbsp&nbsp' + ratingDiff + '</div>' : "";
                        compareContent += priceDiff!=null ? '<div id = "comparePrice" class = "infocompare">' + price + '&nbsp&nbsp&nbsp' + priceDiff + '</div>' : "";
                    } else {
                        compareContent += '<div id = "notComparable" class = "infocompare">Not comparable</div>';
                    }
                    compareContent += '<img class="image" src="' + url + '">' + '</img></div></div>';
                    infoWindow.setContent(subContent + compareContent);
                }
                infoWindow.open(map, this);
                starRating();
            });
            markers.push(marker);

            // Drag map will also close the info window
            cleanInfoWindow();
        });
    }
}

function cleanInfoWindow() {
    infoWindow.setContent(null);
}

// Star rating
function starRating() {
    $.fn.stars = function () {
        return $(this).each(function () {
            // Get the value
            var val = parseFloat($(this).html());
            // Make sure that the value is in 0 - 5 range, multiply to get width
            var size = Math.max(0, (Math.min(5, val))) * 16;
            // Create stars holder
            var $span = $('<span />').width(size);
            // Replace the numerical value with stars
            $(this).html($span);
        });
    }

    $(function () {
        $('span.stars').stars();
    });
}

// Go to top
$("a[href='#top']").click(function () {
    $("html, body").animate({scrollTop: 0}, 'slow');
    return false;
});