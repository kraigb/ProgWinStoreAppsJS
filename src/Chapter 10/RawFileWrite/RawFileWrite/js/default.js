(function () {
    "use strict";

    var app = WinJS.Application;
    var activation = Windows.ApplicationModel.Activation;

    app.onactivated = function (args) {
        if (args.detail.kind === activation.ActivationKind.launch) {
            if (args.detail.previousExecutionState !== activation.ApplicationExecutionState.terminated) {
            } else {
            }
            args.setPromise(WinJS.UI.processAll());

            var fileContents = "Congratulations, you're written data to a temp file!";

            writeTempFileRaw("data.tmp", fileContents);
            writeTempFileSimple("data-simple.tmp", fileContents);

            //Even more compact--a function like writeTempFileSimple is built into WinJS
            WinJS.Application.temp.writeText("data-winjs.tmp", fileContents);
            
            //Another simple way
            Windows.Storage.PathIO.writeTextAsync("ms-appdata:///temp/data-pathio.tmp", fileContents);

            writeTempFileReallyRaw("data-raw.tmp", fileContents);
        }
    };

    //This function shows file I/O at the lowest level using streams. The higher-level
    //API is found in Windows.Storage.PathIO and FileIO, and will typically be what an
    //app uses for this purpose.    
    function writeTempFileRaw(filename, contents) {
        var ws = Windows.Storage;
        var tempFolder = ws.ApplicationData.current.temporaryFolder;
        var outputStream;
        
        tempFolder.createFileAsync(filename, ws.CreationCollisionOption.replaceExisting)
            .then(function (file) {
                return file.openAsync(ws.FileAccessMode.readWrite);
            }).then(function (stream) {
                outputStream = stream.getOutputStreamAt(0);
                var writer = new ws.Streams.DataWriter(outputStream);
                writer.writeString(contents);
                return writer.storeAsync();
            }).done();

        //Note: outputStream.flushAsync() is not needed for non-transacted streams
    }

    //Here's the same thing with FileIO, where one call replaces the lower-level details.
    function writeTempFileSimple(filename, contents) {
        var ws = Windows.Storage;
        var tempFolder = ws.ApplicationData.current.temporaryFolder;
        
        tempFolder.createFileAsync(filename, ws.CreationCollisionOption.replaceExisting)
        .then(function (file) {
            ws.FileIO.writeTextAsync(file, contents);
        });
    }


    //An even lower-level version of writeTempFile, showing buffers at work
    function writeTempFileReallyRaw(filename, contents) {
        var ws = Windows.Storage;
        var tempFolder = ws.ApplicationData.current.temporaryFolder;
        var writer;
        var outputStream;

        //All the control you want!
        tempFolder.createFileAsync(filename, ws.CreationCollisionOption.replaceExisting)
        .then(function (file) {
            //file is a StorageFile
            return file.openAsync(ws.FileAccessMode.readWrite);
        }).then(function (stream) {
            //Stream is an RandomAccessStream. To write to it, we need an IOuputStream
            outputStream = stream.getOutputStreamAt(0);
            //Create a buffer with contents
            writer = new ws.Streams.DataWriter(outputStream);
            writer.writeString(contents);
            var buffer = writer.detachBuffer();
            return outputStream.writeAsync(buffer);
        }).then(function (bytesWritten) {
            console.log("Wrote " + bytesWritten + " bytes.");
            return outputStream.flushAsync();
        }).done(function () {
            writer.close(); //Closes the stream too
        });
    }



    app.start();
})();
