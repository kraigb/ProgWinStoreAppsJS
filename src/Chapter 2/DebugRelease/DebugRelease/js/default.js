(function () {
    "use strict";

    var app = WinJS.Application;
    var activation = Windows.ApplicationModel.Activation;

    //BuildInfo namespace will have some properties from builddefs.js

    app.onactivated = function (args) {
        if (args.detail.kind === activation.ActivationKind.launch) {
            if (args.detail.previousExecutionState !== activation.ApplicationExecutionState.terminated) {
            } else {
            }
            args.setPromise(WinJS.UI.processAll().then(function () {
                //Show build type from App.build defined in builddefs.js
                document.getElementById("txtBuild").textContent = BuildInfo.config;

                //Debug.debuggerAttached tells you if a debugger is attached, but not which release you're running.
                //The !! will convert undefined to false if needed.
                document.getElementById("txtDebugger").textContent = !!Debug.debuggerEnabled;
            }));
        }
    };
   
   
    app.start();
})();
