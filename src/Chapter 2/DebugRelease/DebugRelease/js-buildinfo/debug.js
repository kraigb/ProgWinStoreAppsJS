(function () {
    "use strict";

    WinJS.Namespace.define("BuildInfo", {
        isDebugBuild: true,
        isReleaseBuild: false,

        config: "Debug",
        currentApp: Windows.ApplicationModel.Store.CurrentAppSimulator

        /* 
         * Include debug-only data, service URIs, access tokens, accounts, etc.
         */
    });
})();