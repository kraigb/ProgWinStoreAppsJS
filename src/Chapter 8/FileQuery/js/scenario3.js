//// THIS CODE AND INFORMATION IS PROVIDED "AS IS" WITHOUT WARRANTY OF
//// ANY KIND, EITHER EXPRESSED OR IMPLIED, INCLUDING BUT NOT LIMITED TO
//// THE IMPLIED WARRANTIES OF MERCHANTABILITY AND/OR FITNESS FOR A
//// PARTICULAR PURPOSE.
////
//// Copyright (c) Microsoft Corporation. All rights reserved

(function () {
    "use strict";
    
    var s = Windows.Storage.Search;    
    var queryFiles = true;

    //Mapping between our select control option indices and CommonFileQuery values
    var fileQueryMapping = [
        s.CommonFileQuery.orderByName,
        s.CommonFileQuery.orderByTitle,
        s.CommonFileQuery.orderByDate,
        s.CommonFileQuery.orderByMusicProperties,
        s.CommonFileQuery.orderBySearchRank
    ];

    //Mapping between our select control option indices and CommonFolderQuery values
    var folderQueryMapping = [
        s.CommonFolderQuery.groupByType,
        s.CommonFolderQuery.groupByTag,
        s.CommonFolderQuery.groupByDate,
        s.CommonFolderQuery.groupByAuthor,
        s.CommonFolderQuery.groupByYear,
        s.CommonFolderQuery.groupByMonth,
        s.CommonFolderQuery.groupByArtist,
        s.CommonFolderQuery.groupByComposer,
        s.CommonFolderQuery.groupByGenre,
        s.CommonFolderQuery.groupByPublishedYear,
        s.CommonFolderQuery.groupByRating
    ];
    

    var page = WinJS.UI.Pages.define("/html/scenario3.html", {
        ready: function (element, options) {
            document.getElementById("search").addEventListener("click", search, false);
            document.getElementById("selectItem").addEventListener("change", showQueries, false);
        }
    });

    function showQueries(e) {
        //Show or hide the query select control based on the type of item selected, and
        //remember the selection for searching.
        var styleFiles = "";
        var styleFolders = "";

        if (e.target[e.target.selectedIndex].id == "itemFiles") {
            styleFolders = "none";
            queryFiles = true;
        } else {
            styleFiles = "none";
            queryFiles = false;
        }

        document.getElementById("selectFileQuery").style.display = styleFiles;
        document.getElementById("selectFolderQuery").style.display = styleFolders;
    }

    function search() {
        //Obtain the appropriate StorageFolder for the selected library.
        var selectLibrary = document.getElementById("selectLibrary");
        var libraryName = selectLibrary[selectLibrary.selectedIndex].id;
        var folder = Windows.Storage.KnownFolders[libraryName];
        
        var queryList, selectedQuery, query, promise = null;

        if (queryFiles) {
            //Querying files, get the selected CommonFileQuery
            queryList = document.getElementById("selectFileQuery");
            selectedQuery = fileQueryMapping[queryList.selectedIndex];

            //Create the query and enumerate the files, if supported. Otherwise promise remains null.            
            if (folder.isCommonFileQuerySupported(selectedQuery)) {
                query = folder.createFileQuery(selectedQuery);
                if (query) {
                    promise = query.getFilesAsync();
                }
            }
        } else {
            //Querying for folders, get the selected CommonFolderQuery
            queryList = document.getElementById("selectFolderQuery");
            selectedQuery = folderQueryMapping[queryList.selectedIndex];

            //Create the query and enumerate the folders, if supported. Otherwise promise remains null.
            if (folder.isCommonFolderQuerySupported(selectedQuery)) {
                query = folder.createFolderQuery(selectedQuery);

                if (query) {
                    promise = query.getFoldersAsync();
                }
            }
        }
        
        SdkSample.showResults(promise);
    }
})();
