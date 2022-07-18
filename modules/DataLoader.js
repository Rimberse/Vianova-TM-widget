define
    (
        "Modules/DataLoader",
        [
            'DS/PlatformAPI/PlatformAPI',
            'DS/i3DXCompassServices/i3DXCompassServices'
        ],
        function
            (
               PlatformAPI,
               i3DXCompassServices
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
            // Application's state, used to prevent from calling the web service twice
            const state = {};
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
                PlatformAPI.unsubscribe('xCity.reject');

                // subscribes to common city topics
                PlatformAPI.subscribe('xCity.resolve', resolve.bind(this)); // Good API result will be funneled to "resolve" function
                PlatformAPI.subscribe('xCity.reject', reject.bind(this)); // Bad API result will be funneled to "reject" function
            }

            // Imports GeoJSON to City
            const importGeoJSON = async geoJSON => {
                // this.poi = {
                //     "widgetID": widget.id,
                //     "geojson": this.test.geojson.ManyPoint,
                //     "layer": {
                //         "id": "poi_primitive_geojson"
                //     },
                //     "folder": {
                //         "id": 'test_folder',
                //         "name": 'Test Folder'
                //     },
                //     "render": {
                //         "anchor": true,
                //         "color": 'rgb(0,200,150)',
                //         "scale": [5,5,5],
                //         "shape": 'cube',
                //         "switchDistance": 500,
                //         "opacity": 0.3
                //     },
                //     "options": {
                //         "proxy": 'https://sgp-server2015x.uwglobe.com/widget/assets/php/urlProxy.php',
                //         "css": {
                //             "id": 'poi',
                //             "url": 'https://sgp-server2015x.uwglobe.com/widget/assets/css/poi.css?v=2'
                //         },
                //         "projection": {
                //             "from": 'WGS84',
                //             "preserveElevation": true
                //         }//,
                //         // "addTerrainHeight": true
                //     }
                // };

                // var _this = this;
                // this.PlatformAPI.publish('3DEXPERIENCity.Add3DPOI', this.poi);
                // this.PlatformAPI.subscribe('3DEXPERIENCity.Add3DPOIReturn', function(rs){
                //     console.log("got response");
                //     console.log('3DEXPERIENCity.Add3DPOIReturn', rs);
                //     _this.PlatformAPI.unsubscribe('3DEXPERIENCity.Add3DPOIReturn');
                // });

               console.log(geoJSON);

                // Input
                PlatformAPI.publish('xCity.addData', {
                    "messageId": "fb5c5587-ba4e-4db4-9dfd-7b54338dd448",
                    "publisher": "9MlIiKCA2IIyE5kHL4gO",
                    "data": {
                        "representation": {
                            "id": "vianova",
                            "name": "Vianova activity"
                        },
                        "geojson": geoJSON
                    },
                    "widgetId": [
                        "9MlIiKCA2IIyE5kHL31a"
                    ]
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

                                                    tags.forEach(tag => {
                                                        const selectDiv = document.getElementById('tags');
                                                        const option = document.createElement('option');
                                                        option.value = tag;
                                                        option.innerText = tag;
                                                        selectDiv.appendChild(option);
                                                    });

                                                    const filterBy = tags[2];

                                                    const geoJSON = {
                                                        crs: "EPSG:3414",
                                                        type: "FeatureCollection",
                                                        features: details["geo_features"].filter(feature => feature.tags.includes(filterBy)).map(({ geo_feature_id, geojson, properties }) => ({ type: "Feature", id: geo_feature_id, geometry: geojson, properties }))
                                                    };

                                                    createMapFrom(geoJSON);

                                                    // GeoJSON importation to City
                                                    setupSubscriptions();
                                                    const data = {
                                                        "crs":"EPSG:3414",
                                                        "type":"FeatureCollection",
                                                        "features":[
                                                           {
                                                              "type":"Feature",
                                                              "id":3914125765,
                                                              "geometry":{
                                                                 "type":"Polygon",
                                                                 "coordinates":[
                                                                    [
                                                                       [
                                                                          7.625602,
                                                                          47.568992
                                                                       ],
                                                                       [
                                                                          7.628252,
                                                                          47.566434
                                                                       ],
                                                                       [
                                                                          7.631349,
                                                                          47.567952
                                                                       ],
                                                                       [
                                                                          7.634149,
                                                                          47.56555
                                                                       ],
                                                                       [
                                                                          7.632909,
                                                                          47.562314
                                                                       ],
                                                                       [
                                                                          7.62864,
                                                                          47.562561
                                                                       ],
                                                                       [
                                                                          7.62066,
                                                                          47.560326
                                                                       ],
                                                                       [
                                                                          7.613624,
                                                                          47.558749
                                                                       ],
                                                                       [
                                                                          7.611709,
                                                                          47.5614
                                                                       ],
                                                                       [
                                                                          7.608599,
                                                                          47.565242
                                                                       ],
                                                                       [
                                                                          7.607873,
                                                                          47.56586
                                                                       ],
                                                                       [
                                                                          7.607587,
                                                                          47.565767
                                                                       ],
                                                                       [
                                                                          7.606093,
                                                                          47.567698
                                                                       ],
                                                                       [
                                                                          7.604549,
                                                                          47.569742
                                                                       ],
                                                                       [
                                                                          7.604661,
                                                                          47.569777
                                                                       ],
                                                                       [
                                                                          7.603556,
                                                                          47.571358
                                                                       ],
                                                                       [
                                                                          7.603149,
                                                                          47.572407
                                                                       ],
                                                                       [
                                                                          7.602694,
                                                                          47.573011
                                                                       ],
                                                                       [
                                                                          7.601603,
                                                                          47.574059
                                                                       ],
                                                                       [
                                                                          7.600919,
                                                                          47.574405
                                                                       ],
                                                                       [
                                                                          7.600658,
                                                                          47.574906
                                                                       ],
                                                                       [
                                                                          7.60104,
                                                                          47.575249
                                                                       ],
                                                                       [
                                                                          7.602701,
                                                                          47.576167
                                                                       ],
                                                                       [
                                                                          7.603044,
                                                                          47.577644
                                                                       ],
                                                                       [
                                                                          7.609418,
                                                                          47.578186
                                                                       ],
                                                                       [
                                                                          7.613211,
                                                                          47.578161
                                                                       ],
                                                                       [
                                                                          7.616715,
                                                                          47.577685
                                                                       ],
                                                                       [
                                                                          7.619142,
                                                                          47.576875
                                                                       ],
                                                                       [
                                                                          7.624553,
                                                                          47.579421
                                                                       ],
                                                                       [
                                                                          7.627023,
                                                                          47.577351
                                                                       ],
                                                                       [
                                                                          7.623389,
                                                                          47.575366
                                                                       ],
                                                                       [
                                                                          7.620802,
                                                                          47.573414
                                                                       ],
                                                                       [
                                                                          7.62197,
                                                                          47.570712
                                                                       ],
                                                                       [
                                                                          7.622691,
                                                                          47.56963
                                                                       ],
                                                                       [
                                                                          7.62335,
                                                                          47.568994
                                                                       ],
                                                                       [
                                                                          7.623926,
                                                                          47.568938
                                                                       ],
                                                                       [
                                                                          7.624974,
                                                                          47.569931
                                                                       ],
                                                                       [
                                                                          7.625734,
                                                                          47.569197
                                                                       ],
                                                                       [
                                                                          7.625503,
                                                                          47.569088
                                                                       ],
                                                                       [
                                                                          7.625602,
                                                                          47.568992
                                                                       ]
                                                                    ]
                                                                 ]
                                                              },
                                                              "properties":{
                                                                 
                                                              }
                                                           },
                                                           {
                                                              "type":"Feature",
                                                              "id":3914125764,
                                                              "geometry":{
                                                                 "type":"Polygon",
                                                                 "coordinates":[
                                                                    [
                                                                       [
                                                                          7.577579,
                                                                          47.564363
                                                                       ],
                                                                       [
                                                                          7.576142,
                                                                          47.563192
                                                                       ],
                                                                       [
                                                                          7.574188,
                                                                          47.561917
                                                                       ],
                                                                       [
                                                                          7.573915,
                                                                          47.561935
                                                                       ],
                                                                       [
                                                                          7.565291,
                                                                          47.566092
                                                                       ],
                                                                       [
                                                                          7.562102,
                                                                          47.567989
                                                                       ],
                                                                       [
                                                                          7.558548,
                                                                          47.570488
                                                                       ],
                                                                       [
                                                                          7.557026,
                                                                          47.572523
                                                                       ],
                                                                       [
                                                                          7.565438,
                                                                          47.57622
                                                                       ],
                                                                       [
                                                                          7.56649,
                                                                          47.577669
                                                                       ],
                                                                       [
                                                                          7.571615,
                                                                          47.577112
                                                                       ],
                                                                       [
                                                                          7.575254,
                                                                          47.57614
                                                                       ],
                                                                       [
                                                                          7.576403,
                                                                          47.576454
                                                                       ],
                                                                       [
                                                                          7.578858,
                                                                          47.576669
                                                                       ],
                                                                       [
                                                                          7.583163,
                                                                          47.575819
                                                                       ],
                                                                       [
                                                                          7.583728,
                                                                          47.573088
                                                                       ],
                                                                       [
                                                                          7.583595,
                                                                          47.571047
                                                                       ],
                                                                       [
                                                                          7.586474,
                                                                          47.571007
                                                                       ],
                                                                       [
                                                                          7.586138,
                                                                          47.569278
                                                                       ],
                                                                       [
                                                                          7.58333,
                                                                          47.569188
                                                                       ],
                                                                       [
                                                                          7.583391,
                                                                          47.567216
                                                                       ],
                                                                       [
                                                                          7.579122,
                                                                          47.565385
                                                                       ],
                                                                       [
                                                                          7.577579,
                                                                          47.564363
                                                                       ]
                                                                    ]
                                                                 ]
                                                              },
                                                              "properties":{
                                                                 
                                                              }
                                                           },
                                                           {
                                                              "type":"Feature",
                                                              "id":3914125766,
                                                              "geometry":{
                                                                 "type":"Polygon",
                                                                 "coordinates":[
                                                                    [
                                                                       [
                                                                          7.585961,
                                                                          47.576492
                                                                       ],
                                                                       [
                                                                          7.586453,
                                                                          47.573904
                                                                       ],
                                                                       [
                                                                          7.586552,
                                                                          47.572605
                                                                       ],
                                                                       [
                                                                          7.586427,
                                                                          47.570739
                                                                       ],
                                                                       [
                                                                          7.595112,
                                                                          47.570655
                                                                       ],
                                                                       [
                                                                          7.595107,
                                                                          47.571088
                                                                       ],
                                                                       [
                                                                          7.597422,
                                                                          47.571955
                                                                       ],
                                                                       [
                                                                          7.598015,
                                                                          47.572001
                                                                       ],
                                                                       [
                                                                          7.598416,
                                                                          47.573577
                                                                       ],
                                                                       [
                                                                          7.598134,
                                                                          47.574067
                                                                       ],
                                                                       [
                                                                          7.598257,
                                                                          47.57461
                                                                       ],
                                                                       [
                                                                          7.59732,
                                                                          47.5748
                                                                       ],
                                                                       [
                                                                          7.59664,
                                                                          47.575258
                                                                       ],
                                                                       [
                                                                          7.59549,
                                                                          47.577647
                                                                       ],
                                                                       [
                                                                          7.593955,
                                                                          47.580107
                                                                       ],
                                                                       [
                                                                          7.593011,
                                                                          47.581006
                                                                       ],
                                                                       [
                                                                          7.591825,
                                                                          47.581629
                                                                       ],
                                                                       [
                                                                          7.587016,
                                                                          47.582746
                                                                       ],
                                                                       [
                                                                          7.586963,
                                                                          47.582603
                                                                       ],
                                                                       [
                                                                          7.586718,
                                                                          47.58255
                                                                       ],
                                                                       [
                                                                          7.585966,
                                                                          47.580307
                                                                       ],
                                                                       [
                                                                          7.58583,
                                                                          47.58023
                                                                       ],
                                                                       [
                                                                          7.585877,
                                                                          47.579704
                                                                       ],
                                                                       [
                                                                          7.58567,
                                                                          47.578745
                                                                       ],
                                                                       [
                                                                          7.585789,
                                                                          47.578653
                                                                       ],
                                                                       [
                                                                          7.585961,
                                                                          47.576492
                                                                       ]
                                                                    ]
                                                                 ]
                                                              },
                                                              "properties":{
                                                                 
                                                              }
                                                           },
                                                           {
                                                              "type":"Feature",
                                                              "id":3914125767,
                                                              "geometry":{
                                                                 "type":"Polygon",
                                                                 "coordinates":[
                                                                    [
                                                                       [
                                                                          7.57543,
                                                                          47.544004
                                                                       ],
                                                                       [
                                                                          7.564685,
                                                                          47.545694
                                                                       ],
                                                                       [
                                                                          7.558812,
                                                                          47.544598
                                                                       ],
                                                                       [
                                                                          7.555888,
                                                                          47.544341
                                                                       ],
                                                                       [
                                                                          7.558759,
                                                                          47.552358
                                                                       ],
                                                                       [
                                                                          7.56125,
                                                                          47.551728
                                                                       ],
                                                                       [
                                                                          7.561325,
                                                                          47.551861
                                                                       ],
                                                                       [
                                                                          7.574111,
                                                                          47.553332
                                                                       ],
                                                                       [
                                                                          7.576697,
                                                                          47.553796
                                                                       ],
                                                                       [
                                                                          7.577801,
                                                                          47.552637
                                                                       ],
                                                                       [
                                                                          7.579466,
                                                                          47.551389
                                                                       ],
                                                                       [
                                                                          7.582769,
                                                                          47.549964
                                                                       ],
                                                                       [
                                                                          7.582653,
                                                                          47.549836
                                                                       ],
                                                                       [
                                                                          7.583279,
                                                                          47.549581
                                                                       ],
                                                                       [
                                                                          7.582418,
                                                                          47.548992
                                                                       ],
                                                                       [
                                                                          7.582922,
                                                                          47.5486
                                                                       ],
                                                                       [
                                                                          7.582753,
                                                                          47.548461
                                                                       ],
                                                                       [
                                                                          7.578884,
                                                                          47.546068
                                                                       ],
                                                                       [
                                                                          7.578654,
                                                                          47.545628
                                                                       ],
                                                                       [
                                                                          7.578283,
                                                                          47.543766
                                                                       ],
                                                                       [
                                                                          7.57543,
                                                                          47.544004
                                                                       ]
                                                                    ]
                                                                 ]
                                                              },
                                                              "properties":{
                                                                 
                                                              }
                                                           },
                                                           {
                                                              "type":"Feature",
                                                              "id":3914125777,
                                                              "geometry":{
                                                                 "type":"Polygon",
                                                                 "coordinates":[
                                                                    [
                                                                       [
                                                                          7.604549,
                                                                          47.569742
                                                                       ],
                                                                       [
                                                                          7.607587,
                                                                          47.565767
                                                                       ],
                                                                       [
                                                                          7.600131,
                                                                          47.562134
                                                                       ],
                                                                       [
                                                                          7.597699,
                                                                          47.566241
                                                                       ],
                                                                       [
                                                                          7.597546,
                                                                          47.568426
                                                                       ],
                                                                       [
                                                                          7.597663,
                                                                          47.570441
                                                                       ],
                                                                       [
                                                                          7.598416,
                                                                          47.573577
                                                                       ],
                                                                       [
                                                                          7.598134,
                                                                          47.574067
                                                                       ],
                                                                       [
                                                                          7.598257,
                                                                          47.57461
                                                                       ],
                                                                       [
                                                                          7.600779,
                                                                          47.574711
                                                                       ],
                                                                       [
                                                                          7.600919,
                                                                          47.574405
                                                                       ],
                                                                       [
                                                                          7.601704,
                                                                          47.573975
                                                                       ],
                                                                       [
                                                                          7.603038,
                                                                          47.572576
                                                                       ],
                                                                       [
                                                                          7.603556,
                                                                          47.571358
                                                                       ],
                                                                       [
                                                                          7.604661,
                                                                          47.569777
                                                                       ],
                                                                       [
                                                                          7.604549,
                                                                          47.569742
                                                                       ]
                                                                    ]
                                                                 ]
                                                              },
                                                              "properties":{
                                                                 
                                                              }
                                                           },
                                                           {
                                                              "type":"Feature",
                                                              "id":3914125761,
                                                              "geometry":{
                                                                 "type":"Polygon",
                                                                 "coordinates":[
                                                                    [
                                                                       [
                                                                          7.594609,
                                                                          47.56196
                                                                       ],
                                                                       [
                                                                          7.596587,
                                                                          47.560078
                                                                       ],
                                                                       [
                                                                          7.59812,
                                                                          47.559335
                                                                       ],
                                                                       [
                                                                          7.598114,
                                                                          47.558894
                                                                       ],
                                                                       [
                                                                          7.596712,
                                                                          47.557207
                                                                       ],
                                                                       [
                                                                          7.59461,
                                                                          47.557998
                                                                       ],
                                                                       [
                                                                          7.591426,
                                                                          47.559855
                                                                       ],
                                                                       [
                                                                          7.589166,
                                                                          47.559381
                                                                       ],
                                                                       [
                                                                          7.588238,
                                                                          47.560102
                                                                       ],
                                                                       [
                                                                          7.589809,
                                                                          47.561359
                                                                       ],
                                                                       [
                                                                          7.588318,
                                                                          47.563044
                                                                       ],
                                                                       [
                                                                          7.591441,
                                                                          47.564093
                                                                       ],
                                                                       [
                                                                          7.59197,
                                                                          47.563034
                                                                       ],
                                                                       [
                                                                          7.59346,
                                                                          47.563505
                                                                       ],
                                                                       [
                                                                          7.594609,
                                                                          47.56196
                                                                       ]
                                                                    ]
                                                                 ]
                                                              },
                                                              "properties":{
                                                                 
                                                              }
                                                           },
                                                           {
                                                              "type":"Feature",
                                                              "id":3914125762,
                                                              "geometry":{
                                                                 "type":"Polygon",
                                                                 "coordinates":[
                                                                    [
                                                                       [
                                                                          7.60531,
                                                                          47.557141
                                                                       ],
                                                                       [
                                                                          7.600718,
                                                                          47.556757
                                                                       ],
                                                                       [
                                                                          7.598837,
                                                                          47.556839
                                                                       ],
                                                                       [
                                                                          7.59684,
                                                                          47.557162
                                                                       ],
                                                                       [
                                                                          7.596712,
                                                                          47.557207
                                                                       ],
                                                                       [
                                                                          7.598114,
                                                                          47.558894
                                                                       ],
                                                                       [
                                                                          7.59812,
                                                                          47.559335
                                                                       ],
                                                                       [
                                                                          7.596842,
                                                                          47.559939
                                                                       ],
                                                                       [
                                                                          7.600313,
                                                                          47.562234
                                                                       ],
                                                                       [
                                                                          7.603741,
                                                                          47.563806
                                                                       ],
                                                                       [
                                                                          7.606327,
                                                                          47.565228
                                                                       ],
                                                                       [
                                                                          7.607873,
                                                                          47.56586
                                                                       ],
                                                                       [
                                                                          7.608473,
                                                                          47.565386
                                                                       ],
                                                                       [
                                                                          7.609545,
                                                                          47.564083
                                                                       ],
                                                                       [
                                                                          7.613624,
                                                                          47.558749
                                                                       ],
                                                                       [
                                                                          7.60531,
                                                                          47.557141
                                                                       ]
                                                                    ]
                                                                 ]
                                                              },
                                                              "properties":{
                                                                 
                                                              }
                                                           },
                                                           {
                                                              "type":"Feature",
                                                              "id":3914125763,
                                                              "geometry":{
                                                                 "type":"Polygon",
                                                                 "coordinates":[
                                                                    [
                                                                       [
                                                                          7.58691,
                                                                          47.551354
                                                                       ],
                                                                       [
                                                                          7.588262,
                                                                          47.549155
                                                                       ],
                                                                       [
                                                                          7.587737,
                                                                          47.548804
                                                                       ],
                                                                       [
                                                                          7.585455,
                                                                          47.548978
                                                                       ],
                                                                       [
                                                                          7.584145,
                                                                          47.549429
                                                                       ],
                                                                       [
                                                                          7.583951,
                                                                          47.549295
                                                                       ],
                                                                       [
                                                                          7.582653,
                                                                          47.549836
                                                                       ],
                                                                       [
                                                                          7.582769,
                                                                          47.549964
                                                                       ],
                                                                       [
                                                                          7.579854,
                                                                          47.551155
                                                                       ],
                                                                       [
                                                                          7.578134,
                                                                          47.552355
                                                                       ],
                                                                       [
                                                                          7.576845,
                                                                          47.553604
                                                                       ],
                                                                       [
                                                                          7.575855,
                                                                          47.555202
                                                                       ],
                                                                       [
                                                                          7.573915,
                                                                          47.561935
                                                                       ],
                                                                       [
                                                                          7.574188,
                                                                          47.561917
                                                                       ],
                                                                       [
                                                                          7.576142,
                                                                          47.563192
                                                                       ],
                                                                       [
                                                                          7.578259,
                                                                          47.564897
                                                                       ],
                                                                       [
                                                                          7.581749,
                                                                          47.566542
                                                                       ],
                                                                       [
                                                                          7.582881,
                                                                          47.56551
                                                                       ],
                                                                       [
                                                                          7.58185,
                                                                          47.565045
                                                                       ],
                                                                       [
                                                                          7.582632,
                                                                          47.564402
                                                                       ],
                                                                       [
                                                                          7.581993,
                                                                          47.564034
                                                                       ],
                                                                       [
                                                                          7.582689,
                                                                          47.563483
                                                                       ],
                                                                       [
                                                                          7.580964,
                                                                          47.562097
                                                                       ],
                                                                       [
                                                                          7.580052,
                                                                          47.560178
                                                                       ],
                                                                       [
                                                                          7.580693,
                                                                          47.559451
                                                                       ],
                                                                       [
                                                                          7.581022,
                                                                          47.557998
                                                                       ],
                                                                       [
                                                                          7.581086,
                                                                          47.55663
                                                                       ],
                                                                       [
                                                                          7.581497,
                                                                          47.556289
                                                                       ],
                                                                       [
                                                                          7.584764,
                                                                          47.555475
                                                                       ],
                                                                       [
                                                                          7.586205,
                                                                          47.553058
                                                                       ],
                                                                       [
                                                                          7.585535,
                                                                          47.552156
                                                                       ],
                                                                       [
                                                                          7.586563,
                                                                          47.551831
                                                                       ],
                                                                       [
                                                                          7.58691,
                                                                          47.551354
                                                                       ]
                                                                    ]
                                                                 ]
                                                              },
                                                              "properties":{
                                                                 
                                                              }
                                                           },
                                                           {
                                                              "type":"Feature",
                                                              "id":3914125768,
                                                              "geometry":{
                                                                 "type":"Polygon",
                                                                 "coordinates":[
                                                                    [
                                                                       [
                                                                          7.595452,
                                                                          47.551346
                                                                       ],
                                                                       [
                                                                          7.595068,
                                                                          47.551273
                                                                       ],
                                                                       [
                                                                          7.594312,
                                                                          47.550823
                                                                       ],
                                                                       [
                                                                          7.591187,
                                                                          47.548679
                                                                       ],
                                                                       [
                                                                          7.589308,
                                                                          47.549375
                                                                       ],
                                                                       [
                                                                          7.588654,
                                                                          47.549399
                                                                       ],
                                                                       [
                                                                          7.588262,
                                                                          47.549155
                                                                       ],
                                                                       [
                                                                          7.586671,
                                                                          47.551746
                                                                       ],
                                                                       [
                                                                          7.585535,
                                                                          47.552156
                                                                       ],
                                                                       [
                                                                          7.586205,
                                                                          47.553058
                                                                       ],
                                                                       [
                                                                          7.584764,
                                                                          47.555475
                                                                       ],
                                                                       [
                                                                          7.581507,
                                                                          47.556286
                                                                       ],
                                                                       [
                                                                          7.581175,
                                                                          47.556485
                                                                       ],
                                                                       [
                                                                          7.581004,
                                                                          47.558122
                                                                       ],
                                                                       [
                                                                          7.580693,
                                                                          47.559451
                                                                       ],
                                                                       [
                                                                          7.580052,
                                                                          47.560178
                                                                       ],
                                                                       [
                                                                          7.580964,
                                                                          47.562097
                                                                       ],
                                                                       [
                                                                          7.582689,
                                                                          47.563483
                                                                       ],
                                                                       [
                                                                          7.581993,
                                                                          47.564034
                                                                       ],
                                                                       [
                                                                          7.582632,
                                                                          47.564402
                                                                       ],
                                                                       [
                                                                          7.58185,
                                                                          47.565045
                                                                       ],
                                                                       [
                                                                          7.582881,
                                                                          47.56551
                                                                       ],
                                                                       [
                                                                          7.581749,
                                                                          47.566542
                                                                       ],
                                                                       [
                                                                          7.583391,
                                                                          47.567216
                                                                       ],
                                                                       [
                                                                          7.583918,
                                                                          47.565251
                                                                       ],
                                                                       [
                                                                          7.584092,
                                                                          47.565289
                                                                       ],
                                                                       [
                                                                          7.584316,
                                                                          47.564819
                                                                       ],
                                                                       [
                                                                          7.584211,
                                                                          47.564702
                                                                       ],
                                                                       [
                                                                          7.585228,
                                                                          47.563352
                                                                       ],
                                                                       [
                                                                          7.586624,
                                                                          47.561837
                                                                       ],
                                                                       [
                                                                          7.586481,
                                                                          47.561629
                                                                       ],
                                                                       [
                                                                          7.58623,
                                                                          47.561602
                                                                       ],
                                                                       [
                                                                          7.585696,
                                                                          47.561226
                                                                       ],
                                                                       [
                                                                          7.584742,
                                                                          47.559971
                                                                       ],
                                                                       [
                                                                          7.58447,
                                                                          47.559297
                                                                       ],
                                                                       [
                                                                          7.584302,
                                                                          47.55761
                                                                       ],
                                                                       [
                                                                          7.584023,
                                                                          47.55673
                                                                       ],
                                                                       [
                                                                          7.587097,
                                                                          47.555483
                                                                       ],
                                                                       [
                                                                          7.587853,
                                                                          47.554341
                                                                       ],
                                                                       [
                                                                          7.592077,
                                                                          47.553707
                                                                       ],
                                                                       [
                                                                          7.592317,
                                                                          47.553926
                                                                       ],
                                                                       [
                                                                          7.594529,
                                                                          47.554619
                                                                       ],
                                                                       [
                                                                          7.59552,
                                                                          47.555758
                                                                       ],
                                                                       [
                                                                          7.595184,
                                                                          47.555893
                                                                       ],
                                                                       [
                                                                          7.59514,
                                                                          47.557754
                                                                       ],
                                                                       [
                                                                          7.597264,
                                                                          47.557032
                                                                       ],
                                                                       [
                                                                          7.59716,
                                                                          47.555373
                                                                       ],
                                                                       [
                                                                          7.599338,
                                                                          47.555163
                                                                       ],
                                                                       [
                                                                          7.603967,
                                                                          47.555339
                                                                       ],
                                                                       [
                                                                          7.604334,
                                                                          47.553745
                                                                       ],
                                                                       [
                                                                          7.603717,
                                                                          47.553689
                                                                       ],
                                                                       [
                                                                          7.603353,
                                                                          47.552727
                                                                       ],
                                                                       [
                                                                          7.602601,
                                                                          47.552716
                                                                       ],
                                                                       [
                                                                          7.595452,
                                                                          47.551346
                                                                       ]
                                                                    ]
                                                                 ]
                                                              },
                                                              "properties":{
                                                                 
                                                              }
                                                           },
                                                           {
                                                              "type":"Feature",
                                                              "id":3914125769,
                                                              "geometry":{
                                                                 "type":"Polygon",
                                                                 "coordinates":[
                                                                    [
                                                                       [
                                                                          7.672646,
                                                                          47.585045
                                                                       ],
                                                                       [
                                                                          7.674944,
                                                                          47.584239
                                                                       ],
                                                                       [
                                                                          7.680861,
                                                                          47.582689
                                                                       ],
                                                                       [
                                                                          7.681365,
                                                                          47.581
                                                                       ],
                                                                       [
                                                                          7.68082,
                                                                          47.581132
                                                                       ],
                                                                       [
                                                                          7.678677,
                                                                          47.580148
                                                                       ],
                                                                       [
                                                                          7.678508,
                                                                          47.579363
                                                                       ],
                                                                       [
                                                                          7.677733,
                                                                          47.578126
                                                                       ],
                                                                       [
                                                                          7.677321,
                                                                          47.575965
                                                                       ],
                                                                       [
                                                                          7.677626,
                                                                          47.574559
                                                                       ],
                                                                       [
                                                                          7.677348,
                                                                          47.574349
                                                                       ],
                                                                       [
                                                                          7.676766,
                                                                          47.574319
                                                                       ],
                                                                       [
                                                                          7.676352,
                                                                          47.573979
                                                                       ],
                                                                       [
                                                                          7.67578,
                                                                          47.573802
                                                                       ],
                                                                       [
                                                                          7.674863,
                                                                          47.573989
                                                                       ],
                                                                       [
                                                                          7.672744,
                                                                          47.574069
                                                                       ],
                                                                       [
                                                                          7.671691,
                                                                          47.573713
                                                                       ],
                                                                       [
                                                                          7.670176,
                                                                          47.57359
                                                                       ],
                                                                       [
                                                                          7.66681,
                                                                          47.574476
                                                                       ],
                                                                       [
                                                                          7.666823,
                                                                          47.574747
                                                                       ],
                                                                       [
                                                                          7.666307,
                                                                          47.575048
                                                                       ],
                                                                       [
                                                                          7.665236,
                                                                          47.575078
                                                                       ],
                                                                       [
                                                                          7.664923,
                                                                          47.575575
                                                                       ],
                                                                       [
                                                                          7.662905,
                                                                          47.575139
                                                                       ],
                                                                       [
                                                                          7.662377,
                                                                          47.574729
                                                                       ],
                                                                       [
                                                                          7.66194,
                                                                          47.574091
                                                                       ],
                                                                       [
                                                                          7.661541,
                                                                          47.573895
                                                                       ],
                                                                       [
                                                                          7.662419,
                                                                          47.572809
                                                                       ],
                                                                       [
                                                                          7.661453,
                                                                          47.572416
                                                                       ],
                                                                       [
                                                                          7.661875,
                                                                          47.571979
                                                                       ],
                                                                       [
                                                                          7.660629,
                                                                          47.571186
                                                                       ],
                                                                       [
                                                                          7.660224,
                                                                          47.571398
                                                                       ],
                                                                       [
                                                                          7.658645,
                                                                          47.569256
                                                                       ],
                                                                       [
                                                                          7.658537,
                                                                          47.568852
                                                                       ],
                                                                       [
                                                                          7.6574,
                                                                          47.567687
                                                                       ],
                                                                       [
                                                                          7.656485,
                                                                          47.565755
                                                                       ],
                                                                       [
                                                                          7.653702,
                                                                          47.562997
                                                                       ],
                                                                       [
                                                                          7.652371,
                                                                          47.562116
                                                                       ],
                                                                       [
                                                                          7.652651,
                                                                          47.561782
                                                                       ],
                                                                       [
                                                                          7.648284,
                                                                          47.559936
                                                                       ],
                                                                       [
                                                                          7.644058,
                                                                          47.56129
                                                                       ],
                                                                       [
                                                                          7.641267,
                                                                          47.56127
                                                                       ],
                                                                       [
                                                                          7.638338,
                                                                          47.563232
                                                                       ],
                                                                       [
                                                                          7.636127,
                                                                          47.563923
                                                                       ],
                                                                       [
                                                                          7.6346,
                                                                          47.56202
                                                                       ],
                                                                       [
                                                                          7.632909,
                                                                          47.562314
                                                                       ],
                                                                       [
                                                                          7.634149,
                                                                          47.56555
                                                                       ],
                                                                       [
                                                                          7.631349,
                                                                          47.567952
                                                                       ],
                                                                       [
                                                                          7.628252,
                                                                          47.566434
                                                                       ],
                                                                       [
                                                                          7.625503,
                                                                          47.569088
                                                                       ],
                                                                       [
                                                                          7.625734,
                                                                          47.569197
                                                                       ],
                                                                       [
                                                                          7.624974,
                                                                          47.569931
                                                                       ],
                                                                       [
                                                                          7.623953,
                                                                          47.568954
                                                                       ],
                                                                       [
                                                                          7.623414,
                                                                          47.568946
                                                                       ],
                                                                       [
                                                                          7.622691,
                                                                          47.56963
                                                                       ],
                                                                       [
                                                                          7.62197,
                                                                          47.570712
                                                                       ],
                                                                       [
                                                                          7.620802,
                                                                          47.573414
                                                                       ],
                                                                       [
                                                                          7.623389,
                                                                          47.575366
                                                                       ],
                                                                       [
                                                                          7.627023,
                                                                          47.577351
                                                                       ],
                                                                       [
                                                                          7.624553,
                                                                          47.579421
                                                                       ],
                                                                       [
                                                                          7.628029,
                                                                          47.58137
                                                                       ],
                                                                       [
                                                                          7.63411,
                                                                          47.585863
                                                                       ],
                                                                       [
                                                                          7.636444,
                                                                          47.588377
                                                                       ],
                                                                       [
                                                                          7.639638,
                                                                          47.59037
                                                                       ],
                                                                       [
                                                                          7.643248,
                                                                          47.591346
                                                                       ],
                                                                       [
                                                                          7.641865,
                                                                          47.592913
                                                                       ],
                                                                       [
                                                                          7.641791,
                                                                          47.594197
                                                                       ],
                                                                       [
                                                                          7.643054,
                                                                          47.595051
                                                                       ],
                                                                       [
                                                                          7.644413,
                                                                          47.595746
                                                                       ],
                                                                       [
                                                                          7.645677,
                                                                          47.596961
                                                                       ],
                                                                       [
                                                                          7.651064,
                                                                          47.595722
                                                                       ],
                                                                       [
                                                                          7.655072,
                                                                          47.595401
                                                                       ],
                                                                       [
                                                                          7.661698,
                                                                          47.593708
                                                                       ],
                                                                       [
                                                                          7.664628,
                                                                          47.592671
                                                                       ],
                                                                       [
                                                                          7.667338,
                                                                          47.591951
                                                                       ],
                                                                       [
                                                                          7.675179,
                                                                          47.591988
                                                                       ],
                                                                       [
                                                                          7.675507,
                                                                          47.59305
                                                                       ],
                                                                       [
                                                                          7.676791,
                                                                          47.594319
                                                                       ],
                                                                       [
                                                                          7.678072,
                                                                          47.595361
                                                                       ],
                                                                       [
                                                                          7.679726,
                                                                          47.596365
                                                                       ],
                                                                       [
                                                                          7.680667,
                                                                          47.597198
                                                                       ],
                                                                       [
                                                                          7.68156,
                                                                          47.597339
                                                                       ],
                                                                       [
                                                                          7.683018,
                                                                          47.598499
                                                                       ],
                                                                       [
                                                                          7.684828,
                                                                          47.598773
                                                                       ],
                                                                       [
                                                                          7.687993,
                                                                          47.598612
                                                                       ],
                                                                       [
                                                                          7.689323,
                                                                          47.598847
                                                                       ],
                                                                       [
                                                                          7.691646,
                                                                          47.599591
                                                                       ],
                                                                       [
                                                                          7.693335,
                                                                          47.600918
                                                                       ],
                                                                       [
                                                                          7.693802,
                                                                          47.600775
                                                                       ],
                                                                       [
                                                                          7.693046,
                                                                          47.599492
                                                                       ],
                                                                       [
                                                                          7.690163,
                                                                          47.597575
                                                                       ],
                                                                       [
                                                                          7.684725,
                                                                          47.596642
                                                                       ],
                                                                       [
                                                                          7.683654,
                                                                          47.596027
                                                                       ],
                                                                       [
                                                                          7.681988,
                                                                          47.594267
                                                                       ],
                                                                       [
                                                                          7.679589,
                                                                          47.592253
                                                                       ],
                                                                       [
                                                                          7.677388,
                                                                          47.591368
                                                                       ],
                                                                       [
                                                                          7.67175,
                                                                          47.587276
                                                                       ],
                                                                       [
                                                                          7.672077,
                                                                          47.585245
                                                                       ],
                                                                       [
                                                                          7.672646,
                                                                          47.585045
                                                                       ]
                                                                    ]
                                                                 ]
                                                              },
                                                              "properties":{
                                                                 
                                                              }
                                                           },
                                                           {
                                                              "type":"Feature",
                                                              "id":3914125770,
                                                              "geometry":{
                                                                 "type":"Polygon",
                                                                 "coordinates":[
                                                                    [
                                                                       [
                                                                          7.61658,
                                                                          47.54431
                                                                       ],
                                                                       [
                                                                          7.622493,
                                                                          47.542376
                                                                       ],
                                                                       [
                                                                          7.622311,
                                                                          47.539778
                                                                       ],
                                                                       [
                                                                          7.619491,
                                                                          47.540348
                                                                       ],
                                                                       [
                                                                          7.618184,
                                                                          47.540807
                                                                       ],
                                                                       [
                                                                          7.616889,
                                                                          47.54008
                                                                       ],
                                                                       [
                                                                          7.613739,
                                                                          47.539228
                                                                       ],
                                                                       [
                                                                          7.61306,
                                                                          47.538546
                                                                       ],
                                                                       [
                                                                          7.612697,
                                                                          47.536995
                                                                       ],
                                                                       [
                                                                          7.611848,
                                                                          47.53658
                                                                       ],
                                                                       [
                                                                          7.611822,
                                                                          47.53643
                                                                       ],
                                                                       [
                                                                          7.611035,
                                                                          47.535964
                                                                       ],
                                                                       [
                                                                          7.611386,
                                                                          47.53545
                                                                       ],
                                                                       [
                                                                          7.610492,
                                                                          47.535218
                                                                       ],
                                                                       [
                                                                          7.610229,
                                                                          47.535635
                                                                       ],
                                                                       [
                                                                          7.60919,
                                                                          47.53502
                                                                       ],
                                                                       [
                                                                          7.606016,
                                                                          47.530976
                                                                       ],
                                                                       [
                                                                          7.60604,
                                                                          47.530782
                                                                       ],
                                                                       [
                                                                          7.60565,
                                                                          47.530745
                                                                       ],
                                                                       [
                                                                          7.605582,
                                                                          47.530424
                                                                       ],
                                                                       [
                                                                          7.604449,
                                                                          47.53648
                                                                       ],
                                                                       [
                                                                          7.601996,
                                                                          47.54193
                                                                       ],
                                                                       [
                                                                          7.598977,
                                                                          47.543425
                                                                       ],
                                                                       [
                                                                          7.599164,
                                                                          47.544379
                                                                       ],
                                                                       [
                                                                          7.597378,
                                                                          47.544955
                                                                       ],
                                                                       [
                                                                          7.594765,
                                                                          47.545548
                                                                       ],
                                                                       [
                                                                          7.593356,
                                                                          47.546173
                                                                       ],
                                                                       [
                                                                          7.59395,
                                                                          47.546946
                                                                       ],
                                                                       [
                                                                          7.59281,
                                                                          47.547833
                                                                       ],
                                                                       [
                                                                          7.592102,
                                                                          47.547005
                                                                       ],
                                                                       [
                                                                          7.591926,
                                                                          47.546984
                                                                       ],
                                                                       [
                                                                          7.58729,
                                                                          47.548768
                                                                       ],
                                                                       [
                                                                          7.587737,
                                                                          47.548804
                                                                       ],
                                                                       [
                                                                          7.588534,
                                                                          47.549347
                                                                       ],
                                                                       [
                                                                          7.5889,
                                                                          47.549421
                                                                       ],
                                                                       [
                                                                          7.589848,
                                                                          47.549235
                                                                       ],
                                                                       [
                                                                          7.591187,
                                                                          47.548679
                                                                       ],
                                                                       [
                                                                          7.595068,
                                                                          47.551273
                                                                       ],
                                                                       [
                                                                          7.602601,
                                                                          47.552716
                                                                       ],
                                                                       [
                                                                          7.603353,
                                                                          47.552727
                                                                       ],
                                                                       [
                                                                          7.603717,
                                                                          47.553689
                                                                       ],
                                                                       [
                                                                          7.606757,
                                                                          47.553684
                                                                       ],
                                                                       [
                                                                          7.609409,
                                                                          47.554145
                                                                       ],
                                                                       [
                                                                          7.609642,
                                                                          47.553821
                                                                       ],
                                                                       [
                                                                          7.609815,
                                                                          47.553808
                                                                       ],
                                                                       [
                                                                          7.611338,
                                                                          47.55373
                                                                       ],
                                                                       [
                                                                          7.613675,
                                                                          47.55384
                                                                       ],
                                                                       [
                                                                          7.61418,
                                                                          47.553597
                                                                       ],
                                                                       [
                                                                          7.614852,
                                                                          47.552577
                                                                       ],
                                                                       [
                                                                          7.615343,
                                                                          47.552296
                                                                       ],
                                                                       [
                                                                          7.615806,
                                                                          47.551733
                                                                       ],
                                                                       [
                                                                          7.616534,
                                                                          47.551195
                                                                       ],
                                                                       [
                                                                          7.618521,
                                                                          47.550521
                                                                       ],
                                                                       [
                                                                          7.619997,
                                                                          47.550333
                                                                       ],
                                                                       [
                                                                          7.620439,
                                                                          47.550032
                                                                       ],
                                                                       [
                                                                          7.620311,
                                                                          47.549566
                                                                       ],
                                                                       [
                                                                          7.619767,
                                                                          47.549104
                                                                       ],
                                                                       [
                                                                          7.619766,
                                                                          47.548525
                                                                       ],
                                                                       [
                                                                          7.619214,
                                                                          47.547507
                                                                       ],
                                                                       [
                                                                          7.619763,
                                                                          47.544864
                                                                       ],
                                                                       [
                                                                          7.618948,
                                                                          47.544843
                                                                       ],
                                                                       [
                                                                          7.618909,
                                                                          47.545085
                                                                       ],
                                                                       [
                                                                          7.616591,
                                                                          47.54509
                                                                       ],
                                                                       [
                                                                          7.61658,
                                                                          47.54431
                                                                       ]
                                                                    ]
                                                                 ]
                                                              },
                                                              "properties":{
                                                                 
                                                              }
                                                           },
                                                           {
                                                              "type":"Feature",
                                                              "id":3914125771,
                                                              "geometry":{
                                                                 "type":"Polygon",
                                                                 "coordinates":[
                                                                    [
                                                                       [
                                                                          7.675586,
                                                                          47.56583
                                                                       ],
                                                                       [
                                                                          7.675153,
                                                                          47.565427
                                                                       ],
                                                                       [
                                                                          7.677288,
                                                                          47.564938
                                                                       ],
                                                                       [
                                                                          7.677325,
                                                                          47.56375
                                                                       ],
                                                                       [
                                                                          7.675624,
                                                                          47.563486
                                                                       ],
                                                                       [
                                                                          7.674462,
                                                                          47.563461
                                                                       ],
                                                                       [
                                                                          7.672457,
                                                                          47.56373
                                                                       ],
                                                                       [
                                                                          7.672368,
                                                                          47.565445
                                                                       ],
                                                                       [
                                                                          7.670227,
                                                                          47.565837
                                                                       ],
                                                                       [
                                                                          7.665558,
                                                                          47.565065
                                                                       ],
                                                                       [
                                                                          7.664235,
                                                                          47.565404
                                                                       ],
                                                                       [
                                                                          7.65876,
                                                                          47.564482
                                                                       ],
                                                                       [
                                                                          7.656764,
                                                                          47.563134
                                                                       ],
                                                                       [
                                                                          7.656164,
                                                                          47.562283
                                                                       ],
                                                                       [
                                                                          7.654544,
                                                                          47.562372
                                                                       ],
                                                                       [
                                                                          7.652651,
                                                                          47.561782
                                                                       ],
                                                                       [
                                                                          7.652371,
                                                                          47.562116
                                                                       ],
                                                                       [
                                                                          7.653702,
                                                                          47.562997
                                                                       ],
                                                                       [
                                                                          7.656485,
                                                                          47.565755
                                                                       ],
                                                                       [
                                                                          7.6574,
                                                                          47.567687
                                                                       ],
                                                                       [
                                                                          7.658537,
                                                                          47.568852
                                                                       ],
                                                                       [
                                                                          7.658645,
                                                                          47.569256
                                                                       ],
                                                                       [
                                                                          7.660224,
                                                                          47.571398
                                                                       ],
                                                                       [
                                                                          7.660629,
                                                                          47.571186
                                                                       ],
                                                                       [
                                                                          7.661875,
                                                                          47.571979
                                                                       ],
                                                                       [
                                                                          7.661453,
                                                                          47.572416
                                                                       ],
                                                                       [
                                                                          7.662419,
                                                                          47.572809
                                                                       ],
                                                                       [
                                                                          7.661541,
                                                                          47.573895
                                                                       ],
                                                                       [
                                                                          7.66194,
                                                                          47.574091
                                                                       ],
                                                                       [
                                                                          7.662377,
                                                                          47.574729
                                                                       ],
                                                                       [
                                                                          7.662905,
                                                                          47.575139
                                                                       ],
                                                                       [
                                                                          7.664923,
                                                                          47.575575
                                                                       ],
                                                                       [
                                                                          7.665236,
                                                                          47.575078
                                                                       ],
                                                                       [
                                                                          7.666307,
                                                                          47.575048
                                                                       ],
                                                                       [
                                                                          7.666823,
                                                                          47.574747
                                                                       ],
                                                                       [
                                                                          7.66681,
                                                                          47.574476
                                                                       ],
                                                                       [
                                                                          7.670176,
                                                                          47.57359
                                                                       ],
                                                                       [
                                                                          7.671691,
                                                                          47.573713
                                                                       ],
                                                                       [
                                                                          7.672744,
                                                                          47.574069
                                                                       ],
                                                                       [
                                                                          7.674863,
                                                                          47.573989
                                                                       ],
                                                                       [
                                                                          7.67578,
                                                                          47.573802
                                                                       ],
                                                                       [
                                                                          7.676352,
                                                                          47.573979
                                                                       ],
                                                                       [
                                                                          7.676732,
                                                                          47.574305
                                                                       ],
                                                                       [
                                                                          7.677348,
                                                                          47.574349
                                                                       ],
                                                                       [
                                                                          7.677626,
                                                                          47.574559
                                                                       ],
                                                                       [
                                                                          7.677321,
                                                                          47.575965
                                                                       ],
                                                                       [
                                                                          7.677358,
                                                                          47.576499
                                                                       ],
                                                                       [
                                                                          7.677733,
                                                                          47.578126
                                                                       ],
                                                                       [
                                                                          7.678508,
                                                                          47.579363
                                                                       ],
                                                                       [
                                                                          7.678677,
                                                                          47.580148
                                                                       ],
                                                                       [
                                                                          7.68082,
                                                                          47.581132
                                                                       ],
                                                                       [
                                                                          7.681365,
                                                                          47.581
                                                                       ],
                                                                       [
                                                                          7.681908,
                                                                          47.577461
                                                                       ],
                                                                       [
                                                                          7.683862,
                                                                          47.576662
                                                                       ],
                                                                       [
                                                                          7.683679,
                                                                          47.57391
                                                                       ],
                                                                       [
                                                                          7.684314,
                                                                          47.5738
                                                                       ],
                                                                       [
                                                                          7.685513,
                                                                          47.573092
                                                                       ],
                                                                       [
                                                                          7.688922,
                                                                          47.57243
                                                                       ],
                                                                       [
                                                                          7.689663,
                                                                          47.571403
                                                                       ],
                                                                       [
                                                                          7.6889,
                                                                          47.570291
                                                                       ],
                                                                       [
                                                                          7.687109,
                                                                          47.568389
                                                                       ],
                                                                       [
                                                                          7.685928,
                                                                          47.565615
                                                                       ],
                                                                       [
                                                                          7.683763,
                                                                          47.568356
                                                                       ],
                                                                       [
                                                                          7.68343,
                                                                          47.568426
                                                                       ],
                                                                       [
                                                                          7.683723,
                                                                          47.57054
                                                                       ],
                                                                       [
                                                                          7.683509,
                                                                          47.571258
                                                                       ],
                                                                       [
                                                                          7.681031,
                                                                          47.570437
                                                                       ],
                                                                       [
                                                                          7.67911,
                                                                          47.569505
                                                                       ],
                                                                       [
                                                                          7.67845,
                                                                          47.568966
                                                                       ],
                                                                       [
                                                                          7.677691,
                                                                          47.567811
                                                                       ],
                                                                       [
                                                                          7.675586,
                                                                          47.56583
                                                                       ]
                                                                    ]
                                                                 ]
                                                              },
                                                              "properties":{
                                                                 
                                                              }
                                                           },
                                                           {
                                                              "type":"Feature",
                                                              "id":3914125772,
                                                              "geometry":{
                                                                 "type":"Polygon",
                                                                 "coordinates":[
                                                                    [
                                                                       [
                                                                          7.588918,
                                                                          47.554145
                                                                       ],
                                                                       [
                                                                          7.587853,
                                                                          47.554341
                                                                       ],
                                                                       [
                                                                          7.587097,
                                                                          47.555483
                                                                       ],
                                                                       [
                                                                          7.584148,
                                                                          47.556607
                                                                       ],
                                                                       [
                                                                          7.584008,
                                                                          47.556768
                                                                       ],
                                                                       [
                                                                          7.584288,
                                                                          47.557532
                                                                       ],
                                                                       [
                                                                          7.584474,
                                                                          47.559315
                                                                       ],
                                                                       [
                                                                          7.584742,
                                                                          47.559971
                                                                       ],
                                                                       [
                                                                          7.585696,
                                                                          47.561226
                                                                       ],
                                                                       [
                                                                          7.58623,
                                                                          47.561602
                                                                       ],
                                                                       [
                                                                          7.586481,
                                                                          47.561629
                                                                       ],
                                                                       [
                                                                          7.586624,
                                                                          47.561837
                                                                       ],
                                                                       [
                                                                          7.588238,
                                                                          47.560102
                                                                       ],
                                                                       [
                                                                          7.590153,
                                                                          47.558398
                                                                       ],
                                                                       [
                                                                          7.591946,
                                                                          47.557348
                                                                       ],
                                                                       [
                                                                          7.59301,
                                                                          47.557045
                                                                       ],
                                                                       [
                                                                          7.593541,
                                                                          47.556504
                                                                       ],
                                                                       [
                                                                          7.594604,
                                                                          47.555956
                                                                       ],
                                                                       [
                                                                          7.59501,
                                                                          47.555767
                                                                       ],
                                                                       [
                                                                          7.595184,
                                                                          47.555893
                                                                       ],
                                                                       [
                                                                          7.59552,
                                                                          47.555758
                                                                       ],
                                                                       [
                                                                          7.594631,
                                                                          47.554674
                                                                       ],
                                                                       [
                                                                          7.592317,
                                                                          47.553926
                                                                       ],
                                                                       [
                                                                          7.592077,
                                                                          47.553707
                                                                       ],
                                                                       [
                                                                          7.588918,
                                                                          47.554145
                                                                       ]
                                                                    ]
                                                                 ]
                                                              },
                                                              "properties":{
                                                                 
                                                              }
                                                           },
                                                           {
                                                              "type":"Feature",
                                                              "id":3914125773,
                                                              "geometry":{
                                                                 "type":"Polygon",
                                                                 "coordinates":[
                                                                    [
                                                                       [
                                                                          7.597576,
                                                                          47.567422
                                                                       ],
                                                                       [
                                                                          7.597725,
                                                                          47.566168
                                                                       ],
                                                                       [
                                                                          7.591469,
                                                                          47.564289
                                                                       ],
                                                                       [
                                                                          7.591441,
                                                                          47.564093
                                                                       ],
                                                                       [
                                                                          7.588318,
                                                                          47.563044
                                                                       ],
                                                                       [
                                                                          7.587525,
                                                                          47.564168
                                                                       ],
                                                                       [
                                                                          7.585228,
                                                                          47.563352
                                                                       ],
                                                                       [
                                                                          7.584211,
                                                                          47.564702
                                                                       ],
                                                                       [
                                                                          7.584316,
                                                                          47.564819
                                                                       ],
                                                                       [
                                                                          7.584092,
                                                                          47.565289
                                                                       ],
                                                                       [
                                                                          7.586595,
                                                                          47.56604
                                                                       ],
                                                                       [
                                                                          7.586268,
                                                                          47.567223
                                                                       ],
                                                                       [
                                                                          7.586135,
                                                                          47.568378
                                                                       ],
                                                                       [
                                                                          7.586138,
                                                                          47.569278
                                                                       ],
                                                                       [
                                                                          7.586427,
                                                                          47.570739
                                                                       ],
                                                                       [
                                                                          7.595112,
                                                                          47.570655
                                                                       ],
                                                                       [
                                                                          7.595107,
                                                                          47.571088
                                                                       ],
                                                                       [
                                                                          7.597422,
                                                                          47.571955
                                                                       ],
                                                                       [
                                                                          7.597983,
                                                                          47.571934
                                                                       ],
                                                                       [
                                                                          7.597663,
                                                                          47.570441
                                                                       ],
                                                                       [
                                                                          7.597576,
                                                                          47.567422
                                                                       ]
                                                                    ]
                                                                 ]
                                                              },
                                                              "properties":{
                                                                 
                                                              }
                                                           },
                                                           {
                                                              "type":"Feature",
                                                              "id":3914125774,
                                                              "geometry":{
                                                                 "type":"Polygon",
                                                                 "coordinates":[
                                                                    [
                                                                       [
                                                                          7.569033,
                                                                          47.552736
                                                                       ],
                                                                       [
                                                                          7.561325,
                                                                          47.551861
                                                                       ],
                                                                       [
                                                                          7.563059,
                                                                          47.554934
                                                                       ],
                                                                       [
                                                                          7.564578,
                                                                          47.557109
                                                                       ],
                                                                       [
                                                                          7.57328,
                                                                          47.557529
                                                                       ],
                                                                       [
                                                                          7.575254,
                                                                          47.557132
                                                                       ],
                                                                       [
                                                                          7.575832,
                                                                          47.555255
                                                                       ],
                                                                       [
                                                                          7.576697,
                                                                          47.553796
                                                                       ],
                                                                       [
                                                                          7.574111,
                                                                          47.553332
                                                                       ],
                                                                       [
                                                                          7.569033,
                                                                          47.552736
                                                                       ]
                                                                    ]
                                                                 ]
                                                              },
                                                              "properties":{
                                                                 
                                                              }
                                                           },
                                                           {
                                                              "type":"Feature",
                                                              "id":3914125775,
                                                              "geometry":{
                                                                 "type":"Polygon",
                                                                 "coordinates":[
                                                                    [
                                                                       [
                                                                          7.605541,
                                                                          47.530372
                                                                       ],
                                                                       [
                                                                          7.605547,
                                                                          47.529786
                                                                       ],
                                                                       [
                                                                          7.604622,
                                                                          47.529801
                                                                       ],
                                                                       [
                                                                          7.60471,
                                                                          47.529294
                                                                       ],
                                                                       [
                                                                          7.601775,
                                                                          47.525351
                                                                       ],
                                                                       [
                                                                          7.594788,
                                                                          47.519297
                                                                       ],
                                                                       [
                                                                          7.590746,
                                                                          47.519655
                                                                       ],
                                                                       [
                                                                          7.590255,
                                                                          47.519795
                                                                       ],
                                                                       [
                                                                          7.589325,
                                                                          47.52296
                                                                       ],
                                                                       [
                                                                          7.589648,
                                                                          47.525162
                                                                       ],
                                                                       [
                                                                          7.58997,
                                                                          47.525742
                                                                       ],
                                                                       [
                                                                          7.58993,
                                                                          47.526679
                                                                       ],
                                                                       [
                                                                          7.589489,
                                                                          47.527928
                                                                       ],
                                                                       [
                                                                          7.588494,
                                                                          47.528277
                                                                       ],
                                                                       [
                                                                          7.588393,
                                                                          47.528512
                                                                       ],
                                                                       [
                                                                          7.588473,
                                                                          47.529061
                                                                       ],
                                                                       [
                                                                          7.585873,
                                                                          47.52928
                                                                       ],
                                                                       [
                                                                          7.585911,
                                                                          47.529963
                                                                       ],
                                                                       [
                                                                          7.58569,
                                                                          47.531328
                                                                       ],
                                                                       [
                                                                          7.584682,
                                                                          47.531232
                                                                       ],
                                                                       [
                                                                          7.583858,
                                                                          47.530919
                                                                       ],
                                                                       [
                                                                          7.582787,
                                                                          47.531984
                                                                       ],
                                                                       [
                                                                          7.582695,
                                                                          47.532473
                                                                       ],
                                                                       [
                                                                          7.583471,
                                                                          47.533465
                                                                       ],
                                                                       [
                                                                          7.585926,
                                                                          47.537409
                                                                       ],
                                                                       [
                                                                          7.585971,
                                                                          47.537762
                                                                       ],
                                                                       [
                                                                          7.585536,
                                                                          47.538213
                                                                       ],
                                                                       [
                                                                          7.585491,
                                                                          47.538596
                                                                       ],
                                                                       [
                                                                          7.587311,
                                                                          47.541969
                                                                       ],
                                                                       [
                                                                          7.591522,
                                                                          47.540569
                                                                       ],
                                                                       [
                                                                          7.604217,
                                                                          47.53676
                                                                       ],
                                                                       [
                                                                          7.604449,
                                                                          47.53648
                                                                       ],
                                                                       [
                                                                          7.605541,
                                                                          47.530372
                                                                       ]
                                                                    ]
                                                                 ]
                                                              },
                                                              "properties":{
                                                                 
                                                              }
                                                           },
                                                           {
                                                              "type":"Feature",
                                                              "id":3914125776,
                                                              "geometry":{
                                                                 "type":"Polygon",
                                                                 "coordinates":[
                                                                    [
                                                                       [
                                                                          7.598977,
                                                                          47.543425
                                                                       ],
                                                                       [
                                                                          7.601996,
                                                                          47.54193
                                                                       ],
                                                                       [
                                                                          7.604388,
                                                                          47.53663
                                                                       ],
                                                                       [
                                                                          7.603768,
                                                                          47.536957
                                                                       ],
                                                                       [
                                                                          7.591522,
                                                                          47.540569
                                                                       ],
                                                                       [
                                                                          7.58148,
                                                                          47.543829
                                                                       ],
                                                                       [
                                                                          7.580971,
                                                                          47.543693
                                                                       ],
                                                                       [
                                                                          7.580074,
                                                                          47.543839
                                                                       ],
                                                                       [
                                                                          7.578283,
                                                                          47.543766
                                                                       ],
                                                                       [
                                                                          7.578654,
                                                                          47.545628
                                                                       ],
                                                                       [
                                                                          7.578884,
                                                                          47.546068
                                                                       ],
                                                                       [
                                                                          7.582753,
                                                                          47.548461
                                                                       ],
                                                                       [
                                                                          7.582922,
                                                                          47.5486
                                                                       ],
                                                                       [
                                                                          7.582418,
                                                                          47.548992
                                                                       ],
                                                                       [
                                                                          7.583279,
                                                                          47.549581
                                                                       ],
                                                                       [
                                                                          7.583951,
                                                                          47.549295
                                                                       ],
                                                                       [
                                                                          7.584145,
                                                                          47.549429
                                                                       ],
                                                                       [
                                                                          7.585364,
                                                                          47.548995
                                                                       ],
                                                                       [
                                                                          7.587346,
                                                                          47.548753
                                                                       ],
                                                                       [
                                                                          7.591926,
                                                                          47.546984
                                                                       ],
                                                                       [
                                                                          7.592102,
                                                                          47.547005
                                                                       ],
                                                                       [
                                                                          7.59281,
                                                                          47.547833
                                                                       ],
                                                                       [
                                                                          7.59395,
                                                                          47.546946
                                                                       ],
                                                                       [
                                                                          7.593356,
                                                                          47.546173
                                                                       ],
                                                                       [
                                                                          7.594765,
                                                                          47.545548
                                                                       ],
                                                                       [
                                                                          7.597378,
                                                                          47.544955
                                                                       ],
                                                                       [
                                                                          7.599164,
                                                                          47.544379
                                                                       ],
                                                                       [
                                                                          7.598977,
                                                                          47.543425
                                                                       ]
                                                                    ]
                                                                 ]
                                                              },
                                                              "properties":{
                                                                 
                                                              }
                                                           },
                                                           {
                                                              "type":"Feature",
                                                              "id":3914125778,
                                                              "geometry":{
                                                                 "type":"Polygon",
                                                                 "coordinates":[
                                                                    [
                                                                       [
                                                                          7.570958,
                                                                          47.563384
                                                                       ],
                                                                       [
                                                                          7.573915,
                                                                          47.561935
                                                                       ],
                                                                       [
                                                                          7.575254,
                                                                          47.557132
                                                                       ],
                                                                       [
                                                                          7.57328,
                                                                          47.557529
                                                                       ],
                                                                       [
                                                                          7.564578,
                                                                          47.557109
                                                                       ],
                                                                       [
                                                                          7.559877,
                                                                          47.560537
                                                                       ],
                                                                       [
                                                                          7.558727,
                                                                          47.561964
                                                                       ],
                                                                       [
                                                                          7.557934,
                                                                          47.562625
                                                                       ],
                                                                       [
                                                                          7.55466,
                                                                          47.564366
                                                                       ],
                                                                       [
                                                                          7.5573,
                                                                          47.565031
                                                                       ],
                                                                       [
                                                                          7.559335,
                                                                          47.569389
                                                                       ],
                                                                       [
                                                                          7.556464,
                                                                          47.571387
                                                                       ],
                                                                       [
                                                                          7.556896,
                                                                          47.572466
                                                                       ],
                                                                       [
                                                                          7.557028,
                                                                          47.572521
                                                                       ],
                                                                       [
                                                                          7.558575,
                                                                          47.570464
                                                                       ],
                                                                       [
                                                                          7.562102,
                                                                          47.567989
                                                                       ],
                                                                       [
                                                                          7.565223,
                                                                          47.566127
                                                                       ],
                                                                       [
                                                                          7.570958,
                                                                          47.563384
                                                                       ]
                                                                    ]
                                                                 ]
                                                              },
                                                              "properties":{
                                                                 
                                                              }
                                                           },
                                                           {
                                                              "type":"Feature",
                                                              "id":3914125779,
                                                              "geometry":{
                                                                 "type":"Polygon",
                                                                 "coordinates":[
                                                                    [
                                                                       [
                                                                          7.587068,
                                                                          47.582884
                                                                       ],
                                                                       [
                                                                          7.587016,
                                                                          47.582746
                                                                       ],
                                                                       [
                                                                          7.591667,
                                                                          47.581684
                                                                       ],
                                                                       [
                                                                          7.593157,
                                                                          47.580897
                                                                       ],
                                                                       [
                                                                          7.594018,
                                                                          47.580023
                                                                       ],
                                                                       [
                                                                          7.595281,
                                                                          47.578003
                                                                       ],
                                                                       [
                                                                          7.596572,
                                                                          47.57534
                                                                       ],
                                                                       [
                                                                          7.597131,
                                                                          47.574887
                                                                       ],
                                                                       [
                                                                          7.59787,
                                                                          47.574647
                                                                       ],
                                                                       [
                                                                          7.600779,
                                                                          47.574711
                                                                       ],
                                                                       [
                                                                          7.600658,
                                                                          47.574906
                                                                       ],
                                                                       [
                                                                          7.600926,
                                                                          47.57517
                                                                       ],
                                                                       [
                                                                          7.602723,
                                                                          47.576194
                                                                       ],
                                                                       [
                                                                          7.603044,
                                                                          47.577644
                                                                       ],
                                                                       [
                                                                          7.604889,
                                                                          47.577879
                                                                       ],
                                                                       [
                                                                          7.605339,
                                                                          47.579888
                                                                       ],
                                                                       [
                                                                          7.604769,
                                                                          47.580409
                                                                       ],
                                                                       [
                                                                          7.604701,
                                                                          47.581176
                                                                       ],
                                                                       [
                                                                          7.604061,
                                                                          47.581339
                                                                       ],
                                                                       [
                                                                          7.604586,
                                                                          47.582815
                                                                       ],
                                                                       [
                                                                          7.604822,
                                                                          47.584935
                                                                       ],
                                                                       [
                                                                          7.598469,
                                                                          47.587644
                                                                       ],
                                                                       [
                                                                          7.590412,
                                                                          47.589596
                                                                       ],
                                                                       [
                                                                          7.5887,
                                                                          47.5872
                                                                       ],
                                                                       [
                                                                          7.587067,
                                                                          47.584107
                                                                       ],
                                                                       [
                                                                          7.586911,
                                                                          47.583468
                                                                       ],
                                                                       [
                                                                          7.587068,
                                                                          47.582884
                                                                       ]
                                                                    ]
                                                                 ]
                                                              },
                                                              "properties":{
                                                                 
                                                              }
                                                           },
                                                           {
                                                              "type":"Feature",
                                                              "id":3914125780,
                                                              "geometry":{
                                                                 "type":"Polygon",
                                                                 "coordinates":[
                                                                    [
                                                                       [
                                                                          7.599296,
                                                                          47.563491
                                                                       ],
                                                                       [
                                                                          7.600131,
                                                                          47.562134
                                                                       ],
                                                                       [
                                                                          7.596842,
                                                                          47.559939
                                                                       ],
                                                                       [
                                                                          7.594727,
                                                                          47.561831
                                                                       ],
                                                                       [
                                                                          7.59346,
                                                                          47.563505
                                                                       ],
                                                                       [
                                                                          7.59197,
                                                                          47.563034
                                                                       ],
                                                                       [
                                                                          7.591442,
                                                                          47.564122
                                                                       ],
                                                                       [
                                                                          7.591469,
                                                                          47.564289
                                                                       ],
                                                                       [
                                                                          7.597725,
                                                                          47.566168
                                                                       ],
                                                                       [
                                                                          7.599296,
                                                                          47.563491
                                                                       ]
                                                                    ]
                                                                 ]
                                                              },
                                                              "properties":{
                                                                 
                                                              }
                                                           }
                                                        ]
                                                    };

                                                    importGeoJSON(data);
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