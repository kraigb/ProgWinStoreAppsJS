//// THIS CODE AND INFORMATION IS PROVIDED "AS IS" WITHOUT WARRANTY OF
//// ANY KIND, EITHER EXPRESSED OR IMPLIED, INCLUDING BUT NOT LIMITED TO
//// THE IMPLIED WARRANTIES OF MERCHANTABILITY AND/OR FITNESS FOR A
//// PARTICULAR PURPOSE.
////
//// Copyright (c) Microsoft Corporation. All rights reserved

(function () {
    "use strict";

    var sampleTitle = "FlipView control sample (modified)";

    var scenarios = [
        { url: "/html/simpleflipview.html", title: "FlipView populated using a simple JSON data source and template" },
        { url: "/html/orientationAndItemSpacing.html", title: "Orientation and ItemSpacing" },
        { url: "/html/interactiveContent.html", title: "Using interactive content" },
        { url: "/html/contextControl.html", title: "Creating a Context Control" },
        { url: "/html/stylingButtons.html", title: "Styling Navigation Buttons" },
        { url: "/html/itemTemplatesAndDataSources.html", title: "Item Templates & Data Sources" },
        { url: "/html/controlEvents.html", title: "Control Events" },

        //Added scenarios from the original SDK sample
        { url: "/html/scenario8.html", title: "FlipView for the Pictures Library (declarative template)" },
        { url: "/html/scenario9.html", title: "FlipView for the Pictures Library (template renderer function)" }
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

    WinJS.Namespace.define("SdkSample", {
        sampleTitle: sampleTitle,
        scenarios: scenarios
    });

    WinJS.Application.addEventListener("activated", activated, false);
    WinJS.Application.start();
})();
