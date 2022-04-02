// For an introduction to the Blank template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkId=232509
(function () {
    "use strict";

    var app = WinJS.Application;
    var activation = Windows.ApplicationModel.Activation;
    var wui = Windows.UI.WebUI.WebUIApplication;
    var rfc = Windows.Devices.Bluetooth.Rfcomm; 

    var lastDeviceId = 0;

    var device = null;
    var socket = null;
    var writer = null;

    var output = null;

    app.onactivated = function (args) {
        if (args.detail.kind === activation.ActivationKind.launch) {
            if (args.detail.previousExecutionState !== activation.ApplicationExecutionState.terminated) {
            } else {
            }
            args.setPromise(WinJS.UI.processAll().done(function () {
                output = document.getElementById("output");

                document.getElementById("btnConnect").addEventListener("click", connect);
                document.getElementById("btnChangeColor").addEventListener("click", changeColor);
                document.getElementById("btnDisconnect").addEventListener("click", disconnect);
            }));
        }
    };


    function connect() {
        //Enumerate the devices in the class we're looking for, and use the first one as the default.
        //Can also use rfc.RfcommServiceId.fromUuid("00001101-0000-1000-8000-00805F9B34FB")) as the
        //service id, which is the UUID for the serial port.
        var sel = rfc.RfcommDeviceService.getDeviceSelector(rfc.RfcommServiceId.serialPort);
        
        Windows.Devices.Enumeration.DeviceInformation.findAllAsync(sel, null).then(function (devices) {
            //Sphero id is "\\\\?\\BTHENUM#{00001101-0000-1000-8000-00805f9b34fb}_LOCALMFG&0002#8&1ddaf69e&0&0006664F6CD5_C00000000#{b142fc3e-fa4e-460b-8abc-072b628b3c70}"
            lastDeviceId = devices[0].id
            connectToDevice(lastDeviceId);
        }, function (e) {
            output.innerText = "Failed to find RFCOMM serial port devices; " + e;
        });
    }

    function connectToDevice(id) {
        output.innerText = "";

        rfc.RfcommDeviceService.fromIdAsync(id).done(function (foundDevice) {
            device = foundDevice;
            enableButtons();
            openSocket();
            output.innerText = "Reconnected to Sphero";
        }, function (e) {
            output.innerText = "Failed to acquire Sphero device; " + e;
        });
    }

    function openSocket() {
        output.innerText = "";

        if (device == null) {
            return;
        }

        // Create a socket and connect to the target 
        var sockNS = Windows.Networking.Sockets;
        socket = new sockNS.StreamSocket();        
        socket.connectAsync(device.connectionHostName, device.connectionServiceName,
            sockNS.SocketProtectionLevel.bluetoothEncryptionAllowNullAuthentication)
            .done(function () {
                //Note: the DataWriter constructor does not test the given stream, so if you
                //pass an invalid stream, you won't know until DataWriter.storeAsync throws
                //an exception (see changeColor below).
                writer = new Windows.Storage.Streams.DataWriter(socket.outputStream);                
            }, function (e) {
                output.innerText = "Failed to open socket; " + e;
            });
    }

    function changeColor() {
        output.innerText = "";

        if (writer == null) {
            return;
        }

        var packet = generateRandomColorPacket();
        writer.writeBytes(packet);

        try {
            writer.storeAsync().done(function () {
                var r = packet[6], g = packet[7], b = packet[8];
                output.innerText = "Wrote color (" + r + ", " + g + ", " + b + ")";
                document.getElementById("colorBlock").style.background =
                    "#" + r.toString(16) + g.toString(16) + b.toString(16);
            }, function (e) {
                output.innerText = "Failed to write packet; " + e;
            });
        } catch (e) {
            //Note: if you see an exception here like "The operation identifier is not valid,"
            //check that your socket and outputStream used to create the DataWriter is valid,
            //because the DataWriter won't access it or give any errors until storeAsync is called.
            output.innerText = "DataWriter.storeAsync failed (exception); " + e;
        }
    }


    function generateRandomColorPacket() {
        var r = Math.floor(Math.random() * 256);
        var g = Math.floor(Math.random() * 256);
        var b = Math.floor(Math.random() * 256);

        //Checksum is the lower 8 bits of the packet contents minus the 0xFFFE prefix
        var checksum = (0x02 + 0x20 + 0x01 + 0x05 + r + g + b + 0x01) % 256;
        
        return new Uint8Array([0xFF, 0xFE, 0x02, 0x20, 0x01, 0x05, r, g, b, 0x01, ~checksum]);        
    }

        
    wui.addEventListener("suspending", function (e) {
        disconnect();        
    });

    wui.addEventListener("resuming", function (e) {
        //Attempt to reconnect to previously enumerated device
        if (lastDeviceId != 0) {
            connectToDevice(lastDeviceId);            
        }
    })


    function disconnect() {
        output.innerText = "";

        writer && writer.close();
        writer = null;

        socket && socket.close();
        socket = null;

        device = null;

        enableButtons();
    }

    function enableButtons() {
        var hasDevice = (device != null);

        document.getElementById("btnConnect").disabled = hasDevice;
        document.getElementById("btnChangeColor").disabled = !hasDevice;
        document.getElementById("btnDisconnect").disabled = !hasDevice;
    }

    app.start();
})();
