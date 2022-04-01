//// THIS CODE AND INFORMATION IS PROVIDED "AS IS" WITHOUT WARRANTY OF
//// ANY KIND, EITHER EXPRESSED OR IMPLIED, INCLUDING BUT NOT LIMITED TO
//// THE IMPLIED WARRANTIES OF MERCHANTABILITY AND/OR FITNESS FOR A
//// PARTICULAR PURPOSE.
////
//// Copyright (c) Microsoft Corporation. All rights reserved

(function () {
    "use strict";

    var sampleTitle = "File search JS sample (modified)";

    var scenarios = [
        { url: "/html/scenario1.html", title: "Obtain all files that match a search query" },
        { url: "/html/scenario2.html", title: "Default search queries" },
        { url: "/html/scenario3.html", title: "Deep queries with ordering" },
        { url: "/html/scenario4.html", title: "Music (mp3) query with options" }        
    ];

    function activated(eventObject) {
        if (eventObject.detail.kind === Windows.ApplicationModel.Activation.ActivationKind.launch) {
            // Use setPromise to indicate to the system that the splash screen must not be torn down
            // until after processAll and navigate complete asynchronously.
            eventObject.setPromise(WinJS.UI.processAll().then(function () {
                // Navigate to either the first scenario or to the last running scenario
                // before suspension or termination.
                var url = WinJS.Application.sessionState.lastUrl || scenarios[0].url;
                return WinJS.Navigation.navigate(url);
            }));
        }
    }

    WinJS.Navigation.addEventListener("navigated", function (eventObject) {
        var url = eventObject.detail.location;
        var host = document.getElementById("contentHost");
        // Call unload method on current scenario, if there is one
        host.winControl && host.winControl.unload && host.winControl.unload();
        WinJS.Utilities.empty(host);
        eventObject.detail.setPromise(WinJS.UI.Pages.render(url, host, eventObject.detail.state).then(function () {
            WinJS.Application.sessionState.lastUrl = url;
        }));
    });

    function showResults(promise) {
        var outputDiv = document.getElementById("output");

        if (!promise) {
            outputDiv.innerHTML = "Invalid query (async operation returned null).";
        }

        promise.done(function (items) {
            if (items.size === 0) {
                outputDiv.innerHTML = "No items found.";
            } else {
                // Create an output string to hold results count and item names
                var itemsLabel = (items.size === 1) ? "item" : "items";
                var output = "<b>" + items.size + " " + itemsLabel + " found</b><br>";

                // Iterate through the results and print each filename to the output field
                items.forEach(function (item) {
                    output += item.name + "<br>";
                });

                outputDiv.innerHTML = output;
            }
        });
    }

    WinJS.Namespace.define("SdkSample", {
        sampleTitle: sampleTitle,
        scenarios: scenarios,
        showResults: showResults
    });


    WinJS.Application.addEventListener("activated", activated, false);
    WinJS.Application.start();
})();
