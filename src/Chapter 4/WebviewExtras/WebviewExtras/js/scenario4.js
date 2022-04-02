(function () {
    "use strict";

    var dtm = Windows.ApplicationModel.DataTransfer.DataTransferManager.getForCurrentView();

    var page = WinJS.UI.Pages.define("/html/scenario4.html", {
        ready: function (element, options) {
            // Register handler for the "datarequested" event; be sure to unregister in unload.
            dtm.addEventListener("datarequested", dataRequested);

            document.getElementById("shareButton").disabled = true;
            
            var webview = document.getElementById("webview4");
            webview.addEventListener("MSWebViewNavigationCompleted", navigationCompleted);
            webview.navigate("http://www.kraigbrockschmidt.com/blog");

            document.getElementById("shareButton").addEventListener("click", showShareUI, false);
        },
        unload: function () {
            // Unregister the event handler to prevent memory leaks            
            dtm.removeEventListener("datarequested", dataRequested);
        }
    });

    function navigationCompleted(e) {
        if (e.isSuccess) {
            document.getElementById("shareButton").disabled = false;
        } else {
            WinJS.log && WinJS.log("Webview navigation failed with error code " + e.webErrorStatus, "sdksample", "error");
        }
    }

    function showShareUI() {
        Windows.ApplicationModel.DataTransfer.DataTransferManager.showShareUI();
    }

    //Wrap the webview's capture methods promises.
    function getWebviewSelectionAsync(webview) {
        return new WinJS.Promise(function (cd, ed) {
            var op = webview.captureSelectedContentToDataPackageAsync();
            op.oncomplete = function (args) { cd(args.target.result); };
            op.onerror = function (e) { ed(e); };
            op.start();
        });
    }

    function getWebviewBitmapAsync(webview) {
        return new WinJS.Promise(function (cd, ed) {
            var op = webview.capturePreviewToBlobAsync();

            op.oncomplete = function (args) {
                var ras = Windows.Storage.Streams.RandomAccessStreamReference;
                var bitmapStream = ras.createFromStream(args.target.result.msDetachStream());
                cd(bitmapStream);                
            };

            op.onerror = function (e) { ed(e); };
            op.start();
        });
    }


    function dataRequested(e) {
        var webview = document.getElementById("webview4");
        var dataPackage = e.request.data;

        //Obtain a deferral
        var deferral = e.request.getDeferral();
     
        //Set the data package's properties.  These are displayed within the Share UI
        //to give the user an indication of what is being shared.  They can also be
        //used by target apps to determine the source of the data. 
        dataPackage.properties.title = webview.documentTitle;
        dataPackage.properties.description = "Content shared from Webview";
        dataPackage.properties.applicationName = "Webview Extras Example";

        //Web link is the same as the webview's source URI.
        dataPackage.properties.contentSourceWebLink = new Windows.Foundation.Uri(webview.src);

        //To support app links in Share, the app typically uses protocol activation with
        //a custom protocol.
        var applink = "progwin-js-webviewextras:navigate?page=ShareWebview";
        dataPackage.properties.contentSourceApplicationLink = new Windows.Foundation.Uri(applink);

        // Set the data being shared from the webview's selection, or else use the whole webview.
        getWebviewSelectionAsync(webview).then(function (selectionPackage) {            
            if (selectionPackage != null) {
                //There's a selection, so use that as the data package. First copy the key
                //properties from the original package to the new one.
                var props = ["title", "description", "applicationName", "contentSourceWebLink", "contentSourceApplicationLink"];

                for (var i = 0; i < props.length; i++ ) {
                    selectionPackage.properties[props[i]] = dataPackage.properties[props[i]];
                }
                
                //Now provide the webview's package as a whole for the data
                e.request.data = selectionPackage;

                //We return a promise to make a chain; in this case we just return a Boolean
                //indicating what was rendered (true for selection).
                return WinJS.Promise.as(true);
            } else {
                //With no selection, render the whole webview and provide its URI as text.
                dataPackage.setText(webview.src);
                dataPackage.setUri(new Windows.Foundation.Uri(webview.src));

                return getWebviewBitmapAsync(webview).then(function (bitmapStream) {
                    dataPackage.setBitmap(bitmapStream);                    
                    return false;
                });
            }
        }).done(function (selectionRendered) {
            //Be sure to complete the deferral on success or error either way
            WinJS.log && WinJS.log("Selection rendered: " + selectionRendered, "app");
            deferral.complete();
        }, function (e) {
            deferral.complete();
        });
    }

})();
