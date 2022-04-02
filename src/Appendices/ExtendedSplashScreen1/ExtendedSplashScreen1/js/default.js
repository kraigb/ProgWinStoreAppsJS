(function () {
    "use strict";

    WinJS.Binding.optimizeBindingReferences = true;

    var app = WinJS.Application;
    var activation = Windows.ApplicationModel.Activation;

    var ssDiv = null;           //Splash screen overlay div
    var logo = null;            //Child elements
    var title = null;
    var progress = null;        

    var initSeconds = 10;       //Length in seconds to simulate loading
    var showProgressAfter = 4;  //When to show the progress control in the countdown
    var splashScreen = null;

    app.onactivated = function (args) {
        if (args.detail.kind === activation.ActivationKind.launch) {            
            //WinJS.UI.processAll is needed ONLY if you have WinJS controls on the extended
            //splash screen, otherwise you can skip the call to setPromise, as we're doing here.            
            //args.setPromise(WinJS.UI.processAll());

            ssDiv = document.getElementById("splashScreen");
            splashScreen = args.detail.splashScreen;  //Need this for later
            var loc = splashScreen.imageLocation;

            //Set initial placement of the logo to match the default start screen
            logo = ssDiv.querySelector("#logo");
            logo.style.left = loc.x + "px";
            logo.style.top = loc.y + "px";
            
            //Place the title graphic offscreen to the right so we can animate it in
            title = ssDiv.querySelector("#title");
            title.style.left = ssDiv.clientWidth + "px";  //Just off to the right
            title.style.top = loc.y + "px";               //Same height as the logo

            //Center the progress indicator below the graphic and initially hide it
            progress = ssDiv.querySelector("#progress");
            progress.style.left = (loc.x + loc.width / 2 - progress.clientWidth / 2) + "px";
            progress.style.top = (loc.y + loc.height + progress.clientHeight / 4) + "px";
            progress.style.display = "none";

            //Start our animations when the default splash screen is dismissed
            splashScreen.ondismissed = function () {
                var logoImageWidth = 300;  //Logo is 620px wide, but image is only 300 in the middle
                var logoBlankSide = 160;   //That leaves 160px to either side

                //Calculate the width of logo image + separator + title. This is what we want to end up
                //being centered on the screen.
                var separator = 40;
                var combinedWidth = logoImageWidth + separator + title.clientWidth;

                //Final X position of the logo is screen center - half the combined width - blank area.
                //The (negative) translation is this position minus the starting point (loc.x)
                var logoFinalX = ((ssDiv.clientWidth - combinedWidth) / 2) - logoBlankSide;
                var logoXTranslate = logoFinalX - loc.x;

                //Final X position of the title is screen center + half combined width - title width.
                //The (negative) translation is this position minus the starting point (screen width)
                var titleFinalX = ((ssDiv.clientWidth + combinedWidth) / 2) - title.clientWidth;
                var titleXTranslate = titleFinalX - ssDiv.clientWidth;
                
                //Spin the logo at the same time we translate it
                WinJS.UI.executeTransition(logo, {
                    property: "transform", 
                    delay: 0,
                    duration: 2000,
                    timing: "ease",
                    to: "translateX(" + logoXTranslate + "px) rotate(360deg)"
                });

                //Ease in the title after the logo is already moving (750ms delay)
                WinJS.UI.executeTransition(title, {
                    property: "transform",
                    delay: 750,
                    duration: 1250,
                    timing: "ease",
                    to: "translateX(" + titleXTranslate + "px)"                    
                });
            }

            //Start countdown to simulate initialization
            countDown();
        }
    };
    

    function countDown() {        
        if (initSeconds == 0) {
            showMainPage();
        } else {
            document.getElementById("counter").innerText = initSeconds;
            
            if (--showProgressAfter == 0) {
                progress.style.display = "";
            }

            initSeconds--;           
            setTimeout(countDown, 1000);            
        }
    }

    function showMainPage() {        
        //Hide the progress control, fade out the rest, and pull the overlay
        //div from the DOM when it's all done.
        progress.style.display = "none";
        var promise = WinJS.UI.Animation.fadeOut([ssDiv, logo, title]);

        promise.done(function () {            
            ssDiv.removeNode(true);
            splashScreen.ondismissed = null; //Clean up any closures for this WinRT event
        });
    }

    app.start();
})();
