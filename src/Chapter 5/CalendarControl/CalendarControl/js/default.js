(function () {
    "use strict";

    var app = WinJS.Application;
    var activation = Windows.ApplicationModel.Activation;

    app.onactivated = function (args) {
        if (args.detail.kind === activation.ActivationKind.launch) {
            if (args.detail.previousExecutionState !== activation.ApplicationExecutionState.terminated) {
            } else {
            }

            args.setPromise(WinJS.UI.processAll().done(function () {
                //Calendar1's dateselected handler is set in markup; notice that we use
                //WinJS.UI.eventHandler to define that function below, making it safe for
                //processing in markup.
                }));

            //Since we're creating this calendar in code, we're independent of WinJS.UI.processAll.
            var element = document.getElementById("calendar2");

            //Since we're providing an element, this will be automatically added to the DOM
            var calendar2 = new Controls.Calendar(element);

            //Since this handler is not part of markup processing, it doesn't need to be marked
            calendar2.ondateselected = function (e) {
                document.getElementById("message").innerText = JSON.stringify(e.detail) + " selected";
            }

            //Wire up an event to dispose of the second calendar            
            document.getElementById("btnDispose").addEventListener("click", function (e) {
                calendar2.dispose();

                //At this point, the custom control is disposed, but the root element
                //remains, so we'll hide it and the button
                e.target.parentElement.style.visibility = "hidden";
            })
        }
    };

    app.oncheckpoint = function (args) {
    };

    app.start();

    //Use a namespace to export a handler we'll reference from markup
    WinJS.Namespace.define("CalendarDemo", {
        dateselected: WinJS.UI.eventHandler(function (e) {
            document.getElementById("message").innerText = JSON.stringify(e.detail) + " selected";
        })
    });

})();
