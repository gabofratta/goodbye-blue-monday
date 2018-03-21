
// Reset given jquery object for multi_select div
function resetSelector(multi_select) {
    // Uncheck everything
    multi_select.find('.multi_options input[type="checkbox"]').each(function (index) {
        $(this).prop('checked', false);
    });

    // Hide options
    multi_select.find('.multi_options').hide();

    // Reset option text
    multi_select.find('option').text('Select...');
}

// Set checked checkboxes for given jquery object (multi_select div) and list of selections
function setSelections(multi_select, selections) {
    multi_select.find('.multi_options input[type="checkbox"]').each(function (index) {
        var index = jQuery.inArray($(this).val(), selections); // -1 if not in list
        var checked = (index !== -1); // true if in list, else false
        $(this).prop('checked', checked);
    });

    // update selector text
    updateSelectorText(multi_select, selections);
}

// Update selector text for given jquery object (multi_select div) and list of selections
function updateSelectorText(multi_select, selections) {
    var option = multi_select.find('option');

    // Set selector text
    if (selections.length == 0) {
        option.text('Select...');
    } else {
        option.text(selections.length + ' selected');
    }
}


$(document).ready(function() {

    // Open/close options 
    $('.select_box').on('click', function() {
        var multi_options = $(this).parent().find('.multi_options');
        var all_multi_options = $('.multi_options');

        // If hidden, close all then open this one
        if (!multi_options.is(':visible')) {
            all_multi_options.hide();

            // Calculate space on screen below element and space needed
            var space_below = $(window).height() - $(this)[0].getBoundingClientRect().bottom;
            var options_size = all_multi_options.css("max-height");
            options_size = options_size.substring(0, options_size.length - 2);

            // Open options div on top if it doesn't fit below
            if (options_size > space_below) {
                multi_options.css("top", "-" + options_size + "px");
            } else {
                multi_options.css("top", "");
            }

            // Scroll to top of options div
            setTimeout(function() {multi_options.scrollTop(0);}, 0);
            multi_options.show();
        } else {
            // If visible, close all
            all_multi_options.hide();
        }
    });

    // Close options on click away
    $(document).bind('click', function(e) {
        var clicked = $(e.target);
        if (!clicked.parents().hasClass('multi_select')) {
            $('.multi_options').hide();
        }
    });

    // Handle checkbox toggle
    $('.multi_options input[type="checkbox"]').on('click', function() {
        var checked = [];
        var options = $(this).parent().parent();
        var multi_select = options.parent();

        // Gather selected options
        options.find('input[type="checkbox"]').each(function (index) {
            if ($(this).is(':checked')) {
                checked.push($(this).val());
            }
        });

        // Set text area value
        multi_select.parent().next().find('.selected_slots').val(checked.join('\n'));

        // update selector text
        updateSelectorText(multi_select, checked);

        // Update mobile select
        multi_select.next('.act_slot_selector').val(checked);
    });

});