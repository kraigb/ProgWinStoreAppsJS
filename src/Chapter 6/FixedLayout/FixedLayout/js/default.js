// For an introduction to the Fixed Layout template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkId=232508
(function () {
    "use strict";

    var app = WinJS.Application;
    var activation = Windows.ApplicationModel.Activation;

    app.onactivated = function (args) {
        if (args.detail.kind === activation.ActivationKind.launch) {
            if (args.detail.previousExecutionState !== activation.ApplicationExecutionState.terminated) {
                // TODO: This application has been newly launched. Initialize
                // your application here.
            } else {
                // TODO: This application has been reactivated from suspension.
                // Restore application state here.
            }
            args.setPromise(WinJS.UI.processAll().done(drawCanvas));
        }
    };

    app.oncheckpoint = function (args) {
        // TODO: This application is about to be suspended. Save any state
        // that needs to persist across suspensions here. You might use the
        // WinJS.Application.sessionState object, which is automatically
        // saved and restored across suspension. If you need to complete an
        // asynchronous operation before your application is suspended, call
        // args.setPromise().
    };

    function drawCanvas() {
        var canvas = document.getElementById("canvas1");        
        canvas.width = 1024;
        canvas.height = 768;

        var ctx = canvas.getContext("2d");

        ctx.strokeStyle = "rgb(0, 90, 28)";
        ctx.fillStyle = "rgb(240, 240, 220)";
        var x, y;

        for (var col = 0; col < 4; col++) {
            x = col * 256;            

            for (var row = 0; row < 3; row++) {
                

                //Draw lines
                y = row * 256;
                
                ctx.strokeRect(x, y, 256, 256);
                ctx.fillRect(x, y, 256, 256);

                ctx.save();
                ctx.beginPath();
                ctx.fillStyle = "rgb(100, 120, 170)";
                ctx.arc(x + 128, y + 128, 100, 0, 2 * Math.PI, true);
                ctx.stroke();
                ctx.fill();
                ctx.restore();
            }
        }
    }

    app.start();
})();
