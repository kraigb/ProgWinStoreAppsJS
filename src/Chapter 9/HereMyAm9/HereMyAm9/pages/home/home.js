(function () {
    "use strict";

    var app = WinJS.Application;
    var lastCapture = null;
    var dataTransferManager = null;
    var locator = new Windows.Devices.Geolocation.Geolocator();

    var fontSizeForWebView = 0;

    // This function is called whenever a user navigates to this page. It
    // populates the page elements with the app's data.

    WinJS.UI.Pages.define("/pages/home/home.html", {
        ready: function ready(element, options) {
            performance.mark("entering ready method");
            if (app.sessionState.initFromState) {
                this.initFromState();
            }

            document.getElementById("photo").addEventListener("click", capturePhoto.bind(photo));

            //We can use the page's updateLayout method instead of subscribing to window.onresize directly.
            this.updateLayout();

            dataTransferManager = Windows.ApplicationModel.DataTransfer.DataTransferManager.getForCurrentView();
            dataTransferManager.addEventListener("datarequested", provideData);

            setPlaceholderImage();

            //Wire up the refresh command on the app bar
            var appbar = document.getElementById("appbar").winControl;
            appbar.getCommandById("cmdRefreshLocation").addEventListener("click", this.tryRefresh.bind(this));

            //Hide the location error by default (we set in JavaScript instead of CSS so we can change it).            
            document.getElementById("noLocation").style.display = "none";

            //Using a webview, we listen to MSWebViewScriptNotify for events
            var webview = document.getElementById("map");
            webview.addEventListener("MSWebViewScriptNotify", processWebviewEvent);

            //Get a position for the map once the webview is loaded
            var that = this;
            webview.addEventListener("MSWebViewNavigationCompleted", function () {
                //Temporary workaround because map.html is in another context.
                callWebviewScript("map", "setPlaceholderFontSize", { size: fontSizeForWebView });

                //If we don't have a position in sessionState, try to initialize
                if (!app.sessionState.lastPosition) {
                    that.refreshPosition();
                } else {
                    //Update from saved state
                    updatePosition();
                }
            });

            webview.navigate("ms-appx-web:///html/map.html");
        },

        unload: function () {
            //Remove event listeners from WinRT objects. In this app, we never leave this page so this function
            //will never be called, but the structure is included to show the proper practice.
            if (dataTransferManager != null) {
                dataTransferManager.removeEventListener("datarequested", provideData);
            }
        },

        updateLayout: function () {
            scalePhoto();            
        },

        tryRefresh: function () {
            //Always hide the error message before trying geolocation
            document.getElementById("noLocation").style.display = "none";

            //Hide the app bar and retry
            var appbar = document.getElementById("appbar").winControl.hide();            
            this.refreshPosition();
        },

        //Function to try getting geolocation again
        refreshPosition: function () {
            document.getElementById("retryFlyout").winControl.show();

            locator.getGeopositionAsync().done(function (geocoord) {
                var position = geocoord.coordinate.point.position;                

                //Save for share
                app.sessionState.lastPosition =
                    { latitude: position.latitude, longitude: position.longitude };

                //Always hide the flyout
                document.getElementById("retryFlyout").winControl.hide();

                updatePosition();            
            }, function (error) {
                WinJS.log && WinJS.log("Unable to get location: " + error.message, "app");

                //If we're unable to get the location, display that fact inline
                //on the map by showing the floating error on top of the map.
                document.getElementById("noLocation").style.display = "block";

                //Always hide the flyout
                document.getElementById("retryFlyout").winControl.hide();
            });
        },

        //This function is called from the app's onactivated handler for
        //previousExecutionState == terminated. 
        initFromState: function () {
            if (app.sessionState.imageURI) {
                var uri = new Windows.Foundation.Uri(app.sessionState.imageURI);
                Windows.Storage.StorageFile.getFileFromApplicationUriAsync(uri).done(function (file) {
                    lastCapture = file;
                    var img = document.getElementById("photoImg");
                    scaleImageToFit(img, document.getElementById("photo"), file);
                });
            }
        }
    });


    function updatePosition() {
        if (!app.sessionState.lastPosition) {
            return;
        }

        callWebviewScript("map", "pinLocation",
            { lat: app.sessionState.lastPosition.latitude, long: app.sessionState.lastPosition.longitude});
    }

    //Invoke a webview script, returning a promise tied into its complete/error methods.
    function callWebviewScript(webviewId, targetFunction, args) {
        var webview = document.getElementById(webviewId);
        var err = null;
        
        if (webview == null) {
            err = new WinJS.ErrorFromName("callWebviewScript", "Element for webviewId=" + webviewId + "not found.");
        }

        if (typeof targetFunction !== "string" || targetFunction.length == 0) {
            err = new WinJS.ErrorFromName("callWebviewScript", "targetFunction must be a string");
        }

        //Error conditions must return a promise in the error state
        if (err != null) {
            return WinJS.Promise.wrapError(err);
        }

        //If we're happy with our arguments, create a promise around invokeScriptAsync. Note that the
        //second arg to invokeScriptAsync will be converted to a string, so it's best for us to 
        //stringify it here and let the recipient parse it.
        return new WinJS.Promise(function (completeDispatch, errorDispatch) {            
            var op = webview.invokeScriptAsync(targetFunction, JSON.stringify(args));

            op.oncomplete = function (args) {
                //Return value from the invoked function (always a string) is in args.target.result
                WinJS.log && WinJS.log("Success: callWebviewScript for " + webviewId + "." + targetFunction + ", result = " + args.target.result, "app");
                completeDispatch(args.target.result);
            };

            op.onerror = function (e) {
                WinJS.log && WinJS.log("Error: callWebviewScript for " + webviewId + "." + targetFunction + ", e = " + e.message, "app");
                errorDispatch(e);
            };

            //Don't forget this, or the script function won't be called!
            op.start();
        });
    }

    //Handler for MSWebViewScriptNotify events; argument is a string
    function processWebviewEvent(e) {        
        var args = JSON.parse(e.value);

        switch (args.event) {
            case "locationChanged":
                app.sessionState.lastPosition = { latitude: args.latitude, longitude: args.longitude };
                performance.mark("map pushpin moved");                
                break;

            default:
                break;
        }
    };

    function setPlaceholderImage() {
        //Ignore if we have an image (as when rehydrating)
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

        fontSizeForWebView = fontSize;

        ctx.font = "normal " + fontSize + "px 'Arial'";
        ctx.textAlign = "center";        
        ctx.fillText("Tap to capture photo", canvas.width / 2, canvas.height / 2);

        var img = photo.querySelector("img");

        //The blob should be released when the img.src is replaced
        img.src = URL.createObjectURL(canvas.msToBlob(), { oneTimeOnly: true });
    }


    function capturePhoto() {
        //Avoid invoking the capture UI if the view is too narrow. It fails
        //silently anyway, but we might as well avoid an exception.
        if (window.innerWidth < 500) {
            return;
        }

        performance.mark("entering capturePhoto");

        var captureUI = new Windows.Media.Capture.CameraCaptureUI();
        var photoDiv = this; //this will be the photo element        

        captureUI.photoSettings.format = Windows.Media.Capture.CameraCaptureUIPhotoFormat.jpeg;

        //We don't set a cropping size to allow the user to control the image more precisely

        //The modifications below copy the captured file to local appdata (instead of temp) in a
        //HereMyAm folder. The lines in comments will alternately copy to the pictures library
        var img = photoDiv.querySelector("img");
        var capturedFile;

        captureUI.captureFileAsync(Windows.Media.Capture.CameraCaptureUIMode.photo)
            .then(function (capturedFileTemp) {
                performance.mark("capturePhoto: image obtained");

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
                
                //Save the ms-appdata URL for initializing lastCapture
                app.sessionState.imageURI = "ms-appdata:///local/HereMyAm/" + newFile.name;

                //Adjust styles to accomodate letterboxing
                scaleImageToFit(img, photoDiv, newFile);

                performance.mark("capturePhoto: new image set");
                
                //Delete the temporary file
                return capturedFile.deleteAsync();
            })
            //No completed handler needed for the last operation
            .done(null, function (error) {
                WinJS.log && WinJS.log("Unable to invoke capture UI: " + error.message, "app");
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
        performance.mark("entering provideData (share source)");
        var request = e.request;
        var data = request.data;

        if (!app.sessionState.lastPosition || !lastCapture) {
            //Nothing to share, so exit
            return;
        }

        data.properties.title = "Here My Am!";
        data.properties.description = "At ("
            + app.sessionState.lastPosition.latitude + ", " + app.sessionState.lastPosition.longitude + ")";

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

})();
