//// THIS CODE AND INFORMATION IS PROVIDED "AS IS" WITHOUT WARRANTY OF
//// ANY KIND, EITHER EXPRESSED OR IMPLIED, INCLUDING BUT NOT LIMITED TO
//// THE IMPLIED WARRANTIES OF MERCHANTABILITY AND/OR FITNESS FOR A
//// PARTICULAR PURPOSE.
////
//// Copyright (c) Microsoft Corporation. All rights reserved
// Array passed as the 'dataSource' argument to the ListViews in default.html

(function () {

    var listViewItems; // WinJS.Binding.List

    "use strict";                   
    var page = WinJS.UI.Pages.define("/html/appbar-listview.html", {
        ready: function (element, options) {
            initAppBar();
            initListView();

            WinJS.log && WinJS.log("This scenario is demonstrated with a full screen ListView.", "sample", "status");
        },
        unload: function () {
            AppBarSampleUtils.removeAppBars();
        }
    });
    
    function initListView() {
        var listView = document.getElementById("scenarioListView").winControl;
        // Generate random items
        var items = [];
        for (var i = 0; i < 50; i++) {
            items[i] = generateItem();
        }
        listViewItems = new WinJS.Binding.List(items);
        listView.itemDataSource = listViewItems.dataSource;
        // Add event listeners
        document.getElementById("scenarioListView").addEventListener("selectionchanged", doSelectItem);
        document.getElementById("scenarioShowListView").addEventListener("click", doShowListView, false);
        document.getElementById("scenarioHideListView").addEventListener("click", doHideListView, false);
        document.getElementById("scenarioBackButton").addEventListener("click", doHideListView, false);
    }

    function initAppBar() {
        var appbarDiv = document.getElementById("scenarioAppBar");
        var appbar    = document.getElementById("scenarioAppBar").winControl;
        // Add event listeners (motified from original sample to use getCommandById)
        appbar.getCommandById("cmdAdd").addEventListener("click", doClickAdd, false);
        appbar.getCommandById("cmdDelete").addEventListener("click", doClickDelete, false);
        appbar.getCommandById("cmdSelectAll").addEventListener("click", doClickSelectAll, false);
        appbar.getCommandById("cmdClearSelection").addEventListener("click", doClickClearSelection, false);

        //Modified from using beforeshow in the original sample because the app bar height isn't available at that time
        appbar.addEventListener("aftershow", doAppBarShow, false);
        appbar.addEventListener("beforehide", doAppBarHide, false);        
        // Hide selection group of commands
        appbar.hideCommands(appbarDiv.querySelectorAll('.multiSelect'));
        // Disable AppBar until in full screen mode
        appbar.disabled = true;
    }
        
    function generateItem() {
        var type = Math.floor(Math.random() * 6);
        var tile;
        if (type === 0) {
            tile = { title: "Banana Blast", text: "Low-fat frozen yogurt", picture: "images/60Banana.png" };
        } else if (type === 1) {
            tile = { title: "Lavish Lemon Ice", text: "Sorbet", picture: "images/60Lemon.png" };
        } else if (type === 2) {
            tile = { title: "Marvelous Mint", text: "Gelato", picture: "images/60Mint.png" };
        } else if (type === 3) {
            tile = { title: "Creamy Orange", text: "Sorbet", picture: "images/60Orange.png" };
        } else if (type === 4) {
            tile = { title: "Very Vanilla", text: "Ice Cream", picture: "images/60Vanilla.png" };
        } else {
            tile = { title: "Succulent Strawberry", text: "Sorbet", picture: "images/60Strawberry.png" };
        }
        return tile;
    }

    /* AppBar functions */

    function doClickAdd() {
        WinJS.log && WinJS.log("Add button pressed", "sample", "status");
        var listView = document.getElementById("scenarioListView").winControl;
        var tile = generateItem();
        // Clear selection (if any)
        listView.selection.clear().done(function () {
            listViewItems.push(tile);
        });
    }

    function doClickDelete() {
        WinJS.log && WinJS.log("Delete button pressed", "sample", "status");
        var listView = document.getElementById("scenarioListView").winControl;
        if (listView.selection.count() > 0) {
            var indices = listView.selection.getIndices();
            for (var i = indices.length - 1; i >= 0; i--) {
                listViewItems.splice(indices[i], 1);
            }
        }
    }

    function doClickSelectAll() {
        var listView = document.getElementById("scenarioListView").winControl;
        listView.selection.selectAll();
    }

    function doClickClearSelection() {
        var listView = document.getElementById("scenarioListView").winControl;
        listView.selection.clear();
    }

    /* This function slides the ListView scrollbar into view if occluded by the AppBar (in sticky mode) */
    function doAppBarShow() {
        var listView = document.getElementById("scenarioListView");
        var appbar = document.getElementById("scenarioAppBar");        
        var appbarHeight = appbar.offsetHeight;

        // Move the scrollbar into view if appbar is sticky
        if (appbar.winControl.sticky) {
            var listViewTargetHeight = "calc(100% - " + appbarHeight + "px)";
            var transition = {
                property: 'height',
                duration: 367,
                timing: "cubic-bezier(0.1, 0.9, 0.2, 0.1)",
                to: listViewTargetHeight
            };
            WinJS.UI.executeTransition(listView, transition);
        }
    }

    /* This function slides the ListView scrollbar back to its original position */
    function doAppBarHide() {
        var listView = document.getElementById("scenarioListView");
        var appbar = document.getElementById("scenarioAppBar");

        //Note that this isn't actually needed
        var appbarHeight = appbar.offsetHeight;

        // Move the scrollbar into view if appbar is sticky
        if (appbar.winControl.sticky) {
            var listViewTargetHeight = "100%";
            var transition = {
                property: 'height',
                duration: 1367,
                timing: "cubic-bezier(0.1, 0.9, 0.2, 0.1)",
                to: listViewTargetHeight
            };
            WinJS.UI.executeTransition(listView, transition);
        }
    }

    /* ListView functions */
    
    function doSelectItem() {
        var appbarDiv = document.getElementById("scenarioAppBar");
        var appbar =    document.getElementById('scenarioAppBar').winControl;
        var listView =  document.getElementById("scenarioListView").winControl;
        var count = listView.selection.count();
        if (count > 0) {
            // Show selection commands in AppBar
            appbar.showCommands(appbarDiv.querySelectorAll('.multiSelect'));
            appbar.sticky = true;
            appbar.show();
        } else {
            // Hide selection commands in AppBar
            appbar.hide();
            appbar.hideCommands(appbarDiv.querySelectorAll('.multiSelect'));
            appbar.sticky = false;
        }
    }

    function doShowListView() {
        document.getElementById("scenarioFullscreen").style.visibility = 'visible';
        // Show the AppBar in full screen mode
        document.getElementById("scenarioAppBar").winControl.disabled = false;
    }

    function doHideListView() {
        document.getElementById("scenarioFullscreen").style.visibility = 'hidden';
        // Clear the ListView selection when exiting full screen mode
        doClickClearSelection();
        // Hide the AppBar when not in full screen mode
        document.getElementById("scenarioAppBar").winControl.disabled = true;
    }

})();
