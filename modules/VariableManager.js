define
(
    "Modules/VariableManager",
    [
        
    ],
    function
    (
        
    )
    {
        console.info('VariableManager');

        var parent = window.parent;

        function declareCityData() {
            if(UWA.is(parent.cityData, 'undefined') || !UWA.is(parent.cityData, 'object')) {
                parent.cityData = {};
            }
        }

        var exports = {

            setData: function(key, data) {
                declareCityData();
                parent.cityData[key] = data;
                console.info(key, parent.cityData[key]);
            },

            getData: function(key) {
                declareCityData();
                console.info(key, parent.cityData[key]);
                return parent.cityData[key];
            },

            removeData: function(key) {
                delete parent.cityData[key];
                console.info(key, parent.cityData[key]);
            }
        };

        return exports;
    }
);