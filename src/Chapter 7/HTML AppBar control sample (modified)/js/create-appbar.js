//// THIS CODE AND INFORMATION IS PROVIDED "AS IS" WITHOUT WARRANTY OF
//// ANY KIND, EITHER EXPRESSED OR IMPLIED, INCLUDING BUT NOT LIMITED TO
//// THE IMPLIED WARRANTIES OF MERCHANTABILITY AND/OR FITNESS FOR A
//// PARTICULAR PURPOSE.
////
//// Copyright (c) Microsoft Corporation. All rights reserved

(function () {
    "use strict";
    var page = WinJS.UI.Pages.define("/html/create-appbar.html", {
        ready: function (element, options) {
            //Using the app bar's getCommandById avoids traversing the entire DOM for each button
            var appbar = document.getElementById("createAppBar").winControl;

            //Set the app bar commands property to populate it
            var commands = [
               { id: 'cmdAdd', label: 'Add', icon: 'add', section: 'global', tooltip: 'Add item' },
               { id: 'cmdRemove', label: 'Remove', icon: 'remove', section: 'global', tooltip: 'Remove item' },
               { type: 'separator', section: 'global' },
               { id: 'cmdDelete', label: 'Delete', icon: 'delete', section: 'global', tooltip: 'Delete item' },
               { id: 'cmdCamera', label: 'Camera', icon: 'camera', section: 'selection', tooltip: 'Take a picture' }
            ];
                        
            appbar.commands = commands;
            
            appbar.getCommandById("cmdAdd").addEventListener("click", doClickAdd, false);            
            appbar.getCommandById("cmdRemove").addEventListener("click", doClickRemove, false);
            appbar.getCommandById("cmdDelete").addEventListener("click", doClickDelete, false);
            appbar.getCommandById("cmdCamera").addEventListener("click", doClickCamera, false);            

            //This is helpful for debugging and looking at the app bar in Blend
            //appbar.show();

            WinJS.log && WinJS.log("To show the bar, swipe up from the bottom of the screen, right-click, or press Windows Logo + z. To dismiss the bar, tap in the application, swipe, right-click, or press Windows Logo + z again.", "sample", "status");
            
        },
        unload: function () {
            AppBarSampleUtils.removeAppBars();
        }
    });

    // Command button functions    
    function doClickAdd() {
        WinJS.log && WinJS.log("Add button pressed", "sample", "status");
    }

    function doClickRemove() {
        WinJS.log && WinJS.log("Remove button pressed", "sample", "status");
    }

    function doClickDelete() {
        WinJS.log && WinJS.log("Delete button pressed", "sample", "status");
    }

    function doClickCamera() {
        WinJS.log && WinJS.log("Camera button pressed", "sample", "status");
    }

    doClickAdd.supportedForProcessing = true;

})();
