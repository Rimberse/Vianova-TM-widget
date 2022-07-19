define
(
    "Modules/WidgetManager",
    [
        
    ],
    function
    (
        
    )
    {
        console.info('WidgetManager');

        // Settings options list
        var _pairedWidgets = [],
            _pairedWidgetsId = [],
            _sameTabWidgets = [],
            _sameTabWidgetsId = [],
            _callback;

        restorePairedWidgetList();

        function savePairedWidgetList() {
            widget.setValue('pairedWidgets', JSON.stringify(_pairedWidgets));
        }

        function getPairedWidgetList() {
            var list = widget.getValue('pairedWidgets');

            if(list) {
                list = JSON.parse(list);
            }
            else {
                list = [];
            }

            return list;
        }

        function restorePairedWidgetList() {
            _pairedWidgets = getPairedWidgetList();

            if(_pairedWidgets.length) {
                for(var i=0; i<_pairedWidgets.length; i++) {
                    var id = _pairedWidgets[i].id;
                    _pairedWidgetsId.push(id);
                }
            }
        }

        // Scan tab widgets
        function scanTabWidgets() {
            try {
                var all = window.top.UWA.Widgets.instances,
                    tab,
                    otherTabs = [];

                // Scan tab instance which this widget resides in
                for(var i=0; i<all.length; i++) {
                    var item = all[i];

                    // No layout (widget), no wp (topbar or dashboard). If there are, it is a tab
                    if(UWA.is(item.layout, 'object') && UWA.is(item.layout.wp, 'object') && item.layout.wp.children.length) {
                        
                        // Check tab for this widget
                        for(var j=0; j<item.layout.wp.children.length; j++) {
                            var child = item.layout.wp.children[j];

                            // Find tab containing this widget then break
                            if(child.id === widget.id) {
                                tab = item;
                                break;
                            }
                        }

                        // Found the tab, break
                        if(tab) {
                            break;
                        }
                    }
                }

                // Store all widgets in the tab except this widget
                _sameTabWidgets = [];
                _sameTabWidgetsId = [];
                for(var i=0; i<tab.layout.wp.children.length; i++) {
                    var item = tab.layout.wp.children[i];

                    if(item.id !== widget.id) {
                        _sameTabWidgets.push({
                            id: item.id,
                            title: item.title
                        });
                        _sameTabWidgetsId.push(item.id);
                    }
                }
            } 
            catch (error) {
                console.warn('Not able to scan widgets on current tab', error);
            }
        }

        var exports = {

            setPairedWidgetCallback: function(callback) {
                _callback = callback;
            },

            clearPairedWidget: function() {
                widget.setValue('pairedWidgets', '');
                _pairedWidgets = [];
                _pairedWidgetsId = [];
            },

            addPairedWidget: function(id, title, nocallback) {
                if (_pairedWidgetsId.includes(id)) {
                    return true;
                }

                _pairedWidgets.push({id: id, title: title});
                _pairedWidgetsId.push(id);

                savePairedWidgetList();
                
                if(_callback) {
                    _callback();
                }

                return true;
            },

            isPaired: function(id) {
                return _pairedWidgetsId.includes(id);
            },

            getPairedWidgets: function(idsOnly) {
                if(idsOnly) {
                    return _pairedWidgetsId;
                }

                return _pairedWidgets;
            },

            removePairedWidget: function(id) {
                var index;

                for(var i=0; i<_pairedWidgetsId.length; i++) {
                    var item = _pairedWidgetsId[i];

                    if(item === id) {
                        index = i;
                        break;
                    }
                }

                if(UWA.is(index, 'number')) {
                    _pairedWidgetsId.splice(index, 1);
                    _pairedWidgets.splice(index, 1);
                    savePairedWidgetList();
                    return true;
                }
                else {
                    return false;
                }
                
            },

            getSameTabWidgets: function(idsOnly) {
                if(idsOnly) {
                    return _sameTabWidgetsId;
                }

                return _sameTabWidgets;
            },

            isOnSameTab: function(id) {
                if(_sameTabWidgetsId.includes(id)) {
                    return true;
                }
                else {
                    scanTabWidgets();
                    return _sameTabWidgetsId.includes(id);
                }
            },

            refreshTabWidgetList: function() {
                scanTabWidgets();
            }
        };

        return exports;
    }
);