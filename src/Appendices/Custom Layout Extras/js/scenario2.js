(function () {
    "use strict";

    var page = WinJS.UI.Pages.define("/html/scenario2.html", {
        ready: function (element, options) {                        
        },
    });

    WinJS.Namespace.define("CustomLayouts", {
        VerticalGrid_Flex: WinJS.Class.define(function (options) {
            this._site = null;
            this._surface = null;
        },
        {
            // This sets up any state and CSS layout on the surface of the layout
            initialize: function (site) {
                this._site = site;
                this._surface = this._site.surface;                

                // Add a CSS class to control the surface level layout
                WinJS.Utilities.addClass(this._surface, "verticalGrid_Flex");

                return WinJS.UI.Orientation.vertical;
            },

            // Reset the layout to its initial state
            uninitialize: function () {
                WinJS.Utilities.removeClass(this._surface, "verticalGrid_Flex");
                this._site = null;
                this._surface = null;                
            },
        })
    });
})();
