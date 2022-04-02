(function () {
    "use strict";
    var page = WinJS.UI.Pages.define("/html/scenario8.html", {
        ready: function (element, options) {
            document.getElementById("btnRun").addEventListener("click", runScenario);
        }
    });

    function runScenario() {
        App.clearOutput();

        //This just avoids having the prefix everywhere
        var calculateIntegerSum = App.calculateIntegerSum;

        getDesiredCount().then(function (count) {
            return calculateIntegerSum(count, 500);
        }).then(function (sum1) {
            App.log("calculated first sum = " + sum1);
            return calculateIntegerSum(sum1, 500);
        }).then(function (sum2) {
            App.log("calculated second sum = " + sum2);
        });

        //A little consumer code to test error conditions for calculateIntegerSum
        var pErr = calculateIntegerSum(0, 1).then(function (sum) {
            App.log("calculateIntegerSum(0, 1) fulfilled with " + sum);
            return "Value from completed handler (not used).";
        }, function (err) {
            App.log("calculateIntegerSum(0, 1) failed with error: '" + err.name + ", " + err.message + "'");
            return "Value from error handler.";
        });


        //Because the error handler above returns a value, pErr will be completed with that value.
        pErr.then(function (result) {
            console.log(result);
        }, function (e) {
            console.log(e.message);
        });

        //Additional code to test cancellation behaviors.

        //This first case test cancellation after operation has started
        var promise = calculateIntegerSum(1000, 10).then(function (sum) {
            App.log("calculateIntegerSum(1000, 10) fulfilled with " + sum);                        
        }, function (err) {
            App.log("calculateIntegerSum(1000, 10) failed with error: '" + err.name + ", " + err.message + "'");
        });

        promise.cancel();

        //This first case tests cancellation after the operation has already been fulfilled,
        //showing that the promise is still put into the error state.
        var promise2 = calculateIntegerSum(2000, 15).then(function (sum) {
            App.log("calculateIntegerSum(2000, 15) fulfilled with " + sum);

            App.log("canceling promise2 and calling then again");
            promise2.cancel();
            promise2.then(function () {
                App.log("calculateIntegerSum(2000, 15) - already complete - fulfilled with " + sum);
            }, function (err) {
                App.log("calculateIntegerSum(2000, 15) - already complete - failed with error: '" + err.name + ", " + err.message + "'");
            });
        }, function (err) {
            App.log("calculateIntegerSum(2000, 15) failed with error: '" + err.name + ", " + err.message + "'");
        });
    }


    function getDesiredCount() {
        return WinJS.Promise.timeout(100)
            .then(function () {
                return 1000;
            });
    }

})();

