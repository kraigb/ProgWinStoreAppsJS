(function () {
    "use strict";
    var page = WinJS.UI.Pages.define("/html/scenario4.html", {
        ready: function (element, options) {
            document.getElementById("btnRun").addEventListener("click", runScenario);
        }
    });

    function runScenario() {
        App.clearOutput();

        //Consumer code
        var promise = doXhrGet("http://kraigbrockschmidt.com/blog/?feed=rss2");
        App.log("promise created");

        //Listen to promise with all the handlers (as separate functions for clarity)
        promise.then(completedHandler, errorHandler, progressHandler);
        App.log("returned from first promise.then call");

        //Listen again with a second anonymous completed handler, the same error
        //handler, and a null progress handler to test then's reentrancy.
        promise.then(function (results) {
            App.log("second completed handler called, response length = " + results.response.length);            
        }, errorHandler, null);

        App.log("returned from second promise.then call");
    }

    function completedHandler (results) {
        App.log("operation complete, response length = " + results.response.length);
    }

    function errorHandler (err) {
        App.log("error in request");
    }

    function progressHandler (partialResult) {
        App.log("progress, response length = " + partialResult.response.length);
    }


    //Originator code
    function doXhrGet(uri) {
        return new XhrPromise(uri);
    }

    //This class improves upon scenario 3 with better robustness and support
    //for error and progress handlers. It also supports multiple consumers
    //(multiple calls to then)
    var XhrPromise = function (uri) {
        this._req = null;

        //Handler lists
        this._cList = [];
        this._eList = [];
        this._pList = [];

        this.then = function (completedHandler, errorHandler, progressHandler) {
            var firstTime = false;
            var that = this;

            //Only create one operation for this promise
            if (!this._req) {
                this._req = new XMLHttpRequest();
                firstTime = true;
            }

            //Save handlers in their respective arrays
            completedHandler && this._cList.push(completedHandler);
            errorHandler && this._eList.push(errorHandler);
            progressHandler && this._pList.push(progressHandler);
            
            this._req.onreadystatechange = function () {
                var req = that._req;
                if (req._canceled) { return; }

                if (req.readyState === 4) {  //Complete
                    if (req.status >= 200 && req.status < 300) {
                        that._cList.forEach(function (handler) {
                            handler(req);
                        });
                    } else {
                        that._eList.forEach(function (handler) {
                            handler(req);
                        });
                    }

                    req.onreadystatechange = function () { };
                } else {
                    if (req.readyState === 3) {  //Some data received
                        that._pList.forEach(function (handler) {
                            handler(req);
                        });
                    }
                }
            };

            //Only start the operation on the first call to then
            if (firstTime) {
                this._req.open("GET", uri, true);
                this._req.responseType = "";
                this._req.send();
            }
        };

        this.cancel = function () {
            if (this._req != null) {
                this._req._canceled = true;
                this._req.abort;
            }
        }
    }

})();
