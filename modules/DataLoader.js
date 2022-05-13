define
    (
        "Modules/DataLoader",
        [

        ],
        function
            (

            ) {
            console.info('Data loader is loaded');

            // global variables (widget, UWA, document)
            let accessToken;
            let username;
            let password;
            // Vianova's API
            const host = 'https://vianova-tm.herokuapp.com/api';

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

                const rawResponse = await fetch(address, { method: 'GET' });
                const data = await rawResponse.json();
                return data['access_token'];
            }

            // Retreiving a zoneId for a given user
            const getZoneID = async token => {
                const path = '/zoneID?token=';

                const rawResponse = await fetch(host.concat(path) + token, { method: 'GET' })
                const data = await rawResponse.json();
                return data['zone_id'];
            }

            // Retrievs GeoJSON
            const getGeoJSON = async (token, zoneID) => {
                const options = {
                    method: 'GET',
                    headers: {
                        Accept: 'application/json',
                        Authorization: 'Bearer ' + token
                    }
                };

                return await fetch(`${host}/zones/${zoneID}/`, options)
                    .then(response => response.json())
                    .then(async data => {
                        // Filtering response JSON to obtain a link of JSON, containing informations
                        return await fetch(data["detail_link"], {
                            method: 'GET', headers: { Accept: 'application/json' }
                        })
                            .then(response => response.json())
                            .then(data => data);
                    })
                    .catch(err => console.error(err));
            }

            // Loads Leaflet with Mapbox map

            // Declare public functions or variable here. Accessible by other modules.
            var exports = {
                displayPopup: function () {
                    return getCredentials();
                },
                displayMap: function () {
                    getToken()
                        .then(token => {
                            console.info(token);

                            getZoneID(token)
                                .then(zoneID => {
                                    console.info(zoneID);


                                })
                            // Load leaflet Map

                        })
                        .catch(error => console.log("Couldn't retrieve bearer token: " + error.message));
                }
            };

            return exports;
        }
    );