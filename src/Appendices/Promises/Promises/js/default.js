(function () {
    "use strict";

    var sampleTitle = "Promises";

    var scenarios = [
        { url: "/html/scenario1.html",  title: "Simple promise with existing results" },
        { url: "/html/scenario2.html",  title: "Simple promise with async results" },        
        { url: "/html/scenario3.html",  title: "XmlHttpRequest written with basic promise class" },
        { url: "/html/scenario4.html",  title: "XmlHttpRequest promise supporting error and progress" },
        { url: "/html/scenario5.html",  title: "Simple nesting of async operations" },
        { url: "/html/scenario6.html",  title: "Chaining async operations with basic (incomplete) promise classes" },
        { url: "/html/scenario7.html",  title: "Using WinJS.Promise creation methods (as, wrap, timeout, join, any, and WinJS.xhr)" },
        { url: "/html/scenario8.html",  title: "Chaining async operations with WinJS promises (complete)" },        
        { url: "/html/scenario9.html",  title: "Executing parallel promises with sequential results" },
        { url: "/html/scenario10.html", title: "Creating a promise chain from an array of arguments" },
    ];

    //Install a logger for WinJS.log that outputs to the current page's output area
    WinJS.Utilities.startLog({ tags: "app", action: outputLog })
    
    var outputElement = null;

    function setOutputElement(id) {
        outputElement = document.getElementById(id);
    }

    function clearOutput() {
        if (outputElement) {
            outputElement.innerText = "";
        }
    }

    //This is borrowed from WinJS's base.js :)
    var typeR = /^(error|warn|info|log)$/;    

    function outputLog(message, tag, type) {
        //Prevent "app: " prefix from showing up on messages
        if (tag == "app") {
            tag = null;
        }

        var m = WinJS.Utilities.formatLog(message, tag, type);
        var logToConsole = (type && typeR.test(type));

        if (logToConsole) {
            console[type](m);
        } else {
            if (null != outputElement) {
                outputElement.innerHTML += toStaticHTML(m) + "<br/>";
            }
        }               
    }

    //Simple helper so we don't have to append "app" to every log call.
    //Just use App.log instead of console.log
    var logHelper = function (m) {
        WinJS.log && WinJS.log(m, "app");
    }


    //WinJS promise implementation of an async counting method. We use this in various scenarios
    //so it's centralized here. Call as App.calculateIntegerSum.

    function calculateIntegerSum(max, step) {
        if (max < 1 || step < 1) {
            var err = new WinJS.ErrorFromName("calculateIntegerSum", "max and step must be 1 or greater");
            return WinJS.Promise.wrapError(err);
        }

        var _cancel = false;

        //The WinJS.Promise constructor's argument is a function that receives 
        //dispatchers for completed, error, and progress cases.
        return new WinJS.Promise(function (completeDispatch, errorDispatch, progressDispatch) {
            var sum = 0;

            function iterate(args) {
                for (var i = args.start; i < args.end; i++) {
                    sum += i;
                };

                //If for some reason there was an error, create the error with WinJS.ErrorFromName
                //and pass to errorDispatch
                if (false /* replace with any necessary error check -- we don’t have any here */) {
                    errorDispatch(new WinJS.ErrorFromName("calculateIntegerSum", "error occurred"));
                }

                if (i >= max) {
                    //Complete--dispatch results to completed handlers
                    completeDispatch(sum);
                } else {
                    //Dispatch intermediate results to progress handlers
                    progressDispatch(sum);

                    //Interrupt the operation if canceled
                    if (!_cancel) {
                        setImmediate(iterate, { start: args.end, end: Math.min(args.end + step, max) });
                    }
                }
            }

            setImmediate(iterate, { start: 0, end: Math.min(step, max) });
        },
        //Cancellation function 
        function () {
            _cancel = true;
        });
    }



    function activated(eventObject) {
        if (eventObject.detail.kind === Windows.ApplicationModel.Activation.ActivationKind.launch) {
            eventObject.setPromise(WinJS.UI.processAll().then(function () {
                var url = WinJS.Application.sessionState.lastUrl || scenarios[0].url;
                return WinJS.Navigation.navigate(url);
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

            //Update the output element for logging
            setOutputElement("statusMessage");
        }));
    });

    WinJS.Namespace.define("App", {
        sampleTitle: sampleTitle,
        scenarios: scenarios,
        setOutputElement: setOutputElement,
        clearOutput: clearOutput,
        log: logHelper,
        calculateIntegerSum: calculateIntegerSum,
    });
    

    WinJS.Application.addEventListener("activated", activated, false);
    WinJS.Application.start();
})();
