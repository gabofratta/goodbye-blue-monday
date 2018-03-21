
// Clear selections from given jquery object for multi_select div
function clearSelections(multi_select) {
    multi_select.find('.multi_options input[type="checkbox"]').each(function (index) {
        $(this).prop('checked', false);
    });

    multi_select.find('.multi_options').hide();
}

// Get all options for the given jquery object for multi_select div
function getAllOptions(multi_select) {
    var options = [];

    multi_select.find('.multi_options input[type="checkbox"]').each(function (index) {
        options.push($(this).val());
    });

    return options;
}

// Get selected options for the given jquery object for multi_select div
function getSelected(multi_select) {
    var checked = [];

    multi_select.find('.multi_options input[type="checkbox"]').each(function (index) {
        if ($(this).is(':checked')) {
            checked.push($(this).val());
        }
    });

    return checked;
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

            if (options_size > space_below) {
                multi_options.css("top", "-" + options_size + "px");
            } else {
                multi_options.css("top", "");
            }

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

    // Set text area value to checked boxes
    $('.multi_options input[type="checkbox"]').on('click', function() {
        var text = "";
        var options =  $(this).parent().parent();

        options.find('input[type="checkbox"]').each(function (index) {
            if ($(this).is(':checked')) {
                text += $(this).val() + '\n';
            }
        });

        text = text.substring(0, text.length - 1);
        options.parent().parent().next().find('.selected_slots').val(text);
    });

});