(function () {
    "use strict";

    var page = WinJS.UI.Pages.define("/html/scenario2.html", {
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

        //Block UI thread for a longer period than the timeout
        var sum = 0;
        for (var i = 0; i < 500000; i++) {
            sum += i;
        }

        App.log("calculated sum = " + sum);
    }


    //Originator code
    function doSomethingForNothing() {
        return new EmptyPromise();
    }

    //Promise class implementation simulating async results
    var EmptyPromise = function () {
        this._value = { };
        this.then = function (completedHandler) {
            //Simulate async work with a timeout so that we return before calling completedHandler
            setTimeout(completedHandler, 100, this._value);
        }
    }
})();
