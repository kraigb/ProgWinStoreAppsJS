﻿(function () {
    "use strict";
    var page = WinJS.UI.Pages.define("/html/scenario9.html", {
        processed: function (element, options) {
            // WinJS.UI.processAll() is automatically called by the Pages infrastructure by the time this
            // function gets called, and it has processed the div with data-win-control="WinJS.UI.FlipView"

            initialize();
        }
    });

    function initialize() {
        var myFlipView = document.getElementById("pictures_FlipView").winControl;

        //This data source crawls the Pictures library. If we wanted more control, like not
        //going into all the folders, we'd need to create a file query ourselves.
        myFlipView.itemDataSource = new WinJS.UI.StorageDataSource("Pictures"); 
    }

    //A marked-for-processing renderer that can be specified in markup.
    //This isn't used by default in this example -- see default.html
    WinJS.Namespace.define("Renderers", {
        thumbFlip: WinJS.Utilities.markSupportedForProcessing(function (itemPromise) {
            return itemPromise.then(buildElement);
        })
    });


    //A renderer for the items 
    function thumbFlipRenderer(itemPromise) {
        //This is a simple renderer; it would be better to delay-load the thumbnail which can be done
        //with the placeholder renderer below.
        
        return itemPromise.then(buildElement);

        /*
        //To use this placeholder renderer, make the changes indicated in buildElement below

        var result = buildElement();
        var img = result.querySelector("img");
        var title = result.querySelector(".ItemTitle");

        return {
            element: element,
            renderComplete: itemPromise.then(function (item) {
                title.innerText = item.data.name;
                return item.ready;
            }).then(function(item) {
                return WinJS.UI.StorageDataSource.loadThumbnail(item, img).then();
            })            
        }
        */
    };

    //The function that builds an actual element tree
    //If using a placeholder renderer, the item parameter isn't needed
    function buildElement(item) {
        var result = document.createElement("div");
        result.className = "overlaidItemTemplate";
       
        var innerHTML = "<img class='thumbImage'>";
        innerHTML += "<div class='overlay'>";     
        innerHTML += "<h3 class='ItemTitle'>" + item.data.name + "</h2>";

        //Since we won't have the item with a placeholder renderer, replace the line above with this one.
        //The item name will be available when the itemPromise is fulfilled.
        //innerHTML += "<h3 class='ItemTitle'></h3>";

        innerHTML += "</div>";

        result.innerHTML = innerHTML;

        //Comment out the following two lines if using a placeholder renderer.
        //Set up a listener for thumbnailUpdated that will render to our img element
        var img = result.querySelector("img");
        WinJS.UI.StorageDataSource.loadThumbnail(item, img).then();

        return result;
    }

})();
