define
    (
        'Widget/js/Main',
        [
            // 3DEXPERIENCE Cloud Platform JS modules 
            'DS/PlatformAPI/PlatformAPI',
            'DS/DataDragAndDrop/DataDragAndDrop',

            // Module which requests data and loads them into the application
            'Modules/DataLoader',
            'Modules/WidgetManager',
            'Modules/VariableManager',

            // To make HTTP requests
            'DS/WAFData/WAFData',

            // Libraries
            'Lib/leaflet'
        ],
        function
            (
                PlatformAPI,
                DataDragAndDrop,
                DataLoader,
                WidgetManager,
                VariableManager,
                WAFData,
                leaflet
            ) {
            // Declare public functions or variables here. Accessible by other modules. Call it by "Main.<function>". Usage sample, e.g. Main.onLoad() 

            // Function to setup basic City API subscription 
            const setupSubscriptions = () => {
                // unsubscribe common city topics to prevent double subscriptions
                PlatformAPI.unsubscribe('xCity.resolve');
                PlatformAPI.unsubscribe('xCity.catch');

                // subscribes to common city topics
                PlatformAPI.subscribe('xCity.resolve', resolve.bind(this));   // Good API result will be funneled to "resolve" function
                PlatformAPI.subscribe('xCity.catch', reject.bind(this));      // Bad API result will be funneled to "reject" function
            }

            var exports = {
                onLoad: function () {
                    console.info("Global var widget", widget);

                    console.info("Widget is running!");

                    // Test
                    // let host = 'https://api.vianova.dev';
                    // let path = '/token'
                    // const address = host.concat(path);
                
                    // // Setting up the headers
                    // const headers = new Headers({
                    //     'Content-Type': 'application/x-www-form-urlencoded'
                    // });

                    // const usr = prompt("Enter username:");
                    // const pass = prompt("Enter password:");
                
                    // // Setting up the body
                    // const body = new URLSearchParams({
                    //     username: usr,
                    //     password: pass
                    // });

                    // const data = new FormData();
                    // data.append('username', usr);
                    // data.append('password', pass);

                    // console.info(usr, pass, body.toString());
                    // console.info(encodeURIComponent('username') + '=' + encodeURIComponent(usr) + '&' + encodeURIComponent('password') + '=' + encodeURIComponent(pass));

                    // WAFData.proxifiedRequest('https://httpbin.org/get', {
                    //     method: 'GET',
                    //     onComplete: function (responseAsString) {
                    //         console.info(responseAsString);
                    //     },
                    //     onFailure: function (error, responseAsString) {
                    //         console.info('Couldnt retrieve info: ' + error + '\nResponse: ' + JSON.stringify(responseAsString));
                    //     }
                    // });

                    // WAFData.proxifiedRequest(address, {
                    //     method: 'POST',
                    //     type   : 'json',
                    //     headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    //     data,
                    //     onComplete: function (responseAsString) {
                    //         console.info(responseAsString);
                    //         let data = (async () => await rawResponse.json())();
                    //         console.info(data);
                    //         console.info(data['access_token']);
                    //     },
                    //     onFailure: function (error, responseAsString) {
                    //         console.info('Couldnt retrieve token: ' + error + '\nResponse: ' + JSON.stringify(responseAsString));
                    //     }
                    // });

                    // (async () => {
                    //     const rawResponse = await fetch(address, {
                    //         method: 'POST',
                    //         body
                    //     });

                    //     let result = await rawResponse.json();
                    //     console.info(result);
                    //     console.info(result['access_token']);
                    // })();
                    // End test

                    widget.body.innerHTML = '';
                    const popup = DataLoader.displayPopup();
                    // widget.body.appendChild(popup);
                    // widget.body.removeChild(popup);

                    const container = document.createElement('div');
                    const map = document.createElement('div');
                    map.id = 'map';
                    container.appendChild(map);

                    const tags = document.createElement('select');
                    tags.id = 'tags';
                    tags.name = 'tags';
                    container.appendChild(tags);
                    
                    widget.body.appendChild(container);
                    DataLoader.displayMap();
                },

                onResize: function () {
                    console.info("onResize");
                },

                onViewChange: function () {
                    console.info("onViewChange");
                },

                onEdit: function () {
                    console.info("onEdit");
                },

                onRefresh: function () {
                    console.info("onRefresh");

                    setupSubscriptions();
                    WidgetManager.refreshTabWidgetList();
                    VariableManager.setData('test');
                },

                endEdit: function () {
                    console.info("endEdit");
                }
            };

            return exports;
        }
    );