(function () {
    "use strict";
    var page = WinJS.UI.Pages.define("/html/scenario6.html", {
        ready: function (element, options) {
            document.getElementById("btnRun1").addEventListener("click", runScenario1);
            document.getElementById("btnRun2").addEventListener("click", runScenario2);
        }
    });


    var id; //For counting instance of InnerPromise
    var noisy = false;

    function runScenario1() {
        App.clearOutput();
        noisy = false;
        id = 0;

        getDesiredCount().then(function (count) {
            return calculateIntegerSum(count, 500);
        }).then(function (sum1) {
            App.log("calculated first sum = " + sum1);
            return calculateIntegerSum(sum1, 500);
        }).then(function (sum2) {
            App.log("calculated second sum = " + sum2);
        });
    }

    function runScenario2() {
        App.clearOutput();
        noisy = true;
        id = 0;

        var p1 = getDesiredCount();
        App.log("p1 obtained, type = " + p1._type);

        var p2 = p1.then(function (count) {
            App.log("p1 fulfilled, count = " + count);
            return calculateIntegerSum(count, 500);
        });
        
        App.log("p1.then returned, p2 obtained, type = " + p2._type);

        var p3 = p2.then(function (sum1) {
            App.log("p2 fulfilled, sum1 = " + sum1);            
            return calculateIntegerSum(sum1, 500);
        });

        App.log("p2.then returned, p3 obtained, type = " + p3._type);

        var lastPromise = p3.then(function (sum2) {
            App.log("p3 fulfilled, sum2 = " + sum2);            
        });

        App.log("p3.then returned (end of chain), returned promise type = " + lastPromise._type);
    }

    function getDesiredCount() {
        return new NumberPromise();
    }

    var NumberPromise = function () {
        this._type = "NumberPromise";
        this._value = 1000;
        this.then = function (completedHandler) {            
            setTimeout(valueAvailable, 100, this._value);
            var that = this;

            function valueAvailable(value) {
                noisy && App.log("NumberPromise completed.");
                var retVal = completedHandler(value);
                that._innerPromise.complete(retVal);
            }

            //then returns a promise that's completed with the return value of
            //the completed handler we get above. We use the InnerPromise.complete
            //method to deliver those results so it can pass them onto its 
            //completed handlers.
            var retVal = new InnerPromise();
            this._innerPromise = retVal;
            return retVal;
        }
    }


    //A class to handle returning a promise from NumberPromise.then, which also
    //uses itself to return a promise from its own then.    
    var InnerPromise = function (value) {
        this._type = "InnerPromise" + (++id);   //Hack: use a global to mark unique id's
        this._value = value;
        this._completedHandler = null;        
        var that = this;

        noisy && App.log(this._type + " created");

        //Internal helper
        this._callComplete = function (value) {
            noisy && App.log(that._type + " calling completed handler");

            if (that._completedHandler) {
                var retVal = that._completedHandler(value);
                that._innerPromise.complete(retVal);                
            }
        }

        this.then = function (completedHandler) {
            noisy && App.log(that._type + ".then called");
            if (that._value) {
                noisy && App.log(that._type + ".then has known value");
                var retVal = that._callComplete(that._value);
                that._innerPromise.complete(retVal);
                return that;
            } else {
                noisy && App.log(that._type + ".then creating new promise");
                that._completedHandler = completedHandler;

                //Create yet another inner promise for our return value
                var retVal = new InnerPromise();
                this._innerPromise = retVal;
                return retVal;
            }
        };

        //Test if a value is a promise
        function isPromise(p) {
            return (p && typeof p === "object" && typeof p.then === "function");
        }

        //This tells us we have our fulfillment value
        this.complete = function (value) {
            noisy && App.log(that._type + ".complete method called");
            that._value = value;

            if (isPromise(value)) {
                noisy && App.log(that._type + " calling " + value._type + ".then");
                value.then(function (finalValue) {
                    noisy && App.log(that._value._type + " fulfilled");
                    that._callComplete(finalValue);
                })
            } else {
                that._callComplete(value);                
            }
        }
    }


    function calculateIntegerSum(max, step) {
        return new IntegerSummationPromise(max, step);
    }

    var IntegerSummationPromise = function (max, step) {
        this._type = "IntegerSummationPromise";
        this._sum = null;  //null means we haven't started the operation
        this._cancel = false;

        //Error condition
        if (max < 1) {
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
                    noisy && App.log("IntegerSummationPromise completed");
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
                noisy && App.log("IntegerSummationPromise started");
                setImmediate(iterate, { start: 0, end: Math.min(step, max) });
            }
        };

        this.cancel = function () {
            this._cancel = true;
        }
    }


})();

