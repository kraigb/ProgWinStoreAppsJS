//// THIS CODE AND INFORMATION IS PROVIDED "AS IS" WITHOUT WARRANTY OF
//// ANY KIND, EITHER EXPRESSED OR IMPLIED, INCLUDING BUT NOT LIMITED TO
//// THE IMPLIED WARRANTIES OF MERCHANTABILITY AND/OR FITNESS FOR A
//// PARTICULAR PURPOSE.
////
//// Copyright (c) Microsoft Corporation. All rights reserved

(function () {
    "use strict";
    var page = WinJS.UI.Pages.define("/html/uploadMultipart.html", {
        ready: function (element, options) {
            // Assign event listeners for each button on click.
            id("StartMultipartUpload").addEventListener("click", uploadMultipart, false);
            
            // On load check if there are uploads in progress from a previous activation.
            printLog("Loading uploads ... ");
            // Enumerate outstanding uploads.
            Windows.Networking.BackgroundTransfer.BackgroundUploader.getCurrentUploadsAsync().done(function (uploads) {
                printLog("done.<br/>");
                // If uploads from previous application state exist, reassign callbacks and persist to global array.
                for (var i = 0; i < uploads.size; i++) {
                    var upload = new UploadOperation();
                    upload.load(uploads[i]);
                    uploadOperations.push(upload);
                }
            });
        }
    });

    // Global array used to persist operations.
    var uploadOperations = [];

    // Class associated with each upload.
    function UploadOperation() {
        var upload = null;
        var promise = null;

        this.startMultipart = function (uri, file) {
            printLog("Using URI: " + uri.absoluteUri + "<br/>");

            // Namespace shortcut
            var bt = Windows.Networking.BackgroundTransfer;
            var uploader = new bt.BackgroundUploader();
            var contentParts = [];

            // Instead of sending multiple files (as in the original sample), we'll create those parts that match
            // the POST example for Flickr on http://www.flickr.com/services/api/upload.example.html

            var part;

            part = new bt.BackgroundTransferContentPart();
            part.setHeader("Content-Disposition", "form-data; name=\"api_key\"");
            part.setText("3632623532453245");
            contentParts.push(part);

            part = new bt.BackgroundTransferContentPart();
            part.setHeader("Content-Disposition", "form-data; name=\"auth_token\"");            
            part.setText("436436545");
            contentParts.push(part);

            part = new bt.BackgroundTransferContentPart();
            part.setHeader("Content-Disposition", "form-data; name=\"api_sig\"");
            part.setText("43732850932746573245");
            contentParts.push(part);

            part = new bt.BackgroundTransferContentPart();
            part.setHeader("Content-Disposition", "form-data; name=\"photo\"; filename=\"" + file.name + "\"");
            part.setHeader("Content-Type", "image/jpeg");
            part.setFile(file);
            contentParts.push(part);

            // Create a new upload operation specifying a boundary string.
            uploader.createUploadAsync(uri, contentParts, "form-data", "-----------------------------7d44e178b0434")
                .then(function (uploadOperation) {
                    // Start the upload and persist the promise 
                    upload = uploadOperation;
                    promise = uploadOperation.startAsync().then(complete, error, progress);                
                }
            );
        };

        // On application activation, reassign callbacks for a upload
        // operation persisted from previous application state.
        this.load = function (loadedUpload) {
            upload = loadedUpload;
            printLog("Found upload: " + upload.guid + " from previous application run.<br\>");
            promise = upload.attachAsync().then(complete, error, progress);
        };

        // Returns true if this is the upload identified by the guid.
        this.hasGuid = function (guid) {
            return upload.guid === guid;
        };

        // Removes upload operation from global array.
        function removeUpload(guid) {
            uploadOperations.forEach(function (operation, index) {
                if (operation.hasGuid(guid)) {
                    uploadOperations.splice(index, 1);
                }
            });
        }

        // Progress callback.
        function progress() {
            // Output all attributes of the progress parameter.
            printLog(upload.guid + " - Progress: ");
            var currentProgress = upload.progress;
            for (var att in currentProgress) {
                printLog(att + ": " + currentProgress[att] + ", ");
            }
            printLog("<br/>");

            // Handle various pause status conditions. This will never happen when using POST verb (the default)
            // but may when using PUT. Application can change verb used by using method property of BackgroundUploader class.
            if (currentProgress.status === Windows.Networking.BackgroundTransfer.BackgroundTransferStatus.pausedCostedNetwork) {
                printLog("Upload " + upload.guid + " paused because of costed network <br\>");
            } else if (currentProgress.status === Windows.Networking.BackgroundTransfer.BackgroundTransferStatus.pausedNoNetwork) {
                printLog("Upload " + upload.guid + " paused because network is unavailable.<br\>");
            }            
        }

        // Completion callback.
        function complete() {
            removeUpload(upload.guid);

            printLog(upload.guid + " - upload complete. Status code: " + upload.getResponseInformation().statusCode + "<br/>");
            displayStatus(upload.guid + " - upload complete.");
        }

        // Error callback.
        function error(err) {
            if (upload) {
                removeUpload(upload.guid);
                printLog(upload.guid + " - upload completed with error.<br/>");
            }
            displayException(err);
        }
    }

    function displayException(err) {
        var message;
        if (err.stack) {
            message = err.stack;
        }
        else {
            message = err.message;
        }

        var errorStatus = Windows.Networking.BackgroundTransfer.BackgroundTransferError.getStatus(err.number);
        if (errorStatus === Windows.Web.WebErrorStatus.cannotConnect) {
            message = "App cannot connect. Network may be down, connection was refused or the host is unreachable.";
        }

        displayError(message);
    }

    function displayError(/*@type(String)*/message) {
        WinJS.log && WinJS.log(message, "sample", "error");
    }

    function displayStatus(/*@type(String)*/message) {
        WinJS.log && WinJS.log(message, "sample", "status");
    }

    // Print helper function.
    function printLog(/*@type(String)*/txt) {
        var console = document.getElementById("outputConsole");
        console.innerHTML += txt;
    }

    function id(elementId) {
        return document.getElementById(elementId);
    }

    function uploadMultipart() {
        // To demonstrate a simple multipart upload, we'll always use a simple in-package file.                
        var uriSource = new Windows.Foundation.Uri("ms-appx:///tinysquare.jpg");
        Windows.Storage.StorageFile.getFileFromApplicationUriAsync(uriSource).done(function (file) {
            if (!file) {
                displayError("Error: File could not be opened.");
                return;
            }

            var uri = null;
            try {
                uri = new Windows.Foundation.Uri(document.getElementById("serverAddressField").value);
            } catch (error) {
                displayError("Error: Invalid URI. " + error.message);
                return;
            }

            var upload = new UploadOperation();
            upload.startMultipart(uri, file);

            // Persist the upload operation in the global array.
            uploadOperations.push(upload);
        });
    }

})();
