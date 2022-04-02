(function () {
    "use strict";

    var MSS = null;
    var timeOffset;
    
    var bitsPerSample = 8;
    var frequency = 110.0;

    var sampleRate = Math.floor(frequency * 20);  //This must be a multiple of the frequency
    var samplesPerCycle = Math.floor(sampleRate / frequency); //The number of samples for a complete cycle of the sine wave

    var sineBuffer = null;

    //Include approximately 100 ms of audio data in the Buffer
    var cyclesPerBuffer = Math.floor(sampleRate / 10 / samplesPerCycle);
    var samplesPerBuffer = samplesPerCycle * cyclesPerBuffer;

    //The duration of the data in the Buffer, in ms
    var sampleLength = Math.floor(samplesPerBuffer * 1000 / sampleRate);

    var outputElement = document.getElementById("txtOutput");

    var page = WinJS.UI.Pages.define("/html/S2_GenerateWAV.html", {
        ready: function (element, options) {
            sineBuffer = createSineBuffer(frequency, sampleRate);
            initializeMediaStreamSource();
        }
    });


    function createSineBuffer(frequency, sampleRate) {
        var buffer = null
        var time = 0;
        var timeStep = 1 / sampleRate;
        var rads = 0;
        var value = 0;        
        var range = (Math.pow(2, bitsPerSample) / 2);

        //timeStep keeps track of the time dimension across all of this
        var writer = Windows.Storage.Streams.DataWriter();

        for (var i = 0; i < samplesPerBuffer; i++) {
            rads = 2 * Math.PI * frequency * time;
            time += timeStep;

            //Adjust each sample to bitsPerSample (0 to 255 for 8 bit, 0 to 63355 for 16 bit).
            value = Math.floor((Math.sin(rads) * range) + range);

            if (bitsPerSample == 8) {
                writer.writeByte(value);
            } else {
                writer.writeUInt16(value);
            }
        }

        //Pull the buffer out of the completed DataWriter.
        buffer = writer.detachBuffer();
        writer.close();

        //DEBUG (read buffer contents to check)
        //var reader = Windows.Storage.Streams.DataReader.fromBuffer(buffer);
        //var bytes = new Array(buffer.length);
        //reader.readBytes(bytes);
        //reader.close();
        //END DEBUG

        return buffer;
    }


    function initializeMediaStreamSource() {
        timeOffset = 0;

        // Creating the AudioEncodingProperties for the WAV (PCM) audio
        var audioProps = Windows.Media.MediaProperties.AudioEncodingProperties.createPcm(sampleRate, 1, bitsPerSample);            
        
        // Creating the AudioStreamDescriptor for the MP3 file
        var audioDescriptor = new Windows.Media.Core.AudioStreamDescriptor(audioProps);

        // Creating the MediaStreamSource for the MP3 file
        MSS = new Windows.Media.Core.MediaStreamSource(audioDescriptor);
        MSS.canSeek = false;
        MSS.duration = 0;  //The audio will keep playing so long as the sample handler returns samples

        // Hooking up the MediaStreamSource event handlers
        MSS.addEventListener("starting", startingHandler, false);
        MSS.addEventListener("samplerequested", sampleRequestedHandler, false);        
        MSS.addEventListener("closed", closedHandler, false);

        // Set the MediaStreamSource to audio tag and start the playback
        mediaPlayer.src = URL.createObjectURL(MSS, { oneTimeOnly: true });

        //Uncomment for auto play
        //mediaPlayer.play();
    }


    function sampleRequestedHandler(e) {
        var sample = Windows.Media.Core.MediaStreamSample.createFromBuffer(sineBuffer, timeOffset);        
        sample.duration = sampleLength;
        timeOffset = (timeOffset + sample.duration);
        e.request.sample = sample;
    }


    function startingHandler(e) {
        /* Nothing to do */
    }


    function closedHandler(e) {
        e.target.removeEventListener("starting", startingHandler, false);
        e.target.removeEventListener("samplerequested", sampleRequestedHandler, false);
        e.target.removeEventListener("closed", closedHandler, false);

        if (e.target === MSS) {
            MSS = null;
        }
    }

})();
