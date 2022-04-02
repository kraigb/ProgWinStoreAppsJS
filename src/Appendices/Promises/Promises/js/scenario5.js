(function () {
    "use strict";
    var page = WinJS.UI.Pages.define("/html/scenario5.html", {
        ready: function (element, options) {
            document.getElementById("btnRun").addEventListener("click", runScenario);
        }
    });


    function runScenario() {
        App.clearOutput();

        //Consumer code
        getDesiredCount().then(function (count) {
            App.log("getDesiredCount produced " + count);

            calculateIntegerSum(count, 500).then(function (sum) {
                App.log("calculated sum = " + sum);
            },

            null,  //No error handler

            //Progress handler
            function (partialSum) {
                App.log("partial sum = " + partialSum);
            });
        });

        App.log("getDesiredCount.then returned");
    }


    //Originator code    
    function getDesiredCount() {
        return new NumberPromise();
    }

    //Promise class implementation simulating async results
    var NumberPromise = function () {
        this._value = 5000;
        this.then = function (completedHandler) {
            //Simulate async work with a timeout so that we return before calling completedHandler
            setTimeout(completedHandler, 100, this._value);
        }
    }


    function calculateIntegerSum(max, step) {
        return new IntegerSummationPromise(max, step);
    }

    var IntegerSummationPromise = function (max, step) {
        this._sum = null;  //null means we haven't started the operation
        this._cancel = false;        

        //Error conditions
        if (max < 1 || step < 1) {
            return null;
        }

        //Handler lists
        this._cList = [];
        this._eList = [];
        this._pList = [];
        
        this.then = function (completedHandler, errorHandler, progressHandler) {
            //Save handlers in their respective arrays
            completedHandler && this._cList.push(completedHandler);
            errorHandler && this._eList.push(errorHandler);
            progressHandler && this._pList.push(progressHandler);
            var that = this;

            function iterate(args) {
                for (var i = args.start; i < args.end; i++) {
                    that._sum += i;
                };

                if (i >= max) {
                    //Complete--dispatch results to completed handlers
                    that._cList.forEach(function (handler) {
                        handler(that._sum);
                    });
                } else {
                    //Dispatch intermediate results to progress handlers
                    that._pList.forEach(function (handler) {
                        handler(that._sum);
                    });
                    
                    //Do the next cycle
                    setImmediate(iterate, { start: args.end, end: Math.min(args.end + step, max) });
                }
            }

            //Only start the operation on the first call to then
            if (this._sum === null) {
                this._sum = 0;
                setImmediate(iterate, { start: 0, end: Math.min(step, max) });
            }
        };

        this.cancel = function () {
            this._cancel = true;
        }
    }


})();

