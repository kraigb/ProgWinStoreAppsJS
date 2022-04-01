(function () {
    "use strict";

    var app = WinJS.Application;
    var lastCapture = null;
    var dataTransferManager = null;
    var map = null;
    var folderName = "HereMyAm";
    
    // This function is called whenever a user navigates to this page. It
    // populates the page elements with the app's data.

    WinJS.UI.Pages.define("/pages/home/home.html", {
        ready: function ready(element, options) {
            //With the control in the local context, all postMessage handling is no longer needed.
            //We also want the map to be loaded before trying to initialize from saved session state.
            Microsoft.Maps.loadModule('Microsoft.Maps.Map', { callback: initMap });

            //Rehydrate from saved session state if needed
            if (app.sessionState.initFromState) {
                this.initFromState();
            }

            var image = document.getElementById("photo");
            image.addEventListener("click", capturePhoto.bind(image));

            //Set up a listener for share
            dataTransferManager = Windows.ApplicationModel.DataTransfer.DataTransferManager.getForCurrentView();
            dataTransferManager.addEventListener("datarequested", provideData);

            //Wire up the refresh command on the app bar
            var appbar = document.getElementById("appbar").winControl;
            appbar.getCommandById("cmdRefreshLocation").addEventListener("click", this.tryRefresh.bind(this));
            appbar.getCommandById("cmdPickFile").addEventListener("click", this.pickFile.bind(this));
            appbar.getCommandById("cmdRecentPictures").addEventListener("click", this.recentPictures.bind(this));

            //Hide the error by default (we set in JavaScript instead of CSS so we can change it).
            document.getElementById("floatingError").style.display = "none";

            //If we don't have a position in sessionState, try to initialize
            if (!app.sessionState.lastPosition) {
                this.refreshPosition();
            } else {
            }

        },

        unload: function () {
            //Remove event listeners from WinRT objects. In this app, we never leave this page so this function
            //will never be called, but the structure is included to show the proper practice.
            if (dataTransferManager != null) {
                dataTransferManager.removeEventListener("datarequested", provideData);
            }
        },

        tryRefresh: function () {
            //Always hide the error message before trying geolocation
            document.getElementById("floatingError").style.display = "none";

            //Hide the app bar and retry
            var appbar = document.getElementById("appbar").winControl.hide();            
            this.refreshPosition();
        },

        //Function to try getting geolocation again
        refreshPosition: function () {
            document.getElementById("retryFlyout").winControl.show();
            var gl = new Windows.Devices.Geolocation.Geolocator();

            gl.getGeopositionAsync().done(function (position) {
                //Save for share
                app.sessionState.lastPosition = {
                    latitude: position.coordinate.latitude,
                    longitude: position.coordinate.longitude
                };

                //Always hide the flyout
                document.getElementById("retryFlyout").winControl.hide();

                updatePosition();
            }, function (error) {
                console.log("Unable to get location.");

                //If we're unable to get the location, display that fact inline
                //on the map by showing the floating error on top of the map.
                document.getElementById("floatingError").style.display = "block";

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
                        var uri = URL.createObjectURL(file);
                        document.getElementById("photo").src = uri;
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
            credentials: "AlHJ5gHTINN2iD7HxLJpHn0e_tZYvzUAOsfqd37Rhj1NJz37vhUuE5iBAYJsH-ul",
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

        //Can just use a local function now rather than postMessage to an iframe
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
                //var local = Windows.Storage.ApplicationData.current.localFolder;

                //Use this folder instead to copy to the Pictures Library--be sure to declare that capability in the manifest
                var pix = Windows.Storage.KnownFolders.picturesLibrary;

                capturedFile = capturedFileTemp;
                return pix.createFolderAsync(folderName, Windows.Storage.CreationCollisionOption.openIfExists);
            })
            .then(function (myFolder) {
                //Again, check validity of the result operations
                if (!myFolder) { throw ("could not create local appdata folder"); }

                //Append file creation time to the filename (should avoid collisions, but need to convert colons)
                var newName = capturedFile.displayName + " - " + capturedFile.dateCreated.toString().replace(/:/g, "-") + capturedFile.fileType;
                return capturedFile.copyAsync(myFolder, newName);
            })
            .done(function (newFile) {
                updateImage(that, newFile);
            },
            function (error) {
                console.log(error.message);
            });
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

    //Moved this function out so we can call it from camera capture or pickers
    function updateImage(element, newFile) {
        if (!newFile) { throw ("could not copy file"); }

        if (null == element) {
            element = document.getElementById("photo");
        }

        lastCapture = newFile;  //Save for Share                
        element.src = URL.createObjectURL(newFile, {oneTimeOnly: true});

        //Save the StorageFile in the AccessCache and the token in our session state
        var list = Windows.Storage.AccessCache.StorageApplicationPermissions.futureAccessList;
        if (app.sessionState.fileToken) {
            list.addOrReplace(app.sessionState.fileToken, newFile);
        } else {
            app.sessionState.fileToken = list.add(newFile);
        }
    }

    function provideData(e) {
        var request = e.request;
        var data = request.data;

        if (!app.sessionState.lastPosition || !lastCapture) {
            //Nothing to share, so exit
            return;
        }

        data.properties.title = "Here My Am!";
        data.properties.description = "At (" + app.sessionState.lastPosition.latitude + ", " + app.sessionState.lastPosition.longitude + ")";

        //When sharing an image, include a thumbnail
        var streamReference = Windows.Storage.Streams.RandomAccessStreamReference.createFromFile(lastCapture);
        data.properties.thumbnail = streamReference;

        //It's recommended to always use both setBitmap and setStorageItems for sharing a single image
        //since the target app may only support one or the other.

        //Put the image file in an array and pass it to setStorageItems
        data.setStorageItems([lastCapture]);

        //The setBitmap method requires a RandomAccessStream.
        data.setBitmap(streamReference);
    }


})();
