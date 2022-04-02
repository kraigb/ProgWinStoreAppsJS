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
            args.setPromise(WinJS.UI.processAll().then(function () {
                performance.mark("UI ready");

                document.getElementById("btnLoadImage").addEventListener("click", loadImage);
                document.getElementById("btnGrayscaleJS").addEventListener("click", function () { setGrayscale("JavaScript") });
                document.getElementById("btnGrayscaleCS").addEventListener("click", function () { setGrayscale("CS") });
                document.getElementById("btnGrayscaleCPP").addEventListener("click", function () { setGrayscale("CPP") });
                document.getElementById("btnSave").addEventListener("click", saveGrayscale);
                document.getElementById("btnConvertViaTemp").addEventListener("click", convertViaTempFile);

                document.getElementById("testCS").addEventListener("click", testComponentCS);
                document.getElementById("testCPP").addEventListener("click", testComponentCPP);
                document.getElementById("testPerf").addEventListener("click", testPerf);
                document.getElementById("testPerfAsync").addEventListener("click", testPerfAsync);

                showProgress("progressRing", false);
                showProgress("progressSync", false);
                showProgress("progressAsync", false);
            }));
        }
    };

    app.oncheckpoint = function (args) {
    };


    function showProgress(id, show) {
        var progress = document.getElementById(id);
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
                showProgress("progressRing", true);
                //Save the StorageFile object
                imageFile = file;

                var url = URL.createObjectURL(file, { oneTimeOnly: true });
                document.getElementById("image1").src = url;
                document.getElementById("image1").style.display = "";
                document.getElementById("btnGrayscaleJS").disabled = false;
                document.getElementById("btnGrayscaleCS").disabled = false;
                document.getElementById("btnGrayscaleCPP").disabled = false;
                document.getElementById("btnConvertViaTemp").disabled = false;

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

                    performance.mark("loadImage done");
                });

                showProgress("progressRing", false);
            }
        });
    }

    //setGrayscale uses either JavaScript or WinRT components to do the core part of converting
    //pixels to grayscale. The componentType argument indicates which method to use.

    //Note that this is not necessarily the best approach, though it illustrates working with components.
    //See the convertViaTempFile for a different solution.
    
    function setGrayscale(componentType) {
        performance.mark("setGrayscale enter");

        //Show the canvas and hide the second image
        document.getElementById("canvas1").style.display = "";
        document.getElementById("image2").style.display = "none";


        //Decode the image file into pixel data for a canvas        

        //Get an input stream for the file (StorageFile object saved from opening)
        imageFile.openReadAsync().then(function (stream) {            
            //Create a decoder using static createAsync method and the file stream
            return Imaging.BitmapDecoder.createAsync(stream);
        }).then(function (decoderArg) {
            showProgress("progressRing", true);
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
                    decoder.pixelWidth, decoder.pixelHeight, componentType);            
        }, function () {
            showProgress("progressRing", false);
            performance.mark("setGrayscale complete");
        });
    }

    //Convert pixels to grayscale (using one of different implementations), and render to the canvas
    function copyGrayscaleToCanvas(pixels, width, height, componentType) {
        performance.mark("copyGrayscaleToCanvas enter");

        showProgress("progressRing", true);
        document.getElementById("canvas1").style.display = "";
        document.getElementById("image2").style.display = "none";

        //Set up the canvas context and get its pixel array
        var canvas = document.getElementById("canvas1");
        canvas.width = width;
        canvas.height = height;
        var ctx = canvas.getContext("2d");

        //Loop through and copy pixel values into the canvas after converting to grayscale        
        var imgData = ctx.createImageData(canvas.width, canvas.height);        
        var start;
        
        start = new Date();

        switch (componentType) {
            case "JavaScript":
                doGrayscale(pixels, imgData.data);
                updateOutput(ctx, imgData, start);                
                break;

            case "CS":
                var option = document.getElementById("optionSelect").selectedIndex;
                var pc1 = new PixelCruncherCS.Grayscale();

                switch (option) {
                    case 0:
                        //Use synchronous method
                        pc1.convert(pixels, imgData.data);
                        updateOutput(ctx, imgData, start);
                        break;

                    case 1:
                        //Async method #1 with vector results                                
                        pc1.convertPixelArrayAsync(pixels).done(function (data) {
                            //A drawback is that we can't take data and give it directly to the canvas--have to copy it to imgData.
                            copyArrayToImgData(data, imgData);
                            updateOutput(ctx, imgData, start);
                        });
                        break;

                    case 2:
                        //Async method #2: using input and output properties
                        pc1.inputData = pixels;
                        pc1.convertArraysAsync().done(function () {
                            var data = pc1.detachOutputData()
                            copyArrayToImgData(data, imgData);
                            updateOutput(ctx, imgData, start);
                        }, function (e) {
                            document.getElementById("timeOutput").innerText = "Exception: " + e.message;
                        });

                        break;
                }
                break;

            case "CPP":
                var pc2 = new PixelCruncherCPP.Grayscale();
                pc2.convert(pixels, imgData.data);
                updateOutput(ctx, imgData, start);
                break;
        }

        performance.mark("copyGrayscaleToCanvas complete");
    }

    
    //JavaScript equivalent of the routine in the components
    function doGrayscale(pixels, pixelsGray) {
        var colorOffset = { red: 0, green: 1, blue: 2, alpha: 3 };
        var r, g, b, gray;        

        for (var i = 0; i < pixels.length; i += 4) {
            r = pixels[i + colorOffset.red];
            g = pixels[i + colorOffset.green];
            b = pixels[i + colorOffset.blue];

            //Assign each rgb value to brightness formula
            //gray = Math.floor(.3 * r + .55 * g + .11 * b);    //Floating-point version
            gray = (30 * r + 55 * g + 11 * b) / 100;  //Integer version: much faster

            pixelsGray[i + colorOffset.red] = gray;
            pixelsGray[i + colorOffset.green] = gray;
            pixelsGray[i + colorOffset.blue] = gray;
            pixelsGray[i + colorOffset.alpha] = pixels[i + colorOffset.alpha];
        }

        return;
    }


    //Helper to copy pixel array to the canvas ImageData array; unfortunately the canvas doesn't have
    //a means through which you can just point to the new pixels directly. This reduces the value of an
    //async WinRT component to do the pixel crunching.
    function copyArrayToImgData(data, imgData) {
        var dataImg = imgData.data;
                    
        for (var i = 0 ; i < dataImg.length; i++) {
            dataImg[i] = data[i];
        }
    }

    //Update UI once a conversion is done
    function updateOutput(ctx, imgData, start) {
        //Show elapsed time.        
        var time = new Date() - start;
        document.getElementById("output").innerText = "Conversion took " + time + "ms";

        //Put pixels on the canvas (this can take a while itself)
        ctx.putImageData(imgData, 0, 0);

        //Enable save button
        document.getElementById("btnSave").disabled = false;
        showProgress("progressRing", false);
        return;
    }

    //Routine to save canvas contents to a file
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
            showProgress("progressRing", true);
            
            //Set the pixel data--assume "encoding" object has options from elsewhere.
            //Conversion from canvas data to Uint8Array is necessary because the array type
            //from the canvas doesn't match what WinRT needs here.
          
            encoder.setPixelData(encoding.pixelFormat, encoding.alphaMode,
                encoding.width, encoding.height, encoding.dpiX, encoding.dpiY,
                new Uint8Array(imgData.data));

            //Go do the encoding
            return encoder.flushAsync();
        }).done(function () {
            showProgress("progressRing", false);

            //Make sure to do this at the end
            fileStream.close();
        }, function () {
            showProgress("progressRing", false);
            performance.mark("saveGrayscale complete");
        });
    }
    
    //If the goal is to convert a file and not necessarily render to a canvas, then we can bypass the canvas
    //altogether and just use a temp file instead. In doing so, we can pull the canvas parts out of the whole
    //process we've used above, discovering in the process that we can implement the whole smash inside an
    //async component method: we give it the source file and we get back the temp file with which we can just
    //call URL.createObjectURL and assign the result to an img src. If you look at this code along with the
    //implementation of convertGrayscaleFileAsync, you'll see that it's much smaller than what we've seen
    //using other approaches.

    function convertViaTempFile() {
        performance.mark("convertViaTempFile enter");

        showProgress("progressRing", true);

        //Show the second image and hide the canvas
        document.getElementById("canvas1").style.display = "none";
        document.getElementById("image2").src = "#";
        document.getElementById("image2").style.display = "";

        var start = new Date();

        PixelCruncherCS.Grayscale.convertGrayscaleFileAsync(imageFile).done(function (tempFile) {
            document.getElementById("output").innerText = "Conversion took " + (new Date() - start) + "ms";

            if (tempFile != null) {
                //var uri = URL.createObjectURL(tempFile, { oneTimeOnly: true });
                document.getElementById("image2").src = "ms-appdata:///temp/" + tempFile.name;
            }

            performance.mark("convertViaTempFile complete");
        });

        showProgress("progressRing", false);
    }


    //
    // Various perf and component tests follow
    //

    //Exercise basic methods in the C# component
    function testComponentCS() {
        performance.mark("testComponentCS enter");

        var result = PixelCruncherCS.Tests.testMethod(false);

        try {
            result = PixelCruncherCS.Tests.testMethod(true);
        } catch (e) {
            console.log("PixelCruncherCS.Tests.testMethod threw: '" + e.description + "'.");
        }

        var tests = new PixelCruncherCS.Tests();
        tests.testProperty = 10072006;
        var value = tests.testProperty;

        performance.mark("testComponentCS complete");

        //Test async vector generator
        PixelCruncherCS.Tests.createByteListAsync(20).done(function (result) {
            console.log(result);            
        });

    }

    //Exercise basic methods in the C++ component
    function testComponentCPP() {        
        var result = PixelCruncherCPP.Tests.testMethod(false);

        try {
            result = PixelCruncherCPP.Tests.testMethod(true);
        } catch (e) {
            console.log("PixelCruncherCPP.Tests.testMethod threw: '" + e.description + "'.");
        }

        var tests = new PixelCruncherCPP.Tests();        
        tests.testProperty = 10072006;
        var value = tests.testProperty;
        performance.mark("testComponentCPP complete");
    }


    //Simple function to exercise three ways of doing the same calculation
    function testPerf() {
        showProgress("progressSync", true);
        document.getElementById("output").innerText = " ";

        //Yield to the UI thread for a bit so the progress indicator can appear.
        setTimeout(testPerfInner, 500);
    }

    //Perform some relative perf tests for the different languages.
    function testPerfInner() {
        var timeJS, timeCS, timeCPP;
        var sumJS, sumCS, sumCPP;

        //Note: .0001 increment is for running in the debugger (which takes longer); set to .000001 to run a Release build
        var max = 100, increment = .0001;

        var start = new Date();
        sumJS = countFromZero(max, increment);
        timeJS = new Date() - start;

        start = new Date();
        sumCS = PixelCruncherCS.Tests.countFromZero(max, increment);
        timeCS = new Date() - start;

        start = new Date();        
        sumCPP = PixelCruncherCPP.Tests.countFromZero(max, increment);        
        timeCPP = new Date() - start;
                
        showProgress("progressSync", false);
        document.getElementById("output").innerText = "JS: " + timeJS + "ms (" + sumJS + "); "
            + "C#: " + timeCS + "ms (" + sumCS + "); " + "C++: " + timeCPP + "ms (" + sumCPP + "); "            
    }


    function countFromZero(max, increment) {
        var sum = 0;

        for (var x = 0; x < max; x += increment) {
            sum += x;
        }

        return sum;
    }


    //Perform the same test as testPerf but running on other threads
    function testPerfAsync() {
        showProgress("progressAsync", true);
       
        //To work with async operations in a worker, it can be useful to create a promise around it. The trick here
        //is to wire a variable up to whatever completed handler would later be given to the promise's then or done
        //methods. The function we provide to new WinJS.Promise receives the promise's internal dispatcher methods.
        //So when we want to inform whoever is listening (whoever called then or done), we just call the dispatcher,
        //which we're saving here in workerCompleteDispatcher.

        var workerCompleteDispatcher = null;

        var promiseJS = new WinJS.Promise(function (completeDispatcher, errorDispatcher, progressDispatcher) {
            workerCompleteDispatcher = completeDispatcher;
        });

        //Start the JavaScript worker
        document.getElementById("outputAsyncJS").innerText = "-";
        var startJS = new Date();
        var worker = new Worker('js/worker_count.js');
        worker.onmessage = function (e) {
            //e.data.sum is the result; if we have a promise set up, invoke its completed handler
            if (workerCompleteDispatcher != null) {
                workerCompleteDispatcher(e.data.sum);
            }
        }

        //Provide a completed handler to the promise wrapping the worker
        promiseJS.done(function (sum) {
            document.getElementById("outputAsyncJS").innerText = (new Date() - startJS) + "ms (" + sum + ")";
        });

        //Invoke the method to run the computation 
        worker.postMessage({ method: "countFromZero", max: 1000, increment: .00005 });
        

        //Start the C# async operation
        document.getElementById("outputAsyncCS").innerText = "-";
        var startCS = new Date();
        var promiseCS = PixelCruncherCS.Tests.countFromZeroAsync(1000, .00001);
        promiseCS.done(function (sum) {            
            document.getElementById("outputAsyncCS").innerText = (new Date() - startCS) + "ms (" + sum + ")";
        });


        //Start the C++ operation
        document.getElementById("outputAsyncCPP").innerText = "-";
        var startCPP = new Date();
        var promiseCPP = PixelCruncherCPP.Tests.countFromZeroAsync(10000, .00005);
        promiseCPP.done(function (sum) {            
            document.getElementById("outputAsyncCPP").innerText = (new Date() - startCPP) + "ms (" + sum + ")";
        });


        //By joining promises we wait to execute the completed handler until all are done. This is the perfect place
        //to reset any UI that's common to all the operations, such as the progress handler.
        WinJS.Promise.join([promiseCS, promiseCPP]).done(function () {            
            showProgress("progressAsync", false);
        });
    }


    app.start();
})();


