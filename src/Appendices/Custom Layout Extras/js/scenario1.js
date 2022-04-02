(function () {
    "use strict";

    var itemSizeMap = {
        status: { width: 160 }, // plus 10 pixels to incorporate the margin
        photo:  { width: 260 }  // plus 10 pixels to incorporate the margin
    };

    var page = WinJS.UI.Pages.define("/html/scenario1.html", {
        ready: function (element, options) {
            // Wire up ListView properties
            this._statusTemplate = element.querySelector(".statusTemplate").winControl;
            this._photoTemplate = element.querySelector(".photoTemplate").winControl;
            this._listView = element.querySelector(".listView_s1").winControl;
            this._listView.layout = new CustomLayouts.StatusLayoutHorizontal({itemInfo: this._itemInfo, itemSizeMap: itemSizeMap });
            this._listView.itemTemplate = this._statusRenderer.bind(this);
        },

        // Conditional renderer that chooses between statusTemplate and photoTemplate
        _statusRenderer: function (itemPromise) {
            var that = this;
            return itemPromise.then(function (item) {
                
                if (item.data.type === "photo") {
                    return that._photoTemplate.renderItem(itemPromise);
                }

                return that._statusTemplate.renderItem(itemPromise);
            });
        },

        // Function used by StatusLayout to detemine what CSS class needs to be placed on the item to size it
        _itemInfo: function (i) {
            var item = Data.list.getItem(i);
            return { type: item.data.type };
        }
    });

    WinJS.Namespace.define("CustomLayouts", {
        StatusLayoutHorizontal: WinJS.Class.define(function (options) {
            this._site = null;
            this._surface = null;

            //Necessary to instruct WinJS to put the proper classes on the ListView elements.
            //Be sure to spell "orientation" correctly!
            this.orientation = "horizontal";

            options = options || {};

            if (options.itemInfo) {
                this._itemInfo = options.itemInfo;
            }

            if (options.itemSizeMap) {
                this._itemSizeMap = options.itemSizeMap;
            }
        }, 
        {
            // This sets up any state and CSS layout on the surface of the custom layout
            initialize: function (site) {
                this._site = site;
                this._surface = this._site.surface;

                // Add a CSS class to control the surface level layout.                
                WinJS.Utilities.addClass(this._surface, "statusLayoutHorizontal");

                //Modification: return horizontal. WinJS doesn't actually use this, however.                
                return WinJS.UI.Orientation.horizontal;
            },

            // Reset the layout to its initial state
            uninitialize: function () {
                WinJS.Utilities.removeClass(this._surface, "statusLayoutHorizontal");
                this._site = null;
                this._surface = null;
            },

            // Responsible for sizing and positioning items in the tree. In this case we don't need
            // to style or size the items, but need to add up their sizes so we can appropriate size
            // the win-itemscontainer element (a child of this._surface).            
            layout: function (tree, changedRange, modifiedElements, modifiedGroups) {
                var container = tree[0].itemsContainer;
                var items = container.items;
                var realWidth = 0;
                var itemsLength = items.length;
                var type;

                for (var i = 0; i < itemsLength; i++) {                    
                    type = this._itemInfo(i).type;
                    realWidth += this._itemSizeMap[type].width;
                }
                
                //Set the true width of the itemscontainer now.
                container.element.style.width = realWidth + "px";

                // Return a promise or {realizedRangeComplete: Promise, layoutComplete: Promise};
                return WinJS.Promise.as();
            },


            /*
             * These members are not part of ILayout2
             */

            // Default implementation of the itemInfo function
            _itemInfo: function (i) {
                return "status";
            },

            //Default size map
            _itemSizeMap: {
                status: { width: 100 }, 
            },

            // getters and setters for properties
            itemInfo: {
                get: function () {
                    return this._itemInfo;
                },
                set: function (itemInfoFunction) {
                    this._itemInfo = itemInfoFunction;
                }
            },
            
            itemSizeMap: {
                get: function () {
                    return this._itemSizeMap;
                },
                set: function (value) {
                    this._itemSizeMap = value;
                }
            }
        })
    });
    

})();
