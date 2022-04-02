(function () {
    "use strict";
    var page = WinJS.UI.Pages.define("/html/scenario9.html", {
        ready: function (element, options) {
            document.getElementById("btnRun").addEventListener("click", runScenario);
        }
    });

    function runScenario() {
        App.clearOutput();

        //This just avoids having the prefix everywhere
        var calculateIntegerSum = App.calculateIntegerSum;

        //The arguments we want to process; the calculation lengths are different so we can track sequential results
        var args = [10000, 100000, 300000, 50000, 150000, 500000];
        
        //This works by joining the next operation in line with the join of all the previous ones
        args.reduce(function (prev, arg, i) {
            var result = calculateIntegerSum(arg, 500);
            return WinJS.Promise.join({ prev: prev, result: result }).then(function (v) {
                App.log(i + ", arg: " + arg+ ", " + v.result);
            });
        })
    }

})();

