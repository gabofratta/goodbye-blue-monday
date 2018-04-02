// Reset given jquery object for multi_select div
function resetCustomSelector(multi_select) {
    // Hide options
    multi_select.find('.multi_options').hide();

    // Uncheck everything
    multi_select.find('.multi_options input[type="checkbox"]').prop('checked', false);

    // Reset default option text
    multi_select.find('option').text('Select...');
}

// Set checked checkboxes for given jquery object (multi_select div) and list of selections
function setCustomSelections(multi_select, selections) {
    // iterate over all checkboxes, and check if it's in selections
    multi_select.find('.multi_options input[type="checkbox"]').each(function (index) {
        var index_of = jQuery.inArray($(this).val(), selections); // -1 if not in list
        var is_checked = (index_of !== -1);
        $(this).prop('checked', is_checked);
    });

    // update selector text
    updateCustomSelectorText(multi_select, selections.length);
}

// Update selector text for given jquery object (multi_select div) and selection count
function updateCustomSelectorText(multi_select, selections) {
    var option = multi_select.find('option'); // default option

    // Set selector text
    if (selections == 0) {
        option.text('Select...'); // none selected
    } else {
        option.text(selections + ' selected'); // show selection count
    }
}

// Handle checkbox toggle in filter pane
function filterCustomSelectHandler(checkbox) {
    var checked = [];
    var options = checkbox.parent().parent();
    var multi_select = options.parent();

    // Gather selected options
    options.find('input[type="checkbox"]').each(function (index) {
        if ($(this).is(':checked')) {
            checked.push($(this).val());
        }
    });

    // update selector text
    updateCustomSelectorText(multi_select, checked.length);

    // Update mobile select
    multi_select.next('.f_act_slot_selector').val(checked);

    // update links in corral
    setCorralValues(multi_select.parent().next(), checked);
};

// Create given selector options for given jquery object (multi_select div)
// all options except given unselected (if any) will be selected by default
function createCustomOptions(multi_select, options, unselected = []) {
    var multi_options = multi_select.find('.multi_options');

    multi_options.empty(); // remove options

    // iterate over this activity's given options
    for (var i = 0; i < options.length; i++) {
        // add option to corresponding multi select
        var option = $('<label class="check_label">' +
                            '<input type="checkbox" value="' + options[i] + '" />' +
                            '<span class="checkmark"></span>' + options[i] +
                        '</label>');
        option.appendTo(multi_options);

        // if not in unselected array, check by default
        if (unselected.indexOf(options[i]) === -1) {
            option.find('input[type="checkbox"]').prop('checked', true);
        }
    }

    // update selector text
    updateCustomSelectorText(multi_select, options.length - unselected.length);

    // register event handler for custom click
    $('.f_activity .multi_options input[type="checkbox"]').on('click', function() {
        filterCustomSelectHandler($(this));
    });
}

// update displayed links in filter pane corral
function setCorralValues(corral, values) {
    corral.find('.top_div .start_tag').each(function() {
        if (values.indexOf($(this).text()) === -1) {
            // if link is not selected, hide it
            $(this).parents('.tag').animate({width:'hide'});
        } else {
            // if link is selected, show it
            $(this).parents('.tag').animate({width:'show'});
        }
    });
}


$(document).ready(function() {

    // Open/close options 
    $('.select_box').on('click', function() {
        var multi_options = $(this).parent().find('.multi_options');

        // If hidden, close all then open this one
        if (!multi_options.is(':visible')) {
            // Close all open custom widgets
            $('.multi_options').hide();

            // Calculate space on screen below element and space needed
            var space_below = $(window).height() - $(this)[0].getBoundingClientRect().bottom;
            var options_size = multi_options.css("height");
            options_size = options_size.substring(0, options_size.length - 2);

            // Open options div on top if it doesn't fit below
            if (options_size > space_below) {
                multi_options.css("top", "-" + options_size + "px");
            } else {
                multi_options.css("top", "");
            }

            // Scroll to top of options div, open it
            setTimeout(function() {
                multi_options.scrollTop(0);
            }, 0);
            multi_options.show();
        } else {
            // If open, close all custom widgets
            $('.multi_options').hide();
        }
    });

    // Close options on click away
    $(document).bind('click', function(e) {
        var clicked = $(e.target);
        if (!clicked.parents().hasClass('multi_select')) {
            $('.multi_options').hide();
        }
    });

    // Handle checkbox toggle in acitivity form
    $('.activity .multi_options input[type="checkbox"]').on('click', function() {
        var checked = [];
        var options = $(this).parent().parent();
        var multi_select = options.parent();

        // Get selected options
        options.find('input[type="checkbox"]').each(function (index) {
            if ($(this).is(':checked')) {
                checked.push($(this).val());
            }
        });

        // Set text area value
        multi_select.parent().next().find('.selected_slots').val(checked.join('\n'));

        // update selector text
        updateCustomSelectorText(multi_select, checked.length);

        // Update mobile select
        multi_select.next('.act_slot_selector').val(checked);
    });

});