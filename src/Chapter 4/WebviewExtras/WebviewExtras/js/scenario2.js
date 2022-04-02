(function () {
    "use strict";

    var webview = null;
    var btnBack = null;
    var btnForward = null;
    
    var page = WinJS.UI.Pages.define("/html/scenario2.html", {
        ready: function (element, options) {
            var btn = document.getElementById("btnCapture");
            btn.addEventListener("click", captureSelection);
            btn.disabled = true;

            //Navigate the left-side webview and enable the button when it's ready
            var webview = document.getElementById("webviewSource");
            
            webview.addEventListener("MSWebViewNavigationCompleted", function () {
                document.getElementById("btnCapture").disabled = false;
            });

            webview.navigate("http://www.kraigbrockschmidt.com/blog");

            //This prevents a black box initially
            document.getElementById("webviewOutput").navigateToString("");
        }
    });

    function captureSelection() {
        var source = document.getElementById("webviewSource");

        //Wrap the capture method in a promise
        var promise = new WinJS.Promise(function (cd, ed) {
            var op = source.captureSelectedContentToDataPackageAsync();
            op.oncomplete = function (args) { cd(args.target.result); };
            op.onerror = function (e) { ed(e); };
            op.start();
        });
        
        //Navigate the output webview to the selection, or show an error
        var output = document.getElementById("webviewOutput");

        promise.then(function (dataPackage) {
            if (dataPackage == null) { throw "No selection"; }

            var view = dataPackage.getView();
            console.log("Formats: " + view.availableFormats);

            return view.getHtmlFormatAsync();
        }).done(function (text) {
            output.navigateToString(text);    
        }, function (e) {
            output.navigateToString("Error: " + e.message);
        });
    }

})();
