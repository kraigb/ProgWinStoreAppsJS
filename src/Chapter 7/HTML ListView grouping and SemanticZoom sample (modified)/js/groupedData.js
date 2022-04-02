//// THIS CODE AND INFORMATION IS PROVIDED "AS IS" WITHOUT WARRANTY OF
//// ANY KIND, EITHER EXPRESSED OR IMPLIED, INCLUDING BUT NOT LIMITED TO
//// THE IMPLIED WARRANTIES OF MERCHANTABILITY AND/OR FITNESS FOR A
//// PARTICULAR PURPOSE.
////
//// Copyright (c) Microsoft Corporation. All rights reserved

// Data used in the ListView for the sample
var rawData = [
    { title: "Banana Blast", text: "Low-fat frozen yogurt", picture: "images/60Banana.png" },
    { title: "Banana Blast", text: "Low-fat frozen yogurt", picture: "images/60Banana.png" },
    { title: "Banana Blast", text: "Low-fat frozen yogurt", picture: "images/60Banana.png" },
    { title: "Banana Blast", text: "Low-fat frozen yogurt", picture: "images/60Banana.png" },
    { title: "Lavish Lemon Ice", text: "Sorbet", picture: "images/60Lemon.png" },
    { title: "Lavish Lemon Ice", text: "Sorbet", picture: "images/60Lemon.png" },
    { title: "Lavish Lemon Ice", text: "Sorbet", picture: "images/60Lemon.png" },
    { title: "Lavish Lemon Ice", text: "Sorbet", picture: "images/60Lemon.png" },
    { title: "Marvelous Mint", text: "Gelato", picture: "images/60Mint.png" },
    { title: "Marvelous Mint", text: "Gelato", picture: "images/60Mint.png" },
    { title: "Marvelous Mint", text: "Gelato", picture: "images/60Mint.png" },
    { title: "Marvelous Mint", text: "Gelato", picture: "images/60Mint.png" },
    { title: "Creamy Orange", text: "Sorbet", picture: "images/60Orange.png" },
    { title: "Creamy Orange", text: "Sorbet", picture: "images/60Orange.png" },
    { title: "Creamy Orange", text: "Sorbet", picture: "images/60Orange.png" },
    { title: "Creamy Orange", text: "Sorbet", picture: "images/60Orange.png" },
    { title: "Succulent Strawberry", text: "Sorbet", picture: "images/60Strawberry.png" },
    { title: "Succulent Strawberry", text: "Sorbet", picture: "images/60Strawberry.png" },
    { title: "Succulent Strawberry", text: "Sorbet", picture: "images/60Strawberry.png" },
    { title: "Succulent Strawberry", text: "Sorbet", picture: "images/60Strawberry.png" },
    { title: "Very Vanilla", text: "Ice Cream", picture: "images/60Vanilla.png" },
    { title: "Very Vanilla", text: "Ice Cream", picture: "images/60Vanilla.png" },
    { title: "Very Vanilla", text: "Ice Cream", picture: "images/60Vanilla.png" },
    { title: "Very Vanilla", text: "Ice Cream", picture: "images/60Vanilla.png" },
    { title: "Orangy Orange", text: "Sorbet", picture: "images/60Orange.png" },
    { title: "Orangy Orange", text: "Sorbet", picture: "images/60Orange.png" },
    { title: "Absolutely Orange", text: "Sorbet", picture: "images/60Orange.png" },
    { title: "Absolutely Orange", text: "Sorbet", picture: "images/60Orange.png" },
    { title: "Triple Strawberry", text: "Sorbet", picture: "images/60Strawberry.png" },
    { title: "Triple Strawberry", text: "Sorbet", picture: "images/60Strawberry.png" },
    { title: "Double Banana Blast", text: "Low-fat frozen yogurt", picture: "images/60Banana.png" },
    { title: "Double Banana Blast", text: "Low-fat frozen yogurt", picture: "images/60Banana.png" },
    { title: "Double Banana Blast", text: "Low-fat frozen yogurt", picture: "images/60Banana.png" },
    { title: "Green Mint", text: "Gelato", picture: "images/60Mint.png" }
];

// Sort the items in localized order so that the groups appear in the correct order.
// Use a sorted projection so that changes to the list are also sorted.

//Original code: won't respond to changes
//var sortedData = rawData.sort(function (left, right) {
//    return right.title.localeCompare(left.title);
//});

var baseList = new WinJS.Binding.List(rawData);

// Build a Binding.List to hold the sorted data.
var myList = baseList.createSorted(sorter);

function sorter (left, right) {
    return left.title.localeCompare(right.title);
}

// For globalized grouping data
var charGroups = Windows.Globalization.Collation.CharacterGroupings();

// Function which returns the group key that an item belongs to
function getGroupKey(dataItem) {

    // This sample uses globalization data to determine the grouping
    return charGroups.lookup(dataItem.title); // Ensure this always returns a string
}

// Function which returns the data for a group
function getGroupData(dataItem) {
    // In this case, just use the group key
    var key = getGroupKey(dataItem);

    //Obtain a filtered projection of our list, checking for matching keys
    var filteredList = myList.createFiltered(function (item) {
        return key == getGroupKey(item);
    });

    return {
        groupTitle: key,
        count: filteredList.length
    };
}

function groupSorter(left, right) {
    var charLeft = getGroupKey(left);
    var charRight = getGroupKey(right);

    // If both are under the same grouping character, treat as equal
    if (charLeft.localeCompare(charRight) == 0) {
        console.log(left.localeCompare(right));
        return 0;
    }

    // In different groups, we must rely on locale-sensitive sort order of items since the names
    // of the groups don't sort the same as the groups themselves for some locales.
    return left.localeCompare(right);
}

// Create a grouped list for the ListView from the item data and the grouping functions
var myGroupedList = myList.createGrouped(getGroupKey, getGroupData, groupSorter);
