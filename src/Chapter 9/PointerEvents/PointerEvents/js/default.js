// For an introduction to the Blank template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkId=232509
(function () {
    "use strict";

    var app = WinJS.Application;
    var activation = Windows.ApplicationModel.Activation;

    //Array in which we store the event log
    var output = [];
    var outputSelect;

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
        document.getElementById("clear").addEventListener("click", function () {
            var output = [];
            document.getElementById("log").innerText = "";
        });

        var divElement = document.getElementById("divElement");        
        outputSelect = document.getElementById("selectProperty");

        divElement.addEventListener("MSPointerDown", pointerDown);
        divElement.addEventListener("MSPointerMove", pointerMove);
        divElement.addEventListener("MSPointerUp", pointerUp);
        divElement.addEventListener("MSPointerOver", pointerOver);
        divElement.addEventListener("MSPointerOut", pointerOut);

        //NOTE: hover can get really noisy for touch in the simulator; you might want to comment out this line
        divElement.addEventListener("MSPointerHover", pointerHover);

        //Enable gestures through the mouse wheel--we just need to send the event to MSPointerDown
        //with pointerId=1.
        divElement.addEventListener("wheel", function (e) {
            e.pointerId = 1;   // Fixed pointerId for MouseWheel
            pointerDown(e);
        });

        //Legacy mouse events
        divElement.addEventListener("mousedown", mouseDown);
        divElement.addEventListener("mousemove", mouseMove);
        divElement.addEventListener("mouseup", mouseUp);
        divElement.addEventListener("mouseover", mouseOver);
        divElement.addEventListener("mouseout", mouseOut);
        divElement.addEventListener("hover", mouseHover);
        divElement.addEventListener("click", mouseClick);
        divElement.addEventListener("dblclick", mouseDblClick);

        //Create a gesture object for gesture events
        var gestureObject = new MSGesture();
        gestureObject.target = divElement;
        divElement.gestureObject = gestureObject;

        //Note that we need to do a little within MSPointerDown as well

        divElement.addEventListener("MSGestureTap", gestureTap);
        divElement.addEventListener("MSGestureHold", gestureHold);

        divElement.addEventListener("MSGestureStart", gestureStart);
        divElement.addEventListener("MSGestureChange", gestureChange);
        divElement.addEventListener("MSGestureEnd", gestureEnd);
        divElement.addEventListener("MSInertiaStart", inertiaStart);
    }

    function floor(value) {
        return Math.floor(value * 10000) / 10000;
    }

    function logMouse(msg) {
        var chkMouse = document.getElementById("chkMouse");

        if (!chkMouse.checked) {
            log(msg);
        }
    }

    function logPointer(msg) {
        var chkPointer = document.getElementById("chkPointer");

        if (!chkPointer.checked) {
            log(msg);
        }
    }

    function logGesture(msg) {
        var chkGesture = document.getElementById("chkGesture");

        if (!chkGesture.checked) {
            log(msg);
        }
    }

    function log(msg) {
        //Add to the beginning of the list and limit size to 300 (unshift returns new length)
        if (output.unshift(msg) > 300) {
            output.pop();
        }

        var log = document.getElementById("log");
        log.innerText = output.toString().replace(/,/g, "\n");
    }


    //Pointer handlers

    function pointerDown(e) {
        //Associate this pointer with the target's gesture
        e.target.gestureObject.addPointer(e.pointerId);
        e.target.gestureObject.pointerType = e.pointerType;

        logPointer("pointerDown " + e.pointerType);
    }

    function pointerMove(e) {
        logPointer("pointerMove");
    }

    function pointerUp(e) {
        logPointer("pointerUp");
    }

    function pointerOver(e) {
        logPointer("pointerOver");
    }

    function pointerOut(e) {
        logPointer("pointerOut");
    }

    function pointerHover(e) {
        logPointer("pointerHover");
    }

    //Gesture handlers
    function gestureTap(e) {
        logGesture("gestureTap (e.detail = " + e.detail + ")");
    }

    function gestureHold(e) {
        logGesture("gestureHold (e.detail = " + e.detail + ")");
    }

    function gestureStart(e) {
        logGesture("gestureStart (e.detail = " + e.detail + ")");
    }

    function gestureChange(e) {
        var strOut = "";

        switch (outputSelect[outputSelect.selectedIndex].id) {
            case "screen":
                strOut = "screenX/Y= " + floor(e.screenX) + ": " + floor(e.screenY);
                break;

            case "client":
                strOut = "clientX/Y= " + floor(e.clientX) + ": " + floor(e.clientY);
                break;

            case "offset":
                strOut = "offsetX/Y= " + floor(e.offsetX) + ": " + floor(e.offsetY);
                break;

            case "translation":
                strOut = "translationX/Y= " + floor(e.translationX) + ": " + floor(e.translationY);
                break;

            case "expansion":
                strOut = "scale = " + floor(e.scale) + "; expansion = " + floor(e.expansion) + "; velocityExpansion = " + floor(e.velocityExpansion);
                break;

            case "rotation":
                strOut = "rotation = " + floor(e.rotation) + "; velocityAngular = " + floor(e.velocityAngular);
                break;

            case "velocity":
                strOut = "velocityX/Y = " + floor(e.velocityX) + ": " + floor(e.velocityY);
                break;
        }

        logGesture("gestureChange  (detail = " + e.detail + "; " + strOut + ")");
    }

    function gestureEnd(e) {
        logGesture("gestureEnd (e.detail = " + e.detail + ")");
    }

    function inertiaStart(e) {
        logGesture("inertiaStart (e.detail = " + e.detail + ")");
    }

    //Mouse handlers
    function mouseDown(e) {
        logMouse("mouseDown");
    }

    function mouseMove(e) {
        logMouse("mouseMove");
    }

    function mouseUp(e) {
        logMouse("mouseUp");
    }

    function mouseOver(e) {
        logMouse("mouseOver");
    }

    function mouseOut(e) {
        logMouse("mouseOut");
    }

    function mouseHover(e) {
        logMouse("mouseHover");
    }

    function mouseClick(e) {
        logMouse("click");
    }

    function mouseDblClick(e) {
        logMouse("dblclick");
    }

    app.start();
})();
