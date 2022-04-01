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
            document.getElementById("check1").addEventListener("click", toggleScaling);
            SdkSample.drawScaleCanvas(document.getElementById("canvas1"), false);
            SdkSample.drawScaleCanvas(document.getElementById("canvas2"), false);            
        }
    });

    function toggleScaling() {
        var applyScaling = document.getElementById("check1").checked;

        //Canvas1 we'll scale via CSS
        document.getElementById("canvas1").className = applyScaling ? "scaleImage" : "";

        //Canvas2 we'll scale by resizing the element and redrawing it
        var canvas2 = document.getElementById("canvas2");
        SdkSample.drawScaleCanvas(canvas2, applyScaling);
    }

})();
