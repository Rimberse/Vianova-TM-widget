define
    (
        'Widget/js/Main',
        [
            // 3DEXPERIENCE Cloud Platform JS modules 
            'DS/PlatformAPI/PlatformAPI',

            // Module which requests data and loads them into the application
            'Modules/DataLoader',

            // To make HTTP requests
            'DS/WAFData/WAFData'
        ],
        function
            (
                PlatformAPI,
                DataLoader,
                WAFData
            ) {
            // Declare public functions or variables here. Accessible by other modules. Call it by "Main.<function>". Usage sample, e.g. Main.onLoad() 
            var exports = {
                onLoad: function () {
                    console.info("Global var widget", widget);

                    console.info("Widget is running!");

                    // Test
                    let host = 'https://api.vianova.dev';
                    let path = '/token'
                    const address = host.concat(path);

                    WAFData.proxifiedRequest(address, {
                        method: 'GET',
                        onComplete: function (responseAsString) {
                            console.info(JSON.parse(responseAsString));
                            console.info(responseAsString);
                            let data = await rawResponse.json();
                            console.info(data);
                            console.info(data['access_token']);
                        },
                        onFailure: function (error, responseAsString) { 
                            console.info('Couldnt retrieve token');
                        }
                    });
                    // End test

                    widget.body.innerHTML = '';
                    const popup = DataLoader.displayPopup();
                    widget.body.appendChild(popup);
                    widget.body.removeChild(popup);

                    const container = document.createElement('div');
                    const map = document.createElement('div');
                    map.id = 'map';
                    container.appendChild(map);
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
                },

                endEdit: function () {
                    console.info("endEdit");
                }
            };

            return exports;
        }
    );