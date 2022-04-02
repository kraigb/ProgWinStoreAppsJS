//// THIS CODE AND INFORMATION IS PROVIDED "AS IS" WITHOUT WARRANTY OF
//// ANY KIND, EITHER EXPRESSED OR IMPLIED, INCLUDING BUT NOT LIMITED TO
//// THE IMPLIED WARRANTIES OF MERCHANTABILITY AND/OR FITNESS FOR A
//// PARTICULAR PURPOSE.
////
//// Copyright (c) Microsoft Corporation. All rights reserved

(function () {
    "use strict";
    var appBar;

    var page = WinJS.UI.Pages.define("/html/create-appbar.html", {
        ready: function (element, options) {
            appBar = document.getElementById("createAppBar").winControl;

            //Set the app bar commands property to populate it (commands in markup from the original
            //sample have been commented out).
            var commands = [
               { id: 'cmdAdd', label: 'Add', icon: 'add', section: 'global', tooltip: 'Add item' },
               { id: 'cmdRemove', label: 'Remove', icon: 'remove', section: 'global', tooltip: 'Remove item' },
               { type: 'separator', section: 'global' },
               { id: 'cmdDelete', label: 'Delete', icon: 'delete', section: 'global', tooltip: 'Delete item' },
               { id: 'cmdCamera', label: 'Camera', icon: 'camera', section: 'selection', tooltip: 'Take a picture', extraClass: 'otherFont' },
               { id: 'cmdExtra1', label: 'Extra 1', icon: 'placeholder', section: 'selection', tooltip: 'Extra 1' },
               { id: 'cmdExtra2', label: 'Extra 2', icon: 'placeholder', section: 'selection', tooltip: 'Extra 2' },
               { id: 'cmdExtra3', label: 'Extra 3', icon: 'placeholder', section: 'selection', tooltip: 'Extra 3' },
               { id: 'cmdExtra4', label: 'Extra 4', icon: 'placeholder', section: 'selection', tooltip: 'Extra 4' },
               { id: 'cmdExtra5', label: 'Extra 5', icon: 'placeholder', section: 'selection', tooltip: 'Extra 5' }

            ];

            appBar.commands = commands;

            appBar.getCommandById("cmdAdd").addEventListener("click", doClickAdd, false);
            appBar.getCommandById("cmdRemove").addEventListener("click", doClickRemove, false);
            appBar.getCommandById("cmdDelete").addEventListener("click", doClickDelete, false);
            appBar.getCommandById("cmdCamera").addEventListener("click", doClickCamera, false);
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
})();
