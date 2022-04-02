(function () {
    "use strict";

    var app = WinJS.Application;
    var activation = Windows.ApplicationModel.Activation;
    
    var sysMediaControls = Windows.Media.SystemMediaTransportControls.getForCurrentView();
    var playlist = ["/media/segment1.mp3", "/media/segment2.mp3", "/media/segment3.mp3", "/media/segment4.mp3"];
    var curSong = 0;
    var audio1 = null;
    var preload = null;

    app.onactivated = function (args) {
        if (args.detail.kind === activation.ActivationKind.launch) {
            if (args.detail.previousExecutionState !== activation.ApplicationExecutionState.terminated) {
            } else {
            }
            
            args.setPromise(WinJS.UI.processAll());

            //Preloaded sound effect
            var sound1 = new Audio("/media/SpringyBoing.mp3");
            sound1.msAudioCategory = "SoundEffect";
            sound1.load();  //For pre-loading media -- we'll call play later
            

            //Music track (foreground only)
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

            //Listen to the audio element's play/pause controls to set system control status            .
            //Without these the system controls won't reflect the proper state of the audio nor
            //send the right button events.
            audio1.addEventListener("playing", function () {
                sysMediaControls.playbackStatus = Windows.Media.MediaPlaybackStatus.playing;
            });

            audio1.addEventListener("pause", function () {
                sysMediaControls.playbackStatus = Windows.Media.MediaPlaybackStatus.paused;
            });
        }
    };


    //Starts playback of sequential segments
    function playSegments(e) {
        //Disable Play Segments button. If we re-entered this method, we'd need to make sure
        //that the buttonpressed listener set up below is removed to prevent leaks.
        e.target.disabled = true;

        curSong = 0;

        //Pause the other music
        document.getElementById("musicPlayback").pause();
              
        //Set up media control listeners for the audio object to enable background audio

        //First, enable both play and pause--these are a toggle
        sysMediaControls.isPlayEnabled = true;
        sysMediaControls.isPauseEnabled = true;

        //Next, initially enable Next but not Previous, which we'll change
        //depending on current segment.
        sysMediaControls.isNextEnabled = true;
        sysMediaControls.isPreviousEnabled = false;

        //IMPORTANT: we don't need to remove this WinRT event listener because it's always
        //in effect for the lifetime of the app. If you unload a page containing this code,
        //be sure to removeEventListener. 
        sysMediaControls.addEventListener("buttonpressed", function (e) {
            var wmb = Windows.Media.SystemMediaTransportControlsButton;

            switch (e.button) {
                case wmb.play:
                    audio1.play();
                    break;

                case wmb.pause:
                case wmb.stop:
                    audio1.pause();
                    break;

                case wmb.next:
                    playNext();
                    break;

                case wmb.previous:
                    playPrev();
                    break;

                default:
                    break;
            }
        });


        //There are two ways to set the title and other UI properties for the media controls
        //through its displayUpdater. One is to set the type to music and then set 
        //musicProperties and thumbnail manually. The other way is to get a StorageFile for the
        //track and populate from that. Both methods are shown here, with the second method
        //commented out inside playCurrent because you can find another example in the System media
        //transport controls sample.

        //Set up invariant metadata
        var du = sysMediaControls.displayUpdater;
        du.type = Windows.Media.MediaPlaybackType.music;        
        du.musicProperties.artist = "AudioPlayback Example (Chapter 13)";
        var thumbUri = new Windows.Foundation.Uri("ms-appx:///media/albumArt.jpg");
        du.thumbnail = Windows.Storage.Streams.RandomAccessStreamReference.createFromUri(thumbUri);
        du.update();

        //Show the element (initially hidden) and start playback
        audio1.style.display = "";
        audio1.volume = 0.5; //50%;
        playCurrent();
        
        //Preload the next track in readiness for the switch
        var preload = document.createElement("audio");
        preload.setAttribute("preload", "auto");
        preload.src = playlist[1];

        //Switch to the next track as soon as one had ended or next button is pressed
        audio1.addEventListener("ended", playNext);
    }
    

    function playCurrent() {
        audio1.src = playlist[curSong];
        audio1.play();                             
        
        var du = sysMediaControls.displayUpdater;
        
        //Populate UI manually.
        //Artist and thumbnail set up earlier; we just need the track name
        du.musicProperties.title = "Segment " + (curSong + 1);
        du.update();

        //Populate UI from file metadata. (comment out the two line above if you use this).

        ////Paths in playlist already have /, so prepending ms-appx:// gives ///
        //var uri = new Windows.Foundation.Uri("ms-appx://" + playlist[curSong]);
        //Windows.Storage.StorageFile.getFileFromApplicationUriAsync(uri).then(function (file) {        
        //    return sysMediaControls.displayUpdater.copyFromFileAsync(Windows.Media.MediaPlaybackType.music, file);
        //}).then(function () {
        //    //Reset the thumb because the MP3's don't have that metadata and will default to app tile.
        //    var thumbUri = new Windows.Foundation.Uri("ms-appx:///media/albumArt.jpg");
        //    du.thumbnail = Windows.Storage.Streams.RandomAccessStreamReference.createFromUri(thumbUri);
        //    sysMediaControls.displayUpdater.update();
        //});
        
    }


    function playNext() {
        curSong++;

        //Enable previous button if we have at least one previous track
        sysMediaControls.isPreviousEnabled = (curSong > 0);

        if (curSong < playlist.length) {            
            playCurrent();    //playlist[curSong] should already be loaded

            //Set up the next preload
            var nextTrack = curSong + 1;

            if (nextTrack < playlist.length) {
                preload.src = playlist[nextTrack];
            } else {
                preload.src = null;

                //Disable next if we're at the end of the list.
                sysMediaControls.isNextEnabled = false;
            }
        }
    }

    function playPrev() {
        //Enable Next unless we only have one song in the list
        sysMediaControls.isNextEnabled = (curSong != playlist.length - 1);

        curSong--;

        //Disable previous button if we're at the beginning now
        sysMediaControls.isPreviousEnabled = (curSong != 0);

        playCurrent();
        preload.src = playlist[curSong + 1]; //This should always work
    }

    app.start();
})();

