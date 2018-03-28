// Reset given jquery object for multi_select div
function resetCustomSelector(multi_select) {
    // Hide options
    multi_select.find('.multi_options').hide();

    // Uncheck everything
    multi_select.find('.multi_options input[type="checkbox"]').each(function (index) {
        $(this).prop('checked', false);
    });

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

// Remove '1' from selector text for given jquery object (multi_select div)
function decreaseCustomSelectorText(multi_select) {
    var option = multi_select.find('option'); // default option

    // Set selector text
    if (option.text() == "Select...") {
        return; // none selected
    } else {
        // Get currently selected quantity
        var quantity = option.text().substring(0, 1);

        if (quantity == 1) {
            option.text("Select..."); // none selected
        } else {
            option.text((quantity - 1) + ' selected'); // updated quantity
        }
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

    // iterate over links in corral
    multi_select.parent().next().find('.top_div .start_tag').each(function() {
        if (checked.indexOf($(this).text()) === -1) {
            // if link is not selected, hide it
            $(this).parents('.tag').hide();
        } else {
            // if link is selected, show it
            $(this).parents('.tag').show();
        }
    });
};

// Create given selector options for given jquery object (multi_select div)
function createCustomOptions(multi_select, options) {
    var multi_options = multi_select.find('.multi_options');

    multi_options.empty(); // remove options

    // iterate over this activity's given options
    for (var i = 0; i < options.length; i++) {
        // convert option index to text
        var value = slot_converter.id_to_text(options[i]);

        // add option to corresponding multi select
        var option = $('<label class="check_label">' +
                            '<input type="checkbox" value="' + value + '" />' +
                            '<span class="checkmark"></span>' + value +
                        '</label>');
        option.appendTo(multi_options);
        option.find('input[type="checkbox"]').prop('checked', true);
    }

    // update selector text
    updateCustomSelectorText(multi_select, options.length);

    // register event handler for custom click
    $('.f_activity .multi_options input[type="checkbox"]').on('click', function() {
        filterCustomSelectHandler($(this));
    });
}

var slot_converter; // add to scope


$(document).ready(function() {

    // time slot id to text lookup
    slot_converter = (function() {
        var id_to_text = {};
        var text_to_id = {};

        // create id to text, text to id maps
        $('.act_slot_selector').first().children().each(function (index) {
            var value = $(this).val();
            id_to_text[index + 1] = value;
            text_to_id[value] = index + 1;
        })

        // return the text at the given index
        return {
            id_to_text: function(index) {
                return id_to_text[index];
            },
            text_to_id: function(text) {
                return text_to_id[text];
            }
        }
    })();

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