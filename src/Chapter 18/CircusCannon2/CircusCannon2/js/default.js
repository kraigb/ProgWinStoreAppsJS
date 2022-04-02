(function () {
    "use strict";

    var app = WinJS.Application;
    var activation = Windows.ApplicationModel.Activation;    
    
    var txtOutput = null;
    var cannon = null;

    //Array to map ids to handler functions for all the buttons; this is done so we can
    //loop over all these instead of writing lines of code for each. id is the element's id
    //in the DOM, e will be assigned the element, and fn is the button handler. The groups are
    //used to determine which buttons to disable when different movement limits are reached.
    var commandButtons = [
        { id: "btnLeft",      e: null, fn: moveLeft,      groups: ["left"] },
        { id: "btnRight",     e: null, fn: moveRight,     groups: ["right"] },
        { id: "btnUp",        e: null, fn: moveUp,        groups: ["up"] },
        { id: "btnDown",      e: null, fn: moveDown,      groups: ["down"] },
        { id: "btnLeftSlow",  e: null, fn: moveLeftSlow,  groups: ["left"] },
        { id: "btnRightSlow", e: null, fn: moveRightSlow, groups: ["right"] }, 
        { id: "btnUpSlow",    e: null, fn: moveUpSlow,    groups: ["up"] },
        { id: "btnDownSlow",  e: null, fn: moveDownSlow,  groups: ["down"] },
        { id: "btnLeftStep",  e: null, fn: moveLeftStep,  groups: ["left"] },
        { id: "btnRightStep", e: null, fn: moveRightStep, groups: ["right"] },
        { id: "btnUpStep",    e: null, fn: moveUpStep,    groups: ["up"] },
        { id: "btnDownStep",  e: null, fn: moveDownStep,  groups: ["down"] },
        { id: "btnUpLeft",    e: null, fn: moveUpLeft,    groups: ["up", "left"] },
        { id: "btnUpRight",   e: null, fn: moveUpRight,   groups: ["up", "right"] },
        { id: "btnDownLeft",  e: null, fn: moveDownLeft,  groups: ["down", "left"] },
        { id: "btnDownRight", e: null, fn: moveDownRight, groups: ["down", "right"] },

        { id: "btnStop",      e: null, fn: stop, groups: [] },
        { id: "btnFireOne",   e: null, fn: fireOne , groups: [] },
        { id: "btnFireAll",   e: null, fn: fireAll, groups: [] }
    ];

    WinJS.Utilities.startLog("app");    

    app.onactivated = function (args) {
        if (args.detail.kind === activation.ActivationKind.launch) {
            if (args.detail.previousExecutionState !== activation.ApplicationExecutionState.terminated) {
            } else {
            }
            args.setPromise(WinJS.UI.processAll().then(function () {
                cannon = new CircusCannonControl.Controller();

                txtOutput = document.getElementById("txtOutput");

                document.getElementById("btnConnect").addEventListener("click", connect);
                document.getElementById("btnDisconnect").addEventListener("click", disconnect);

                var cmd;

                //Loop the commands, initializing elements and click listeners 
                for (var i = 0; i < commandButtons.length; i++) {
                    cmd = commandButtons[i];
                    cmd.e = document.getElementById(cmd.id);
                    cmd.e.addEventListener("click", cmd.fn);
                }

                enableButtons();                
            }));
        }
    };


    function connect() {        
        cannon.connectAsync().done(function (connected) {
            enableButtons();
            addCannonHandlers();
        }, function (e) {
            console.log(e);
        });
        
    }

    function disconnect() {
        removeCannonHandlers();
        cannon.disconnect();
        enableButtons();
    }



    function moveLeft() {
        cannon && cannon.left();        
    }

    function moveRight() {
        cannon && cannon.right();
    }

    function moveUp() {
        cannon && cannon.up();
    }

    function moveDown() {
        cannon && cannon.down();
    }

    function moveLeftSlow() {
        cannon && cannon.left(CircusCannonControl.Speed.slow);
    }

    function moveRightSlow() {
        cannon && cannon.right(CircusCannonControl.Speed.slow);
    }

    function moveUpSlow() {
        cannon && cannon.up(CircusCannonControl.Speed.slow);
    }

    function moveDownSlow() {
        cannon && cannon.down(CircusCannonControl.Speed.slow);
    }

    function moveLeftStep() {
        cannon && cannon.leftStep();
    }

    function moveRightStep() {
        cannon && cannon.rightStep();
    }

    function moveUpStep() {
        cannon && cannon.upStep();
    }

    function moveDownStep() {
        cannon && cannon.downStep();
    }

    function moveUpLeft() {
        cannon && cannon.upLeft();        
    }

    function moveUpRight() {
        cannon && cannon.upRight();        
    }

    function moveDownLeft() {
        cannon && cannon.downLeft();
    }

    function moveDownRight() {
        cannon && cannon.downRight();
    }

    function stop() {
        cannon && cannon.stop();
    }

    function fireOne() {
        cannon && cannon.fireOne();
    }

    function fireAll() {
        cannon && cannon.fireAll();
    }


    Windows.UI.WebUI.WebUIApplication.addEventListener("suspending", function () {
        disconnect();        
    });


    Windows.UI.WebUI.WebUIApplication.addEventListener("resuming", function () {
        connect();
    })


    function enableButtons(device) {
        var haveCannon = cannon && cannon.isConnected;

        document.getElementById("btnConnect").disabled = haveCannon && (cannon != null);        
        document.getElementById("btnDisconnect").disabled = !haveCannon;

        //Enable or disable all the other buttons
        for (var i = 0; i < commandButtons.length; i++) {
            commandButtons[i].e.disabled = !haveCannon;
        }        
    }
    
    //Functions to add/remove handlers to all the control object's events
    function addCannonHandlers() {
        if (cannon == null) {
            return;
        }

        cannon.addEventListener("leftlimitchanged", leftLimitChanged);
        cannon.addEventListener("rightlimitchanged", rightLimitChanged);
        cannon.addEventListener("toplimitchanged", topLimitChanged);
        cannon.addEventListener("bottomlimitchanged", bottomLimitChanged);
        cannon.addEventListener("missilefired", missileFired);
    }

    function removeCannonHandlers() {
        if (cannon == null) {
            return;
        }

        cannon.removeEventListener("leftlimitchanged", leftLimitChanged);
        cannon.removeEventListener("rightlimitchanged", rightLimitChanged);
        cannon.removeEventListener("toplimitchanged", topLimitChanged);
        cannon.removeEventListener("bottomlimitchanged", bottomLimitChanged);
        cannon.removeEventListener("missilefired", missileFired);
    }

    function leftLimitChanged (e) {
        disableCommandGroup("left", e);
        WinJS.log && WinJS.log("Left limit changed, status = " + e, "app");
    }

    function rightLimitChanged(e) {
        disableCommandGroup("right", e);
        WinJS.log && WinJS.log("Right limit changed, status = " + e, "app");
    }

    function topLimitChanged(e) {
        disableCommandGroup("up", e);
        WinJS.log && WinJS.log("Top limit changed, status = " + e, "app");
    }

    function bottomLimitChanged(e) {
        disableCommandGroup("down", e);
        WinJS.log && WinJS.log("Bottom limit reached, status = " + e, "app");
    }

    function missileFired(e) {
        WinJS.log && WinJS.log("Missile fired", "app");
    }


    function disableCommandGroup (group, disabled) {
        var buttons = commandButtons;
        var cmd;

        for (var i = 0; i < buttons.length; i++) {
            cmd = buttons[i];

            if (cmd.groups.indexOf(group) > -1) {
                cmd.e.disabled = disabled;
            }
        }
    }

    app.start();
})();
