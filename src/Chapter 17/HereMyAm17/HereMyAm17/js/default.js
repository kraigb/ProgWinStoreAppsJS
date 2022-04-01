(function () {
    "use strict";

    var app = WinJS.Application;
    var activation = Windows.ApplicationModel.Activation;
    var nav = WinJS.Navigation;

    app.onactivated = function (args) {
        if (args.detail.kind === activation.ActivationKind.launch) {
            if (args.detail.previousExecutionState !== activation.ApplicationExecutionState.terminated) {
                //Normal startup: initialize lastPosition through geolocation API and leave photo to the default
                app.sessionState.initFromState = false;
            } else {
                //We'll use this bit of session state to let the home page know whether to rehydrate.
                //It should clear reset the flag (to false) once it's picked up so that we never save it
                //as true during suspend.
                app.sessionState.initFromState = true;
            }

            if (app.sessionState.history) {
                nav.history = app.sessionState.history;
            }
            
            args.setPromise(WinJS.UI.processAll().then(function () {
                //Must call this after the controls are instantiates
                WinJS.Resources.processAll();

                if (nav.location) {
                    nav.history.current.initialPlaceholder = true;
                    return nav.navigate(nav.location, nav.state);
                } else {
                    return nav.navigate(Application.navigator.home);
                }

                //Listen for a language change and refresh our UI accordingly.
                //RTL and LTR adjustments will be automatically reflected through changes in the stylesheets.
                WinJS.Resources.addEventListener("contextchanged", function () {
                    WinJS.Resources.processAll();
                });
            }));
        }
    };

    //Use the WinJS helper to populate our Settings
    app.onsettings = function (e) {
        e.detail.applicationcommands =
            {
                "about":   { title: WinJS.Resources.getString('about_command').value, href: "/html/about.html" },
                "help":    { title: WinJS.Resources.getString('help_command').value, href: "/html/help.html" },
                "privacy": { title: WinJS.Resources.getString('privacy_command').value, href: "/html/privacy.html" }
            };

        WinJS.UI.SettingsFlyout.populateSettings(e);        
    };

    app.start();
})();
