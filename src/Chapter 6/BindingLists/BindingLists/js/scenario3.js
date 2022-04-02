/// <reference path="//Microsoft.WinJS.2.0/js/base.js" />
/// <reference path="//Microsoft.WinJS.2.0/js/ui.js" />

(function () {
    "use strict";

    var page = WinJS.UI.Pages.define("/html/scenario3.html", {
        _numItems: 20,
        _rangeLower: 1,
        _rangeUpper: 100,

        _list: null,
        _filteredByNumber: null,
        _filteredByBlueness: null,
        _sorted: null,
        _sortedByBlueness: null,
        _sortedByFilteredBlueness: null,
        _groupedByDecades: null,
        _groupedByDecadesSortedByCount: null,        
        
        init: function (element, options) {
            this._createLists(this._numItems);
        },

        ready: function (element, options) {
            document.getElementById("btnChangeList").addEventListener("click", this._changeList.bind(this));            
            document.getElementById("btnChangeProjection").addEventListener("click", this._changeProjection.bind(this));
            this._updateOutput();
        },

        _updateOutput: function () {            
            outputList(document.getElementById("listOutput"), this._list);
            outputList(document.getElementById("filter1Output"), this._filteredByNumber);
            outputList(document.getElementById("filter2Output"), this._filteredByBlueness);
            outputList(document.getElementById("sorted1Output"), this._sorted);
            outputList(document.getElementById("sorted2Output"), this._sortedByBlueness);
            outputList(document.getElementById("sorted3Output"), this._sortedByFilteredBlueness);
            outputList(document.getElementById("grouped1Output"), this._groupedByDecades);

            if (this._groupedByDecades) {
                outputGroups(document.getElementById("groups1Output"), this._groupedByDecades.groups);
            }

            outputList(document.getElementById("grouped2Output"), this._groupedByDecadesSortedByCount);

            if (this._groupedByDecadesSortedByCount) {
                outputGroups(document.getElementById("groups2Output"), this._groupedByDecadesSortedByCount.groups);
            }
        },

        _changeList: function () {
            randomizeList(this._list, this._numItems, this._rangeLower, this._rangeUpper);

            //This notifyReload is necessary to reset the grouping data, not just the projections.
            this._list.notifyReload();
            this._updateOutput();
        },

        _changeProjection: function () {
            //Change the first item in the three-layered projection to show that the change
            //carries through all the layers, even when we replace the item entirely with setAt.
            if (this._groupedByDecadesSortedByCount) {
                this._groupedByDecadesSortedByCount.setAt(0,
                    { number: randInt(this._rangeLower, this._rangeUpper), color: randColor() });
            }

            this._updateOutput();
        },

        _createLists: function (num) {
            //Create an empty list (no underlying array)
            this._list = new WinJS.Binding.List();

            //Populate with randomized objects
            for (var i = 0; i < num; i++) {
                this._list.push({ number: randInt(this._rangeLower, this._rangeUpper), color: randColor() });
            }


            //Now create the projections
            this._filteredByNumber = this._list.createFiltered(function (j) {
                var result = j.number > 50;
                WinJS.log && WinJS.log("filtering > 50: input = " + j.number + ", result: " + result, "projections");
                return result;
            });

            this._filteredByBlueness = this._list.createFiltered(filterBluenessOver192);

            this._sorted = this._list.createSorted(sortByNumberThenBlueness);
            this._sortedByBlueness = this._list.createSorted(sortByBlueness);
            this._sortedByFilteredBlueness = this._filteredByBlueness.createSorted(sortByBlueness);

            //We're binding the groupSorter's "this" to the list we're grouping
            this._groupedByDecades = this._list.createGrouped(decadeKey, decadeGroupData.bind(this._list));

            //Do the same grouping but sort the groups themselves in reverse order of the
            //group's item count. You can also use any other projection as the basis.
            this._groupedByDecadesSortedByCount =
                this._list.createGrouped(decadeKey, decadeGroupData.bind(this._list),
                    function (j, k) {
                        //j and k are keys as returned from decadeKey; k-j does reverse sort
                        var result = k - j;
                        WinJS.log && WinJS.log("sorting groups j = " + j.count+ ", k = " + k.count + ", result: " + result, "projections");
                        return result;
                    });
        },

    });


    //Sorting, grouping, and filtering functions
    function filterBluenessOver192(j) {
        var result = j.color.b > 192;
        WinJS.log && WinJS.log("filterBluenessOver192 j = " + j.color.b + ", result: " + result, "projections");
        return result;
    }

    function sortByNumberThenBlueness (j, k) {
        var result = j.number - k.number;

        //If the items' numbers are the same, sort by blueness as the second tier
        if (result == 0) {
            result = sortByBlueness(j, k)
        }

        WinJS.log && WinJS.log("sorting j = " + j.number + ", k = " + k.number + ", result: " + result, "projections");
        return result;
    }

    function sortByBlueness(j, k) {
        var result = j.color.b - k.color.b;
        WinJS.log && WinJS.log("sortByBlueness j = " + j.color.b + ", k = " + k.color.b + ", result: " + result, "projections");
        return result;
    }
    
    function decade(n) {
        return Math.floor(Math.floor(n / 10) * 10);
    }

    function decadeKey(j) {
        var result = decade(j.number);
        WinJS.log && WinJS.log("decadeKey for " + j.number + " = " + result, "projections");
        return result;
    }


    //"this" will be bound to the list that's being grouped
    function decadeGroupData(j) {
        //Make sure we have a List in this
        if (this == null || this.getAt == "undefined" || typeof this.getAt !== "function") {
            return;
        }

        var dec = decade(j.number);

        //Do a quick in-place filtering of the list so we can get the population of the decade.
        var decArray = this.filter(function (v) {
            var result = (decade(v.number) == dec);
            WinJS.log && WinJS.log("filter for grouping count j.number = " + j.number + ", v.number = " + v.number + ", result = " + result, "filter");
            return result;
        })

        return {
            decade: dec,
            name: dec.toString(),
            count: decArray.length
        }
    }



    function randInt(lower, upper) {
        var range = upper - lower;
        return Math.floor(Math.random() * range) + lower;
    }

    function randColor() {
        //For this test we'll just use blues so the sorting is visually meaningful.
        //Using 128-255 range so we can use black text
        return { r: 96, g: 96, b: randInt(128, 255) };
    }


    function randomizeList(list, num, lower, upper) {
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

    function outputList(element, list) {
        var str = "";        

        for (var i = 0; i < list.length; i++) {
            str += coloredNumber(list.getAt(i));
        }

        //Need this to preserve the inline style, and we know where the string came from
        WinJS.Utilities.setInnerHTMLUnsafe(element, str);
    }


    function outputGroups(element, groupList) {
        //Outputs the data returned from decadeGroupData

        var str = "";

        for (var i = 0; i < groupList.length; i++) {
            str += "&nbsp;&nbsp;&nbsp;&nbsp;" + JSON.stringify(groupList.getAt(i)) + "<br/>";
        }

        WinJS.Utilities.setInnerHTMLUnsafe(element, str);
    }

    function coloredNumber(item) {
        function rgb(color) { return "rgb(" + [color.r, color.g, color.b].join(",") + ")"; }

        var pad = item.number < 10 ? "0" : "";

        return "<span style='color: white; background-color: " + rgb(item.color) + ";'>" + pad + item.number + "</span>&nbsp";
    }
    
})();
