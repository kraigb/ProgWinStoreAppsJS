(function () {
    "use strict";

    var app = WinJS.Application;
    var activation = Windows.ApplicationModel.Activation;

    var Imaging = Windows.Graphics.Imaging;  //Shortcut
    var imageFile;                           //Saved from the file picker
    var decoder;                             //Saved from BitmapDecoder.createAsync
    var encoding = {};                       //To cache some details from the decoder    

    app.onactivated = function (args) {
        if (args.detail.kind === activation.ActivationKind.launch) {
            if (args.detail.previousExecutionState !== activation.ApplicationExecutionState.terminated) {
            } else {
            }
            args.setPromise(WinJS.UI.processAll());

            document.getElementById("btnLoadImage").addEventListener("click", loadImage);
            document.getElementById("btnGrayscale").addEventListener("click", setGrayscale);
            document.getElementById("btnSave").addEventListener("click", saveGrayscale);
            showProgress(false);
        }
    };

    app.oncheckpoint = function (args) {
    };


    function showProgress(show) {
        var progress = document.getElementById("progressRing");
        progress.style.display = show ? "" : "none";        
    }


    function loadImage() {
        performance.mark("loadImage enter");

        //Load an image selected from the pictures library into an element
        var picker = new Windows.Storage.Pickers.FileOpenPicker();
        picker.suggestedStartLocation = Windows.Storage.Pickers.PickerLocationId.picturesLibrary;
        picker.fileTypeFilter.replaceAll([".jpg", ".jpeg", ".png"]);

        picker.pickSingleFileAsync().then(function (file) {
            if (file) {
                showProgress(true);
                //Save the StorageFile object
                imageFile = file;

                var url = URL.createObjectURL(file, { oneTimeOnly: true });
                document.getElementById("image1").src = url;
                document.getElementById("image1").style.display = "";
                document.getElementById("btnGrayscale").disabled = false;

                //Get additional properties--first-level image information
                file.properties.getImagePropertiesAsync().done(function (props) {
                    var info = "Title: " + props.title + ", Taken: " + props.dateTaken;
                    document.getElementById("txtInfo").innerHTML = info;
                });

                //Get a thumbnail
                file.getThumbnailAsync(Windows.Storage.FileProperties.ThumbnailMode.picturesView).done(function (thumb) {
                    var stream = window.MSApp.createStreamFromInputStream(thumb.contentType, thumb.getInputStreamAt(0));
                    document.getElementById("thumb1").src = window.URL.createObjectURL(stream, { oneTimeOnly: true });
                    document.getElementById("thumb1").style.display = "";

                    performance.mark("loadImage complete");
                });

                showProgress(false);
            }
        });
    }

    function setGrayscale() {
        performance.mark("setGrayscale enter");

        //Decode the image file into pixel data for a canvas        

        //Get an input stream for the file (StorageFile object saved from opening)
        imageFile.openReadAsync().then(function (stream) {            
            //Create a decoder using static createAsync method and the file stream
            return Imaging.BitmapDecoder.createAsync(stream);
        }).then(function (decoderArg) {
            showProgress(true);
            decoder = decoderArg;

            //Configure the decoder if desired. Default is BitmapPixelFormat.rgba8 and
            //BitmapAlphaMode.ignore. You can also use the parameterized version of getPixelDataAsync 
            //to control transform, ExifOrientationMode, and ColorManagementMode if needed.

            //Cache these settings for encoding later
            encoding.dpiX = decoder.dpiX;
            encoding.dpiY = decoder.dpiY;
            encoding.pixelFormat = decoder.bitmapPixelFormat;
            encoding.alphaMode = decoder.bitmapAlphaMode;
            encoding.width = decoder.pixelWidth;
            encoding.height = decoder.pixelHeight;

            return decoder.getPixelDataAsync();
        }).done(function (pixelProvider) {
            //detachPixelData gets the actual bits (array can't be returned from an async operation)
            copyGrayscaleToCanvas(pixelProvider.detachPixelData(),
                    decoder.pixelWidth, decoder.pixelHeight);            
        }, function () {
            showProgress(false);
            performance.mark("setGrayscale complete");
        });
    }

    function copyGrayscaleToCanvas(pixels, width, height) {
        performance.mark("copyGrayscaleToCanvas enter");

        showProgress(true);

        //Set up the canvas context and get its pixel array
        var canvas = document.getElementById("canvas1");
        canvas.width = width;
        canvas.height = height;
        var ctx = canvas.getContext("2d");

        //Loop through and copy pixel values into the canvas after converting to grayscale
        var imgData = ctx.createImageData(canvas.width, canvas.height);
        var colorOffset = { red: 0, green: 1, blue: 2, alpha: 3 };
        var r, g, b, gray;
        var data = imgData.data;  //Makes a huge perf difference to not dereference imgData.data each time!

        for (var i = 0; i < pixels.length; i += 4) {
            r = pixels[i + colorOffset.red];
            g = pixels[i + colorOffset.green];
            b = pixels[i + colorOffset.blue];

            //Assign each rgb value to brightness for
            //gray = Math.floor(.3 * r + .55 * g + .11 * b);    //Floating-point version
            gray = (30 * r + 55 * g + 11 * b) / 100;  //Integer version: much faster
            
            data[i + colorOffset.red] = gray;
            data[i + colorOffset.green] = gray;
            data[i + colorOffset.blue] = gray;
            data[i + colorOffset.alpha] = pixels[i + colorOffset.alpha];
        }

        //Show it on the canvas        
        ctx.putImageData(imgData, 0, 0);

        //Enable save button
        document.getElementById("btnSave").disabled = false;
        showProgress(false);
        performance.mark("copyGrayscaleToCanvas complete");
    }


    function saveGrayscale() {
        performance.mark("saveGrayscale enter");

        var picker = new Windows.Storage.Pickers.FileSavePicker();
        picker.suggestedStartLocation = Windows.Storage.Pickers.PickerLocationId.picturesLibrary;
        picker.suggestedFileName = imageFile.name + " - grayscale";
        picker.fileTypeChoices.insert("PNG file", [".png"]);

        var imgData, fileStream = null;

        picker.pickSaveFileAsync().then(function (file) {
            if (file) {
                return file.openAsync(Windows.Storage.FileAccessMode.readWrite);                
            } else {
                return WinJS.Promise.wrapError("No file selected");
            }
        }).then(function (stream) {
            fileStream = stream;

            var canvas = document.getElementById("canvas1");
            var ctx = canvas.getContext("2d");
            imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            
            return Imaging.BitmapEncoder.createAsync(Imaging.BitmapEncoder.pngEncoderId, stream);
        }).then(function (encoder) {
            showProgress(true);            
            
            //Set the pixel data--assume "encoding" object has options from elsewhere.
            //Conversion from canvas data to Uint8Array is necessary because the array type
            //from the canvas doesn't match what WinRT needs here.
          
            encoder.setPixelData(encoding.pixelFormat, encoding.alphaMode,
                encoding.width, encoding.height, encoding.dpiX, encoding.dpiY,
                new Uint8Array(imgData.data));

            //Go do the encoding
            return encoder.flushAsync();
        }).done(function () {
            showProgress(false);

            //Make sure to do this at the end
            fileStream.close();
        }, function () {
            showProgress(false);
            performance.mark("saveGrayscale complete");
        });
    }

    app.start();
})();
