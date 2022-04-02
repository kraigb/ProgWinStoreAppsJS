
(function () {
    "use strict";

    var app = WinJS.Application;
    var activation = Windows.ApplicationModel.Activation;

    var view = null;
    var viewProjection = null;
    var vm = Windows.UI.ViewManagement;
    var projMan = null;
    var btnStart = null, btnStop = null, btnSwap = null, btnSend = null;

    var msgCount = 0;

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

            //Get our view
            view = vm.ApplicationView.getForCurrentView();

            projMan = vm.ProjectionManager;

            btnStart = document.getElementById("btnStart");
            btnStop = document.getElementById("btnStop");
            btnSwap = document.getElementById("btnSwap");
            btnSend = document.getElementById("btnSendToProjection");
            
            btnStart.addEventListener("click", startProjection);
            btnStop.addEventListener("click", stopProjection);
            btnSwap.addEventListener("click", swapProjection);
            disableStopSwapSend(true);

            projMan.onprojectiondisplayavailablechanged = function () {
                checkEnableProjection();
            }

            //Set up messaging
            btnSend.addEventListener("click", sendMessage);
            window.onmessage = showMessage;
        }
    };


    function disableStopSwapSend(disable) {        
        btnStop.disabled = disable;
        btnSwap.disabled = disable;
        btnSend.disabled = disable;
    }

    function checkEnableProjection() {                
        btnStart.disabled = !projMan.projectionDisplayAvailable;
    }

    function startProjection() {
        //Create a new view. This will cause the HTML file and its references to load,
        //and you can hold the view in this state indefinitely before starting projection.
        viewProjection = MSApp.createNewView("ms-appx:///projection/projection.html");

        projMan.startProjectingAsync(viewProjection.viewId, view.id).done(function () {
            disableStopSwapSend(false);
            btnStart.disabled = true;
        });
    }

    function stopProjection() {
        projMan.stopProjectingAsync(viewProjection.viewId, view.id).done(function () {
            checkEnableProjection();
            disableStopSwapSend(true);
        });
    }

    function swapProjection() {
        projMan.swapDisplaysForViewsAsync(viewProjection.viewId, view.id);
    }

    function sendMessage() {        
        var date = new Date();
        var timeString = date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds() + ":" + date.getMilliseconds();
        var msgObj = { text: timeString };
        viewProjection.postMessage(JSON.stringify(msgObj), document.location.protocol + "//" + document.location.host);
    }

    function showMessage(msg) {
        var data = JSON.parse(msg.data);

        switch (data.type) {
            case "close":
                checkEnableProjection();
                disableStopSwapSend(true);
                break;

            case "info":
            default:
                msgCount++;
                document.getElementById("messageCount").innerText = msgCount;
                document.getElementById("messageOutput").innerText = data.text;
        }
    }

    app.start();
})();
