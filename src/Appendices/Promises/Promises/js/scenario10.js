(function () {
    "use strict";
    var page = WinJS.UI.Pages.define("/html/scenario10.html", {
        ready: function (element, options) {
            document.getElementById("btnRun").addEventListener("click", runScenario);
        }
    });

    function runScenario() {
        App.clearOutput();

        //This just avoids having the prefix everywhere
        var calculateIntegerSum = App.calculateIntegerSum;

        //This op function attached other arguments to each call
        var op = function (arg) { return calculateIntegerSum(arg, 100); };

        //The arguments we want to process
        var args = [1000000, 500000, 300000, 150000, 50000, 10000];

        //This code creates a parameterized promise chain from the array of args and the async call
        //in op. By using WinJS.Promise.as for the initializer we can just call p.then inside
        //the callback.
        var endPromise = args.reduce(function (p, arg) {
            return p.then(function (r) {
                //The first result from WinJS.Promise.as will be undefined, so skip logging
                if (r !== undefined) { App.log("operation completed with results = " + r) };

                return op(arg);
            });
        }, WinJS.Promise.as());

        //endPromise is fulfilled with the last operation's results when the whole chain is complete.
        endPromise.done(function (r) {
            App.log("Final promise complete with results = " + r);
        }); 
    }

})();

