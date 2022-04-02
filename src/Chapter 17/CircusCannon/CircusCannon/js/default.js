(function () {
    "use strict";

    var app = WinJS.Application;
    var activation = Windows.ApplicationModel.Activation;
    var hid = Windows.Devices.HumanInterfaceDevice.HidDevice;
    
    var txtOutput = null;
    var launcher = null;
    var deviceName = "";
    var lastDeviceId = null;

    WinJS.Utilities.startLog("app");    


    //Circus Cannon interface
    WinJS.Namespace.define("CircusCannon", {
        vid: 0x1941,
        pid: 0x8021,
        usagePage: 0xFFA0,
        usageId: 0x0001,        

        //Control commands for output report 0x00
        commands: {
            stop: 0x00,
            up: 0x01,
            upSlow: 0x0D,
            down: 0x02,
            downSlow: 0x0E,
            left: 0x04,
            leftSlow: 0x07,
            right: 0x08,
            rightSlow: 0x0B,
            fire: 0x10,
            upLeft: 0x01 + 0x04,
            upRight: 0x01 + 0x08,
            downLeft: 0x02 + 0x04,
            downRight: 0x02 + 0x08,
            nop: 0xFF
        },

        //Status bits in the input report
        status: {
            topLimit: 0x80,
            bottomLimit: 0x40,
            leftLimit: 0x04,
            rightLimit: 0x08,
            missileFired: 0x80
        },

        //Byte positions of status bits in the input report
        offset: {
            upDown: 1,
            leftRight: 2,
            missile: 2
        },
    });

    app.onactivated = function (args) {
        if (args.detail.kind === activation.ActivationKind.launch) {
            if (args.detail.previousExecutionState !== activation.ApplicationExecutionState.terminated) {
            } else {
            }
            args.setPromise(WinJS.UI.processAll().then(function () {
                txtOutput = document.getElementById("txtOutput");

                document.getElementById("btnAcquire").addEventListener("click", acquireLauncher);
                document.getElementById("btnDisconnect").addEventListener("click", disconnect);
                document.getElementById("btnLeft").addEventListener("click", moveLeft);
                document.getElementById("btnRight").addEventListener("click", moveRight);
                document.getElementById("btnUp").addEventListener("click", moveUp);
                document.getElementById("btnDown").addEventListener("click", moveDown);

                document.getElementById("btnLeftSlow").addEventListener("click", moveLeftSlow);
                document.getElementById("btnRightSlow").addEventListener("click", moveRightSlow);
                document.getElementById("btnUpSlow").addEventListener("click", moveUpSlow);
                document.getElementById("btnDownSlow").addEventListener("click", moveDownSlow);


                document.getElementById("btnStop").addEventListener("click", stop);
                document.getElementById("btnFire").addEventListener("click", fire);
            }));
        }
    };


    function acquireLauncher () {
        var ccSelector = hid.getDeviceSelector(CircusCannon.usagePage, CircusCannon.usageId,
            CircusCannon.vid, CircusCannon.pid);

        //When using findAllAsync with a selector string from JavaScript, be sure to pass
        //null as the second argument (or additional AQS filters), otherwise you'll
        //enumerate all devices. 
        Windows.Devices.Enumeration.DeviceInformation.findAllAsync(ccSelector, null).done(function (devInfo) {
            //If no devices are found, throw an error out to our chain's handler
            if (devInfo.size == 0) {
                throw "no devices found";
            }

            //If we find any, assume we just have one such device on the system and use it.
            //Save the device id for reconnecting after resume.
            lastDeviceId = devInfo[0].id;
            deviceName = devInfo[0].name;
            connect(lastDeviceId);
        });
    }


    function connect (id) {
        if (lastDeviceId == null) {
            return;
        }

        hid.fromIdAsync(id, Windows.Storage.FileAccessMode.readWrite).done(function (device) {
            if (device == null) {
                //Device could be enumerated but not accessed; user likely denied consent.
                var status = Windows.Devices.Enumeration.DeviceAccessInformation.createFromId(id);
                txtOutput.innerText = "Device exists but not acquired. Status: " + statusString(status.currentStatus);                
            } else {
                launcher = device;
                txtOutput.innerText = "Device acquired: " + deviceName;                
            }

            enableButtonsAndEvents(launcher);
            sendCommand(CircusCannon.commands.stop);
        }, function (e) {
            //Some other error happened
            txtOutput.innerText = "Error acquiring device: " + e;
        });        
    }


    function sendCommand(command) {
        if (launcher == null) {
            return;
        }

        WinJS.log && WinJS.log("Sending command " + command, "app");

        var reportId = 0x00;
        var report = launcher.createOutputReport(reportId);

        var dataWriter = new Windows.Storage.Streams.DataWriter();
        var packet = new Uint8Array([reportId, command, 0, 0, 0, 0, 0, 0, 0]);
        dataWriter.writeBytes(packet);
        //dataWriter.writeByte(reportId);
        //dataWriter.writeByte(command);

        //for (var i = 0; i < 7; i++) {
        //    dataWriter.writeByte(0x00);
        //}
        
        report.data = dataWriter.detachBuffer();

        try {
            launcher.sendOutputReportAsync(report);
        } catch (e) {
            console.log(e);
        }
    }

    function moveLeft () {
        sendCommand(CircusCannon.commands.left);
    }

    function moveRight () {
        sendCommand(CircusCannon.commands.right);
    }

    function moveUp () {
        sendCommand(CircusCannon.commands.up);
    }

    function moveDown () {
        sendCommand(CircusCannon.commands.down);
    }

    function moveLeftSlow() {
        sendCommand(CircusCannon.commands.leftSlow);
    }

    function moveRightSlow() {
        sendCommand(CircusCannon.commands.rightSlow);
    }

    function moveUpSlow() {
        sendCommand(CircusCannon.commands.upSlow);
    }

    function moveDownSlow() {
        sendCommand(CircusCannon.commands.downSlow);
    }


    function stop() {
        sendCommand(CircusCannon.commands.stop);
    }

    function fire() {        
        sendCommand(CircusCannon.commands.fire);
    }


    function disconnect() {
        // Stop all existing movement
        sendCommand(CircusCannon.commands.stop);

        // Close the device
        if (launcher != null) {            
            launcher.removeEventListener("inputreportreceived", inputReportReceived);
            launcher.close();
            launcher = null;
        }

        enableButtonsAndEvents();
    }


    Windows.UI.WebUI.WebUIApplication.addEventListener("suspending", function () {
        disconnect();
        WinJS.log && WinJS.log("suspending: released launcher", "app");
    });


    Windows.UI.WebUI.WebUIApplication.addEventListener("resuming", function () {
        // Reacquire the device object 
        if (lastDeviceId != null) {
            connect(lastDeviceId);

            if (launcher != null) {
                WinJS.log && WinJS.log("resuming: reacquired launcher", "app");
            } else {
                WinJS.log && WinJS.log("resuming: could not reacquire launcher", "app");
            }
        }
        
    })


    function statusString(status) {
        var types = Windows.Devices.Enumeration.DeviceAccessStatus;

        switch (status) {
            case types.deniedByUser:
                return "user did not give consent to access the device.";

            case types.deniedBySystem:
                return "access to this device denied by policy or lack of manifest declaration.";

            default:
                return "other error; device might be open in another app.";
        }
    }


    function enableButtonsAndEvents(device) {
        var haveDevice = (device != null);
        document.getElementById("btnAcquire").disabled = haveDevice;        
        document.getElementById("btnDisconnect").disabled = !haveDevice;

        document.getElementById("btnUp").disabled = !haveDevice;
        document.getElementById("btnDown").disabled = !haveDevice;
        document.getElementById("btnLeft").disabled = !haveDevice;
        document.getElementById("btnRight").disabled = !haveDevice;

        document.getElementById("btnUpSlow").disabled = !haveDevice;
        document.getElementById("btnDownSlow").disabled = !haveDevice;
        document.getElementById("btnLeftSlow").disabled = !haveDevice;
        document.getElementById("btnRightSlow").disabled = !haveDevice;

        document.getElementById("btnStop").disabled = !haveDevice;
        document.getElementById("btnFire").disabled = !haveDevice;

        if (haveDevice) {
            device.addEventListener("inputreportreceived", inputReportReceived);
        }
    }
    

    function inputReportReceived(e) {
        document.getElementById("output_id").innerText = e.report.id;
        document.getElementById("output_size").innerText = e.report.data.length;        
        document.getElementById("output_rawReport").innerText = generateRawReport(e.report.data);

        var reader = Windows.Storage.Streams.DataReader.fromBuffer(e.report.data);
        var report = new Uint8Array(e.report.data.length);
        reader.readBytes(report);

        //Check for hitting limits. To be more sophisticated, we could debounce each limit after it's
        //hit, as the switch inside the cannon won't necessarily release after the first move in an
        //opposite direction. That is, if we hit the up limit, we could debounce the next five reports
        //of the limit after a down movement has started. But in this example I'm not implementing that.
        var upDown = report[CircusCannon.offset.upDown];
        var leftRight = report[CircusCannon.offset.leftRight];
        
        var atLimit = (upDown & (CircusCannon.status.topLimit | CircusCannon.status.bottomLimit))
            || (leftRight & (CircusCannon.status.leftLimit | CircusCannon.status.rightLimit));
        
        //Check also if we just fired a missle and stop if so.
        var missileFired = report[CircusCannon.offset.missile] & CircusCannon.status.missileFired;

        //Stop movement if we're at a limit, or stop the firing after one shot.
        if (atLimit || missileFired) {
            sendCommand(CircusCannon.commands.stop);
        }
    }


    function generateRawReport(dataBuffer) {
        var reader = Windows.Storage.Streams.DataReader.fromBuffer(dataBuffer);

        //Note: once you read from the DataReader, you can't seek backwards and have to
        //create a new DataReader to start over. That's why this method creates a reader
        //unto itself.

        var report = new Uint8Array(dataBuffer.length);
        reader.readBytes(report);

        var hexReport = "";
        var byteStr = "";

        for (var i = 0; i < dataBuffer.length; i++) {
            byteStr = report[i].toString(16);

            //Add leading 0 if needed to make the output readable
            if (byteStr.length == 1) {
                byteStr = "0" + byteStr;
            }

            hexReport += byteStr + " ";
        }

        return hexReport;
    }


    app.start();
})();
