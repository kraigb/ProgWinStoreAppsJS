(function () {
    "use strict";

    var page = WinJS.UI.Pages.define("/html/scenario1.html", {
        ready: function (element, options) {
            document.getElementById("btnRun").addEventListener("click", runScenario);            
        }
    });

    function runScenario() {
        App.clearOutput();

        //Consumer code
        var promise = doSomethingForNothing();
        App.log("promise created");

        promise.then(function (results) {
            App.log(JSON.stringify(results, null, 4));
        });

        App.log("returned from promise.then");
    }


    //Originator code
    function doSomethingForNothing() {
        return new EmptyPromise();
    }

    //Promise class implementation using existing results
    var EmptyPromise = function () {
        this._value = { };
        this.then = function (completedHandler) {
            completedHandler(this._value);            
        }
    }

})();