(function () {
    "use strict";
    var page = WinJS.UI.Pages.define("/html/scenario7.html", {
        ready: function (element, options) {
            document.getElementById("btnRun").addEventListener("click", runScenario);
        }
    });

    function runScenario() {
        App.clearOutput();

        App.log("Case 1: calling WinJS.Promise.as(<string>)");
        var p1 = WinJS.Promise.as("Value 1");
        p1.then(function (value) {
            App.log("Case 1 fulfilled with " + JSON.stringify(value, null, 4));
        });

        App.log("Case 2: calling WinJS.Promise.as(<promise>)");
        var p2 = WinJS.Promise.as(p1);
        p2.then(function (value) {
            App.log("Case 2 fulfilled with " + JSON.stringify(value, null, 4));
        });

        App.log("Case 3: calling WinJS.Promise.timeout(2000) [two-second delay]");
        var p3 = WinJS.Promise.timeout(2000);       
        p3.then(function () {
            App.log("Case 5 fulfilled (no results)");
        });

        App.log("Case 4: using WinJS.Promise.timeout(1000) [one-second delay] to wrap a value (12345) to deliver");
        var p4 = WinJS.Promise.timeout(1000).then(function () {
            return 12345;
        });

        p4.then(function (value) {
            App.log("Case 4 fulfilled with " + value);
        });

        App.log("Case 5: calling WinJS.Promise.as(<async promise>)");
        var p5 = WinJS.Promise.as(p5);
        p5.then(function (value) {
            App.log("Case 5 fulfilled with " + JSON.stringify(value, null, 4));
        });

        App.log("Cases 6 and 7: creating three timeout promises for 3, 4, and 5 seconds, with fulfillment values of 3333, 4444, and 5555");
        var p6a = new WinJS.Promise.timeout(3000).then(function () { return 3333; });
        var p6b = new WinJS.Promise.timeout(4000).then(function () { return 4444; });
        var p6c = new WinJS.Promise.timeout(5000).then(function () { return 5555; });
        var p6All = [p6a, p6b, p6c];

        App.log("Case 6: calling WinJS.Promise.join([p6a, p6b, p6c])");        
        var p6 = WinJS.Promise.join(p6All);
        p6.then(function (value) {
            App.log("Case 6 fulfilled with " + JSON.stringify(value, null, 4));
        });

        App.log("Case 7: calling WinJS.Promise.any([p6a, p6b, p6c])");
        var p7 = WinJS.Promise.any(p6All);
        p7.then(function (value) {
            App.log("Case 7 fulfilled with " + JSON.stringify(value, null, 4));
        });

        App.log("Case 8: calling WinJS.xhr");
        var p8 = WinJS.xhr({ url: "http://kraigbrockschmidt.com/blog/?feed=rss2" });
        p8.then(function (results) {
            App.log("Case 8 complete, response length = " + results.response.length);
        },
        function (err) {
            App.log("Case 8: error in request: " + JSON.stringify(err, null, 4));
        },
        function (partialResult) {
            App.log("Case 8 progress, response length = " + partialResult.response.length);
        });

    }

})();

