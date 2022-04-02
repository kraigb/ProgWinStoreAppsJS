(function () {
    "use strict";

    var app = WinJS.Application;
    var activation = Windows.ApplicationModel.Activation;
    var verbs = Windows.ApplicationModel.Appointments.AppointmentsProvider.AppointmentsProviderLaunchActionVerbs;
    var lastId = 0;

    app.onactivated = function (args) {
        if (args.detail.kind === activation.ActivationKind.appointmentsProvider) {
            var operation = null;
            var headerVerb = "";
            var output = null;
            
            switch (args.detail.verb) {
                case verbs.addAppointment:
                    headerVerb = "Add";
                    operation = args.detail.addAppointmentOperation;
                    output = formatAppointmentInfo(operation.appointmentInformation);

                    //Just make up an id to return.
                    lastId = Math.floor(Math.random() * 1000) + 1;
                    break;

                case verbs.removeAppointment:
                    headerVerb = "Remove";
                    operation = args.detail.removeAppointmentOperation;
                    output = "appointmentId: " + operation.appointmentId + "<br/>";
                    output += "instanceStartDate: " + operation.instanceStartDate + "<br/>";
                    break;

                case verbs.replaceAppointment:
                    headerVerb = "Update";
                    operation = args.detail.replaceAppointmentOperation;
                    output = formatAppointmentInfo(operation.appointmentInformation);
                    output += "instanceStartDate: " + operation.instanceStartDate + "<br/>";
                    break;

                default:
                    headerVerb = "Whoops!";
                    output = "Provider app activated with unknown verb (which shouldn't happen)."
                    break;
            }

            //Set header text in our UI
            document.getElementById("txtVerb").innerText = headerVerb;

            output += "<br/>sourcePackageFamilyName: " + operation.sourcePackageFamilyName;
            document.getElementById("outputElement").innerHTML = output;
            
            //Buttons are just to demonstrate calling report* methods
            var btnComplete = document.getElementById("btnComplete");
            var btnCancel = document.getElementById("btnCancel");
            var btnError = document.getElementById("btnError");

            if (operation != null) {
                btnComplete.addEventListener("click", function () {
                    //When operation is complete, be sure to dismiss the UI.
                    operation.dismissUI();
                    operation.reportComplete(lastId);
                });

                btnCancel.addEventListener("click", function () {                    
                    operation.reportCancel();
                });

                btnError.addEventListener("click", function () {
                    operation.reportError("Error button was pressed");
                });
            } else {
                btnComplete.disabled = true;
                btnCancel.disabled = true;
                btnError.disabled = true;
            }

            args.setPromise(WinJS.UI.processAll());
        }
    };


    function formatAppointmentInfo(appt) {
        var output = "";

        //Just generate some basic info (skipping some fields like invitees)
        output += "subject: " + appt.subject + "<br/>";
        output += "location: " + appt.location + "<br/>";
        output += "organizer: " + appt.organizer + "<br/>";
        output += "startTime: " + appt.startTime + "<br/>";
        output += "duration: " + appt.duration + "<br/>";
        output += "details: " + appt.details + "<br/>";

        return output;
    }

    app.start();
})();
