// For an introduction to the Blank template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkId=232509
(function () {
    "use strict";

    var app = WinJS.Application;
    var activation = Windows.ApplicationModel.Activation;

    var rows = 4;
    var cols = 4;

    app.onactivated = function (args) {
        if (args.detail.kind === activation.ActivationKind.launch) {
            if (args.detail.previousExecutionState !== activation.ApplicationExecutionState.terminated) {
                // TODO: This application has been newly launched. Initialize
                // your application here.
            } else {
                // TODO: This application has been reactivated from suspension.
                // Restore application state here.
            }
            args.setPromise(WinJS.UI.processAll());

            window.addEventListener("resize", doLayout);
            initialize();
        }
    };

    app.oncheckpoint = function (args) {
        // TODO: This application is about to be suspended. Save any state
        // that needs to persist across suspensions here. You might use the
        // WinJS.Application.sessionState object, which is automatically
        // saved and restored across suspension. If you need to complete an
        // asynchronous operation before your application is suspended, call
        // args.setPromise().
    };
    
    
    function initialize() {
        var main = document.getElementById("divMain");

        var child;

        for (var row = 1; row <= rows; row++) {
            for (var col = 1; col <= cols; col++) {
                child = document.createElement("div");
                child.className = "divChild";
                child.style.msGridColumn = col;
                child.style.msGridRow = row;
                main.appendChild(child);
            }
        }

        doLayout();
    }

    function doLayout() {
        var main = document.getElementById("divMain");

        var width = Math.floor(main.clientWidth / cols * .9) + "px";
        var marginH = Math.floor(main.clientWidth / cols * .05) + "px";
        var height = Math.floor(main.clientHeight / rows * .9) + "px";
        var marginV = Math.floor(main.clientHeight / rows * .05) + "px";

        var children = main.getElementsByClassName("divChild");

        for (var i = 0; i < children.length; i++) {
            children[i].style.width = width;
            children[i].style.height = height;
            children[i].style.margin = marginV + " " + marginH + " " + marginV + " " + marginH;
        }

        //A test for content that extends outside the cell        
        children[0].style.width = "350px";
        children[0].style.marginLeft = "150px";
        children[0].style.background = "#fbb";        
    }


    app.start();
})();
