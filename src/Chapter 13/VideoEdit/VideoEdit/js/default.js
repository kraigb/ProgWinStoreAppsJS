(function () {
    "use strict";

    var app = WinJS.Application;
    var activation = Windows.ApplicationModel.Activation;

    var video1, canvas1, ctx;
    var colorOffset = { red: 0, green: 1, blue: 2, alpha: 3 };

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
            startVideo();
        }
    };

    function startVideo() {
        video1 = document.getElementById("video1");
        canvas1 = document.getElementById("canvas1");
        ctx = canvas1.getContext("2d");

        video1.play();
        requestAnimationFrame(renderVideo);
    }

    function renderVideo() {
        //Copy a frame from the video to the canvas
        ctx.drawImage(video1, 0, 0, canvas1.width, canvas1.height);

        //Retrieve that frame as pixel data
        var imgData = ctx.getImageData(0, 0, canvas1.width, canvas1.height);
        var pixels = imgData.data;

        //Loop through the pixels, manipulate as needed.
        var r, g, b, brightness;

        for (var i = 0; i < pixels.length; i += 4) {
            r = pixels[i + colorOffset.red];
            g = pixels[i + colorOffset.green];
            b = pixels[i + colorOffset.blue];

            //Assign each rgb value below to this same brightness value for grayscale instead
            //brightness = (.3 * r + .55 * g + .11 * b);

            //This creates a negative image.
            pixels[i + colorOffset.red] = 255 - r;
            pixels[i + colorOffset.green] = 255 - g;
            pixels[i + colorOffset.blue] = 255 - b;
        }

        //Copy the manipulated pixels to the canvas
        ctx.putImageData(imgData, 0, 0);

        //Request the next frame
        requestAnimationFrame(renderVideo);
    }

    app.start();
})();
