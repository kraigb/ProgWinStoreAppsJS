(function () {
    "use strict";

    var app = WinJS.Application;
    var activation = Windows.ApplicationModel.Activation;
    var lastPosition = null;
    var lastCapture = null;

    //Only need to create this once for the app; we also need to keep the Geolocator
    //in scope on first use (and the consent prompt).
    var locator = new Windows.Devices.Geolocation.Geolocator();

    app.onactivated = function (args) {
        if (args.detail.kind === activation.ActivationKind.launch) {
            if (args.detail.previousExecutionState !== activation.ApplicationExecutionState.terminated) {
                //The place for initializing default state if not being rehydrated.                
            } else {
                //The place to rehydrate from saved state.
            }
            
            //Any work for WinJS controls needs to be inside the completed
            //handler for WinJS.UI.processAll; we don't have any of that here.
            args.setPromise(WinJS.UI.processAll());
            
            document.getElementById("photo").addEventListener("click", capturePhoto.bind(photo));            

            var dataTransferManager = Windows.ApplicationModel.DataTransfer.DataTransferManager.getForCurrentView();
            dataTransferManager.addEventListener("datarequested", provideData);
        }
    };


    //WinJS.Application.onready is fired after activation. This is the right
    //time to do anything that should wait until the app is really running, e.g.
    //to make sure the map is loaded in the iframe.
    app.onready = function () {
        //We rely on the locator object having been created already
        if (locator == null) {
            return;
        }

        locator.getGeopositionAsync().done(function (geocoord) {
            var position = geocoord.coordinate.point.position;

            //Save for share
            lastPosition = { latitude: position.latitude, longitude: position.longitude };

            callFrameScript(document.frames["map"], "pinLocation",
                [position.latitude, position.longitude]);
        }, function (error) {
            console.log("Unable to get location: " + error.message);
        });
    };

    app.oncheckpoint = function (args) {
    };

    
    function callFrameScript(frame, targetFunction, args) {
        var message = { functionName: targetFunction, args: args };
        //Target origin is the web context of the app
        frame.postMessage(JSON.stringify(message), "ms-appx-web://" + document.location.host);
    }

    function capturePhoto() {
        //Due to the .bind() call in addEventListener, "this" will be the image element,
        //but we need a copy for the async completed handler below.
        var captureUI = new Windows.Media.Capture.CameraCaptureUI();
        var that = this;

        //Indicate that we want to capture a JPEG that's no bigger than our target element --
        //the UI will automatically show a crop box of this size. 
        captureUI.photoSettings.format = Windows.Media.Capture.CameraCaptureUIPhotoFormat.jpeg;

        captureUI.photoSettings.croppedSizeInPixels =
            { width: that.clientWidth, height: that.clientHeight };

        //Note: this will fail if we're in view that's less than 500px wide.
        captureUI.captureFileAsync(Windows.Media.Capture.CameraCaptureUIMode.photo)
            .done(function (capturedFile) {
                //Be sure to check validity of the item returned; could be null if the user canceled.
                if (capturedFile) {
                    lastCapture = capturedFile;  //Save for Share
                    that.src = URL.createObjectURL(capturedFile, { oneTimeOnly: true });
                }
            }, function (error) {
                console.log("Unable to invoke capture UI: " + error.message);
            });
    }


    function provideData(e) {
        var request = e.request;
        var data = request.data;

        if (!lastPosition || !lastCapture) {
            //Nothing to share, so exit
            return;
        }

        data.properties.title = "Here My Am!";
        data.properties.description = "At ("
            + lastPosition.latitude + ", " + lastPosition.longitude + ")";

        //When sharing an image, include a thumbnail 
        var streamReference =
            Windows.Storage.Streams.RandomAccessStreamReference.createFromFile(lastCapture);
        data.properties.thumbnail = streamReference;

        //It's recommended to always use both setBitmap and setStorageItems for sharing a single image 
        //since the target app may only support one or the other.

        //Put the image file in an array and pass it to setStorageItems
        data.setStorageItems([lastCapture]);

        //The setBitmap method requires a RandomAccessStream.
        data.setBitmap(streamReference);
    }

    app.start();

    
})();