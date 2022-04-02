//// THIS CODE AND INFORMATION IS PROVIDED "AS IS" WITHOUT WARRANTY OF
//// ANY KIND, EITHER EXPRESSED OR IMPLIED, INCLUDING BUT NOT LIMITED TO
//// THE IMPLIED WARRANTIES OF MERCHANTABILITY AND/OR FITNESS FOR A
//// PARTICULAR PURPOSE.
////
//// Copyright (c) Microsoft Corporation. All rights reserved

(function () {
    "use strict";
    var cfq= Windows.Storage.Search.CommonFileQuery;

    //Array of queries matching our select control
    var queries = [ cfq.defaultQuery, cfq.orderByName, cfq.orderBySearchRank, cfq.orderByTitle, cfq.orderByDate, cfq.orderByMusicProperties ];       
    
    var page = WinJS.UI.Pages.define("/html/scenario4.html", {
        ready: function (element, options) {
            document.getElementById("getFiles").addEventListener("click", getFiles, false);
        }
    });

    // Enumerate all of the files in the picked folder and display their storage provider and availability.
    function getFiles() {        
        // Ask the user to pick a folder.
        var picker = new Windows.Storage.Pickers.FolderPicker();
        picker.fileTypeFilter.replaceAll(["*"]);
        picker.viewMode = Windows.Storage.Pickers.PickerViewMode.list;
        picker.suggestedStartLocation = Windows.Storage.Pickers.PickerLocationId.documentsLibrary;
        picker.pickSingleFolderAsync().done(function (folder) {
            if (folder) {
                var list = document.getElementById("itemsList");
                list.innerHTML = "";

                var select = document.getElementById("selectQuery");
                var selectedQuery = queries[select.selectedIndex];

                //Check if the folder supports the query, if not, show a message in output.
                if (!folder.isCommonFileQuerySupported(selectedQuery)) {
                    var listItemElement = document.createElement("li");
                    listItemElement.textContent = "Folder doesn't support this query.";
                    list.appendChild(listItemElement);
                    return;
                }

                // Query the folder.
                var query = folder.createFileQuery(selectedQuery);

                //This is just here so you can examine the options object in the debugger.
                var options = query.getCurrentQueryOptions();
                
                query.getFilesAsync().done(function (files) {
                    // Display file list with storage provider and availability.                    
                    files.forEach(function (file) {
                        // Create an entry in the list for the item.                        
                        var listItemElement = document.createElement("li");
                        listItemElement.textContent = file.name;

                        // Show the item's provider (This PC, SkyDrive, Network, or Application Content).
                        listItemElement.textContent += ": On " + file.provider.displayName;

                        // Show if the item is available (SkyDrive items are usually available when
                        // online or when they are marked for "always available offline").
                        listItemElement.textContent += " (";
                        if (file.isAvailable) {
                            listItemElement.textContent += "available";
                        } else {
                            listItemElement.textContent += "not available";
                        }
                        listItemElement.textContent += ")";

                        list.appendChild(listItemElement);
                    });
                });
            }
        });
    }    
})();
