// Maps key needs mirgrating to production key and the dummy data should be replaced with production once that is confirmed. 

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

    let destinationLocation = '';

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

        // Get the manufacturer from the meta tag
        const metaTag = document.querySelector('meta[name="manufacturer"]');
        const manufacturer = metaTag && metaTag.getAttribute('content');

        // Construct the URL
        const url = `https://apimktprd01.autotrader.ca/research/v1/dealer-search?oemName=` + manufacturer;
        // Fetch the data
        fetch(url)
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
                    zoom: 11,
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

                    destinationLocation = location.latitude + ',' + location.longitude;

                    // Create an InfoWindow for the marker

                    let phoneNumber = location.phoneNumber;
                    if (phoneNumber) {
                        phoneNumber = phoneNumber.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
                    }

                    const infoWindow = new google.maps.InfoWindow({
                        content: `
                        <div class="maps_infowindow maps_tip_heading">
                        <div class="maps_infowindow_header">

                        <img src="${location.logoUrl}" loading="lazy" alt="" class="maps_infoWindow_image">
                        
                        <div class="maps_infowindow_heading">${location.name}</div></div>
                        
                        <div class="maps_infowindow_divider">
                        
                        </div>
                        
                        <ul role="list" class="map_item_list_window">
                        
                        <li class="map_item_list_item">
                        
                        <div class="map_item_list_item_icon w-embed"> <svg width="14" height="15" viewBox="0 0 14 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.99935 7.26213C6.61257 7.26213 6.24164 7.10848 5.96815 6.83499C5.69466 6.5615 5.54102 6.19057 5.54102 5.80379C5.54102 5.41702 5.69466 5.04609 5.96815 4.77259C6.24164 4.4991 6.61257 4.34546 6.99935 4.34546C7.38612 4.34546 7.75706 4.4991 8.03055 4.77259C8.30404 5.04609 8.45768 5.41702 8.45768 5.80379C8.45768 5.9953 8.41996 6.18494 8.34667 6.36187C8.27339 6.53881 8.16597 6.69957 8.03055 6.83499C7.89513 6.97041 7.73436 7.07783 7.55743 7.15112C7.3805 7.2244 7.19086 7.26213 6.99935 7.26213ZM6.99935 1.72046C5.91638 1.72046 4.87777 2.15067 4.112 2.91644C3.34622 3.68221 2.91602 4.72082 2.91602 5.80379C2.91602 8.86629 6.99935 13.3871 6.99935 13.3871C6.99935 13.3871 11.0827 8.86629 11.0827 5.80379C11.0827 4.72082 10.6525 3.68221 9.8867 2.91644C9.12093 2.15067 8.08232 1.72046 6.99935 1.72046Z" fill="#3E3E3E"></path>
                        </svg></div>
                        
                        <div>5525 Ambler Dr, Mississauga, ON L4W 3Z1 · 9 km from you</div>
                        
                        </li>
                        
                        <li class="map_item_list_item">
                        
                        <div class="map_item_list_item_icon w-embed"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3.86167 6.29417C4.70167 7.945 6.055 9.29833 7.70583 10.1383L8.98917 8.855C9.1525 8.69167 9.38 8.645 9.58417 8.70917C10.2375 8.925 10.9375 9.04167 11.6667 9.04167C11.8214 9.04167 11.9697 9.10312 12.0791 9.21252C12.1885 9.32192 12.25 9.47029 12.25 9.625V11.6667C12.25 11.8214 12.1885 11.9697 12.0791 12.0791C11.9697 12.1885 11.8214 12.25 11.6667 12.25C9.0366 12.25 6.51426 11.2052 4.65452 9.34548C2.79479 7.48574 1.75 4.9634 1.75 2.33333C1.75 2.17862 1.81146 2.03025 1.92085 1.92085C2.03025 1.81146 2.17862 1.75 2.33333 1.75H4.375C4.52971 1.75 4.67808 1.81146 4.78748 1.92085C4.89687 2.03025 4.95833 2.17862 4.95833 2.33333C4.95833 3.0625 5.075 3.7625 5.29083 4.41583C5.355 4.62 5.30833 4.8475 5.145 5.01083L3.86167 6.29417Z" fill="#3E3E3E"></path>
                        </svg></div>
                        
                        <div><a target="_blank" href="tel:${location.phoneNumber}">${phoneNumber}</a></div>
                        
                        </li>

                        <li>
                        <a href="#" data-map-directions="${location.latitude}, ${location.longitude}">Get Directions</a>
                        </li>
                        
                        </ul>
                        
                        </div>


                                     `
                    });

                    let timeoutId = null;

                    // Add a click event listener to the marker
marker.addListener('click', () => {
    // Open the InfoWindow when the marker is clicked
    infoWindow.open(map, marker);
    marker.setIcon('https://uploads-ssl.webflow.com/64c57def3601adf69171da07/65e894396b30c86b21522c13_active.svg');
    li.classList.add('hover');
});

// Add a click event listener to the map
google.maps.event.addListener(map, 'click', () => {
    // Close the InfoWindow when the map is clicked
    infoWindow.close();
    marker.setIcon('https://uploads-ssl.webflow.com/64c57def3601adf69171da07/65e894381acc2469159cdc1c_dormant.svg');
    li.classList.remove('hover');
});

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
                            li.setAttribute('data-gtm-content-model', location['name']);

                            var directionButton = li.querySelector('[data-map="direction-button"]');
                            if (directionButton) {
                                directionButton.setAttribute('data-gtm-content-model', location['name']);
                            }

                            li.setAttribute('data-gtm-content-model', location['name']);

                            if (element.hasAttribute('data-map') && element.getAttribute('data-map') === 'phoneNumber') {

                                let phoneNumber = location[key];
                                if (phoneNumber) {

                                    phoneNumber = phoneNumber.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');

                                    element.innerHTML = phoneNumber;
                                    element.href = `tel:${location[key]}`;
                                }

                            } else if (element.hasAttribute('data-map')) {
                                element.innerHTML = location[key];
                            } else if (element.hasAttribute('data-map-image')) {
                                if (location[key] && location[key].trim() !== '') {
                                    element.src = location[key];
                                    element.srcset = location[key];
                                }
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
                        map.setZoom(15);
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

                        console.log(destinationLocation)

                        if (destinationLocation) {
                            calculateAndDisplayRoute(directionsService, directionsRenderer, userLocation, destinationLocation, google.maps.TravelMode[selectedMode]);
                        }
                    }
                });

                document.querySelector('[data-maps="close-directions"]').addEventListener('click', function (event) {

                    directionsRenderer.setDirections(null);

                });


            })

    }).catch(error => console.error('Error:', error));

}
