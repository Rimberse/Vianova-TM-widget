define
(
    'Widget/js/Main',
    [
        // 3DEXPERIENCE Cloud Platform JS modules 
        'DS/PlatformAPI/PlatformAPI',

        // Module which requests data and loads them into the application
        'Modules/DataLoader'
    ],
    function
    (
        PlatformAPI,
        DataLoader
    )
    {
        // Declare public functions or variables here. Accessible by other modules. Call it by "Main.<function>". Usage sample, e.g. Main.onLoad() 
        var exports = {
            onLoad: function() {
                console.info("Global var widget", widget);

                console.info("Widget is running!");

                widget.body.innerHTML = '';
                widget.body.appendChild(DataLoader.displayPopup());

                const container = document.createElement('div');
                widget.body.appendChild(container);
                DataLoader.displayMap();
            },

            onResize: function() {
                console.info("onResize");
            },

            onViewChange: function() {
                console.info("onViewChange");
            },

            onEdit: function() {
                console.info("onEdit");
            },

            onRefresh: function() {
                console.info("onRefresh");
            },

            endEdit: function() {
                console.info("endEdit");
            }
        };

        return exports;
    }
);