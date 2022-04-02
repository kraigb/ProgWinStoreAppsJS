// For an introduction to the Blank template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkId=232509
(function () {
    "use strict";

    var app = WinJS.Application;
    var activation = Windows.ApplicationModel.Activation;
    
    var mediaControl = Windows.Media.MediaControl;
    var playlist = ["media/segment1.mp3", "media/segment2.mp3", "media/segment3.mp3", "media/segment4.mp3"];
    var curSong = 0;
    var audio1 = null;
    var preload = null;

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

            var sound1 = new Audio("media/SpringyBoing.mp3");
            sound1.msAudioCategory = "SoundEffect";
            sound1.load();  //For pre-loading media            
            //sound1.play();  //At any later time

            //Music segment
            var sound2 = new Audio();
            sound2.msAudioCategory = "ForegroundOnlyMedia";  //Set this before setting src
            sound2.src = "http://www.kraigbrockschmidt.com/mp3/WhoIsSylvia_PortlandOR_5-06.mp3";
            sound2.loop = true;
            sound2.volume = 0.5; //50%;
            sound2.setAttribute("id", "musicPlayback");
            sound2.setAttribute("controls", "");
            sound2.msAudioCategory = "ForegroundOnlyMedia";

            //Make controls visible and play the audio (optional)
            document.getElementById("audioInsertion").appendChild(sound2);
            //sound2.play();

            document.getElementById("btnSound").addEventListener("click", function () {
                //Reset position in case we're already playing
                sound1.currentTime = 0;
                sound1.play();
            });

            //Hide the second audio initially
            document.getElementById("audioSegments").style.display = "none";
            document.getElementById("btnSegments").addEventListener("click", playSegments);
            audio1 = document.getElementById("audioSegments");
            preload = document.createElement("audio");
        }
    };

    app.oncheckpoint = function (args) {
        // TODO: This application is about to be suspended. Save any state
        // that needs to persist across suspensions here. You might use the
        // WinJS.Application.sessionState object, which is automatically
        // saved and restored across suspension. If you need to complete an
        // asynchronous operation before your application is suspended, call
        // args.setPromise().
    };

    //Function to play sequential segments
    function playSegments() {
        //Always reset WinRT object event listeners to prevent duplication and leaks        
        mediaControl.removeEventListener("nexttrackpressed", nextHandler);
        mediaControl.removeEventListener("previoustrackpressed", prevHandler);
        
        curSong = 0;

        //Pause the other music
        document.getElementById("musicPlayback").pause();
              
        //Set up media control listeners
        setMediaControl(audio1); 
        
        //Show the element (initially hidden) and start playback
        audio1.style.display = "";
        audio1.volume = 0.5; //50%;
        playCurrent();
        
        //Preload the next track in readiness for the switch
        var preload = document.createElement("audio");
        preload.setAttribute("preload", "auto");
        preload.src = playlist[1];

        //Switch to the next track as soon as one had ended or next button is pressed
        audio1.addEventListener("ended", nextHandler);
        mediaControl.addEventListener("nexttrackpressed", nextHandler);
    }
    
    function nextHandler () {
        curSong++;

        //Enable previous button if we have at least one previous track
        if (curSong > 0) {
            mediaControl.addEventListener("previoustrackpressed", prevHandler);
        }

        if (curSong < playlist.length) {
            //playlist[curSong] should already be loaded
            playCurrent();

            //Set up the next preload
            var nextTrack = curSong + 1;

            if (nextTrack < playlist.length) {
                preload.src = playlist[nextTrack];
            } else {
                preload.src = null;
                mediaControl.removeEventListener("nexttrackpressed", nextHandler);
            }
        }
    }

    function prevHandler() {
        //If we're already playing the last song, add the next button handler again
        if (curSong == playlist.length - 1) {
            mediaControl.addEventListener("nexttrackpressed", nextHandler);
        }

        curSong--;

        if (curSong == 0) {
            mediaControl.removeEventListener("previoustrackpressed", prevHandler);
        }

        playCurrent();
        preload.src = playlist[curSong + 1]; //This should always work
    }

    function playCurrent() {
        audio1.src = playlist[curSong];
        audio1.play();
        mediaControl.trackName = "Segment " + (curSong + 1);
    }

    //Set up media control listeners for the audio object to enable background audio
    function setMediaControl(audioElement) {        
        mediaControl.addEventListener("playpausetogglepressed", function () {
            if (audioElement.paused) {
                audioElement.play();
                mediaControl.isPlaying = true;
            } else {
                audioElement.pause();
                mediaControl.isPlaying = false;
            }
        });

        mediaControl.addEventListener("playpressed", function () {
            audioElement.play();
            mediaControl.isPlaying = true;
        });

        mediaControl.addEventListener("stoppressed", function () {
            audioElement.pause();
            mediaControl.isPlaying = false;
        });

        mediaControl.addEventListener("pausepressed", function () {
            audioElement.pause();
            mediaControl.isPlaying = false;
        });
    }

    app.start();
})();

