/// <reference path="//Microsoft.WinJS.2.0/js/base.js" />
/// <reference path="//Microsoft.WinJS.2.0/js/ui.js" />

(function () {
    "use strict";


    var page = WinJS.UI.Pages.define("/html/scenario2.html", {
        _numItems: 3,
        _rangeLower: 1,
        _rangeUpper: 100,

        //Default constructor options
        _options: { binding: false, proxy: false },

        init: function (element, options) {
            this._array = initObjectArray(this._numItems);
            randomizeObjectArray(this._array, this._numItems, this._rangeLower, this._rangeUpper);
            this._createList(false);
        },

        ready: function (element, options) {
            document.getElementById("btnChangeArray").addEventListener("click", this._changeArray.bind(this));            
            document.getElementById("btnChangeList").addEventListener("click", this._changeList.bind(this));
            document.getElementById("chkBinding").addEventListener("click", this._bindingChanged.bind(this));
            document.getElementById("chkProxy").addEventListener("click", this._proxyChanged.bind(this));
            document.getElementById("btnChangeArrayByProperties").addEventListener("click", this._changeArrayByProperties.bind(this));
            document.getElementById("btnChangeListByProperties").addEventListener("click", this._changeListByProperties.bind(this));
            this._updateOutput();
            this._bindSingleOutput();
        },

        _updateOutput: function () {
            outputArray(document.getElementById("arrayOutput"), this._array);
            outputList(document.getElementById("listOutput"), this._list);            
        },

        _changeArray: function () {
            randomizeObjectArray(this._array, this._numItems, this._rangeLower, this._rangeUpper);
            this._updateOutput();
        },

        _changeList: function () {
            randomizeObjectList(this._list, this._numItems, this._rangeLower, this._rangeUpper);
            this._updateOutput();
        },

        _changeArrayByProperties: function () {
            randomizeObjectArrayByProperties(this._array, this._numItems, this._rangeLower, this._rangeUpper);
            this._updateOutput();
        },

        _changeListByProperties: function () {
            randomizeObjectListByProperties(this._list, this._numItems, this._rangeLower, this._rangeUpper);
            this._updateOutput();
        },

        _bindingChanged: function (e) {
            this._options.binding = e.target.checked;
            this._createList(true);
        },

        _proxyChanged: function (e) {
            this._options.proxy = e.target.checked;
            this._createList(true);
        },

        _createList: function (updateOutput) {
            //Create with current options
            this._list = new WinJS.Binding.List(this._array, this._options);

            if (updateOutput) {
                this._updateOutput();
                this._bindSingleOutput();
            }           
        },

        _bindSingleOutput: function () {
            //If Binding is enabled, set up a relationship between the single output field and
            //the first item in the list. (Otherwise show a message.)  Note that the item's color
            //property is already an rgb() string applicable to CSS, so no converter is needed.
            var output = document.getElementById("boundOutput");

            //Might not be initialized yet, so ignore
            if (!output) {
                return;
            }

            if (this._options.binding) {
                var item0 = this._list.getAt(0);
                WinJS.Binding.processAll(output, item0);

                this._list.onitemchanged = function (e) {
                    console.log("List item changed.");
                }

                item0.onitemchanged = function (e) {
                    console.log("Individual item changed.");
                }
            } else {
                output.innerText = "[check the Binding box to enable data binding]";
            }
        }

    });

    function randInt(lower, upper) {
        var range = upper - lower;
        return Math.floor(Math.random() * range) + lower;
    }

    function randColor() {
        //Only using 128-255 ranges to make a color that works OK with black text
        return rgb(randInt(128, 255), randInt(128, 255), randInt(128, 255));
    }

    function rgb(r, g, b) { return "rgb(" + [r, g, b].join(",") + ")"; }


    //This is here to be able to set items in the array by properties later
    function initObjectArray(num) {
        var arr = [];

        for (var i = 0; i < num; i++) {
            arr[i] = { number: null, color: null };
        }

        return arr;
    }
    

    function randomizeObjectArray(arr, num, lower, upper) {
        if (arr == null || !(arr instanceof Array)) {
            return;
        }

        //Because this replaces the objects in the array, the List's references
        //to the replaced item remain in its map and there's no propagation.
        for (var i = 0; i < num; i++) {
            arr[i] = { number: randInt(lower, upper), color: randColor() };
        }
    }

    function randomizeObjectArrayByProperties(arr, num, lower, upper) {
        if (arr == null || !(arr instanceof Array)) {
            return;
        }

        //Changing the properties of an item in the array, instead of the item as 
        //a whole, has the effect of changing them in the List as well because the
        //same item still exists in both the array and the list's map.
        for (var i = 0; i < num; i++) {            
            arr[i].number = randInt(lower, upper);
            arr[i].color = randColor();
        }
    }

    function randomizeObjectList(list, num, lower, upper) {
        if (list == null || list.setAt == "undefined" || typeof list.setAt !== "function") {
            return;
        }

        //This replaces the item in the map, which is now different from the one in 
        //the array, so changes aren't reflected in the array.
        for (var i = 0; i < list.length; i++) {
            list.setAt(i, { number: randInt(lower, upper), color: randColor() } );
        }
    }

    function randomizeObjectListByProperties(list, num, lower, upper) {
        if (list == null || list.getAt == "undefined" || typeof list.getAt !== "function") {
            return;
        }

        //getAt returns the item in the map, which is the same as the on in the
        //array, so changes here are reflected in the array.
        for (var i = 0; i < num; i++) {
            var item = list.getAt(i);
            item.number = randInt(lower, upper);
            item.color = randColor();
        }
    }

    function outputArray(element, arr) {
        var str = "";

        for (var i = 0; i < arr.length; i++) {
            str += itemString(arr[i]);
        }
        
        //Need this to preserve the inline style, and we know where the string came from
        WinJS.Utilities.setInnerHTMLUnsafe(element, str);
    }


    function outputList(element, list) {
        var str = "";        

        for (var i = 0; i < list.length; i++) {            
            str += itemString(list.getAt(i));
        }

        //Need this to preserve the inline style, and we know where the string came from
        WinJS.Utilities.setInnerHTMLUnsafe(element, str);
    }

    function itemString(item) {        
        return "{ number: " + item.number
            + ", color: <span style='background-color: " + item.color + "'>"
            + item.color + "</span>}<br>";
    }
    
})();
