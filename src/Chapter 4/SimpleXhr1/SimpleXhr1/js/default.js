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

            //Go get some blog posts
            downloadPosts();            
        }
    };

    function downloadPosts() {
        WinJS.xhr({ url: "http://blogs.msdn.com/b/windowsappdev/rss.aspx" })
            .done(processPosts, processError, showProgress);
    }


    function processPosts(request) {
        //Clear out the progress message
        var status = document.getElementById("status");
        status.innerText = "";

        //Clear out all existing posts
        document.getElementById("posts").innerHTML = "";
        
        //Parse the feed
        var items = request.responseXML.querySelectorAll("item");
        if (items.length == 0) {
            status.innerText = "error downloading posts";
        }

        var posts = document.getElementById("posts");
        
        for (var i = 0, len = items.length; i < len; i++) {
            var item = items[i];

            //Append data to the posts div
            var post = document.createElement("div");
            post.className = "post";
            posts.appendChild(post);

            appendDiv(post, item.querySelector("title").textContent, "win-type-x-large");
            appendDiv(post, item.querySelector("pubDate").textContent, "win-type-medium");
            appendLink(post, item.querySelector("link").textContent, "win-type-small");
        }
    }

    function processError (e) {
        document.getElementById("status").innerText = "Error downloading posts";
    }

    function showProgress(e) {
        var bytes = Math.floor(e.response.length / 1024);
        document.getElementById("status").innerText = "Downloaded " + bytes + " KB";
    }

    function appendDiv(parent, text, className) {
        var div = document.createElement("div");        
        div.className = className;
        div.innerText = text;
        parent.appendChild(div);

        //If text contained HTML, we could use the unsafe setInnerHTML here because we trust the source
        //WinJS.Utilities.setInnerHTMLUnsafe(div, html);
    }


    function appendLink(parent, url, className) {
        var ref = document.createElement("a");
        ref.className = className;
        ref.href = url;
        ref.innerText = url;
        parent.appendChild(ref);
    }

    app.start();
})();
