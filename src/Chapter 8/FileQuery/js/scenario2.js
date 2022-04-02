//// THIS CODE AND INFORMATION IS PROVIDED "AS IS" WITHOUT WARRANTY OF
//// ANY KIND, EITHER EXPRESSED OR IMPLIED, INCLUDING BUT NOT LIMITED TO
//// THE IMPLIED WARRANTIES OF MERCHANTABILITY AND/OR FITNESS FOR A
//// PARTICULAR PURPOSE.
////
//// Copyright (c) Microsoft Corporation. All rights reserved

(function () {
    "use strict";

    var picturesLibrary = Windows.Storage.KnownFolders.picturesLibrary;

    var page = WinJS.UI.Pages.define("/html/scenario2.html", {
        ready: function (element, options) {
            document.getElementById("fileQuery").addEventListener("click", fileQuery, false);
            document.getElementById("folderQuery").addEventListener("click", folderQuery, false);
            document.getElementById("itemQuery").addEventListener("click", itemQuery, false);
        }
    });

    function fileQuery() {
        //This is identical to picturesLibrary.createFileQuery(Windows.Storage.Search.CommonFileQuery.defaultQuery);
        var query = picturesLibrary.createFileQuery();
        SdkSample.showResults(query.getFilesAsync());
    }

    function folderQuery() {
        //This is identical to picturesLibrary.createFolderQuery(Windows.Storage.Search.CommonFileQuery.defaultQuery);
        var query = picturesLibrary.createFolderQuery();
        SdkSample.showResults(query.getFoldersAsync());
    }

    function itemQuery() {
        //This is identical to picturesLibrary.createItemQuery(Windows.Storage.Search.CommonFileQuery.defaultQuery);
        var query = picturesLibrary.createItemQuery();
        SdkSample.showResults(query.getItemsAsync());
    }

})();
