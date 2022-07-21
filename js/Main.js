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
            'Lib/leaflet',
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