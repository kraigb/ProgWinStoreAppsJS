(function () {
    "use strict";

    var app = WinJS.Application;
    var activation = Windows.ApplicationModel.Activation;
    var btnClose = null, btnSend = null;
    var thisView = null;
    var opener = null;
    var msgCount = 0;
    
    var domain = document.location.protocol + "//" + document.location.host;

    app.onactivated = function (args) {
        if (args.detail.kind === activation.ActivationKind.launch) {
            if (args.detail.previousExecutionState !== activation.ApplicationExecutionState.terminated) {
                // TODO: This application has been newly launched. Initialize
                // your application here.
            } else {
                // TODO: This application has been reactivated from suspension.
                // Restore application state here.
            }
            args.setPromise(WinJS.UI.processAll());

            btnClose = document.getElementById("btnClose");
            btnSend = document.getElementById("btnSendToPrimary");

            msgCount = 0;
            opener = MSApp.getViewOpener();

            //Close button will inform the primary view and close this one.
            btnClose.addEventListener("click", function () {
                sendCloseMessage();
                window.close();
            });

            //We also want to listen for being closed by the user and let the primary view know.
            thisView = Windows.UI.ViewManagement.ApplicationView.getForCurrentView();
            thisView.onconsolidated = function () {
                sendCloseMessage();
            }

            //Set up messaging
            btnSend.addEventListener("click", sendMessage);
            window.onmessage = showMessage;
        }
    }


    function sendMessage() {
        var date = new Date();
        var timeString = date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds() + ":" + date.getMilliseconds();
        var msgObj = { type: "info", text: timeString };
        opener.postMessage(JSON.stringify(msgObj), domain);
    }

    function sendCloseMessage() {
        var msgObj = { type: "close" };
        opener.postMessage(JSON.stringify(msgObj), domain);
    }

    function showMessage(msg) {
        msgCount++;
        document.getElementById("messageCount").innerText = msgCount;

        var data = JSON.parse(msg.data);
        document.getElementById("messageOutput").innerText = data.text;
    }

    app.start();
})();
