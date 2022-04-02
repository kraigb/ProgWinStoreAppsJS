(function () {
    "use strict";

    var app = WinJS.Application;
    var activation = Windows.ApplicationModel.Activation;

    WinJS.Binding.optimizeBindingReferences = true;

    app.onactivated = function (args) {
        if (args.detail.kind === activation.ActivationKind.launch) {
            if (args.detail.previousExecutionState !== activation.ApplicationExecutionState.terminated) {
            } else {
            }

            args.setPromise(WinJS.UI.processAll());
            runTests();
        }
    }    

    //Converter that changes a userType to a color.
    function userTypeToColor(type) {
        return type == "kid" ? "Orange" : "Black";
    }    


    //Initializer for Test 2 that wraps the userTypeToColor converter. WinJS.Binding.converter
    //creates an initializer around the converter. Note that we use a namespace to export the
    //initializer from the current module so WinJS.Binding can find it.
    WinJS.Namespace.define("Tests", {
        typeColorInitializer: WinJS.Binding.converter(userTypeToColor)
    });


    //Use a namespace to export function from this module so WinJS.Binding can find it    
    WinJS.Namespace.define("LoginData", {
        login: { name: "liamb", id: "12345678",
            photoURL: "http://www.kraigbrockschmidt.com/images/Liam07.png", userType: "kid" },

        LoginObject: WinJS.Binding.define({name: "", id: "", photoURL: "", userType: "" }),

        typeColorInitializer: WinJS.Binding.converter(userTypeToColor)
    });


    function runTests() {
        //Test 1 code
        var login1 = { name: "liamb", id: "12345678", photoURL: "http://www.kraigbrockschmidt.com/images/Liam07.png", userType: "kid" };

        //"Binding" is done one property at a time, with converter functions just called directly
        var name = document.getElementById("loginName1");
        name.innerText = login1.name;
        name.style.color = userTypeToColor(login1.userType);
        document.getElementById("photo1").src = login1.photoURL;


        //Test 2 code
        var login2 = { name: "liamb", id: "12345678", photoURL: "http://www.kraigbrockschmidt.com/images/Liam07.png", userType: "kid" };
        WinJS.Binding.processAll(document.getElementById("loginDisplay2"), login2);


        //Test 3 code
        WinJS.Binding.processAll(document.getElementById("loginDisplay3"), LoginData.login);

        //With one-time binding, this won't trigger an update
        LoginData.login.name = "liam-no-update";

        //Doing one-way binding; changing observable object properties triggers update.
        //This also updates the original source.
        var loginObservable = WinJS.Binding.as(LoginData.login)
        loginObservable.name = "liambro";        

        //Test 4: using WinJS.Binding.define to create a constructor for an observable object with the specified properties
        var login4 = new LoginData.LoginObject({ name: "liamb", photoURL: "http://www.kraigbrockschmidt.com/images/Liam08.png" });
        WinJS.Binding.processAll(document.getElementById("loginDisplay4"), login4).done(function (results) {;
            setTimeout(function () { login4.userType = "kid" }, 2000);
        });
    }

    app.oncheckpoint = function (args) {
    };

    app.start();
})();
