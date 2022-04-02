(function () {
    "use strict";
    var page = WinJS.UI.Pages.define("/html/scenario8.html", {
        processed: function (element, options) {
            // WinJS.UI.processAll() is automatically called by the Pages infrastructure by the time this
            // function gets called, and it has processed the div with data-win-control="WinJS.UI.FlipView"

            initialize();
        }
    });

    function initialize() {
        var myFlipView = document.getElementById("pictures_FlipView").winControl;

        //Example of enumerating the pictures library and using URLs as a data source.
        //This could be used instead of the StorageDataSource, but the images lose their
        //aspect ratio and its more expensive as full images are loaded into memory.
        /*
        Windows.Storage.KnownFolders.picturesLibrary.getFilesAsync()
            .done(function (files) {
                var pixURLs = [];

                files.forEach(function (item) {
                    var url = URL.createObjectURL(item, {oneTimeOnly: true });

                    pixURLs.push({type: "item", title: item.name, picture: url });
                });

                var pixList = new WinJS.Binding.List(pixURLs);
                myFlipView.itemDataSource = pixList.dataSource;
            });
        */

        //This data source crawls the Pictures library. If we wanted more control, like not
        //going into all the folders, we'd need to create a file query ourselves.
        myFlipView.itemDataSource = new WinJS.UI.StorageDataSource("Pictures"); 
    }

    //A marked-for-processing initializer for the declarative template.    
    WinJS.Namespace.define("InitFunctions", {
        thumbURL: WinJS.Binding.initializer(function (s, sp, d, dp) {            
            var thumb = WinJS.Utilities.getMember(sp.join("."), s);
            
            if (thumb) {
                var lastProp = dp.pop();
                var target = dp.length ? WinJS.Utilities.getMember(dp.join("."), d) : d;
                dp.push(lastProp);
                target[lastProp] = URL.createObjectURL(thumb, { oneTimeOnly: true });
            }
        })
    });

})();
