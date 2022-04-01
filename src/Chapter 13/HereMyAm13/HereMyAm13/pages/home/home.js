(function () {
    "use strict";

    var app = WinJS.Application;
    var lastCapture = null;
    var dataTransferManager = null;
    var map = null;
    var folderName = "HereMyAm";
    var Key = WinJS.Utilities.Key;  //Helpful enumeration

    // This function is called whenever a user navigates to this page. It
    // populates the page elements with the app's data.

    WinJS.UI.Pages.define("/pages/home/home.html", {
        ready: function ready(element, options) {
            //Load the map before trying to initialize from saved session state.
            Microsoft.Maps.loadModule('Microsoft.Maps.Map', { callback: initMap });

            //Rehydrate from saved session state if needed
            if (app.sessionState.initFromState) {
                this.initFromState();
            }

            var image = document.getElementById("photo");
            image.addEventListener("click", capturePhoto.bind(image));

            //Include enter key and spacebar to act like click
            image.addEventListener("keydown", function (e) {
                if (e.keyCode == Key.enter || e.keyCode == Key.space) {
                    image.click();                    
                }
            });

            //Make sure the primary control has the focus (the image)
            image.focus();

            //Clear out whatever tile update might still be lingering (mostly for debugging)
            Windows.UI.Notifications.TileUpdateManager.createTileUpdaterForApplication().clear();

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
            errorImage.tabIndex = 2;            

            //We split this off to call it from both onclick and onkeydown
            var tryAgain = function () {
                //Try again, hiding the image if successful
                map = new Microsoft.Maps.Map(mapDiv, options);

                if (map !== null) {
                    errorImage.style.display = "none";
                    errorImage.tabIndex = -1;                    
                    updatePosition();
                }
            }

            //Link up trying again to click and keystroke
            errorImage.onclick = function () { tryAgain(); }
            errorImage.onkeydown = function (e) { 
                if (e.keyCode == Key.enter || e.keyCode == Key.space) { tryAgain(); }
            }
        }
    }

    function updatePosition() {
        if (!app.sessionState.lastPosition) {
            return;
        }

        //Go check if we have enough info to issue a tile update
        updateTile();

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

            //Go check if we have enough info to issue a tile update
            updateTile();
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

        //Go check if we have enough info to issue a tile update
        updateTile();
    }

    function provideData(e) {
        var request = e.request;
        var data = request.data;

        if (!app.sessionState.lastPosition || !lastCapture) {
            //Nothing to share, so exit
            return;
        }

        data.properties.title = "Here My Am!";
        data.properties.description = formatLocation(app.sessionState.lastPosition.latitude, app.sessionState.lastPosition.longitude);

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


    //Simple helper as we need to format lat/long in multiple places
    function formatLocation(lat, long, format) {
        if (typeof format === "undefined") {
            format = "terse";
        }

        switch(format) {
            case "verbose":
                return "At latitude " + lat + ", longitude " + long;

            default:
                return "At (" + lat + ", " + long + ")";
        }
    }


    //Issue square and wide tile updates if we have a good position and image
    function updateTile() {
        if (!app.sessionState.lastPosition || lastCapture == null) {
            //Don't have enough info for an update.
            return;
        }

        // First we need to get a small version of the last capture image since the capture images are 
        // likely above the 200K limit for tiles. Then we can issue the update.
        //
        // The 180% square tile image size is 270x270, so we could use that as the target image size as 
        // jpeg encoding of a photo at that size will typically be under 200K. This will mean that the
        // wide tile will be enlarged 200%, but that should be reasonable.
        //
        // Alternately we could create a separate 558x270 wide image, cropping the top and bottom to keep
        // the image below 200K; a 558x558 will typically exceed that size.
        //
        // Note also that PNG encoding for a photograph can easily exceed 200K, which is why we'll force
        // jpeg encoding regardless of the image source.        
        var squareURI;

        //Our transcodeImage function is async.
        transcodeImage(lastCapture, "tile_image_square.png", 270, 270).done(function (_squareURI) {
            squareURI = _squareURI;
            if (squareURI != null) {
                //Got the images, go update the tile using the same image for both square and wide tiles.
                issueTileUpdate(squareURI, squareURI);
            }
        }, function (e) {
            console.log("Error: " + e);
        });

    }

    //Async function that returns an appdata URI to a file created using filename in the local folder.
    //Note that with 8 chained promises, this might be easier to write in C# using a WinRT component where
    //we have the "using" statement for streams and the await keyword. We'll do exactly this in Chapter 17.

    function transcodeImage(source, filename, width, height) {
        if (source && filename) {
            var file = null;
            var decoder;
            var readStream = null;
            var writeStream = null;            
            var pixels;
            var imaging = Windows.Graphics.Imaging;
            var enc = Windows.Graphics.Imaging.BitmapEncoder;

            //Function that we can use in both success and error cases
            var closeStreams = function () {
                if (writeStream != null) {
                    writeStream.close();
                }

                if (readStream != null) {
                    readStream.close();
                }
            };

            return source.openAsync(Windows.Storage.FileAccessMode.read).then(function (stream) {
                readStream = stream;
                // Decode the image
                return imaging.BitmapDecoder.createAsync(readStream);
            }).then(function (_decoder) {
                decoder = _decoder;

                // Re-encode the image at width and height into target file
                return Windows.Storage.ApplicationData.current.localFolder.createFileAsync(
                    filename, Windows.Storage.CreationCollisionOption.replaceExisting);
            }).then(function (newFile) {
                file = newFile;
                return file.openAsync(Windows.Storage.FileAccessMode.readWrite);
            }).then(function (stream) {
                writeStream = stream;
                writeStream.size = 0;  //Be sure to clean out existing file

                //Set up the decoder properties to get the pixel data
                var transform = new imaging.BitmapTransform();                
                transform.scaledWidth = width;
                transform.scaledHeight = height;
                
                return decoder.getPixelDataAsync(decoder.bitmapPixelFormat, decoder.bitmapAlphaMode,
                    transform, imaging.ExifOrientationMode.respectExifOrientation,
                    imaging.ColorManagementMode.colorManageToSRgb);
            }).then(function (pixelProvider) {
                pixels = pixelProvider.detachPixelData();

                //Now we're ready to encode to the new file
                return enc.createAsync(enc.jpegEncoderId, writeStream);                
            }).then(function (encoder) {
                encoder.setPixelData(decoder.bitmapPixelFormat, decoder.bitmapAlphaMode,
                  width, height, decoder.dpiX, decoder.dpiY, pixels);

                return encoder.flushAsync();
            }).then(function () {
                closeStreams();                
                return WinJS.Promise.as("ms-appdata:///local/" + file.name);
            }, function (e) {
                closeStreams();
                return WinJS.Promise.as(null);
            });
        }
    }

    function issueTileUpdate(squareURI, wideURI) {
        //NOTE: because our URIs might be the same as the last time we issued an update (we're using the same
        //filenames each time, the XML payload might not change from update to update (unless the coordinates
        //changed). In that case, the XML wouldn't show an update so the tile will not reload the images. To
        //guarantee that it does, we'll clear the tile first.
        var tileUpdater = Windows.UI.Notifications.TileUpdateManager.createTileUpdaterForApplication();
        tileUpdater.clear();

        var lat = Math.round(app.sessionState.lastPosition.latitude * 100) / 100;
        var long = Math.round(app.sessionState.lastPosition.longitude * 100) / 100;

        //Use Notification Extensions to build our tile updates
        var tileContent = NotificationsExtensions.TileContent.TileContentFactory.createTileWidePeekImage05();
        tileContent.textHeading.text = "Here My Am!";
        tileContent.textBodyWrap.text = formatLocation(lat, long, "verbose");
        tileContent.imageMain.src = wideURI;
        tileContent.imageSecondary.src = squareURI;

        var squareTileContent = NotificationsExtensions.TileContent.TileContentFactory.createTileSquarePeekImageAndText04();
        squareTileContent.image.src = squareURI;        
        squareTileContent.textBodyWrap.text = "Here My Am! " + formatLocation(lat, long);

        tileContent.squareContent = squareTileContent;

        // send the notification
        tileUpdater.update(tileContent.createNotification());
    }

})();
