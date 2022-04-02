//// THIS CODE AND INFORMATION IS PROVIDED "AS IS" WITHOUT WARRANTY OF
//// ANY KIND, EITHER EXPRESSED OR IMPLIED, INCLUDING BUT NOT LIMITED TO
//// THE IMPLIED WARRANTIES OF MERCHANTABILITY AND/OR FITNESS FOR A
//// PARTICULAR PURPOSE.
////
//// Copyright (c) Microsoft Corporation. All rights reserved


itemInfo.supportedForProcessing = true;
groupInfo.supportedForProcessing = true;


// Enable cell spanning in ListView and specify
// the cellWidth and cellHeight for the items
function groupInfo() {
    return {
        enableCellSpanning: true,
        cellWidth: 155,
        cellHeight: 80
    };
}

var myData = new WinJS.Binding.List([
        { title: "Banana Blast", text: "Low-fat frozen yogurt", picture: "images/60Banana.png" },
        { title: "Banana Blast", text: "Low-fat frozen yogurt", picture: "images/60Banana.png" },
        { title: "Banana Blast", text: "Low-fat frozen yogurt", picture: "images/60Banana.png" },
        { title: "Banana Blast", text: "Low-fat frozen yogurt", picture: "images/60Banana.png" },
        { title: "Banana Blast", text: "Low-fat frozen yogurt", picture: "images/60Banana.png" },
        { title: "Lavish Lemon Ice", text: "Sorbet", picture: "images/60Lemon.png" },
        { title: "Lavish Lemon Ice", text: "Sorbet", picture: "images/60Lemon.png" },
        { title: "Lavish Lemon Ice", text: "Sorbet", picture: "images/60Lemon.png" },
        { title: "Lavish Lemon Ice", text: "Sorbet", picture: "images/60Lemon.png" },
        { title: "Lavish Lemon Ice", text: "Sorbet", picture: "images/60Lemon.png" },
        { title: "Marvelous Mint", text: "Gelato", picture: "images/60Mint.png" },
        { title: "Marvelous Mint", text: "Gelato", picture: "images/60Mint.png" },
        { title: "Marvelous Mint", text: "Gelato", picture: "images/60Mint.png" },
        { title: "Marvelous Mint", text: "Gelato", picture: "images/60Mint.png" },
        { title: "Marvelous Mint", text: "Gelato", picture: "images/60Mint.png" },
        { title: "Creamy Orange", text: "Sorbet", picture: "images/60Orange.png" },
        { title: "Creamy Orange", text: "Sorbet", picture: "images/60Orange.png" },
        { title: "Creamy Orange", text: "Sorbet", picture: "images/60Orange.png" },
        { title: "Creamy Orange", text: "Sorbet", picture: "images/60Orange.png" },
        { title: "Creamy Orange", text: "Sorbet", picture: "images/60Orange.png" },
        { title: "Succulent Strawberry", text: "Sorbet", picture: "images/60Strawberry.png" },
        { title: "Succulent Strawberry", text: "Sorbet", picture: "images/60Strawberry.png" },
        { title: "Succulent Strawberry", text: "Sorbet", picture: "images/60Strawberry.png" },
        { title: "Succulent Strawberry", text: "Sorbet", picture: "images/60Strawberry.png" },
        { title: "Succulent Strawberry", text: "Sorbet", picture: "images/60Strawberry.png" },
        { title: "Very Vanilla", text: "Ice Cream", picture: "images/60Vanilla.png" },
        { title: "Very Vanilla", text: "Ice Cream", picture: "images/60Vanilla.png" },
        { title: "Very Vanilla", text: "Ice Cream", picture: "images/60Vanilla.png" },
        { title: "Very Vanilla", text: "Ice Cream", picture: "images/60Vanilla.png" },
        { title: "Very Vanilla", text: "Ice Cream", picture: "images/60Vanilla.png" },
        { title: "Banana Blast", text: "Low-fat frozen yogurt", picture: "images/60Banana.png" },
        { title: "Banana Blast", text: "Low-fat frozen yogurt", picture: "images/60Banana.png" },
        { title: "Banana Blast", text: "Low-fat frozen yogurt", picture: "images/60Banana.png" },
        { title: "Banana Blast", text: "Low-fat frozen yogurt", picture: "images/60Banana.png" },
        { title: "Banana Blast", text: "Low-fat frozen yogurt", picture: "images/60Banana.png" },
        { title: "Lavish Lemon Ice", text: "Sorbet", picture: "images/60Lemon.png" },
        { title: "Lavish Lemon Ice", text: "Sorbet", picture: "images/60Lemon.png" },
        { title: "Lavish Lemon Ice", text: "Sorbet", picture: "images/60Lemon.png" },
        { title: "Lavish Lemon Ice", text: "Sorbet", picture: "images/60Lemon.png" },
        { title: "Lavish Lemon Ice", text: "Sorbet", picture: "images/60Lemon.png" },
        { title: "Marvelous Mint", text: "Gelato", picture: "images/60Mint.png" },
        { title: "Marvelous Mint", text: "Gelato", picture: "images/60Mint.png" },
        { title: "Marvelous Mint", text: "Gelato", picture: "images/60Mint.png" },
        { title: "Marvelous Mint", text: "Gelato", picture: "images/60Mint.png" },
        { title: "Marvelous Mint", text: "Gelato", picture: "images/60Mint.png" },
        { title: "Creamy Orange", text: "Sorbet", picture: "images/60Orange.png" },
        { title: "Creamy Orange", text: "Sorbet", picture: "images/60Orange.png" },
        { title: "Creamy Orange", text: "Sorbet", picture: "images/60Orange.png" },
        { title: "Creamy Orange", text: "Sorbet", picture: "images/60Orange.png" },
        { title: "Creamy Orange", text: "Sorbet", picture: "images/60Orange.png" },
        { title: "Succulent Strawberry", text: "Sorbet", picture: "images/60Strawberry.png" },
        { title: "Succulent Strawberry", text: "Sorbet", picture: "images/60Strawberry.png" },
        { title: "Succulent Strawberry", text: "Sorbet", picture: "images/60Strawberry.png" },
        { title: "Succulent Strawberry", text: "Sorbet", picture: "images/60Strawberry.png" },
        { title: "Succulent Strawberry", text: "Sorbet", picture: "images/60Strawberry.png" },
        { title: "Very Vanilla", text: "Ice Cream", picture: "images/60Vanilla.png" },
        { title: "Very Vanilla", text: "Ice Cream", picture: "images/60Vanilla.png" },
        { title: "Very Vanilla", text: "Ice Cream", picture: "images/60Vanilla.png" },
        { title: "Very Vanilla", text: "Ice Cream", picture: "images/60Vanilla.png" },
        { title: "Very Vanilla", text: "Ice Cream", picture: "images/60Vanilla.png" }
    ]);

