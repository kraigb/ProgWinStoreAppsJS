(function () {
    "use strict";

    var app = WinJS.Application;
    var lastCapture = null;
    var dataTransferManager = null;
    var locator = new Windows.Devices.Geolocation.Geolocator();
    var map = null;
    var folderName = "HereMyAm";
    
    //fontSizeForWebview no longer needed; we can consolidate generating error graphics

    // This function is called whenever a user navigates to this page. It
    // populates the page elements with the app's data.

    WinJS.UI.Pages.define("/pages/home/home.html", {
        ready: function ready(element, options) {
            //With the control in the local context, all webview handling is no longer needed.
            //We also want the map to be loaded before trying to initialize from saved session state.
            Microsoft.Maps.loadModule('Microsoft.Maps.Map', { callback: initMap });

            performance.mark("entering ready method");
            if (app.sessionState.initFromState) {
                this.initFromState();
            }

            document.getElementById("photo").addEventListener("click", capturePhoto.bind(photo));

            this.updateLayout();

            dataTransferManager = Windows.ApplicationModel.DataTransfer.DataTransferManager.getForCurrentView();
            dataTransferManager.addEventListener("datarequested", provideData);

            //Set capture placeholder if we don't have an image already (see initFromState)
            if (lastCapture == null) {
                setPlaceholderImage("photo", "Tap to capture photo");
            }
            
            //Wire up the commands on the app bar
            var appbar = document.getElementById("appbar").winControl;
            appbar.getCommandById("cmdRefreshLocation").addEventListener("click", this.tryRefresh.bind(this));
            appbar.getCommandById("cmdPickFile").addEventListener("click", this.pickFile.bind(this));
            appbar.getCommandById("cmdRecentPictures").addEventListener("click", this.recentPictures.bind(this));

            //Hide the location error by default (we set in JavaScript instead of CSS so we can change it).
            document.getElementById("noLocation").style.display = "none";

            //If we don't have a position in sessionState, try to initialize
            if (!app.sessionState.lastPosition) {
                this.refreshPosition();
            } else {
                //Update from saved state
                updatePosition();
            }

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

        //Function to try getting geolocation again, but don't bother if we don't have a map,
        //which means the map error image is showing.
        refreshPosition: function () {
            if (map == null) {
                return;
            }

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

        pickFile: function () {
            //Load picture command goes to file picker. We use ones settingsIdentifier for this case.
            doPicker("loadPicture");
        },

        recentPictures: function () {
            //Loading from recent pictures also uses a picker, but a different settingsIdentifier            
            doPicker("recent");
        },


        //This function is called from the app's onactivated handler for
        //previousExecutionState == terminated. 
        initFromState: function () {
            //Check if we have an access cache token we can use to reload the file. We have to use
            //this mechanism because the file might have come from the file picker instead of a
            //place where we have programmatic access.
            if (app.sessionState.fileToken) {
                var list = Windows.Storage.AccessCache.StorageApplicationPermissions.futureAccessList;
                list.getFileAsync(app.sessionState.fileToken).done(function (file) {
                    if (file != null) {
                        lastCapture = file;
                        var img = document.getElementById("photoImg");
                        scaleImageToFit(img, document.getElementById("photo"), file);
                    }
                });
            }

            updatePosition();
        }
    });

    //Callback for the Bing Maps loading function    
    function initMap() {
        var options = {
            //NOTE: replace these credentials with your own obtained at
            //http://msdn.microsoft.com/en-us/library/ff428642.aspx
            credentials: "AhTTNOioICXvPRPUdr0_NAYWj64MuGK2msfRendz_fL9B1U6LGDymy2OhbGj7vhA",
            //zoom: 12,
            mapTypeId: Microsoft.Maps.MapTypeId.road
        };

        var mapDiv = document.getElementById("mapDiv");
        map = new Microsoft.Maps.Map(mapDiv, options);

        if (map != null) {
            //We created the map, so make sure the error image is hidden
            document.getElementById("errorImage").style.display = "none";
        } else {
            //Otherwise show the image and try to recreate the map when tapped
            setPlaceholderImage("mapDiv", "Could not create the map.", "Tap to try again.");

            var errorImage = document.getElementById("errorImage")
            errorImage.style.display = "block";
                    
            errorImage.onclick = function () {
                //Try again, hiding the image if successful
                map = new Microsoft.Maps.Map(mapDiv, options);

                if (map !== null) {
                    errorImage.style.display = "none";
                    updatePosition();
                }
            }
        }
    }

    function updatePosition() {
        if (!app.sessionState.lastPosition) {
            return;
        }

        //Can just use a local function now rather than calling a webview script
        pinLocation(app.sessionState.lastPosition.latitude, app.sessionState.lastPosition.longitude);
    }

    function pinLocation(lat, long) {
        if (map === null) {
            return;
        }

        var location = new Microsoft.Maps.Location(lat, long);
        var pushpin = new Microsoft.Maps.Pushpin(location, { draggable: true });

        Microsoft.Maps.Events.addHandler(pushpin, "dragend", function (e) {
            var location = e.entity.getLocation();
            app.sessionState.lastPosition = { latitude: location.latitude, longitude: location.longitude };
        });

        //Pop any previous pushpin, otherwise repeated calls will create new pins.
        map.entities.pop();

        //Add the new one
        map.entities.push(pushpin);
        map.setView({ center: location, zoom: 12, });
        return;
    }

    function setPlaceholderImage(containerId, text1, text2) {
        var element = document.getElementById(containerId);
        var canvas = document.createElement("canvas");
        canvas.width = element.clientWidth;
        canvas.height = element.clientHeight;

        var ctx = canvas.getContext("2d");
        ctx.fillStyle = "#7f7f7f";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#ffffff";

        //Use 75% height of the photoSection heading for the font
        var fontSize = .75 * document.getElementById("photoSection").querySelector("h2").clientHeight;

        ctx.font = "normal " + fontSize + "px 'Arial'";
        ctx.textAlign = "center";

        //Use slightly different positioning if we have one or two lines of text
        if (!text2) {            
            ctx.fillText(text1, canvas.width / 2, canvas.height / 2);
        } else {            
            ctx.fillText(text1, canvas.width / 2, (canvas.height / 2) - (fontSize * .75));
            ctx.fillText(text2, canvas.width / 2, (canvas.height / 2) + (fontSize * .75));
        }

        var img = element.querySelector("img");

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

        //The modifications below copy the captured file to the pictures library in a HereMyAm folder
        //(instead of local appdata as before).        
        var capturedFile;

        captureUI.captureFileAsync(Windows.Media.Capture.CameraCaptureUIMode.photo)
            .then(function (capturedFileTemp) {
                performance.mark("capturePhoto: image obtained");

                //Be sure to check validity of the item returned; could be null if the user canceled.
                if (!capturedFileTemp) { throw ("no file captured"); }
                capturedFile = capturedFileTemp;

                //Use this folder instead to copy to the Pictures Library--be sure to declare that capability in the manifest
                var pix = Windows.Storage.KnownFolders.picturesLibrary;
                return pix.createFolderAsync(folderName, Windows.Storage.CreationCollisionOption.openIfExists);
            })
            .then(function (myFolder) {
                //Again, check validity of the result operations
                if (!myFolder) { throw ("could not create folder in pictures library"); }

                //Append file creation time to the filename (should avoid collisions, but need to convert colons)
                var newName = capturedFile.displayName + " - " + capturedFile.dateCreated.toString().replace(/:/g, "-") + capturedFile.fileType;
                return capturedFile.copyAsync(myFolder, newName);
            })
            .then(function (newFile) {                
                updateImage(photoDiv, newFile);
                performance.mark("capturePhoto: new image set");

                //Delete the temporary file
                return capturedFile.deleteAsync();
            })
            //No completed handler needed for the last operation
            .done(null, function (error) {
                WinJS.log && WinJS.log("Capture sequence failed: " + error.message, "app");
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
            setPlaceholderImage("photo", "Tap to capture photo");
        }

        //Regenerate the map placeholder as well
        if (map == null) {
            setPlaceholderImage("mapDiv", "Could not create the map.", "Tap to try again.");
        }
    }

    //Moved this function out so we can call it from camera capture or pickers
    function updateImage(parentDiv, newFile) {
        if (!newFile) { throw ("could not copy file"); }

        var element = null;

        if (null == parentDiv) {
            parentDiv = document.getElementById("photo");
        }

        element = parentDiv.querySelector("img");

        if (!element) { throw ("parentDiv does not contain an img element"); }

        lastCapture = newFile;  //Save for Share                

        //Save the StorageFile in the AccessCache and the token in our session state
        var list = Windows.Storage.AccessCache.StorageApplicationPermissions.futureAccessList;
        if (app.sessionState.fileToken) {
            list.addOrReplace(app.sessionState.fileToken, newFile);
        } else {
            app.sessionState.fileToken = list.add(newFile);
        }

        scaleImageToFit(element, parentDiv, newFile);
    }


    //Invoke the file picker with a particular id
    function doPicker(id) {
        var pickers = Windows.Storage.Pickers;
        var picker = new pickers.FileOpenPicker();
        picker.fileTypeFilter.replaceAll([".jpg", ".jpeg", ".png", ".bmp"]);
        picker.viewMode = pickers.PickerViewMode.thumbnail;
        picker.settingsIdentifier = id;
        picker.suggestedStartLocation = pickers.PickerLocationId.picturesLibrary;

        picker.pickSingleFileAsync().done(function (file) {
            if (null != file) {
                updateImage(null, file);
            }
        });
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
