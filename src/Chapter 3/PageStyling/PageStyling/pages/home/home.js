(function () {
    "use strict";

    WinJS.UI.Pages.define("/pages/home/home.html", {
        // This function is called whenever a user navigates to this page. It
        // populates the page elements with the app's data.
        ready: function (element, options) {            
            document.getElementById("btn2").onclick = function () {
                WinJS.Navigation.navigate("/pages/page2/page2.html");
            }
        }
    });
})();
