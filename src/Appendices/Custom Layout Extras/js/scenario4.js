(function () {
    "use strict";

    var page = WinJS.UI.Pages.define("/html/scenario4.html", {
        ready: function (element, options) {
        },
    });

    WinJS.Namespace.define("CustomLayouts", {
        VerticalGrid_Flex4: WinJS.Class.define(function (options) {
            this._site = null;
            this._surface = null;
            this._itemWidth = 50;
            this._itemHeight = 50;

            this._itemsPerRow = 0;
            this._totalRows = 0;

            this._lastIndex = -1;     //Used to minimize hitTest output noise
            this._lastRotatedElement = null;

            options = options || {};

            if (options.itemWidth) {
                this._itemWidth = options.itemWidth;
            }

            if (options.itemHeight) {
                this._itemHeight = options.itemHeight;
            }
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

            //Properties for options
            // getters and setters for properties
            itemWidth: {
                get: function () {
                    return this._itemWidth;
                },
                set: function (width) {
                    this._itemWidth = width;
                }
            },
            
            itemHeight: {
                get: function () {
                    return this._itemHeight;
                },
                set: function (height) {
                    this._itemHeight = height;
                }
            },
            

            layout: function() {
                //Compute these constants only when layout happens
                this._itemsPerRow = Math.floor(this._site.viewportSize.width / this._itemWidth);                
                this._totalRows = Math.floor(this._site.itemCount._value / this._itemsPerRow);

                //We don't need to do anything else.
                return WinJS.Promise.as();
            },
            
            getAdjacent: function (item, key) {
                var Key = WinJS.Utilities.Key;
                var index = item.index;
                var curRow = Math.floor(index / this._itemsPerRow);
                var curCol = index % this._itemsPerRow;
                var newRow;

                //The ListView is gracious enough to ignore our return index if it's out of bounds,
                //so we don't have to check for that here.

                switch (key) {
                    case Key.rightArrow:
                        index = index + 1;
                        break;

                    case Key.downArrow:                        
                        index = index + this._itemsPerRow;
                        break;

                    case Key.pageDown:
                        //If we page down past the last item, this will go to the last item
                        newRow = Math.min(curRow + 3, this._totalRows);
                        index = curCol + (newRow * this._itemsPerRow);
                        break;

                    case Key.leftArrow:
                        index = index - 1;
                        break;

                    case Key.upArrow:
                        index = index - this._itemsPerRow;
                        break;

                    case Key.pageUp:
                        newRow = Math.max(curRow - 3, 0);
                        index = curCol + (newRow * this._itemsPerRow);
                        break;
                }
                
                return { type: WinJS.UI.ObjectType.item, index: index };
            },

            _indexFromCoordinates: function (x, y) {
                var row = Math.floor(y / this._itemHeight);
                var col = Math.floor(x / this._itemWidth);
                return (row * this._itemsPerRow) + col;
            },

            hitTest: function (x, y) {
                var index = this._indexFromCoordinates(x, y);

                //Only log the output if the index changes.
                if (this._lastIndex != index) {
                    console.log("hitTest on (" + x + ", " + y + "), index = " + index);
                    this._lastIndex = index;
                }

                return { type: WinJS.UI.ObjectType.item, index: index, insertAfterIndex: index - 1 };
            },

            dragOver: function (x, y, dragInfo) {
                //Get the index of the item we'd be dropping on
                var index = this._indexFromCoordinates(x, y);

                console.log("dragOver on index = " + index);

                //Get the element and scale it a little (like a button press)
                var element = this._site.tree[0].itemsContainer.items[index];
                element && this._addAnimateDropPoint(element);
                this._lastRotatedElement && this._clearAnimateDropPoint(this._lastRotatedElement);
                this._lastRotatedElement = element;
            },

            dragLeave: function () {
                console.log("dragLeave");
                if (this._lastRotatedElement) {
                    this._clearAnimateDropPoint(this._lastRotatedElement);
                    this._lastRotatedElement = null;
                }                
            },

            _addAnimateDropPoint: function (element) {
                element.style.transition = "transform ease 167ms";
                element.style.transform = "rotate(-20deg)";
            },
            
            _clearAnimateDropPoint: function (element) {
                element.style.transition = "";
                element.style.transform = "";
            }
        })
    });
})();
