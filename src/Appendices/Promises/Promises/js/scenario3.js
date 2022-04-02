(function () {
    "use strict";

    var page = WinJS.UI.Pages.define("/html/scenario3.html", {
        ready: function (element, options) {
            document.getElementById("btnRun").addEventListener("click", runScenario);
        }
    });


    function runScenario() {
        App.clearOutput();

        //Consumer code (note that the promise isn't explicit)
        doXhrGet("http://kraigbrockschmidt.com/blog/?feed=rss2").then(function (results) {
            App.log("Response length = " + results.responseText.length);
        });

        App.log("returned from promise.then");
    }

    
    //Originator code
    function doXhrGet(uri) {
        return new XhrPromise(uri);
    }

    var XhrPromise = function (uri) {
        this.then = function (completedHandler) {
            var req = new XMLHttpRequest();
            req.onreadystatechange = function () {
                if (req.readyState === 4) {
                    if (req.status >= 200 && req.status < 300) {
                        completedHandler(req);
                    }

                    req.onreadystatechange = function () { };
                }
            };

            req.open("GET", uri, true);
            req.responseType = "";
            req.send();
        }
    }

})();