function itemInfo(index) {
    //getItem(index).data retrieves the array item from a WinJS.Binding.List
    var item = myCellSpanningData.getItem(index).data;
    var width, height;

    switch (item.type) {
        case "smallListIconTextItem":
            width = 145;
            height = 70;
            break;

        case "mediumListIconTextItem":
            width = 310;
            height = 70;
            break;

        case "largeListIconTextItem":
            width = 310;
            height = 160;
            break;
    }

    return {
        //newColumn: false,
        //To show column breaking, uncomment this line and comment out the one above
        newColumn: (index == 6 || index == 14),   //Break on items 7 and 15 (index is 6 and 14)
        itemWidth: width,
        itemHeight: height
    };
}

var myCellSpanningData = new WinJS.Binding.List([
        { title: "Banana Blast", text: "1 Low-fat frozen yogurt", picture: "images/60Banana.png", type: "smallListIconTextItem" },
        { title: "Lavish Lemon Ice", text: "2 Sorbet", picture: "images/60Lemon.png", type: "mediumListIconTextItem" },
        { title: "Marvelous Mint", text: "3 Gelato", picture: "images/60Mint.png", type: "largeListIconTextItem" },
        { title: "Creamy Orange", text: "4 Sorbet", picture: "images/60Orange.png", type: "mediumListIconTextItem" },
        { title: "Succulent Strawberry", text: "5 Sorbet", picture: "images/60Strawberry.png", type: "smallListIconTextItem" },
        { title: "Very Vanilla", text: "6 Ice Cream", picture: "images/60Vanilla.png", type: "smallListIconTextItem" },
        { title: "Banana Blast", text: "7 Low-fat frozen yogurt", picture: "images/60Banana.png", type: "mediumListIconTextItem" },
        { title: "Lavish Lemon Ice", text: "8 Sorbet", picture: "images/60Lemon.png", type: "mediumListIconTextItem" },
        { title: "Marvelous Mint", text: "9 Gelato", picture: "images/60Mint.png", type: "smallListIconTextItem" },
        { title: "Creamy Orange", text: "10 Sorbet", picture: "images/60Orange.png", type: "smallListIconTextItem" },
        { title: "Succulent Strawberry", text: "11 Sorbet", picture: "images/60Strawberry.png", type: "smallListIconTextItem" },
        { title: "Very Vanilla", text: "12 Ice Cream", picture: "images/60Vanilla.png", type: "smallListIconTextItem" },
        { title: "Banana Blast", text: "13 Low-fat frozen yogurt", picture: "images/60Banana.png", type: "smallListIconTextItem" },
        { title: "Lavish Lemon Ice", text: "14 Sorbet", picture: "images/60Lemon.png", type: "smallListIconTextItem" },
        { title: "Marvelous Mint", text: "15 Gelato", picture: "images/60Mint.png", type: "mediumListIconTextItem" },
        { title: "Creamy Orange", text: "16 Sorbet", picture: "images/60Orange.png", type: "smallListIconTextItem" },
        { title: "Succulent Strawberry", text: "17 Sorbet", picture: "images/60Strawberry.png", type: "largeListIconTextItem" },
        { title: "Very Vanilla", text: "18 Ice Cream", picture: "images/60Vanilla.png", type: "mediumListIconTextItem" }
]);

var myDataWithRatings = new WinJS.Binding.List([
        { title: "Banana Blast", text: "Low-fat frozen yogurt", picture: "images/60Banana.png", rating: 3 },
        { title: "Lavish Lemon Ice", text: "Sorbet", picture: "images/60Lemon.png", rating: 1 },
        { title: "Marvelous Mint", text: "Gelato", picture: "images/60Mint.png", rating: 1 },
        { title: "Creamy Orange", text: "Sorbet", picture: "images/60Orange.png", rating: 2 },
        { title: "Succulent Strawberry", text: "Sorbet", picture: "images/60Strawberry.png", rating: 4 },
        { title: "Very Vanilla", text: "Ice Cream", picture: "images/60Vanilla.png", rating: 4 },
]);