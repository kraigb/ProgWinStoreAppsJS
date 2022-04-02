(function () {
    "use strict";

    WinJS.Namespace.define("Controls", {
        Calendar : WinJS.Class.define(
            // constructor
            function (element, options) {
                this.element = element || document.createElement("div");
                this.element.className = "control-calendar";
                this.element.winControl = this;
                WinJS.Utilities.addClass(this.element, "win-disposable");
                this._disposed = false;

                this._cal = new Windows.Globalization.Calendar();
                this._cells = [];

                // header (prev, label, next)
                this._header = document.createElement("div");
                this._header.className = "header"

                // inline encoded values are stripped when just setting innerHTML directly
                WinJS.Utilities.setInnerHTMLUnsafe(this._header, "<button class='prev'>&#x25C0</button><p class='label'></p><button class='next'>&#x25B6</button>");
                this.element.appendChild(this._header);
                                    
                this._prevListener = function () {
                    this.prevMonth();
                };

                this._nextListener = function () {
                    this.nextMonth();
                };

                this.element.querySelector(".prev").addEventListener("click", this._prevListener.bind(this));
                this.element.querySelector(".next").addEventListener("click", this._nextListener.bind(this));

                // body
                
                this._cellClickListener = function (e) {
                    this.dispatchEvent("dateselected", e.srcElement._date);
                };

                var days = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
                this._body = document.createElement("div");
                this._body.className = "body"
                for (var row = 0 ; row < 7 ; row++) {
                    for (var col = 0 ; col < 7 ; col++) {

                        var cell = document.createElement("div");
                        cell.style.msGridColumn = col + 1;
                        cell.style.msGridRow = row + 1;

                        if (row === 0) {
                            cell.innerText = days[col];
                            WinJS.Utilities.addClass(cell, "daylabel");
                        } else {
                            this._cells.push(cell);
                            WinJS.Utilities.addClass(cell, "cell");
                            cell.addEventListener("click", this._cellClickListener.bind(this));
                        }
                        if (col === 0) {
                            WinJS.Utilities.addClass(cell, "sunday");
                        }
                        this._body.appendChild(cell);
                    }
                }
                this.element.appendChild(this._body);

                if (options) {
                    WinJS.UI.setOptions(this, options);
                }

                this._update();
            }, {
                // methods
                _setClass: function (condition, element, className) {
                    if (condition) {
                        WinJS.Utilities.addClass(element, className);
                    } else {
                        WinJS.Utilities.removeClass(element, className);
                    }
                },

                _update: function () {
                    var today = new Windows.Globalization.Calendar();
                    today.setDateTime(new Date());

                    var cal = this._cal;
                    var thisMonth = cal.month;

                    cal.day = 1;
                    cal.addDays(-cal.dayOfWeek);
                    for (var i = 0 ; i < this._cells.length ; i++) {
                        this._cells[i].innerText = cal.day;
                        this._cells[i]._date = { year: cal.year, month: cal.month, day: cal.day };
                        this._setClass((cal.month !== thisMonth), this._cells[i], "otherMonth");
                        this._setClass((cal.month === thisMonth), this._cells[i], "thisMonth");
                        this._setClass((cal.year === today.year &&
                            cal.month === today.month &&
                            cal.day === today.day), this._cells[i], "today");
                        cal.addDays(1);
                    }

                    cal.month = thisMonth;
                    this.element.querySelector("p.label").innerText = cal.yearAsString() + " " + cal.monthAsString();
                },

                dispose: function () {
                    //Prevent reentrancy if we're already disposed
                    if (this._disposed) {
                        return;
                    }

                    this._disposed = true;

                    //Clear out any other WinJS controls contained in us
                    WinJS.Utilities.disposeSubTree(this.element);

                    //Now just reverse the constructor's steps and any other allocations
                    this._cal = null;

                    var prev = this.element.querySelector(".prev");
                    prev && prev.removeEventListener("click", this._prevListener);

                    var next = this.element.querySelector(".next");
                    next && next.removeEventListener("click", this._nextListener);

                    this.element.removeChild(this._header);

                    var that = this;
                    this._cells.forEach(function (cell) {
                        cell.removeEventListener("click", that._cellClickListener);
                        that._body.removeChild(cell);
                    });

                    this._cells = null;
                    this.element.removeChild(this._body);
                },

                nextMonth: function () {
                    this._cal.addMonths(1);
                    this._update();
                },

                prevMonth: function () {
                    this._cal.addMonths(-1);
                    this._update();
                },

                year: {
                    set: function (value) {
                        this._cal.year = value;
                        this._update();
                    }
                },

                month: {
                    set: function (value) {
                        this._cal.month = value;
                        this._update();
                    }
                },

                date: {
                    set: function (value) {
                        this._cal.date = value;
                        this._update();
                    }
                }
            })
    })

    WinJS.Class.mix(Controls.Calendar, WinJS.Utilities.createEventProperties("dateselected"));
    WinJS.Class.mix(Controls.Calendar, WinJS.UI.DOMEventMixin);
})();