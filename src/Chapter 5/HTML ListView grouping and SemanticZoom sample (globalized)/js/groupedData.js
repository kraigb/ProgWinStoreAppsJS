//// THIS CODE AND INFORMATION IS PROVIDED "AS IS" WITHOUT WARRANTY OF
//// ANY KIND, EITHER EXPRESSED OR IMPLIED, INCLUDING BUT NOT LIMITED TO
//// THE IMPLIED WARRANTIES OF MERCHANTABILITY AND/OR FITNESS FOR A
//// PARTICULAR PURPOSE.
////
//// Copyright (c) Microsoft Corporation. All rights reserved

// Data used in the ListView for the sample
var myList = new WinJS.Binding.List([
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
]);


//For globalized sort ordering.
var cg = Windows.Globalization.Collation.CharacterGroupings();

// Create a grouped list for the ListView from the item data and the grouping functions.
// Use compareGroups2 to see a two-level ordering.
var myGroupedList = myList.createGrouped(getGroupKey, getGroupData, compareGroups);

// Function used to sort the groups by first letter. This is a modification from the original
// sample to apply globalized sort order properly.
function compareGroups(left, right) {
    return groupCompareGlobalized(left, right);
}

function groupCompareGlobalized(left, right) {
    //Non-globalized: return left.toUpperCase().charCodeAt(0) - right.toUpperCase().charCodeAt(0);

    var charLeft = cg.lookup(left);
    var charRight = cg.lookup(right);

    // If both are under the same grouping character, treat as equal
    if (charLeft.localeCompare(charRight) == 0) {
        return 0;
    }

    // In different groups, we must rely on locale-sensitive sort order of items since the names
    // of the groups don't sort the same as the groups themselves for some locales.
    return left.localeCompare(right);
}


// Two-level group sorting function
function compareGroups2(left, right) {
    var leftLen = filteredLengthFromKey(left);
    var rightLen = filteredLengthFromKey(right);

    if (leftLen != rightLen) {
        return rightLen - leftLen;
    }

    return groupCompareGlobalized(left, right);
}

function filteredLengthFromKey(key) {
    var filteredList = myList.createFiltered(function (item) {
        return key == getGroupKey(item);
    });

    return filteredList.length;
}


// Function which returns the group key that an item belongs to. This is a modification from the original
// sample to apply globalized sort order properly.

function getGroupKey(dataItem) {
    //Non-globalized: dataItem.title.toUpperCase().charAt(0);    
    return cg.lookup(dataItem.title);
}

// Function which returns the data for a group. This is a modification from the original
// sample to apply globalized sort order properly. It's also modified the name of the group
// property from title to groupTitle so it's more clear in the declarative templates where
// this particular group data ends up.
function getGroupData(dataItem) {
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
