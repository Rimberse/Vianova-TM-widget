define
   (
      "Modules/DataLoader",
      [
         'DS/PlatformAPI/PlatformAPI',
         'DS/i3DXCompassServices/i3DXCompassServices',
         'Modules/WidgetManager',

         // Libraries
         'Lib/leaflet'
      ],
      function
         (
            PlatformAPI,
            i3DXCompassServices,
            WidgetManager,
            leaflet
         ) {

         console.info('Data loader has been loaded');

         // global variables (widget, UWA, document)
         let accessToken;
         let username;
         let password;

         // Vianova's API
         // const host = 'https://vianova-tm.herokuapp.com/api';
         const host = 'https://api.vianova.dev';

         // Leaflet map;
         let map;
         // Application's state, which contains http response data. Used to prevent from calling the web service twice
         const state = {};
         // Worldwide Coordinate System
         const epsg = "EPSG:3395";

         // Private functions. Not accessible by other modules. Accesible within this module only

         // Creates a popup to retrieve credentials
         // Used to retrieve Vianova credentials and token, required for later use
         function getCredentials() {
            var popup = document.createElement('div');
            popup.id = "popup";

            var accessTokenDiv = document.createElement('div');
            accessTokenDiv.innerHTML = "Mapbox access token:"
            var inputTkn = document.createElement('input');
            inputTkn.id = "tkn";
            inputTkn.type = "text";

            var usernameDiv = document.createElement('div');
            usernameDiv.innerHTML = "Username:"
            var inputUsr = document.createElement('input');
            inputUsr.id = "usr";
            inputUsr.type = "text";

            var passwordDiv = document.createElement('div');
            passwordDiv.innerHTML = "Password:"
            var inputPass = document.createElement('input');
            inputPass.id = "pass";
            inputPass.type = "password";

            var confirmBtn = document.createElement('button');
            confirmBtn.id = "confirm-btn";
            confirmBtn.role = "button";
            confirmBtn.innerHTML = "Confirm";
            confirmBtn.onclick = function done() {
               document.getElementById("popup").style.display = "none";
               var token = document.getElementById("tkn").value;
               var usr = document.getElementById("usr").value;
               var pass = document.getElementById("pass").value;

               console.log(token, usr, pass);
               accessToken = token;
               username = usr;
               password = pass;
            };

            popup.appendChild(accessTokenDiv);
            popup.appendChild(inputTkn);
            popup.appendChild(usernameDiv);
            popup.appendChild(inputUsr);
            popup.appendChild(passwordDiv);
            popup.appendChild(inputPass);
            popup.appendChild(confirmBtn);
            return popup;
         }

         // Vianova's API requests
         // Retrieves bearer token by calling Vianova's web service
         const getToken = async () => {
            const path = '/token'
            const address = host.concat(path);

            const headers = new Headers({
               'Content-Type': 'application/x-www-form-urlencoded'
            });

            const body = new URLSearchParams({
               username: prompt("Please enter username:"),
               password: prompt("Please enter password:")
            });

            const rawResponse = await fetch(address, {
               method: 'POST',
               body
            });
            const data = await rawResponse.json();
            return data['access_token'];
         }

         // Retreiving a zoneId for a given user
         const getZoneID = async token => {
            const path = '/zones/';

            const headers = new Headers({
               'Authorization': 'Bearer ' + token,
            });

            const requestOptions = {
               method: 'GET',
               headers
            };

            const rawResponse = await fetch(host.concat(path), requestOptions);
            const data = await rawResponse.json();
            return data.contents[0].zone_id;
         }

         // Retrieves GeoFeatures
         const getGeoJSON = async (token, zoneID) => {
            const path = `${host}/zones/${zoneID}/`;

            const options = {
               method: 'GET',
               headers: {
                  Accept: 'application/json',
                  Authorization: 'Bearer ' + token
               }
            };

            const rawResponse = await fetch(path, options);
            const data = await rawResponse.json();
            const response = await fetch(data["detail_link"], {
               method: 'GET', headers: { Accept: 'application/json' }
            });

            const details = response.json();
            return details;
         }

         // Retrieves GeoFeature tags
         const getGeoFeatureTags = async (token, zoneID) => {
            const path = `${host}/zones/${zoneID}/geo_features/tags/`;

            const options = { method: 'GET', headers: { Authorization: 'Bearer ' + token } };

            const rawResponse = await fetch(path, options);
            const data = await rawResponse.json();
            return data.sort();
         }

         // City widget interaction
         // Function to setup basic City API subscription 
         const setupSubscriptions = () => {
            // unsubscribe common city topics to prevent double subscriptions
            PlatformAPI.unsubscribe('xCity.resolve');
            PlatformAPI.unsubscribe('xCity.catch');

            // subscribes to common city topics
            PlatformAPI.subscribe('xCity.resolve', resolve.bind(this));   // Good API result will be funneled to "resolve" function
            PlatformAPI.subscribe('xCity.catch', reject.bind(this));      // Bad API result will be funneled to "reject" function
         }

         // Imports given GeoJSON to City's experience tab
         const importGeoJSON = async geoJSON => {
            // To get the request widget ID: the arrow (top) dropdown button should be cliked in Chrome debugger
            // Then City's frame should be selected (highlighted one in blue). After that enter the line command 'widget' (to see it's id among other properties)
            // MessageId should be a unique identifier (Date.now() could be used to generate unique id)

            // makes request to a given topic with a given body
            makeAPIRequest('addData', {
               "representation": {
                  "id": "vianova",
                  "name": "Vianova activity"
               },
               "geojson": geoJSON
            });
         }

         // Helper functions to receive all API result before funneled further to each individual topic function
         const resolve = res => {
            if (isValidResultMessage(res)) {
               console.info('Resolve: ', res);

               switch (res.topic) {
                  case 'xCity.ping': ping(res); break;
                  case 'xCity.pair': pair(res); break;
                  case 'xCity.moveTo': moveTo(res); break;
                  case 'xCity.onClick': onClick(res); break;
                  case 'xCity.onSelect': onSelect(res); break;
                  case 'xCity.onDeselect': onDeselect(res); break;
                  case 'xCity.addData': addData(res); break;
                  // case 'xCity.<topic>': topicFunction(res); break;
                  default: console.info('No setup for ' + res.topic + ' topic');
               }
            }
         }

         const reject = res => {
            if (isValidResultMessage(res)) {
               console.warn('Reject: ', res);
            }
         }

         const ping = res => {
            console.info('ping: ', res);
         }

         // ===== Individual functions to process API result for each topic
         const pair = res => {
            console.info('pair: ', res);
            if (UWA.is(res.data, 'object')) {

               if ((res.data.status === 'pairing-success' || res.data.status === 'paired') && !WidgetManager.isPaired(res.publisher)) {
                  WidgetManager.addPairedWidget(res.publisher, res.data.title);

               } else if (res.data.status === 'pairing-removed') {
                  WidgetManager.removePairedWidget(res.publisher);
               }
            }
         }

         function moveTo(res) {
            console.info('moveTo: ', res);
         }

         function onClick(res) {
            console.info('onClick: ', res);
         }

         function onSelect(res) {
            console.info('onSelect: ', res);
         }

         function onDeselect(res) {
            console.info('onDeselect: ', res);
         }

         function addData(res) {
            console.info('addData: ', res);
         }

         // ===== Helper functions to verify API result is valid
         const isValidResultMessage = res => {
            if (UWA.is(res, 'object')) {

               // If result is broadcast type to dashboard
               if (res.messageType === 'broadcast' && res.subscribeType === 'dashboard') {
                  return true;
               }
               // Else always check if it is for this widget
               else if (isForThisWidget(res.widgetId)) {
                  return true;
               }
            }

            return false;
         }

         function isForThisWidget(widgetId) {
            if (
               (UWA.is(widgetId, 'string') && widgetId === widget.id) ||
               (UWA.is(widgetId, 'array') && widgetId.includes(widget.id))
            ) {
               return true;
            }

            return false;
         }


         // ===== Helper function to make request to City API for any available topic
         function makeAPIRequest(topic, data) {
            var request = {
               messageId: UWA.Utils.getUUID(),
               publisher: widget.id
            };

            if (UWA.is(data, 'object')) {
               request.data = data;
            }

            console.log(WidgetManager.getSameTabWidgets());

            // Get target city widget ID
            if (topic != 'ping' && topic != 'pair') {
               request.widgetId = WidgetManager.getSameTabWidgets()[0].id;
            }

            console.info('xCity.' + topic, request);
            PlatformAPI.publish('xCity.' + topic, request);
         }


         // Loads Leaflet with Mapbox map
         const createMapFrom = GeoJSON => {
            const coordinates = [47.559601, 7.588576];

            console.info(GeoJSON);
            map = L.map('map', {
               center: coordinates,
               zoom: 13,
               preferCanvas: true,
               renderer: L.canvas()
            });

            const myStyle = {
               "color": "#9824bf",
               "weight": 2,
               "opacity": 1
            };

            L.tileLayer("https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}", {
               attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery &copy; <a href="https://www.mapbox.com/">Mapbox</a>',
               maxZoom: 23,
               id: 'mapbox/streets-v11',
               tileSize: 512,
               zoomOffset: -1,
               accessToken: accessToken
            }).addTo(map);

            L.geoJSON(GeoJSON, {
               style: myStyle
            }).addTo(map);
         }


         // Event handler for dropdown menu containing all the layers, permits to change the layer and redraw the map with newly filtered data
         const selectionHandler = (token, zoneID, responseJSON) => {
            return event => {
               event.preventDefault();
               event.stopPropagation();

               const filterBy = event.target.value;

               // Removes all the existing layers from the map
               map.eachLayer(layer => map.removeLayer(layer));

               L.tileLayer("https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}", {
                  attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery &copy; <a href="https://www.mapbox.com/">Mapbox</a>',
                  maxZoom: 23,
                  id: 'mapbox/streets-v11',
                  tileSize: 512,
                  zoomOffset: -1,
                  accessToken: accessToken
               }).addTo(map);

               // Styling object for GeoJSON features
               const myStyle = {
                  "color": "#f2ccff",
                  "weight": 2,
                  "opacity": 1
               };

               // Styling object for points
               const geojsonMarkerOptions = {
                  radius: 8,
                  fillColor: "#ff7800",
                  color: "#000",
                  weight: 1,
                  opacity: 1,
                  fillOpacity: 0.8
               };

               // Verify if state object already contains the data, to tell if a web service has already been called and the data retrieved, if it's the case, then retrieve it's value value for a given tag
               if (state[filterBy]) {
                  const markers = L.markerClusterGroup({
                     disableClusteringAtZoom: 22
                  });

                  lastColorIndexes = {};

                  // Range object is used to get the range of gradient colors between two given colors
                  const range = { min: rgbToString(hexToRgb(myStyle.color)), max: rgbToString(hexToRgb("#9116fe")) };
                  const colors = interpolateColors(range.min, range.max, state[filterBy]["color interpolation"].length).map(color => `rgb(${color.join(', ')})`);
                  console.log(colors);

                  L.geoJSON(state[filterBy].GeoJSON, {
                     style: (state[filterBy]["color interpolation"].length > 1) ? feature => {
                        // Example: array.length = 12 => 100 / 12 = 8.33 => 8.33 / 100 => itemIndexFromSortedArray * 8.33 => Saturation value
                        const colorOffset = 100 / state[filterBy]["color interpolation"].length / 100;

                        if (feature.metrics !== undefined) {
                           let colorIndex = state[filterBy]["color interpolation"].indexOf(Math.round(feature.metrics[0].values[0])) + 1;
                           if (lastColorIndexes[Math.round(feature.metrics[0].values[0])]) {
                              if (lastColorIndexes[Math.round(feature.metrics[0].values[0])] === colorIndex) {
                                 colorIndex++;
                              }
                           }

                           lastColorIndexes[Math.round(feature.metrics[0].values[0])] = colorIndex;
                           lastColorIndex = colorIndex;

                           return { color: colors[colorIndex - 1], weight: myStyle.weight, opacity: myStyle.opacity };
                        } else {
                           return { color: myStyle.color, weight: myStyle.weight, opacity: myStyle.opacity };
                        }
                     } : myStyle,
                     pointToLayer: (feature, latlng) => markers.addLayer(L.circleMarker(latlng, geojsonMarkerOptions)),
                     onEachFeature: onEachFeature
                  }).addTo(map);

                  return;
               }

               // Build properly formatted GeoJSON
               const geoJSON = {
                  crs: epsg,
                  type: "FeatureCollection",
                  features: responseJSON["geo_features"].filter(feature => feature.tags.includes(filterBy)).map(({ geo_feature_id, name, geojson, properties }) => ({ type: "Feature", id: geo_feature_id, name, geometry: geojson, properties }))
               };

               console.log(geoJSON);

               // If GeoJSON contains more than 1000 geo features, then split them by packs of 1000. This is to prevent sending huge payload and to prevent the web service from failing to respond to an API call
               if (geoJSON.features.length > 1000) {
                  const promises = [];
                  let metrics = [];
                  const splitBy = 1000;

                  // Get ranges. Example: if the array is of length 3200: 0 - 1000, 1000 - 2000, 2000 - 3000
                  let startIndex = 0;
                  for (let endIndex = splitBy; endIndex < geoJSON.features.length; endIndex += splitBy) {
                     const geoJSONsliced = (({ crs, features, type }) => ({ crs, features, type }))(geoJSON);
                     geoJSONsliced.features = geoJSON.features.slice(startIndex, endIndex);
                     startIndex = endIndex;

                     promises.push(getFleetSize(token, zoneID, geoJSONsliced));
                  }

                  // Gets the last range. Example: 3000 - 3200
                  if (startIndex < geoJSON.features.length) {
                     const geoJSONsliced = (({ crs, features, type }) => ({ crs, features, type }))(geoJSON);
                     geoJSONsliced.features = geoJSON.features.slice(startIndex, geoJSON.features.length)

                     promises.push(getFleetSize(token, zoneID, geoJSONsliced))
                  }

                  Promise.all(promises)
                     .then(responses => Promise.all(responses.map(response => response.json())))
                     .then(results => {
                        results.forEach(result => {
                           console.log(result);

                           if (result.groupings.length > 0) {
                              metrics = metrics.concat(result.groupings.filter(grouping => grouping.grouping === "geo_fence" && geoJSON.features.some(feature => grouping.grouping_value.includes(feature.id))));
                              console.log(metrics);
                           }
                        });

                        metrics.forEach(grouping => {
                           const feature = geoJSON.features.find(feature => grouping.grouping_value.includes(feature.id));
                           feature.metrics = grouping.metrics;
                        });

                        console.log(metrics);

                        const colorInterpolation = metrics.map(metric => Math.round(metric.metrics[0].values[0]));
                        colorInterpolation.sort((a, b) => a - b);

                        // GeoJSON and color interpolations are stored, to get the values in case of successive selections of the same layer.
                        // Made to prevent from calling the web service again just to end up with the same data
                        if (state[filterBy] === undefined) {
                           state[filterBy] = { GeoJSON: geoJSON, "color interpolation": colorInterpolation };
                        }

                        const markers = L.markerClusterGroup({
                           disableClusteringAtZoom: 22
                        });

                        lastColorIndexes = {};

                        // Range object is used to get the range of gradient colors between two given colors
                        const range = { min: rgbToString(hexToRgb(myStyle.color)), max: rgbToString(hexToRgb("#9116fe")) };
                        const colors = interpolateColors(range.min, range.max, colorInterpolation.length).map(color => `rgb(${color.join(', ')})`);
                        console.log(colors);

                        L.geoJSON(geoJSON, {
                           style: (colorInterpolation.length > 1) ? feature => {
                              // Example: array.length = 12 => 100 / 12 = 8.33 => 8.33 / 100 => itemIndexFromSortedArray * 8.33 => Saturation value
                              const colorOffset = 100 / colorInterpolation.length / 100;

                              if (feature.metrics !== undefined) {
                                 let colorIndex = colorInterpolation.indexOf(Math.round(feature.metrics[0].values[0])) + 1;
                                 if (lastColorIndexes[Math.round(feature.metrics[0].values[0])]) {
                                    if (lastColorIndexes[Math.round(feature.metrics[0].values[0])] === colorIndex) {
                                       colorIndex++;
                                    }
                                 }

                                 lastColorIndexes[Math.round(feature.metrics[0].values[0])] = colorIndex;
                                 lastColorIndex = colorIndex;

                                 return { color: colors[colorIndex - 1], weight: myStyle.weight, opacity: myStyle.opacity };
                              } else {
                                 return { color: myStyle.color, weight: myStyle.weight, opacity: myStyle.opacity };
                              }
                           } : myStyle,
                           pointToLayer: (feature, latlng) => markers.addLayer(L.circleMarker(latlng, geojsonMarkerOptions)),
                           onEachFeature: onEachFeature
                        }).addTo(map);
                     })
                     .catch(error => {
                        alert("NO DATA!");
                        console.log(error);
                     });

                  return;
               }

               getFleetSize(token, zoneID, geoJSON)
                  .then(response => response.json())
                  .then(data => {
                     console.log(data);

                     // Filters out metrics data for a given polygon type. E.g.: size of the fleet for within given subdriction of the city. Id is used to identify polygon (uri: 123456789)
                     const metrics = data.groupings.filter(grouping => grouping.grouping === "geo_fence" && geoJSON.features.some(feature => grouping.grouping_value.includes(feature.id)));

                     // Create metrics field for each geo feature
                     metrics.forEach(grouping => {
                        const feature = geoJSON.features.find(feature => grouping.grouping_value.includes(feature.id));
                        feature.metrics = grouping.metrics;
                     });

                     const colorInterpolation = metrics.map(metric => Math.round(metric.metrics[0].values[0]));
                     colorInterpolation.sort((a, b) => a - b);
                     console.log(colorInterpolation);

                     if (state[filterBy] === undefined) {
                        state[filterBy] = { GeoJSON: geoJSON, "color interpolation": colorInterpolation };
                     }

                     const markers = L.markerClusterGroup({
                        disableClusteringAtZoom: 22
                     });

                     let lastColorIndexes = {};

                     // Range object is used to get the range of gradient colors between two given colors
                     const range = { min: rgbToString(hexToRgb(myStyle.color)), max: rgbToString(hexToRgb("#9116fe")) };
                     const colors = interpolateColors(range.min, range.max, colorInterpolation.length).map(color => `rgb(${color.join(', ')})`);
                     console.log(colors);

                     L.geoJSON(geoJSON, {
                        // If only one zone is diplayed on the map, then use one color code, otherwise darken/lighthen the color based on it's metrics value
                        style: (colorInterpolation.length > 1) ? feature => {
                           // Example: array.length = 12 => 100 / 12 = 8.33 => 8.33 / 100 => itemIndexFromSortedArray * 8.33 => Saturation value
                           const colorOffset = 100 / colorInterpolation.length / 100;

                           if (feature.metrics !== undefined) {
                              let colorIndex = colorInterpolation.indexOf(Math.round(feature.metrics[0].values[0])) + 1;
                              if (lastColorIndexes[Math.round(feature.metrics[0].values[0])]) {
                                 if (lastColorIndexes[Math.round(feature.metrics[0].values[0])] === colorIndex) {
                                    colorIndex++;
                                 }
                              }

                              lastColorIndexes[Math.round(feature.metrics[0].values[0])] = colorIndex;
                              lastColorIndex = colorIndex;

                              return { color: colors[colorIndex - 1], weight: myStyle.weight, opacity: myStyle.opacity };
                           } else {
                              return { color: myStyle.color, weight: myStyle.weight, opacity: myStyle.opacity };
                           }
                        } : myStyle,
                        pointToLayer: (feature, latlng) => markers.addLayer(L.circleMarker(latlng, geojsonMarkerOptions)),
                        onEachFeature: onEachFeature
                     }).addTo(map);
                  })
                  .catch(error => {
                     alert("NO DATA!");
                     console.log(error);
                  });
            }
         };


         // Retreiving fleet availability and fleet size related informations
         const getFleetSize = async (token, zoneID, geoFeatures) => {
            // let now = new Date();
            // // now.setHours(now.getHours() - 3);
            // now.setDate(now.getDate() - 1);
            // now = now.toISOString();

            // 1 second to ms: 1000
            // 1 minutes to ms: 60000
            // 1 hour to ms: 3600000
            // 1 day to ms: 86400000
            // 1 week to ms: 604800000
            let tzoffset = (new Date()).getTimezoneOffset() * 60000 + 86400000;         // offset in milliseconds (yesterday date)
            let now = (new Date(Date.now() - tzoffset)).toISOString();                 // .slice(0, -1);
            console.log("Retrieving data for the time: " + now);

            const body = {
               subfleet: {
                  realtime: false,
                  geo_fences: [
                     {
                        buffer_meters: 0,
                        // Loops through all the geo features, retreiving their id's. Id's are then used to create an array of objects containing 'uri' field,
                        // which are used to retrieve the fleet size for a given geo fence object -> uri. E.g.: fleet size for a given polygon of coordinates.
                        geo_features: geoFeatures.features.map(feature => ({ uri: "/geo_features/" + feature.id.toString() }))
                     }
                  ],
                  start_time: now
               },
               metric_types: [
                  "fleet_size"
               ],
               resolution: "day",
               aggregation_type: "average"
            };

            console.log(body);

            const options = {
               method: 'POST',
               headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
               body: JSON.stringify(body)
            };

            return await fetch(`${host}/zones/${zoneID}/metrics/`, options);
         };


         // Popup description for layers
         const onEachFeature = (feature, layer) => {
            let popupMessage = feature.name + "<br>";

            // If there are properties
            if (feature.properties && Object.keys(feature.properties).length > 0) {

               // Assign property value to a layer
               for (property in feature.properties) {
                  popupMessage += property + ": " + feature.properties[property] + "<br>";
               }
            }

            const fleetSize = (feature.metrics !== undefined) ? Math.round(feature.metrics[0].values[0]) : "no data";
            popupMessage += "Count: " + fleetSize;

            layer.bindPopup(popupMessage);
         }


         // Builds RGB string representing the color
         function rgbToString(rgb) {
            return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
         }


         // Converts given HEX color to RGB color. RGB color is later used to call interpolateColors function
         function hexToRgb(hex) {
            var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

            return result ? {
               r: parseInt(result[1], 16),
               g: parseInt(result[2], 16),
               b: parseInt(result[3], 16)
            } : null;
         }


         // Returns a single RGB color interpolation between given RGB color
         // based on the factor given; via https://codepen.io/njmcode/pen/axoyD?editors=0010
         function interpolateColor(color1, color2, factor) {
            if (arguments.length < 3) {
               factor = 0.5;
            }

            var result = color1.slice();
            for (var i = 0; i < 3; i++) {
               result[i] = Math.round(result[i] + factor * (color2[i] - color1[i]));
            }

            return result;
         };


         // Function to interpolate between two colors completely, returning an array
         function interpolateColors(color1, color2, steps) {
            var stepFactor = 1 / (steps - 1),
               interpolatedColorArray = [];

            color1 = color1.match(/\d+/g).map(Number);
            color2 = color2.match(/\d+/g).map(Number);

            for (var i = 0; i < steps; i++) {
               interpolatedColorArray.push(interpolateColor(color1, color2, stepFactor * i));
            }

            return interpolatedColorArray;
         }


         // Declare public functions or variable here. Accessible by other modules.
         var exports = {
            displayPopup: function () {
               return getCredentials();
            },

            displayMap: function () {
               accessToken = prompt("Please enter an access token");
               getToken()
                  .then(token => {
                     console.info(token);

                     getZoneID(token)
                        .then(zoneID => {
                           console.info(zoneID);

                           getGeoJSON(token, zoneID)
                              .then(details => {
                                 console.info(details);

                                 getGeoFeatureTags(token, zoneID)
                                    .then(tags => {
                                       console.info(tags);

                                       document.getElementById('tags').addEventListener('change', selectionHandler(token, zoneID, details));

                                       tags.forEach(tag => {
                                          const selectDiv = document.getElementById('tags');
                                          const option = document.createElement('option');
                                          option.value = tag;
                                          option.innerText = tag;
                                          selectDiv.appendChild(option);
                                       });

                                       const filterBy = tags[0];

                                       const geoJSON = {
                                          crs: epsg,
                                          type: "FeatureCollection",
                                          features: details["geo_features"].filter(feature => feature.tags.includes(filterBy)).map(({ geo_feature_id, geojson, properties }) => ({ type: "Feature", id: geo_feature_id, geometry: geojson, properties }))
                                       };

                                       // Load GeoJSON into leaflet map
                                       createMapFrom(geoJSON);

                                       // Setup subscription to listen for results of API calls and scan for widgets in a current tab
                                       setupSubscriptions();
                                       WidgetManager.refreshTabWidgetList();

                                       // GeoJSON ingestion to City
                                       importGeoJSON(geoJSON);
                                    })
                              })
                        })
                  })
                  .catch(error => console.log("Couldn't retrieve GeoJSON: " + error.message));
            }
         };

         return exports;
      }
   );
