const mapKey = 'AIzaSyAMf4ck6tVB7e6xjH0k2lAF1ymsZJUHP3I';

// Function to calculate the distance between two points on the Earth

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
        ;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    return distance;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180)
}

// Initialize lastRequestedDirections variable
let lastRequestedDirections = null;
// Main map code responsible for creating the map, adding markers, and populating the list

function initMap() {

    // Get the URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const latParam = parseFloat(urlParams.get('lat'));
    const longParam = parseFloat(urlParams.get('long'));

    // Check if SearchCriteria exists in local storage
    const searchCriteria = localStorage.getItem('SearchCriteria');
    let searchCriteriaLocation;
    if (searchCriteria) {
        const parsedSearchCriteria = JSON.parse(searchCriteria);
        if (parsedSearchCriteria.address) {
            searchCriteriaLocation = parsedSearchCriteria.address;
        }
    }

    // If the lat and long parameters are present, use them as the user's location
    let userLocationPromise;
    if (!isNaN(latParam) && !isNaN(longParam)) {
        userLocationPromise = Promise.resolve({
            lat: latParam,
            lng: longParam
        });
    } else if (searchCriteriaLocation) {
        // If SearchCriteria location is present, use it as the user's location
        // You would need to convert the postcode to lat and long coordinates
        // For now, we'll use the default Toronto coordinates
        userLocationPromise = Promise.resolve({
            lat: 43.70, // latitude for Toronto
            lng: -79.42 // longitude for Toronto
        });
    } else {
        // Otherwise, get the user's current location
        userLocationPromise = new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(position => {
                resolve({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
            }, () => {
                // If geolocation is not supported or permission is denied, set location to Toronto
                resolve({
                    lat: 43.70, // latitude for Toronto
                    lng: -79.42 // longitude for Toronto
                });
            });
        });
    }

    userLocationPromise.then(userLocation => {

        function calculateAndDisplayRoute(directionsService, directionsRenderer, origin, destination, travelMode) {
            directionsService.route(
                {
                    origin: origin,
                    destination: destination,
                    travelMode: travelMode
                },
                (response, status) => {
                    console.log(destination);

                    if (status === 'OK') {
                        directionsRenderer.setDirections(response);

                        // Get the destination address of the last leg
                        let legs = response.routes[0].legs;
                        let lastLeg = legs[legs.length - 1];
                        let destinationAddress = lastLeg.end_address;

                        document.querySelector('[data-map=destination]').innerHTML = destinationAddress;
                    } else {
                        window.alert('Directions request failed due to ' + status);
                    }
                }

            );
        }

        // Get the update location element
        const updateLocationElement = document.querySelector('[data-map="update-location"]');

        if (updateLocationElement) {
            updateLocationElement.addEventListener('click', () => {
                // Get the postcode from the element with data-map="postcode"
                const postcodeElement = document.querySelector('[data-map="postcode"]');
                if (postcodeElement) {
                    const postcode = postcodeElement.value;

                    // Use Google Maps Geocoding API to get the latitude and longitude from the postcode
                    fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${postcode}&key=${mapKey}`)
                        .then(response => response.json())
                        .then(data => {
                            const location = data.results[0].geometry.location;

                            // Update userLocation variable
                            userLocation.lat = location.lat;
                            userLocation.lng = location.lng;

                        });
                }

                lastRequestedDirections.click();

            });
        }
        // Use a geocoding service to get the postcode from the latitude and longitude
        // This is a placeholder and should be replaced with a real geocoding service
        fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${userLocation.lat},${userLocation.lng}&key=${mapKey}`)
            .then(response => response.json())
            .then(data => {
                // Set the postcode in the element with the attribute data-map="postcode"
                const postcodeElement = document.querySelector('[data-map="postcode"]');
                if (postcodeElement) {
                    const postcode = data.results[0].address_components.find(component => component.types.includes('postal_code')).short_name;
                    postcodeElement.value = postcode;
                }

                // Add an event listener to update the user's location when the postcode is changed
                postcodeElement.addEventListener('change', event => {
                    // Use a geocoding service to get the latitude and longitude from the postcode
                    fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${event.target.value}&key=${mapKey}`)
                        .then(response => response.json())
                        .then(data => {
                            userLocation.lat = data.results[0].geometry.location.lat;
                            userLocation.lng = data.results[0].geometry.location.lng;
                        });
                });
            });

        // https://cdn.jsdelivr.net/gh/Qwen2020/composite@main/dealers-dummy.json
        fetch('https://cdn.jsdelivr.net/gh/Qwen2020/composite@main/dealers-dummy.json')
            .then(response => response.json())
            .then(data => {
                // Replace locations with companies
                const locations = data.companies;

                // Calculate the distance between the user's location and each location
                locations.forEach(location => {
                    const latDiff = parseFloat(location.latitude) - userLocation.lat;
                    const lngDiff = parseFloat(location.longitude) - userLocation.lng;
                    location.distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
                });

                // Sort the locations by distance
                locations.sort((a, b) => a.distance - b.distance);

                // Create a new map centered at the user's location
                const map = new google.maps.Map(document.getElementById('map'), {
                    zoom: 8,
                    center: userLocation,
                    styles: [
                        {
                            featureType: 'poi',
                            stylers: [{ visibility: 'off' }]
                        }
                    ],
                    streetViewControl: false, // This will hide the Street View control
                    mapTypeControl: false // This will hide the Map/Satellite control
                });

                // Maps Directons 

                // Create a new DirectionsService object
                const directionsService = new google.maps.DirectionsService();
                // Create a new DirectionsRenderer object
                const directionsRenderer = new google.maps.DirectionsRenderer();

                // Set the map for the DirectionsRenderer
                directionsRenderer.setMap(map);

                // Set the panel for the DirectionsRenderer
                let panelElement = document.querySelector('[data-maps-directions]');
                directionsRenderer.setPanel(panelElement);

                // Get the list and the template list item
                const list = document.querySelector('[data-map-list]');
                const template = list.firstElementChild;

                // Add a marker and a list item for each location
                locations.forEach((location, index) => {
                    location.distance = calculateDistance(userLocation.lat, userLocation.lng, location.latitude, location.longitude);
                    const marker = new google.maps.Marker({
                        position: { lat: parseFloat(location.latitude), lng: parseFloat(location.longitude) },
                        map: map,
                        icon: 'https://uploads-ssl.webflow.com/64c57def3601adf69171da07/65e894381acc2469159cdc1c_dormant.svg'
                    });

                    let destinationLocation = location.latitude + ',' + location.longitude;

                    // Create an InfoWindow for the marker
                    const infoWindow = new google.maps.InfoWindow({
                        content: `
                                        <p class="maps_tip_heading">${location.name}</p>
                                        <ul class="map_item_list">
                                         <li>${location.latitude}</li>
                                         <li>${location.longitude}</li>
                                        <li><a target="_blank" href="tel:${location.phoneNumber}">${location.phoneNumber}</a></li>
                                         <a href="#" data-map-directions="${location.latitude}, ${location.longitude}">Get Directions</a>
                                        </ul>
                                     `
                    });

                    let timeoutId = null;

                    // Show the InfoWindow and change the icon when the marker is hovered
                    marker.addListener('mouseover', () => {
                        clearTimeout(timeoutId); // Clear the timeout if it's set
                        infoWindow.open(map, marker);
                        marker.setIcon('https://uploads-ssl.webflow.com/64c57def3601adf69171da07/65e894396b30c86b21522c13_active.svg'); // Set the icon to a hover image
                        li.classList.add('hover');
                    });

                    // Hide the InfoWindow and change the icon back when the mouse leaves the marker
                    marker.addListener('mouseout', () => {
                        // Set a timeout to close the InfoWindow after 1 second
                        timeoutId = setTimeout(() => {
                            infoWindow.close();
                            marker.setIcon('https://uploads-ssl.webflow.com/64c57def3601adf69171da07/65e894381acc2469159cdc1c_dormant.svg'); // Set the icon back to the default image
                            li.classList.remove('hover');
                        }, 1000); // 1000 milliseconds = 1 second
                    });

                    // Clone the template and populate it with data
                    const li = template.cloneNode(true);
                    li.querySelectorAll('[data-map], [data-map-image], [data-map-distance]').forEach(element => {
                        const key = element.hasAttribute('data-map') ? element.getAttribute('data-map') :
                            element.hasAttribute('data-map-image') ? element.getAttribute('data-map-image') :
                                'distance';
                        if (location.hasOwnProperty(key)) {
                            if (element.hasAttribute('data-map')) {
                                element.innerHTML = location[key];
                            } else if (element.hasAttribute('data-map-image')) {
                                element.src = location[key];
                            } else if (element.hasAttribute('data-map-distance')) {
                                element.textContent = `${location[key].toFixed(2)} km`;
                            }
                        }

                        // If the element is a direction button, add an event listener
                        if (key === 'direction-button') {
                            element.addEventListener('click', function () {
                                destinationLocation = {
                                    lat: location.latitude,
                                    lng: location.longitude
                                };
                                calculateAndDisplayRoute(directionsService, directionsRenderer, userLocation, destinationLocation, google.maps.TravelMode.DRIVING);

                                lastRequestedDirections = element;

                                console.log(lastRequestedDirections);
                                
                                // Simulate a click on the element with the data-maps-directions-open attribute
                                let openElement = document.querySelector('[data-maps-directions-open]');
                                if (openElement) {
                                    openElement.click();
                                }
                            });
                        }
                    });
                    li.addEventListener('click', () => {
                        map.setCenter(marker.getPosition());
                        map.setZoom(8);
                    });

                    // Clear the list before appending the first location
                    if (index === 0) {
                        while (list.firstChild) {
                            list.removeChild(list.firstChild);
                        }
                    }

                    // Append the new list item to the list
                    list.appendChild(li);
                });


                // Event listerners for UI elements

                let destinationLocation;

                document.addEventListener('click', function (event) {
                    if (event.target.dataset.mapDirections) {
                        destinationLocation = {
                            lat: parseFloat(event.target.dataset.mapDirections.split(',')[0]),
                            lng: parseFloat(event.target.dataset.mapDirections.split(',')[1])
                        };
                        calculateAndDisplayRoute(directionsService, directionsRenderer, userLocation, destinationLocation, google.maps.TravelMode.DRIVING);

                        // Simulate a click on the element with the data-maps-directions-open attribute
                        let openElement = document.querySelector('[data-maps-directions-open]');

                        if (openElement) {
                            openElement.click();
                        }
                    }
                });

                document.querySelector('[data-maps-directions-mode]').addEventListener('click', function (event) {
                    if (event.target.tagName === 'BUTTON') {
                        let selectedMode = event.target.id;
                        if (destinationLocation) {
                            calculateAndDisplayRoute(directionsService, directionsRenderer, userLocation, destinationLocation, google.maps.TravelMode[selectedMode]);
                        }
                    }
                });


            })

    }).catch(error => console.error('Error:', error));

}
