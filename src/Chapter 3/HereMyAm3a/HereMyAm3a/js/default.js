(function () {
    "use strict";

    var app = WinJS.Application;
    var activation = Windows.ApplicationModel.Activation;
    var lastPosition = null;
    var lastCapture = null;

    app.onactivated = function (args) {
        if (args.detail.kind === activation.ActivationKind.launch) {
            if (args.detail.previousExecutionState !== activation.ApplicationExecutionState.terminated) {
                //Place for initializing default state if not being rehydrated.
            } else {
                //Place to rehydrate from saved state.
            }
            args.setPromise(WinJS.UI.processAll());

            var image = document.getElementById("photo");
            image.addEventListener("click", capturePhoto.bind(image));

            var dataTransferManager = Windows.ApplicationModel.DataTransfer.DataTransferManager.getForCurrentView();
            dataTransferManager.addEventListener("datarequested", provideData);

            window.addEventListener("message", processFrameEvent);

            var gl = new Windows.Devices.Geolocation.Geolocator();

            gl.getGeopositionAsync().done(function (position) {
                //Save for share
                lastPosition = {
                    latitude: position.coordinate.latitude,
                    longitude: position.coordinate.longitude
                };

                callFrameScript(document.frames["map"], "pinLocation",
                    [position.coordinate.latitude, position.coordinate.longitude]);
            }, function(error) {
                console.log("Unable to get location.");
            });
        }
    };

    app.oncheckpoint = function (args) {
    };

    
    function callFrameScript(frame, targetFunction, args) {
        var message = { functionName: targetFunction, args: args };
        //Target origin is the web context of the app
        frame.postMessage(JSON.stringify(message), "ms-appx-web://" + document.location.host);
    }

    function processFrameEvent(message) {
        //Verify data and origin (in this case the web context of the app)
        if (!message.data || message.origin !== "ms-appx-web://" + document.location.host) {
            return;
        }

        var eventObj = JSON.parse(message.data);

        switch (eventObj.event) {
            case "locationChanged":
                lastPosition = { latitude: eventObj.latitude, longitude: eventObj.longitude };
                break;

            default:
                break;
        }
    };

    function capturePhoto() {
        //Due to the .bind() call in addEventListener, "this" will be the image element,
        //but we need a copy for the async completed handler below.
        var that = this;

        var captureUI = new Windows.Media.Capture.CameraCaptureUI();

        //Indicate that we want to capture a PNG that's no bigger than our target element --
        //the UI will automatically show a crop box of this size
        captureUI.photoSettings.format = Windows.Media.Capture.CameraCaptureUIPhotoFormat.png;
        captureUI.photoSettings.croppedSizeInPixels = { width: this.clientWidth, height: this.clientHeight };

        //For use across chained promises
        var capturedFile = null;

        captureUI.captureFileAsync(Windows.Media.Capture.CameraCaptureUIMode.photo)
            .then(function (capturedFileTemp) {
                //Be sure to check validity of the item returned; could be null if the user canceled.
                if (!capturedFileTemp) { throw ("no file captured"); }

                //As a demonstration of ms-appdata usage, copy the StorageFile to a folder called HereMyAm
                //in the appdata/local folder, and use ms-appdata to point to that.
                var local = Windows.Storage.ApplicationData.current.localFolder;

                //Use this folder instead to copy to the Pictures Library--be sure to declare that capability in the manifest
                //var local = Windows.Storage.KnownFolders.picturesLibrary;

                capturedFile = capturedFileTemp;
                return local.createFolderAsync("HereMyAm", Windows.Storage.CreationCollisionOption.openIfExists);
            })
            .then(function (myFolder) {
                //Again, check validity of the result operations
                if (!myFolder) { throw ("could not create local appdata folder"); }

                //Append file creation time to the filename (should avoid collisions, but need to convert colons)
                var newName = capturedFile.displayName + " - " + capturedFile.dateCreated.toString().replace(/:/g, "-") + capturedFile.fileType;
                return capturedFile.copyAsync(myFolder, newName);
            })
            .done(function (newFile) {
                if (!newFile) { throw ("could not copy file"); }

                lastCapture = newFile;  //Save for Share
                that.src = "ms-appdata:///local/HereMyAm/" + newFile.name; //newFile.name includes extension

                //Use this form if copying images to the pictures library
                //that.src = URL.createObjectURL(newFile, {oneTimeOnly: true});
            },
            function (error) {
                console.log(error.message);
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
