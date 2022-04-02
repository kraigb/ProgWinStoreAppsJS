(function () {
    "use strict";

    var page = WinJS.UI.Pages.define("/html/scenario3.html", {
        ready: function (element, options) {
            //The buttons on this page just add/remove from the data source
            document.getElementById("btnAdd").addEventListener("click", function () {
                Data.smallList.push(Data.randomItem());
            });

            document.getElementById("btnRemove").addEventListener("click", function () {
                Data.smallList.pop();
            });

            var chkSpiral = document.getElementById("chkSpiral");
            chkSpiral.checked = false;

            chkSpiral.addEventListener("click", function () {
                var list = document.querySelector(".listView_s3").winControl;
                list.layout.spiral = chkSpiral.checked;
                list.forceLayout();
            });
        },
    });

    WinJS.Namespace.define("CustomLayouts", {
        CircleLayout: WinJS.Class.define(function (options) {
            this._site = null;
            this._surface = null;
            this._spiral = false;

            options = options || {};

            if (options.spiral) {
                this._spiral = options.spiral;
            }
        },
        {
            // This sets up any state and CSS layout on the surface of the layout
            initialize: function (site) {
                this._site = site;
                this._surface = this._site.surface;

                // Add a CSS class to control the surface level layout
                WinJS.Utilities.addClass(this._surface, "circleLayout");

                return WinJS.UI.Orientation.vertical;
            },

            // Reset the layout to its initial state
            uninitialize: function () {
                WinJS.Utilities.removeClass(this._surface, "circleLayout");
                this._site = null;
                this._surface = null;
            },

            spiral: {
                get: function () {
                    return this._spiral;
                },
                set: function (spiral) {
                    this._spiral = spiral;
                }
            },

            layout: function (tree, changedRange, modifiedElements, modifiedGroups) {
                var site = this._site;  //This gets all the items
                var tree = site.tree;

                var count = 0;
                for (var groupIndex = 0; groupIndex < tree.length; groupIndex++) {
                    var items = tree[groupIndex].itemsContainer.items;
                    count += items.length;
                }

                var itemWidth = 72;
                var itemHeight = 72;
                var halfItemWidth = itemWidth / 2;
                var halfItemHeight = itemHeight / 2;
                var diameter = Math.min(site.viewportSize.height - itemHeight - halfItemHeight, site.viewportSize.width - itemWidth - halfItemWidth);
                var centerPointY = (site.viewportSize.height - itemHeight) / 2;
                var centerPointX = (site.viewportSize.width - itemWidth) / 2;

                var c = this._spiral ? 20 : count;
                var distanceBetweenItemsInRadians = c ? 2 * Math.PI / c : 0;

                var absoluteItemIndex = 0;

                for (var groupIndex = 0; groupIndex < tree.length; groupIndex++) {
                    var groupBundle = tree[groupIndex];
                    var groupHeader = groupBundle.header;
                    var itemsContainer = groupBundle.itemsContainer;
                    var itemsContainerEl = itemsContainer.element;
                    var items = itemsContainer.items;

                    //This places all items in a circle.
                    var radius = diameter / 2;

                    for (var itemIndex = 0; itemIndex < items.length; itemIndex++) {
                        var container = items[itemIndex];

                        var itemRadius = this._spiral ? (radius * absoluteItemIndex / items.length) : radius;

                        var posX = itemRadius * Math.cos(distanceBetweenItemsInRadians * (count - 1 - absoluteItemIndex) - Math.PI / 2);
                        var posY = itemRadius * Math.sin(distanceBetweenItemsInRadians * (count - 1 - absoluteItemIndex) - Math.PI / 2);

                        container.style.left = centerPointX + "px";
                        container.style.top = centerPointY + "px";

                        if (container.style.opacity === "") {
                            container.style.opacity = "0";
                            container.style.opacity.transition = "none";
                            getComputedStyle(container).opacity;
                            container.style.opacity.transition = "";
                            container.style.opacity = "1";
                        }

                        container.style.transform = "translate(" + posX + 'px, ' + posY + 'px)';

                        absoluteItemIndex++;
                    }
                }

                return WinJS.Promise.as(); // A Promise or {realizedRangeComplete: Promise, layoutComplete: Promise};
            },
        })
    });

})();
