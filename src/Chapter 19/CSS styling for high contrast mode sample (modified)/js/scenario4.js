//// THIS CODE AND INFORMATION IS PROVIDED "AS IS" WITHOUT WARRANTY OF
//// ANY KIND, EITHER EXPRESSED OR IMPLIED, INCLUDING BUT NOT LIMITED TO
//// THE IMPLIED WARRANTIES OF MERCHANTABILITY AND/OR FITNESS FOR A
//// PARTICULAR PURPOSE.
////
//// Copyright (c) Microsoft Corporation. All rights reserved

(function () {
    "use strict";
    
    var page = WinJS.UI.Pages.define("/html/scenario4.html", {
        ready: function (element, options) {
            var accSet = new Windows.UI.ViewManagement.AccessibilitySettings();

            accSet.addEventListener("highcontrastchanged", function (e) {
                var image = document.getElementById("buttonImage");

                // Basic code to change between standard and high contrast, but this doesn't accomodate
                // switching between contrast modes and the change might not be picked up by the resource
                // loader by the time the image.src is set.                

                //Use the scheme name (sans whitespace) as the dummy URI parameter to force refresh of the
                //img element.                 
                var params = e.target.highContrast ? "?" + e.target.highContrastScheme.replace(/\s*/g, "") : "";
                console.log("Contrast changed; params = " + params);
                image.src = "../button.svg" + params;

                /* Another way to approach this...

                // This code just sets the img.src explicitly based on the contrast mode.
                var file = "../button";

                if (e.target.highContrast) {
                    if (e.target.highContrastScheme == "High Contrast White") {
                        file += ".contrast-white";
                    } else {
                        //Assume black for anything other than white
                        file += ".contrast-black";
                    }
                } else {
                    file += ".contrast-standard";
                }

                console.log("Contrast changed; new file = " + file + ".svg");
                image.src = file + ".svg";

                */
            });
        }
    });
})();
