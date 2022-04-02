(function () {
    "use strict";

    var app = WinJS.Application;
    var lastCapture = null;
    var dataTransferManager = null;
    var locator = new Windows.Devices.Geolocation.Geolocator();
    var map = null;
    var folderName = "HereMyAm";
    var Key = WinJS.Utilities.Key;  //Helpful enumeration

    // This function is called whenever a user navigates to this page. It
    // populates the page elements with the app's data.

    WinJS.UI.Pages.define("/pages/home/home.html", {
        ready: function ready(element, options) {
            //Load the map before trying to initialize from saved session state.
            Microsoft.Maps.loadModule('Microsoft.Maps.Map', { callback: initMap });

            performance.mark("entering ready method");
            if (app.sessionState.initFromState) {
                this.initFromState();
            }

            var photo = document.getElementById("photo");
            photo.addEventListener("click", capturePhoto.bind(photo));

            this.updateLayout();

            //Include enter key and spacebar to act like click
            photo.addEventListener("keydown", function (e) {
                if (e.keyCode == Key.enter || e.keyCode==Key.space) {
                    photo.click();
                }
            });

            //Make sure the primary control has the focus (the image)
            photo.focus();

            //Clear out whatever tile update might still be lingering (mostly for debugging)
            Windows.UI.Notifications.TileUpdateManager.createTileUpdaterForApplication().clear();
          
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

        //Go check if we have enough info to issue a tile update
        updateTile();
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
        data.properties.description = formatLocation(app.sessionState.lastPosition.latitude, app.sessionState.lastPosition.longitude);

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

    //Simple helper as we need to format lat/long in multiple places
    function formatLocation(lat, long, format) {
        if (typeof format === "undefined") {
            format = "terse";
        }

        switch (format) {
            case "verbose":
                return "At latitude " + lat + ", longitude " + long;

            default:
                return "At (" + lat + ", " + long + ")";
        }
    }


    //Issue tile updates if we have a good position and image
    function updateTile() {
        if (!app.sessionState.lastPosition || lastCapture == null) {
            //Don't have enough info for an update.
            return;
        }

        // First we need to get a small version of the last capture image because the capture images could
        // be above the 200K limit for tiles (though unlikely for jpeg formats). Then we can issue the update.
        //
        // The 180% large tile image size is 558x558, which will scale down to other tile sizes just fine.
        // We use jpeg encoding at 80% which will keep it well under 200K. 
        //
        // A PNG encoding for a photograph can easily exceed 200K, which is why we'll force jpeg encoding
        // regardless of the image source. This app already captures jpegs, so in truth we could just
        // use the captured image directly. But I've kept this code here for reference in case it's useful to you.
        var squareURI;

        //Our transcodeImage function is async.
        transcodeImage(lastCapture, "tile_image_square.jpg", 558).done(function (_squareURI) {
            squareURI = _squareURI;
            if (squareURI != null) {
                //Got the images, go update the tile using the same image for all tile sizes.
                issueTileUpdate(squareURI, squareURI, squareURI);
            }
        }, function (e) {
            console.log("Error: " + e);
        });

    }

    //Async function that returns an appdata URI to a file created using filename in the local folder.
    //Note that with 9 chained promises, this might be easier to write in C# using a WinRT component where
    //we have the "using" statement for streams and the await keyword. We'll do exactly this in Chapter 19.

    function transcodeImage(source, filename, requiredSize) {
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

            var targetWidth = requiredSize, targetHeight = requiredSize;

            //The aspect ratio of the source might not match the given width and height, so
            //we'll determine our target dimensions here. We want to make the smaller dimension
            //of the source come out to the match the given dimension in width or height.
            return source.properties.getImagePropertiesAsync().then(function (props) {
                var aspectRatio = props.width / props.height;

                if (aspectRatio >= 1.0) {
                    //Horizontal aspect ratio, set target height to match desired size
                    //and scale the width to the same aspect ratio.                    
                    targetWidth = aspectRatio * requiredSize;
                } else {
                    //Vertical aspect ratio, set target width to match desired size and
                    //scale the height to the same aspect ratio.
                    targetHeight = aspectRatio * requiredSize;                    
                }

                return source.openAsync(Windows.Storage.FileAccessMode.read);
            }).then(function (stream) {
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

                //Set up the decoder properties to get the pixel data. Note that the source image might
                //not match the target aspect ratio in width and height. What we'll do, then, is try to keep
                //the widest dimension of the source scaled to the target dimension.

                var transform = new imaging.BitmapTransform();
                transform.scaledWidth = targetWidth;
                transform.scaledHeight = targetHeight;

                return decoder.getPixelDataAsync(decoder.bitmapPixelFormat, decoder.bitmapAlphaMode,
                    transform, imaging.ExifOrientationMode.respectExifOrientation,
                    imaging.ColorManagementMode.colorManageToSRgb);
            }).then(function (pixelProvider) {
                pixels = pixelProvider.detachPixelData();

                //Now we're ready to encode to the new file. Create an encoder for JPEG with
                //the quality set to 80% to make sure our image file is small enough.
                var propSet = new imaging.BitmapPropertySet();
                var quality = new imaging.BitmapTypedValue(0.8, Windows.Foundation.PropertyType.single);                    
                propSet.insert("ImageQuality", quality);

                return enc.createAsync(enc.jpegEncoderId, writeStream, propSet);
            }).then(function (encoder) {                
                encoder.setPixelData(decoder.bitmapPixelFormat, decoder.bitmapAlphaMode,
                  targetWidth, targetHeight, decoder.dpiX, decoder.dpiY, pixels);

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

    function issueTileUpdate(squareURI, wideURI, largeURI) {
        //NOTE: because our URIs might be the same as the last time we issued an update (we're using the same
        //filenames each time, the XML payload might not change from update to update (unless the coordinates
        //changed). In that case, the XML wouldn't show an update so the tile will not reload the images. To
        //guarantee that it does, we'll clear the tile first.
        var tileUpdater = Windows.UI.Notifications.TileUpdateManager.createTileUpdaterForApplication();
        tileUpdater.clear();

        var lat = Math.round(app.sessionState.lastPosition.latitude * 100) / 100;
        var long = Math.round(app.sessionState.lastPosition.longitude * 100) / 100;

        //Use Notification Extensions to build our tile updates

        //We start with the large template
        var tileContent = NotificationsExtensions.TileContent.TileContentFactory.createTileSquare310x310ImageAndText01();
        tileContent.image.src = largeURI;
        tileContent.textCaptionWrap.text = "Here My Am! " + formatLocation(lat, long);

        //Then create the wide
        var wideContent = NotificationsExtensions.TileContent.TileContentFactory.createTileWide310x150PeekImage05();
        wideContent.textHeading.text = "Here My Am!";
        wideContent.textBodyWrap.text = formatLocation(lat, long, "verbose");
        wideContent.imageMain.src = wideURI;
        wideContent.imageSecondary.src = squareURI;
      
        //Then create the medium
        var mediumContent = NotificationsExtensions.TileContent.TileContentFactory.createTileSquare150x150PeekImageAndText04();
        mediumContent.image.src = squareURI;
        mediumContent.textBodyWrap.text = "Here My Am! " + formatLocation(lat, long);

        //The medium content is a property of the wide
        wideContent.square150x150Content = mediumContent;
        
        //Then the wide is a property of the large
        tileContent.wide310x150Content = wideContent;

        //Now we have the full notification to send.
        tileUpdater.update(tileContent.createNotification());
    }

})();