//// THIS CODE AND INFORMATION IS PROVIDED "AS IS" WITHOUT WARRANTY OF
//// ANY KIND, EITHER EXPRESSED OR IMPLIED, INCLUDING BUT NOT LIMITED TO
//// THE IMPLIED WARRANTIES OF MERCHANTABILITY AND/OR FITNESS FOR A
//// PARTICULAR PURPOSE.
////
//// Copyright (c) Microsoft Corporation. All rights reserved

(function () {
    "use strict";
    var page = WinJS.UI.Pages.define("/html/scenario3.html", {
        ready: function (element, options) {
            document.getElementById("check1").addEventListener("click", toggleScaling);
        }
    });

    function toggleScaling() {
        var applyScaling = document.getElementById("check1").checked;
        document.getElementById("image1").className = applyScaling ? "scaleImage" : "";
        document.getElementById("image2").className = applyScaling ? "scaleImage" : "";
    }

})();
