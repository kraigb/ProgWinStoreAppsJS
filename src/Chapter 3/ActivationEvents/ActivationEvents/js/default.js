(function () {
    "use strict";

    var app = WinJS.Application;
    var activation = Windows.ApplicationModel.Activation;

    //The next three events are raised from Windows. You can also use the 
    //on* syntax for adding handlers.
    document.addEventListener("DOMContentLoaded", function () {
        console.log("DOMContentLoaded")
    });
    
    var wui = Windows.UI.WebUI.WebUIApplication;
    wui.addEventListener("activated", function () {
        console.log("Windows.UI.WebUI.WebUIApplication.onactivated")
    });

    window.addEventListener("load", function () {
        console.log("window.onload");
    });


    //The WinJS wrapper for DOMContentLoaded
    WinJS.Utilities.ready(function () {
        console.log("WinJS.Utilities.ready callback");
    });

    //The next three events are raised from WinJS in response to the Windows events.
    //You can also use addEventListener with these.

    app.onloaded = function () {
        console.log("WinJS.Application.onloaded")
    }

    app.onactivated = function (args) {
        console.log("WinJS.Application.onactivated")

        if (args.detail.kind === activation.ActivationKind.launch) {
            if (args.detail.previousExecutionState !== activation.ApplicationExecutionState.terminated) {
            } else {
            }
            args.setPromise(WinJS.UI.processAll());
        }

        //Note: In WinJS 2.0 (Windows 8.1), the window.onload will have fired before
        //WinJS.Application.onactivated, so you cannot add a listener to window.onload here.
        //This is a quirk change from WinJS 1.0 (Windows 8) where window.onload fired after
        //WinJS.Application.onactivated and you *could* add an event handler here.
    };

    app.onready = function () {
        console.log("WinJS.Application.onready");
    }

    app.start();
})();
