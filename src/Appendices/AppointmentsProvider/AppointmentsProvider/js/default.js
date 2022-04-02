(function () {
    "use strict";

    var app = WinJS.Application;
    var activation = Windows.ApplicationModel.Activation;
    var verbs = Windows.ApplicationModel.Appointments.AppointmentsProvider.AppointmentsProviderLaunchActionVerbs;

    app.onactivated = function (args) {
        var outputElement = document.getElementById("outputElement");

        if (args.detail.kind === activation.ActivationKind.appointmentsProvider) {
            if (args.detail.verb == verbs.showTimeFrame) {
                var output = "Activated for showTimeFrame verb.<br/>";
                output += "Duration = " + args.detail.duration + "ms<br/>"
                output += "TimeFrame = " + args.detail.timeToShow;
                outputElement.innerHTML = output;
            }
            args.setPromise(WinJS.UI.processAll());
        }

        if (args.detail.kind === activation.ActivationKind.launch) {
            if (args.detail.previousExecutionState !== activation.ApplicationExecutionState.terminated) {
                // TODO: This application has been newly launched. Initialize
                // your application here.
            } else {
                // TODO: This application has been reactivated from suspension.
                // Restore application state here.
            }
            outputElement.innerHTML = "App was launched normally."
            args.setPromise(WinJS.UI.processAll());
        }
    };

    app.start();
})();
