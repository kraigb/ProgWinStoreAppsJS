(function () {
    "use strict";

    var animateDegrees = 180;

    var page = WinJS.UI.Pages.define("/html/scenario3.html", {
        ready: function (element, options) {            
            var btn = document.getElementById("btnAnimate");
            btn.addEventListener("click", animateImage);
            btn.disabled = true;

            var webview = document.getElementById("webview3");
            webview.addEventListener("MSWebViewNavigationCompleted", captureImage);
            webview.navigate("http://www.kraigbrockschmidt.com/blog");
        }
    });

    function animateImage() {                
        var image = document.getElementById("imgOutput");

        //See css/scenario3.css for transition timing styles
        image.style.transform = "perspective(1200px) rotateY(" + animateDegrees + "deg)";
        
        //Change direction for the next animation (180 becomes 0, 0 becomes 180)
        animateDegrees = Math.abs(animateDegrees - 180);
    };

    function captureImage() {
        //The webview is set to 1200x800 offscreen. The imgOutput element is onscreen set to
        //600x400, so effectively displays a scaled-down thumbnail of the webview contents.
        //Note that capturePreviewToBlobAsync will not work when a webview has display: none.
        var webview = document.getElementById("webview3");

        var promise = new WinJS.Promise(function (cd, ed) {
            var op = webview.capturePreviewToBlobAsync();
            op.oncomplete = function (args) { cd(args.target.result); };
            op.onerror = function (e) { ed(e); };
            op.start();
        });

        //When we get our thumbnail, enable the animate button
        promise.then(function (blob) {
            document.getElementById("imgOutput").src = URL.createObjectURL(blob, { oneTimeOnly : true });
            document.getElementById("btnAnimate").disabled = false;            
        });
    }

})();
