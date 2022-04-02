(function () {
    "use strict";

    var app = WinJS.Application;
    var lastCapture = null;
    var dataTransferManager = null;
    var map = null;
    var folderName = WinJS.Resources.getString('foldername').value;    
    var Key = WinJS.Utilities.Key;  //Helpful enumeration
    var accSettings = new Windows.UI.ViewManagement.AccessibilitySettings();

    // This function is called whenever a user navigates to this page. It
    // populates the page elements with the app's data.

    WinJS.UI.Pages.define("/pages/home/home.html", {
        ready: function ready(element, options) {
            //Make sure the photo canvas is sized properly
            this.updateLayout();

            //Initialize localized string resources
            WinJS.Resources.processAll();

            //Draw the tap message in the photo area canvas and error message in its canvas
            redrawPhotoMessages();

            //Redraw on language change
            WinJS.Resources.addEventListener("contextchanged", redrawPhotoMessages);

            //Also redraw on contrast change (note that this listener is removed in unload)
            accSettings.addEventListener("highcontrastchanged", redrawPhotoMessages);

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

            if (accSettings != null) {
                accSettings.removeEventListener("highcontrastchanged", redrawPhotoMessages);
            }
        },

        //This is called when we're resized
        updateLayout: function () {
            //Set canvas dimensions equal to its container
            var resizeCanvas = function (parent, canvas) {
                var parentDiv = document.getElementById(parent);
                var image = document.getElementById(canvas);
                image.width = parentDiv.clientWidth;
                image.height = parentDiv.clientHeight;                
            };

            //Do this for both the photo and the error image
            resizeCanvas("photoDiv", "photo");
            resizeCanvas("mapDiv", "errorImage");
            redrawPhotoMessages();
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
                        updatePhotoSrcAndDraw(uri, document.getElementById("photo"));
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
        var uri = URL.createObjectURL(newFile, { oneTimeOnly: true });
        updatePhotoSrcAndDraw(uri, document.getElementById("photo"));

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

        data.properties.title = WinJS.Resources.getString('share_title').value;
        data.properties.description = formatLocation(app.sessionState.lastPosition.latitude, app.sessionState.lastPosition.longitude);

        //Include our listing URI for the Store; linkUri will throw if we're not in the Store yet
        try {
            data.properties.applicationListingUri = Windows.ApplicationModel.Store.CurrentApp.linkUri;
        } catch (e) {
            //Do nothing
        }

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

        var formatString = null;

        switch (format) {
            case "verbose":
                formatString = WinJS.Resources.getString("location_formatLong").value;
                break;

            default:
                formatString = WinJS.Resources.getString("location_formatShort").value;
                break;
        }

        return sprintf(formatString, lat, long);
    }

    //From http://stackoverflow.com/questions/610406/javascript-equivalent-to-printf-string-format
    function sprintf(format, etc) {
        var arg = arguments;
        var i = 1;
        return format.replace(/%((%)|s)/g, function (m) { return m[2] || arg[i++] })
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
        
        // The transcodeImage routine originally written in JavaScript is now in the Utilities component,
        // written in C#, which gives you an opportunity to compare the implementations.
        var promise = Utilities.ImageConverter.transcodeImageAsync(lastCapture, "tile_image_square.png", 270, 270);

        promise.done(function (_squareURI) {
            squareURI = _squareURI;
            if (squareURI != null) {
                //Got the images, go update the tile using the same image for both square and wide tiles.
                issueTileUpdate(squareURI, squareURI);
            }
        }, function (e) {
            console.log("Error: " + e);
        });
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

    //Handler for contrast changed event, context changed event, resizing, and initialization
    function redrawPhotoMessages() {
        var image;

        //If we don't have a picture, draw the message, otherwise update the image because
        //the canvas will lose its contents when it's resized.
        image = document.getElementById("photo");

        if (lastCapture == null) {            
            drawPhotoMessage(image, WinJS.Resources.getString("photo_line1").value, WinJS.Resources.getString("photo_line2").value);
        } else {
            drawPhoto(image);
        }

        //Redraw the map error message (it's normally hidden)
        image = document.getElementById("errorImage");
        drawPhotoMessage(image, WinJS.Resources.getString("location_errorImage1").value, WinJS.Resources.getString("location_errorImage2").value);
    }

    //Draws text lines on a canvas (line2 could be "")
    function drawPhotoMessage(element, line1, line2) {        
        var ctx = element.getContext("2d");
        ctx.clearRect(0, 0, element.width, element.height);

        //Set an appropriate color scheme for the contrast setting. If we're standard, do white
        //on gray. If high contrast or white on black, do white on black, otherwise do black on white.
        var textColor = "#ffffff";
        var backColor = "#7f7f7f";
        var borderColor = "#7f7f7f";

        if (accSettings.highContrast) {            
            switch (accSettings.highContrastScheme) {
                case "High Contrast White":
                    //Set black on white for white background theme
                    textColor = "#000000";
                    backColor = "#ffffff";                    
                    borderColor = "#000000";
                    break;

                default:
                    //Set white on black for anything else
                    textColor = "#ffffff";
                    backColor = "#000000";
                    borderColor = "#ffffff";
                    break;
            }
        }

        //Fill in the background
        ctx.fillStyle = backColor;        
        ctx.fillRect(0, 0, element.width, element.height);
        ctx.strokeStyle = borderColor;
        ctx.strokeRect(0, 0, element.width, element.height);

        //Draw the text centered; using a smaller size for snapped view
        var view = Windows.UI.ViewManagement;
        var fontSize = 40;
        ctx.font = "20pt Segoe UI";

        if (view.ApplicationView.value == view.ApplicationViewState.snapped) {
            ctx.font = "11pt Segoe UI";
            fontSize = 20;
        }
                    
        ctx.fillStyle = textColor;        

        //For most languages, center the text; to render Hebrew (our one RTL language) decently,
        //we'll right-align it. This could still be improved.
        var x = element.width / 2;

        if (Windows.System.UserProfile.GlobalizationPreferences.languages[0] == "he") {
            ctx.textAlign = "right";
            x = element.width * 3 / 4;
        } else {
            ctx.textAlign = "center";
        }
        
        var haveSecondLine = (line2 != "~");   //Ignore no-text indicator (because the resource loader won't load "" as a string).
        var offset = haveSecondLine ? fontSize / 2 : fontSize / 4;
        var y1 = element.height / 2 - offset;  
        var y2 = element.height / 2 + offset;  

        ctx.fillText(line1, x, y1);

        if (haveSecondLine) {
            ctx.fillText(line2, x, y2);
        }

        return;
    }

    //Helper function to draw canvas from photo src when it's ready
    function updatePhotoSrcAndDraw(uri, element) {
        var photoSrc = document.getElementById("photoSrc");
        photoSrc.src = uri;

        photoSrc.onload = function () {
            drawPhoto(element);
        }
    }

    function drawPhoto(element) {
        var ctx = element.getContext("2d");
        var source = document.getElementById("photoSrc");

        ctx.drawImage(source, 0, 0, element.width, element.height);
        return;
    }

})();
