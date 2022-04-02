(function () {
    "use strict";

    var app = WinJS.Application;
    var activation = Windows.ApplicationModel.Activation;
    var hid = Windows.Devices.HumanInterfaceDevice.HidDevice;
    var controllerDevice = null;    
    var txtOutput = null;

    var launcherDevice = null;

    WinJS.Utilities.startLog("app");    

    app.onactivated = function (args) {
        if (args.detail.kind === activation.ActivationKind.launch) {
            if (args.detail.previousExecutionState !== activation.ApplicationExecutionState.terminated) {
            } else {
            }
            args.setPromise(WinJS.UI.processAll());

            txtOutput = document.getElementById("txtOutput");            
            document.getElementById("btnAcquire").addEventListener("click", acquireController);
        }
    };

    function acquireController() {
        var xbcSelector = hid.getDeviceSelector(0x0001, 0x0005, 0x045E, 0x028E);
        var id = null;
        var name = null;
        
        Windows.Devices.Enumeration.DeviceInformation.findAllAsync(xbcSelector, null).then(function (devInfo) {
            //If no devices are found, throw an error out to our chain's handler
            if (devInfo.size == 0) {
                throw "no devices found";
            }

            //If we find any, assume we just have one such device on the system and use it.
            id = devInfo[0].id;
            name = devInfo[0].name;
            return hid.fromIdAsync(id, Windows.Storage.FileAccessMode.read);
        }).done(function (device) {
            if (device == null) {
                //Device could be enumerated but not accessed; user likely denied consent.
                var status = Windows.Devices.Enumeration.DeviceAccessInformation.createFromId(id);
                txtOutput.innerText = "Device exists but not acquired. Status: " + statusString(status.currentStatus);                
            } else {
                controllerDevice = device;
                txtOutput.innerText = "Device acquired: " + name;                
            }

            enableButtonsAndEvents(controllerDevice);
        }, function (e) {
            //Some other error happened
            txtOutput.innerText = "Error acquiring device: " + e;
        });        
    }


    Windows.UI.WebUI.WebUIApplication.addEventListener("suspending", function () {
        // Stop all existing I/O

        // Close the device
        if (controllerDevice) {
            controllerDevice.close();
            controllerDevice.removeEventListener("inputreportreceived", inputReportReceived);
        }
                
        controllerDevice = null;

        WinJS.log && WinJS.log("suspending: closed controller", "app");
    });


    Windows.UI.WebUI.WebUIApplication.addEventListener("resuming", function () {
        // Reacquire the device object 
        controllerDevice = acquireController();
        WinJS.log && WinJS.log("resuming: reacquired controller", "app");
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

        if (haveDevice) {
            device.addEventListener("inputreportreceived", inputReportReceived);
        }
    }
    
    function inputReportReceived(e) {        
        output_id.innerText = e.report.id;
        output_size.innerText = e.report.data.length;        
        output_rawReport.innerText = generateRawReport(e.report.data);

        //Create the DataReader to read the report from the Buffer
        reader = Windows.Storage.Streams.DataReader.fromBuffer(e.report.data);

        var reportObj = {};

        //Unused
        reportObj.unused1 = reader.readByte();

        //16-bit values for stick positions
        reportObj.stickLeftX = reader.readUInt16() - 32768;
        reportObj.stickLeftY = reader.readUInt16() - 32768;
        reportObj.stickRightX = reader.readUInt16() - 32768;
        reportObj.stickRightY = reader.readUInt16() - 32768;

        //Unused
        reportObj.unused2 = reader.readByte();

        //8-bit value for trigger positions
        reportObj.triggers = reader.readByte();        

        //Byte with bits for buttons: A (bit 0) B X Y LB RB back start        
        var buttons = reader.readByte();
        reportObj.buttonA = UpDown(buttons & 0x01);
        reportObj.buttonB = UpDown(buttons & 0x02);
        reportObj.buttonX = UpDown(buttons & 0x04);
        reportObj.buttonY = UpDown(buttons & 0x08);
        reportObj.buttonLB = UpDown(buttons & 0x10);
        reportObj.buttonRB = UpDown(buttons & 0x20);
        reportObj.buttonBack = UpDown(buttons & 0x40);
        reportObj.buttonStart = UpDown(buttons & 0x80);

        ////D-Pad and left stick/right stick buttons are bits here
        buttons = reader.readByte();
       
        reportObj.buttonLeftStick = UpDown(buttons & 0x01);
        reportObj.buttonRightStick = UpDown(buttons & 0x02);
        
        //Mask the dpad buttons. Then any buttons are down, you get a value from 1 to 8
        //in clockwise rotation: 
        //    1
        //  8   2 
        //7       3
        //  6   4
        //    5
        //        
        reportObj.dpad = (buttons & 0x3c) >> 2;

        reportObj.unused3 = reader.readByte();
        reportObj.unused4 = reader.readByte();


        //Populate our output fields whose id's match the object's field names
        Object.keys(reportObj).forEach(function (key) {
            document.getElementById("output_" + key).innerText = reportObj[key];
        });
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


    function UpDown(bool) {
        return bool ? "down" : "up";
    }
    
    app.start();
})();
