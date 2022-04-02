(function () {
    "use strict";

    WinJS.Binding.optimizeBindingReferences = true;

    var app = WinJS.Application;
    var activation = Windows.ApplicationModel.Activation;

    var ssDiv = null;           //Splash screen overlay div
    var logo = null;            //Child elements
    var title = null;
    var progress = null;        

    var loc = null;             //Initial splash screen logo placement
    var initSeconds = 10;       //Length in seconds to simulate loading
    var showProgressAfter = 4;  //When to show the progress control in the countdown
    var splashScreen = null;

    //View dimensions, set inside initial window.onresize listener
    var vw = 0;
    var vh = 0;

    var logoFileWidth = 620;    //TODO: modify for scaling?
    var logoImageWidth = 300;   //Logo is 620px wide, but image is only 300 in the middle
    var logoBlankSide = 160;    //That leaves 160px to either side
    var logoImageHeight = 300;
    var titleWidth = 668;
    var titleHeight = 300;
    var separator = 40;

    var animationPromises = [];    

    app.onactivated = function (args) {
        if (args.detail.kind === activation.ActivationKind.launch) {            
            //WinJS.UI.processAll is needed ONLY if you have WinJS controls on the extended
            //splash screen, otherwise you can skip the call to setPromise, as we're doing here.            
            //args.setPromise(WinJS.UI.processAll());

            ssDiv = document.getElementById("splashScreen");
            logo = ssDiv.querySelector("#logo");
            title = ssDiv.querySelector("#title");
            progress = ssDiv.querySelector("#progress");
            splashScreen = args.detail.splashScreen;

            //Save the default image location for later
            loc = splashScreen.imageLocation;

            //Listen for default splash screen dismissal
            splashScreen.ondismissed = setExtendedSplash;

            
            //Place any elements that go relative to the default image

            //Logo exactly matches the image            
            setElementPosition(logo, loc.x, loc.y);

            //Place the title graphic offscreen to the right so we can animate it in. The resize
            //event we set up initially resets this position if the window size changes while the
            //default splash screen is still up.
            setElementPosition(title, ssDiv.clientWidth, loc.y);

            //Center the progress indicator below the graphic and initially hide it. Tip: do not
            //change an item's visibility in the window.onresize event as you'll trigger a re-rendering
            //and another onresize event.
            setElementPosition(progress, (loc.x + loc.width / 2 - progress.clientWidth / 2),
                (loc.y + loc.height + progress.clientHeight / 4));
            progress.style.display = "none";
        }
    };
        
    //Simple helper to add the CSS "px"
    function setElementPosition(e, left, top) {
        e.style.left = left + "px";
        e.style.top = top + "px";
    }



    //Helper to check if we are wide enough to have logo and title side by side
    function isWideLandscape(w, h) {
        return (w > h && w > 1024);
    }


    //Initial resize handler for the default splash screen in which we make sure
    //the title is just offscreen to the right. NOTE: do not change an item's 
    //visibility or visual status in this handler or you'll trigger another
    //layout pass and another resize event.
    window.onresize = function () {
        var w = ssDiv.clientWidth;
        var h = ssDiv.clientHeight;
        setElementPosition(title, w, isWideLandscape(w, h) ? loc.y : h / 2);
    }


    function setExtendedSplash() {
        //If we launch into a landscape view where the title and logo can be side by
        //side, animate the logo left and the title from offscreen. Otherwise, animate
        //the logo up and the title again from offscreen (though positioned down);

        var w = ssDiv.clientWidth;
        var h = ssDiv.clientHeight;
        var titleXTranslate = 0;
        var logoXTranslate = 0;
        var logoYTranslate = 0;

        if (isWideLandscape(w, h)) {
            //Calculate the width of logo image + separator + title. This is what we want to end up
            //being centered on the screen.
            var combinedWidth = logoImageWidth + separator + titleWidth;

            //Final X position of the logo is view center - half the combined width - blank area.
            //The (negative) translation is this position minus the starting point (loc.x)
            var logoFinalX = ((w - combinedWidth) / 2) - logoBlankSide;
            logoXTranslate = logoFinalX - loc.x;

            //Final X position of the title is view center + half combined width - title width.
            //The (negative) translation is this position minus the starting point (screen width)
            var titleFinalX = ((w + combinedWidth) / 2) - titleWidth;
            titleXTranslate = titleFinalX - w;
        } else {
            var vCenter = h / 2;

            //Logo moves straight up
            var logoFinalY = vCenter - separator - logoImageHeight;
            logoYTranslate = logoFinalY - loc.y;

            //Set title's top to the vertical center. The final X position is
            //view center minus titleWidth, to translation is that minus the view width,
            //which will be a negative number.
            title.style.top = vCenter;
            var titleFinalX = ((w - titleWidth) / 2);
            titleXTranslate = titleFinalX - w;
        }

        //Spin the logo at the same time we translate it
        animationPromises[0] = WinJS.UI.executeTransition(logo, {
            property: "transform",
            delay: 0,
            duration: 2000,
            timing: "ease",
            to: "translateX(" + logoXTranslate + "px) translateY(" + logoYTranslate + "px) rotate(360deg)"
        });

        //Ease in the title after the logo is already moving (750ms delay)
        animationPromises[1] = WinJS.UI.executeTransition(title, {
            property: "transform",
            delay: 750,
            duration: 1250,
            timing: "ease",
            to: "translateX(" + titleXTranslate + "px)"
        });

        //Listen now for resize events
        window.onresize = resizeView;
    
        //Start countdown to simulate initialization
        countDown();
    }


    function resizeView() {
        // Our resize strategy for the extended splash screen is this:
        // 1. For landscape aspect ratios > 1024px wide, just move the logo, title, and progress.
        //    indicator to be centered horizontally.
        // 2. For narrower landscape and all portrait aspect ratios, stack the logo, title,
        //    and progress vertically, with the top of the title at the vertical center,
        //    the logo above that, and the progress control under the title.

        //Cancel any animations that are going on, if they got started at all (which is 
        //always the case given where we set the resize handler) 
        animationPromises[0] && animationPromises[0].cancel();
        animationPromises[1] && animationPromises[1].cancel();

        //Clear out transforms
        logo.style.transform = "translateX(0px) rotate(0deg)";
        title.style.transform = "translateX(0px)";

        var w = ssDiv.clientWidth;
        var h = ssDiv.clientHeight;

        if (isWideLandscape(w , h)) {
            var combinedWidth = logoImageWidth + separator + title.clientWidth;
            setElementPosition(logo, (w - combinedWidth) / 2 - logoBlankSide, loc.y);
            setElementPosition(title, (w + combinedWidth) / 2 - titleWidth, loc.y);
            setElementPosition(progress, (w - progress.clientWidth) / 2, loc.y + loc.height + progress.clientHeight / 4);
        } else {
            var vCenter = h / 2;

            //Move logo up a separator above vertical centerline        
            setElementPosition(logo, (w - logoFileWidth) / 2, vCenter - separator - logoImageHeight);

            //Move title to have its top at the vertical centerline, and scale so that it's a little
            //smaller than the horizontal dimension of the view.            
            setElementPosition(title, (w - titleWidth) / 2, vCenter);
            var scale = Math.min(w / (titleWidth * 1.1), 1);
            title.style.transform = "scale(" + scale + ")";

            //Center the progress indicator below the graphic and initially hide it        
            setElementPosition(progress, (w - progress.clientWidth) / 2, vCenter + titleHeight + progress.clientHeight / 4);
        }
    }


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
        //Redirect window.onresize to the main app's handler (none in this example)
        window.onresize = null;

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
