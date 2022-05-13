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

                // Setting up the headers
                // const headers = new Headers({
                //     'Content-Type': 'application/x-www-form-urlencoded'
                // });

                // Setting up the body
                // const body = new URLSearchParams({
                //     username,
                //     password
                // });

                // const rawResponse = await fetch(address, {
                //     method: 'POST',
                //     body
                // });

                const rawResponse = await fetch(address, { method: 'GET' });
                const data = await rawResponse.json();
                return data['access_token'];
            }

            // Loads Leaflet with Mapbox map

            // Declare public functions or variable here. Accessible by other modules.
            var exports = {
                displayPopup: function () {
                    return getCredentials();
                },
                displayMap: function () {
                    console.log(getToken());
                }
            };

            return exports;
        }
    );