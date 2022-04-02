/// <reference path="///LiveSDKHTML/js/wl.js" />

(function () {
    "use strict";

    WinJS.Binding.optimizeBindingReferences = true;

    var app = WinJS.Application;
    var activation = Windows.ApplicationModel.Activation;
    var nav = WinJS.Navigation;

    //TODO: remove this when building final version
    WinJS.Utilities.startLog("app");

    var loginImage = null;
    var loginName = null;
    var listenerName = null;
    var listenerImage = null;

    app.addEventListener("activated", function (args) {
        if (args.detail.kind === activation.ActivationKind.launch) {
            args.setPromise(WinJS.UI.processAll());

            WL.init();
            WL.Event.subscribe("auth.login", onLoginComplete);
            WL.Event.subscribe("auth.sessionChange", onSessionChange);
            WL.Event.subscribe("auth.statusChange", onStatusChange);

            loginImage = document.getElementById("loginImage");
            loginName = document.getElementById("loginName");

            //Assume we need these event handlers on the default "Sign in" text and image
            listenerName = loginName.addEventListener("click", tryLogin);
            listenerImage = loginImage.addEventListener("click", tryLogin);

            //Attempt a login automatically. If it works, the above event handlers are removed.
            tryLogin();            
        }
    });


    function tryLogin() {
        //Login with the Microsoft account; if successful, disable login controls (but we'd
        //enable logout controls if we had them.
        WL.login({ scope: ["wl.signin", "wl.basic"] }).then(
            function (response) {
                WinJS.log && WinJS.log("Authorization response: " + JSON.stringify(response, null, 4), "app");
                //Token is in response.session.access_token

                //Prevent logging in again through the name/image elements
                loginName.removeEventListener("click", listenerName);
                loginImage.removeEventListener("click", listenerImage);
            },
            function (response) {
                WinJS.log && WinJS.log("Authorization error: " + JSON.stringify(response, null, 4), "app");

            }
        );        
    }

    //When we're logged in, change the "Sign in" default text to the Microsoft Account profile
    function onLoginComplete(e) {
        WinJS.log && WinJS.log("Logged into Microsoft account; status = " + e.status, "app");
        displayMe();
    }

    function onSessionChange(e) {
        WinJS.log && WinJS.log("Session change, status = " + e.status, "app");
    }

    function onStatusChange(e) {
        WinJS.log && WinJS.log("Session change, status = " + e.status, "app");
    }

    function displayMe() {
        WL.api({ path: "me/picture?type=small", method: "get" }).then(
            function (response) {
                if (response.location) {
                    loginImage.src = response.location;
                }
            },
            function (failedResponse) {
                WinJS.log && WinJS.log("get-me/picture failure: " + JSON.stringify(failedResponse, null, 4), "app");
            }
        );

        WL.api({ path: "me", method: "get" }).then(
            function (response) {
                loginName.innerText = response.name;
            },
            function (failedResponse) {
                WinJS.log && WinJS.log("get-me failure: " + JSON.stringify(failedResponse, null, 4), "app");
            }
        );    
    }

    app.start();
})();
