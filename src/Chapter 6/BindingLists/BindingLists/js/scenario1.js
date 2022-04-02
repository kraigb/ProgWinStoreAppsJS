/// <reference path="//Microsoft.WinJS.2.0/js/base.js" />
/// <reference path="//Microsoft.WinJS.2.0/js/ui.js" />

(function () {
    "use strict";


    var page = WinJS.UI.Pages.define("/html/scenario1.html", {
        _numItems: 12,
        _rangeLower: 1,
        _rangeUpper: 100,

        //Default constructor options
        _options: { binding: false, proxy: false },

        init: function (element, options) {
            this._array = [];
            randomizeArray(this._array, this._numItems, this._rangeLower, this._rangeUpper);
            this._createList(false);            
        },

        ready: function (element, options) {
            document.getElementById("btnChangeArray").addEventListener("click", this._changeArray.bind(this));
            document.getElementById("btnChangeList").addEventListener("click", this._changeList.bind(this));
            document.getElementById("chkBinding").addEventListener("click", this._bindingChanged.bind(this));
            document.getElementById("chkProxy").addEventListener("click", this._proxyChanged.bind(this));
            this._updateOutput();
        },

        _updateOutput: function () {
            document.getElementById("arrayOutput").innerText = this._array.toString();            
            outputList(document.getElementById("listOutput"), this._list);            
        },

        _changeArray: function () {
            randomizeArray(this._array, this._numItems, this._rangeLower, this._rangeUpper);
            this._updateOutput();
        },

        _changeList: function () {
            randomizeList(this._list, this._numItems, this._rangeLower, this._rangeUpper);
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
            }
        }
    });

    function randInt(lower, upper) {
        var range = upper - lower;
        return Math.floor(Math.random() * range) + lower;
    }

    function randomizeArray(arr, num, lower, upper) {
        if (arr == null || !(arr instanceof Array)) {
            return;
        }

        for (var i = 0; i < num; i++) {
            arr[i] = randInt(lower, upper);            
        }
    }

    function randomizeList(list, num, lower, upper) {
        if (list == null || list.setAt == "undefined" || typeof list.setAt !=="function") {
            return;
        }

        for (var i = 0; i < list.length; i++) {
            list.setAt(i, randInt(lower, upper));
        }
    }

    function outputList(element, list) {
        var str = "";

        for (var i = 0, len = list.length - 1; i < len; i++) {
            str += list.getAt(i) + ",";
        }

        str += list.getAt(len);
        element.innerText = str;
    }

})();
