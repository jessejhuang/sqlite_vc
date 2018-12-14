function populateDropdown(dropdownID, listOfItems, defaultValue, defaultText) {
    var $dropdown = $("#" + dropdownID);

    // Default option
    $dropdown.append($("<option />").val(defaultValue).text(defaultText));

    // Append filter options
    $.each(listOfItems, function() {
        $dropdown.append($("<option />").val(this).text(this));
    });
}
// EOF