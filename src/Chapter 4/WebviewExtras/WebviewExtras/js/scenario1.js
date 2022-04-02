(function () {
    "use strict";
    var page = WinJS.UI.Pages.define("/html/scenario1.html", {
        ready: function (element, options) {
            var baseURI = "http://www.kraigbrockschmidt.com/images/";            
            var content = "<!doctype HTML>";

            //Refer to an in-package stylesheet (or one in ms-appdata:/// or http[s]://)
            content += "<head><link rel='stylesheet' href='ms-appx-web:///css/localstyles.css' /></head>";
            content += "<html><body><h1>Dynamically-created page</h1>";
            content += "<p>This document contains its own styles as well as a remote image references.</p>"
            content += "<img src='" + baseURI + "Cover_ProgrammingWinApps-2E.jpg' />";
            content += "<img src='" + baseURI + "Cover_ProgrammingWinApps-1E.jpg' />";
            content += "<img src='" + baseURI + "Cover_MysticMicrosoft.jpg' />";
            content += "<img src='" + baseURI + "Cover_FindingFocus.jpg' />";
            content += "<img src='" + baseURI + "Cover_HarmoniumHandbook2.jpg' />";
            content += "<br/><p>img element with link to in-package file</p>";
            content += "<img src='ms-appx-web:///images/logo.png' />";
            content += "</body></html>";

            //One way to navigate using this content.
            //var webview = document.getElementById("webview");
            //webview.navigateToString(content);

            //Another way is to write it to an appdata file and navigate to that.
            var local = Windows.Storage.ApplicationData.current.localFolder;

            local.createFolderAsync("pages", Windows.Storage.CreationCollisionOption.openIfExists).then(function (folder) {
                return folder.createFileAsync("dynamicPage.html", Windows.Storage.CreationCollisionOption.replaceExisting);
            }).then(function (file) {
                return Windows.Storage.FileIO.writeTextAsync(file, content);
            }).then(function () {
                var webview = document.getElementById("webview1");
                webview.navigate("ms-appdata:///local/pages/dynamicPage.html");                
            }).done(null, function (e) {
                WinJS.log && WinJS.log("failed to create dynamicPage.html, err = " + e.message, "app");
            });
        }        
    });
})();