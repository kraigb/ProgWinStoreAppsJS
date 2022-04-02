//// THIS CODE AND INFORMATION IS PROVIDED "AS IS" WITHOUT WARRANTY OF
//// ANY KIND, EITHER EXPRESSED OR IMPLIED, INCLUDING BUT NOT LIMITED TO
//// THE IMPLIED WARRANTIES OF MERCHANTABILITY AND/OR FITNESS FOR A
//// PARTICULAR PURPOSE.
////
//// Copyright (c) Microsoft Corporation. All rights reserved

(function () {
    "use strict";
    var page = WinJS.UI.Pages.define("/html/scenario2.html", {
        ready: function (element, options) {
            document.getElementById("check1").addEventListener("click", toggleStyles);
            SdkSample.drawCanvas(document.getElementById("canvas1"), true);

            //This loads SVG markup from a local file to avoid having it inline.
            WinJS.xhr({ url: "/html/graphic.svg", responseType: "text" }).done(function (request) {
                //setInnerHTMLUnsafe is OK because we know the content is coming from our package.
                WinJS.Utilities.setInnerHTMLUnsafe(document.getElementById("svgPlaceholder"), request.response);                
            });
        }
    });

    function toggleStyles() {
        var applyStyles = document.getElementById("check1").checked;

        document.getElementById("image1").className = applyStyles ? "transformImage" : "";
        document.getElementById("canvas1").className = applyStyles ? "scaleCanvas" : "";

        document.getElementById("r").style.fill = applyStyles ? "purple" : "";
        document.getElementById("l").style.stroke = applyStyles ? "green" : "";
        document.getElementById("c").style.fill = applyStyles ? "red" : "";
        document.getElementById("t").style.fontStyle = applyStyles ? "normal" : "";
        document.getElementById("t").style.textDecoration = applyStyles ? "underline" : "";
    }
})();
