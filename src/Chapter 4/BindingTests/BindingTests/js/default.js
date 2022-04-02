// For an introduction to the Blank template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkId=232509
(function () {
    "use strict";

    var app = WinJS.Application;
    var activation = Windows.ApplicationModel.Activation;

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

            //Test 1 code
            var login1 = { name: "liamb", id: "12345678",photoURL: "http://www.kraigbrockschmidt.com/images/Liam07.png", userType: "kid"};
                               
            //"Binding" is done one property at a time, with converter functions just called directly
            var name = document.getElementById("loginName1");
            name.innerText = login1.name;
            name.style.color = userTypeToColor1(login1.userType);
            document.getElementById("photo1").src = login1.photoURL;        
            

            //Test 2 code
            var login2 = { name: "liamb", id: "12345678", photoURL: "http://www.kraigbrockschmidt.com/images/Liam07.png", userType: "kid"};
            WinJS.Binding.processAll(document.getElementById("loginDisplay2"), login2);


            //Test 3 code
            WinJS.Binding.processAll(document.getElementById("loginDisplay3"), LoginData.login);

            //With one-time binding, this won't trigger an update
            LoginData.login.name = "liam-no-update";

            //Doing one-way binding; changing observable object properties triggers updates
            var loginObservable = WinJS.Binding.as(LoginData.login)
            loginObservable.name = "liambro";            

            //Test 4: using WinJS.Binding.define to create a constructor for a bindable object with certain properties
            var login4 = new LoginData.LoginObject({ name: "liamb", photoURL: "http://www.kraigbrockschmidt.com/images/Liam08.png" });
            WinJS.Binding.processAll(document.getElementById("loginDisplay4"), login4).done(function (results) {;
                login4.userType = "kid";                
            });
        }
    }    

    //Converter for Test 1
    function userTypeToColor1(type) {
        return type == "kid" ? "Orange" : "Black";
    }    


    //Converter (actually an initializer) for Test 2.
    //Use a namespace to export function from the current module so WinJS.Binding can find it
    WinJS.Namespace.define("Tests", {
        userTypeToColor: WinJS.Binding.converter(function (type) {
            return type == "kid" ? "Orange" : "Black";
        })
    });


    //Use a namespace to export function from this module so WinJS.Binding can find it    
    WinJS.Namespace.define("LoginData", {
        login: { name: "liamb", id: "12345678",
            photoURL: "http://www.kraigbrockschmidt.com/images/Liam07.png", userType: "kid" },

        LoginObject: WinJS.Binding.define({name: "", id: "", photoURL: "", userType: "" }),

        userTypeToColor: WinJS.Binding.converter(function (type) {
            return type == "kid" ? "Orange" : "Black";
        })
    });

    app.oncheckpoint = function (args) {
    };

    app.start();
})();
