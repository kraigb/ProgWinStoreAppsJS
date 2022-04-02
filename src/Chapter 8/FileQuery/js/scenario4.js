//// THIS CODE AND INFORMATION IS PROVIDED "AS IS" WITHOUT WARRANTY OF
//// ANY KIND, EITHER EXPRESSED OR IMPLIED, INCLUDING BUT NOT LIMITED TO
//// THE IMPLIED WARRANTIES OF MERCHANTABILITY AND/OR FITNESS FOR A
//// PARTICULAR PURPOSE.
////
//// Copyright (c) Microsoft Corporation. All rights reserved

(function () {
    "use strict";

    var page = WinJS.UI.Pages.define("/html/scenario4.html", {
        ready: function (element, options) {
            document.getElementById("runQuery").addEventListener("click", runQuery, false);
        }
    });

    function runQuery() {
        var musicLibrary = Windows.Storage.KnownFolders.musicLibrary;
        var options = new Windows.Storage.Search.QueryOptions(Windows.Storage.Search.CommonFileQuery.orderByTitle, [".mp3"]);

        if (musicLibrary.areQueryOptionsSupported(options)) {
            var query = musicLibrary.createFileQueryWithOptions(options);            
            SdkSample.showResults(query.getFilesAsync());
        }
    }

})();
