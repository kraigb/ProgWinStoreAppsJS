(function () {
    "use strict";

    var app = WinJS.Application;
    var activation = Windows.ApplicationModel.Activation;
    var lastPosition = null;
    var lastCapture = null;

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

            //Handles updating the image with view changes
            window.addEventListener("resize", scalePhoto);

            var dataTransferManager = Windows.ApplicationModel.DataTransfer.DataTransferManager.getForCurrentView();
            dataTransferManager.addEventListener("datarequested", provideData);

            window.addEventListener("message", processFrameEvent);
        }
    };


    //WinJS.Application.onready is fired after activation. This is the right
    //time to do anything that should wait until the app is really running, e.g.
    //to make sure the map is loaded in the iframe.
    app.onready = function () {
        setPlaceholderImage();

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

    function setPlaceholderImage() {
        //Ignore if we have an image (shouldn't be called under such conditions)
        if (lastCapture != null) {
            return;
        }

        var photo = document.getElementById("photo");
        var canvas = document.createElement("canvas");
        canvas.width = photo.clientWidth;
        canvas.height = photo.clientHeight;

        var ctx = canvas.getContext("2d");
        ctx.fillStyle = "#7f7f7f";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#ffffff";

        //Use 75% height of the photoSection heading for the font
        var fontSize = .75 * document.getElementById("photoSection").querySelector("h2").clientHeight;
        ctx.font = "normal " + fontSize + "px 'Arial'";
        ctx.textAlign = "center";
        ctx.fillText("Tap to capture photo", canvas.width / 2, canvas.height / 2);

        var img = photo.querySelector("img");

        //The blob should be released when the img.src is replaced
        img.src = URL.createObjectURL(canvas.msToBlob(), { oneTimeOnly: true });
    }


    function capturePhoto() {
        var captureUI = new Windows.Media.Capture.CameraCaptureUI();
        var photoDiv = this; //this will be the photo element        

        //Indicate that we want to capture a JPEG that's no bigger than our target element --
        //the UI will automatically show a crop box of this size. 
        captureUI.photoSettings.format = Windows.Media.Capture.CameraCaptureUIPhotoFormat.jpeg;

        //We don't set a cropping size to allow the user to control the image more precisely

        //The modifications below copy the captured file to local appdata (instead of temp) in a
        //HereMyAm folder. The lines in comments will alternately copy to the pictures library
        var img = photoDiv.querySelector("img");
        var capturedFile;

        captureUI.captureFileAsync(Windows.Media.Capture.CameraCaptureUIMode.photo)
            .then(function (capturedFileTemp) {
                //Be sure to check validity of the item returned; could be null if the user canceled.
                if (!capturedFileTemp) { throw ("no file captured"); }
                capturedFile = capturedFileTemp;

                //As a demonstration of ms-appdata usage, copy the StorageFile to a folder called HereMyAm
                //in the appdata/local folder, and use ms-appdata to point to that.
                var local = Windows.Storage.ApplicationData.current.localFolder;

                //Use this folder instead to copy to the Pictures Library--be sure to declare that capability in the manifest
                //var local = Windows.Storage.KnownFolders.picturesLibrary;

                return local.createFolderAsync("HereMyAm", Windows.Storage.CreationCollisionOption.openIfExists);
            })
            .then(function (myFolder) {
                //Again, check validity of the result
                if (!myFolder) { throw ("could not create local appdata folder"); }

                //Append file creation time to the filename (should avoid collisions, but need to convert colons)
                var newName = "Capture - " + capturedFile.dateCreated.toString().replace(/:/g, "-") + capturedFile.fileType;

                //Make the copy
                return capturedFile.copyAsync(myFolder, newName);
            })
            .then(function (newFile) {
                if (!newFile) { throw ("could not copy file"); }

                lastCapture = newFile;  //Save for Share

                //Adjust styles to accomodate letterboxing
                scaleImageToFit(img, photoDiv, newFile);

                //Delete the temporary file
                return capturedFile.deleteAsync();
            })
            //No completed handler needed for the last operation
            .done(null, function (error) {
                console.log("Unable to invoke capture UI:" + error.message);
            });
    }


    function scaleImageToFit(imgElement, parentDiv, file) {
        //To handle size differences between the image size and the display area, set the scaling
        //to 100% width if the aspect ratio of the image is greter than that of the element, or to
        //100% height if the opposite is true. The StorageFile.properties.getImagePropertiesAsync
        //provides the size details for the captured image.        
        file.properties.getImagePropertiesAsync().done(function (props) {
            var requestedSize;
            var scaleToWidth = (props.width / props.height > parentDiv.clientWidth / parentDiv.clientHeight);
            if (scaleToWidth) {
                imgElement.style.width = "100%";
                imgElement.style.height = "";
                requestedSize = parentDiv.clientWidth;
            } else {
                imgElement.style.width = "";
                imgElement.style.height = "100%";
                requestedSize = parentDiv.clientHeight;
            }

            //Using a thumbnail is always more memory efficient unless you really need all the
            //pixels in the image file.

            //Align the thumbnail request to known caching sizes (for non-square aspects).
            if (requestedSize > 532) { requestedSize = 1026; }
                else { if (requestedSize > 342) { requestedSize = 532; }
                else { requestedSize = 342; }}

            file.getScaledImageAsThumbnailAsync(
                Windows.Storage.FileProperties.ThumbnailMode.singleItem, requestedSize)
                .done(function (thumb) {
                    imgElement.src = URL.createObjectURL(thumb, { oneTimeOnly: true });
                });
        }, function (e) {
            console.log("scaleImageToFit error: " + e.message);
        });
    }

    //window.onresize event handler
    function scalePhoto() {
        var photoImg = document.getElementById("photoImg");

        //Make sure we have an img element
        if (photoImg == null) {
            return;
        }

        //If we have an image, scale it, otherwise regenerate the placeholder
        if (lastCapture != null) {
            scaleImageToFit(photoImg, document.getElementById("photo"), lastCapture);
        } else {
            setPlaceholderImage();
        }
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

