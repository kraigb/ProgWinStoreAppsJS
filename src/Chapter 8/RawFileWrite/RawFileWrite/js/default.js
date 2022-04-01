// For an introduction to the Blank template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkId=232509
(function () {
    "use strict";

    var app = WinJS.Application;
    var activation = Windows.ApplicationModel.Activation;

    app.onactivated = function (args) {
        if (args.detail.kind === activation.ActivationKind.launch) {
            if (args.detail.previousExecutionState !== activation.ApplicationExecutionState.terminated) {
                // TODO: This application has been newly launched. Initialize
                // your application here.
            } else {
                // TODO: This application has been reactivated from suspension.
                // Restore application state here.
            }
            args.setPromise(WinJS.UI.processAll());

            var fileContents = "Congratulations, you're written data to a temp file!";
            writeTempFileRaw("data.tmp", fileContents);            
            writeTempFileSimple("data-simple.tmp", fileContents);

            //Even more compact with WinJS--a function like writeTempFileSImple is built in
            WinJS.Application.temp.writeText("data-winjs.tmp", fileContents);
        }
    };

    //This function shows file I/O at the lowest level using streams. The higher-level
    //API is found in Windows.Storage.PathIO and FileIO, and will typically be what an
    //app uses for this purpose.    
    function writeTempFileRaw(filename, contents) {
        var tempFolder = Windows.Storage.ApplicationData.current.temporaryFolder;
        var outputStream;
        
        tempFolder.createFileAsync(filename, Windows.Storage.CreationCollisionOption.replaceExisting)
            .then(function (file) {
                return file.openAsync(Windows.Storage.FileAccessMode.readWrite);
            }).then(function (stream) {
                outputStream = stream.getOutputStreamAt(0);
                var writer = new Windows.Storage.Streams.DataWriter(outputStream);
                writer.writeString(contents);
                return writer.storeAsync();
            }).done();

        //Note: outputStream.flushAsync() is not needed for non-transacted streams
    }

    //Here's the same thing with FileIO, where one call replaces the lower-level details.
    function writeTempFileSimple(filename, contents) {
        var tempFolder = Windows.Storage.ApplicationData.current.temporaryFolder;
        
        tempFolder.createFileAsync(filename, Windows.Storage.CreationCollisionOption.replaceExisting)
        .then(function (file) {
            Windows.Storage.FileIO.writeTextAsync(file, contents).done();
        });
    }

    app.oncheckpoint = function (args) {
        // TODO: This application is about to be suspended. Save any state
        // that needs to persist across suspensions here. You might use the
        // WinJS.Application.sessionState object, which is automatically
        // saved and restored across suspension. If you need to complete an
        // asynchronous operation before your application is suspended, call
        // args.setPromise().
    };

    app.start();
})();
