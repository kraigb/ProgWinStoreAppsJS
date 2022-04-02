//// THIS CODE AND INFORMATION IS PROVIDED "AS IS" WITHOUT WARRANTY OF
//// ANY KIND, EITHER EXPRESSED OR IMPLIED, INCLUDING BUT NOT LIMITED TO
//// THE IMPLIED WARRANTIES OF MERCHANTABILITY AND/OR FITNESS FOR A
//// PARTICULAR PURPOSE.
////
//// Copyright (c) Microsoft Corporation. All rights reserved

(function () {
    "use strict";

    var sampleTitle = "Webview Extras Example";

    var scenarios = [
        { url: "/html/scenario1.html", title: "Loading an HTML page from string and appdata" },
        { url: "/html/scenario2.html", title: "Rendering the webview selection" },
        { url: "/html/scenario3.html", title: "Rendering a bitmap from an offscreen webview" },
        { url: "/html/scenario4.html", title: "Sharing webview content via the Share charm" },
    ];

    WinJS.Utilities.startLog("app");

    function activated(eventObject) {
        if (eventObject.detail.kind === Windows.ApplicationModel.Activation.ActivationKind.launch) {
            eventObject.setPromise(WinJS.UI.processAll().then(function () {
                var url = WinJS.Application.sessionState.lastUrl || scenarios[0].url;
                return WinJS.Navigation.navigate(url);
            }));
        } else if (eventObject.detail.kind === Windows.ApplicationModel.Activation.ActivationKind.protocol) {
            //Protocol activation is used only by scenario 4, so just nav there
            //(ignoring the actual URI in eventObject.detail.uri.absoluteUri)            
            eventObject.setPromise(WinJS.UI.processAll().then(function () {
                return WinJS.Navigation.navigate("\html\scenario4.html");
            }));
        }
    }

    WinJS.Navigation.addEventListener("navigated", function (eventObject) {
        var url = eventObject.detail.location;
        var host = document.getElementById("contentHost");

        host.winControl && host.winControl.unload && host.winControl.unload();
        WinJS.Utilities.empty(host);
        eventObject.detail.setPromise(WinJS.UI.Pages.render(url, host, eventObject.detail.state).then(function () {
            WinJS.Application.sessionState.lastUrl = url;
        }));
    });

    WinJS.Namespace.define("SdkSample", {
        sampleTitle: sampleTitle,
        scenarios: scenarios,
        drawCanvas: drawCanvas,
        drawScaleCanvas: drawScaleCanvas
    });
    
    function drawCanvas(canvas, noFill) {
        drawGraphic(canvas, noFill, false);
    }

    function drawScaleCanvas(canvas, scale) {
        drawGraphic(canvas, false, scale);
    }

    //Canvas code to produce the identical output to basic.png, with options for fill and scaling
    function drawGraphic(canvas, noFill, scale) {
        canvas.width = 350 * (scale ? 1.5 : 1);
        canvas.height = 200 * (scale ? 4 : 1);

        var ctx = canvas.getContext("2d");

        if (scale) {
            ctx.scale(1.5, 4);
        }

        //Draw surrounding box
        ctx.fillStyle = "#ACF";
        ctx.strokeStyle = "#A20";
        ctx.lineWidth = 3;

        if (!noFill) {
            ctx.fillRect(0, 0, 350, 200);
        }

        ctx.strokeRect(0, 0, 350, 200);

        //Draw a line
        ctx.strokeStyle = "#A3A";
        ctx.beginPath();
        ctx.moveTo(70, 70);
        ctx.lineTo(180, 30);
        ctx.stroke();

        //Draw a circle
        ctx.fillStyle = "#FE4";
        ctx.strokeStyle = "#F83";
        ctx.beginPath();
        ctx.arc(240, 80, 40, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        //Draw some text
        ctx.font = 'italic 60px "Arial"'
        ctx.fillStyle = "#FFF";
        ctx.fillText("Press Start", 20, 180);
    }

    WinJS.Application.addEventListener("activated", activated, false);
    WinJS.Application.start();
})();
