(function () {
    "use strict";

    var app = WinJS.Application;
    var activation = Windows.ApplicationModel.Activation;

    app.onactivated = function (args) {
        if (args.detail.kind === activation.ActivationKind.launch) {
            if (args.detail.previousExecutionState !== activation.ApplicationExecutionState.terminated) {
            } else {
            }
            args.setPromise(WinJS.UI.processAll().done(drawCanvas));
        }
    };


    //Code to scale the layout div using CSS transforms to maintain a fixed aspect ratio
    window.onresize = resizeLayout;

    function resizeLayout(e) {
        var viewbox = document.getElementById("viewbox");
        
        var w = window.innerWidth;
        var h = window.innerHeight;
        var bw = viewbox.clientWidth;
        var bh = viewbox.clientHeight;
        var wRatio = w / bw;
        var hRatio = h / bh;
        var mRatio = Math.min(wRatio, hRatio);
        var transX = Math.abs(w - (bw * mRatio)) / 2; 
        var transY = Math.abs(h - (bh * mRatio)) / 2; 
        viewbox.style["transform"] = "translate(" + transX + "px," + transY + "px) scale(" + mRatio + ")";
        viewbox.style["transform-origin"] = "top left";
    }


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
