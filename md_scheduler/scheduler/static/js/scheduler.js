// turn a variable into a state representing flag
function makeStateFlag() {
    var value = false;
    return {
        in_progress: function() {
            return value;
        },
        start: function () {
            value = true;
        },
        stop: function() {
            value = false;
        }
    };
}

// turn variable into converter between slot text and id, both ways
function makeSlotConverter() {
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
        },
        get_end_slot: function(text, length) {
            return id_to_text[text_to_id[text] + length - 1];
        }
    }
}

// build an itineraries object
function buildItineraries(data) {
    var count = data.size;
    var index = 0;
    var itineraries = data.itineraries;

    var filtered_count = count;
    var filtered_itineraries = [];

    // array of activity names
    var activity_names = [];
    // map of start slots for each activity name
    var activity_slots = {};
    // map of length for each activity name
    var activity_lengths = {};
    // map of activity name to start slots to itineraries in which they are used
    var activity_slot_itineraries = {};

    // iterate over itineraries
    for (var i = 0; i < count; i++) {
        
        // iterate over activities
        for (var j = 0; j < itineraries[i].length; j++) {
            var activity = itineraries[i][j];

            // if new activity, initialize objects/arrays
            if (activity_slots[activity.name] === undefined) {
                activity_names.push(activity.name);
                activity_slots[activity.name] = [];
                activity_lengths[activity.name] = activity.length;
                activity_slot_itineraries[activity.name] = {};
            }

            // if new slot, initialize objects/arrays
            if (activity_slot_itineraries[activity.name][activity.slots[0]] === undefined) {
                activity_slot_itineraries[activity.name][activity.slots[0]] = [i];
                activity_slots[activity.name].push(activity.slots[0]);
            } else {
                activity_slot_itineraries[activity.name][activity.slots[0]].push(i);
            }
        }

        // if last itinerary, sort slots for every activity
        if (i == (count - 1)) {
            activity_slots[activity.name].sort(function(a, b) { return a - b; });
        }
    }

    filtered_itineraries = deepCopy(itineraries); // initially, no filter

    return {
        get_count: function() {
            return filtered_count;
        },
        get_unfiltered_count: function() {
            return count;
        },
        get_index: function() {
            return index;
        },
        next: function() {
            index = (index + 1) % filtered_count;
            return index;
        },
        prev: function() {
            if (index == 0) {
                index = filtered_count - 1;
            } else {
                index--;
            }
            return index;
        },
        get_activities: function() {
            return deepCopy(filtered_itineraries[index]);
        },
        reset_filter: function() {
            filtered_itineraries = deepCopy(itineraries);
            filtered_count = count;
            index = 0;
        },
        filter_out: function(remove_list) {
            // sort itinerary ids
            remove_list.sort(function(a, b) { return a - b; });

            // remove itinerary ids from back to front, so that there is no rolling
            for (var i = (remove_list.length - 1); i >= 0; i--) {
                filtered_itineraries.splice(remove_list[i], 1);
            }

            filtered_count = filtered_itineraries.length; // update count
        },
        is_filtered: function() {
            return (filtered_count !== count);
        },
        get_activity_count: function() {
            return activity_names.length;
        },
        get_activity_length: function(activity_name) {
            return activity_lengths[activity_name];
        },
        get_activity_slots: function(activity_name) {
            return activity_slots[activity_name].slice();
        },
        get_activity_names: function() {
            return activity_names.slice();
        },
        get_itineraries_for: function(activity_name, slot) {
            return activity_slot_itineraries[activity_name][slot].slice();
        }
    };
}

// return a deep copy of the given object
function deepCopy(object) {
    return JSON.parse(JSON.stringify(object));
}


$(document).ready(function() {


    //////////////////////////////
    ////////// Globals ///////////
    //////////////////////////////


    // hammer element on schedule table for mobile swipe events
    var hammer = new Hammer(document.getElementById('schedule'), {});

    var importing = makeStateFlag(); // importing activities flag
    var generating = makeStateFlag(); // generating schedule flag
    var filtering = makeStateFlag(); // filtering schedule flag

    // itineraries object, always check count before using
    var itineraries = buildItineraries({"size" : 0, "itineraries" : []});

    // time slot id to text lookup
    var slot_converter = makeSlotConverter();

    // page settings
    var weeks_per_row = 12;
    var weeks_per_month = 4;
    var activity_name_length = 25;
    var default_colors = [["RED", "WHITE"], ["BLUE", "WHITE"], ["PURPLE", "WHITE"],
                          ["GREEN", "WHITE"], ["GRAY", "WHITE"], ["#aa6e28", "WHITE"],
                          ["NAVY", "WHITE"], ["MAROON", "WHITE"], ["OLIVE", "WHITE"],
                          ["TEAL", "WHITE"], ["BLACK", "WHITE"], ["YELLOW", "BLACK"],
                          ["LIME", "BLACK"], ["AQUA", "BLACK"], ["FUCHSIA", "BLACK"],
                          ["ORANGE", "BLACK"], ["PINK", "BLACK"], ["SILVER", "BLACK"]];

    $('#filter_contents').hide(); // to allow initial fade in


    /////////////////////////////////////
    ////////// Event handlers ///////////
    /////////////////////////////////////


    ///////// User navigation /////////

    // set current state to page history
    history.replaceState({"data" : {"size" : 0, "activities" : []}}, '', '');

    // listen on user click back, fwd buttons
    window.addEventListener("popstate", function(e) {
        // close custom select
        $('.multi_options').hide();

        // get state
        var state = e.state;

        // dismiss alerts
        $('.alert').fadeOut();

        // if there is a previous state
        if (state !== null) {
            // if any activities
            if (state.data.size > 0) {
                // set activities and generate itineraries
                generateActivities(state.data);
                generatePrograms(true, state.data);
            } else {
                // clear activities and itinerary
                resetActivities();
                itineraries = buildItineraries({"size" : 0, "itineraries" : []});
                showItinerary(false);
            }
        }

        return false;
    });


    ////////// Alerts ////////////


    // dismiss alert
    $('.close_alert').click(function () {
        // close custom select
        $('.multi_options').hide();

        // dismiss alert
        $(this).closest('.alert').fadeOut();

        return false;
    });


    ////////// Navigate schedules ////////////


    // swipe right on schedule table
    hammer.on('swiperight', function() {
        // close custom select
        $('.multi_options').hide();

        // If no schedules, do nothing
        if (itineraries.get_count() == 0) {
            return false;
        }

        // Decrease itinerary index w/ loop around
        itineraries.prev();

        // Show new itinerary
        showItinerary(true);

        return false;
    });

    // swipe left on schedule table
    hammer.on('swipeleft', function() {
        // close custom select
        $('.multi_options').hide();

        // Show error if no schedules
        if (itineraries.get_count() == 0) {
            return false;
        }

        // Increase itinerary index w/ loop around
        itineraries.next();

        // Show new itinerary
        showItinerary(true);

        return false;
    });

    $('.prev_program').click(function () {
        // close custom select
        $('.multi_options').hide();

        // Show error if no schedules
        if (itineraries.get_count() == 0) {
            setAlert('.alert-danger', "No schedules available.");
            return false;
        }

        // Decrease itinerary index w/ loop around
        itineraries.prev();

        // Show new itinerary
        showItinerary(true);

        return false;
    });

    $('.next_program').click(function () {
        // close custom select
        $('.multi_options').hide();

        // Show error if no schedules
        if (itineraries.get_count() == 0) {
            setAlert('.alert-danger', "No schedules available.");
            return false;
        }

        // Increase itinerary index w/ loop around
        itineraries.next();

        // Show new itinerary
        showItinerary(true);

        return false;
    });


    ////////// Copy schedule /////////////


    $('.copy_program').click(function () {
        // close custom select
        $('.multi_options').hide();

        // Show error if no schedules
        if (itineraries.get_count() == 0) {
            setAlert('.alert-danger', "No schedules available.");
            return false;
        }

        // Build program text
        var text = "";
        var activities = itineraries.get_activities();

        // For each activity
        for (var j = 0; j < activities.length; j++) {
            var line = activities[j].code + " - " + activities[j].name + " - " + activities[j].category + ": ";

            // For each slot
            for (var k = 0; k < activities[j].slots.length; k++) {
                var week = slot_converter.id_to_text(activities[j].slots[k]);
                line += (week + ", ");
            }

            text += (line.substring(0, line.length - 2) + "\n");
        }

        // Copy text to clipboard
        copyToClipboard(text);

        // Show success alert
        setAlert('.alert-success', "Schedule copied to clipboard.");

        return false;
    });


    /////////// Import - export ///////////


    // export activities in form
    $('#export_acts').click(function () {
        // close custom select
        $('.multi_options').hide();

        // get and validate activity info
        var export_val = getAndValidateActivities();

        // download text file, if data is valid
        if (export_val.size > 0) {
            download("ms4planner_activities.txt", JSON.stringify(export_val));
            setAlert('.alert-success', "Activities exported successfully.");
        }

        return false;
    });

    // import activities from file
    $('#import_acts').click(function () {
        // close custom select
        $('.multi_options').hide();

        // call hidden file uploader
        $('#file_input').click();

        return false;
    });

    // hidden file uploader activation
    $('#file_input').change(function () {
        // prevent double hit
        if (importing.in_progress()) {
            return false;
        }
        importing.start();

        // check if browser supports FileReader
        if (!(window.File && window.FileReader && window.FileList && window.Blob)) {
            setAlert('.alert-danger', "Your browser does not support this feature.");
            $(this).val('');
            importing.stop();
            return false;
        }

        // get file object
        var file = $(this)[0].files[0];

        // no file selected
        if (file == undefined) {
            $(this).val('');
            importing.stop();
            return false;
        }

        // check that file is .txt
        if (file.type != 'text/plain') {
            setAlert('.alert-danger', "Invalid file type. Expecting a text file.");
            $(this).val('');
            importing.stop();
            return false;
        }

        // check file size
        if (file.size = 0 || file.size > 2000) {
            setAlert('.alert-danger', "Invalid file size.");
            $(this).val('');
            importing.stop();
            return false;
        }

        // create FileReader object
        var reader = new FileReader();
        reader.onload = (function (reader) {
            return function () {
                // show loading overlay after 0.5 sec
                var loadingTO = setTimeout(function() {
                    $('.loading').removeClass('hidden');
                }, 500);

                try {
                    // copy activities onto web page
                    var contents = JSON.parse(reader.result);
                    generateActivities(contents);
                    setAlert('.alert-success', "Activities imported successfully.");
                } catch (ex) {
                    // reset activity pane, alert error
                    resetActivities();
                    setAlert('.alert-danger', "There was something wrong with the imported file.");
                } finally {
                    hideLoader(loadingTO);
                    importing.stop();
                }
            }
        })(reader);

        // read file and clear form
        reader.readAsText(file);
        $(this).val('');
        return false;
    });


    //////////// Activity form //////////////


    // mobile multi-select options changed
    $('.act_slot_selector').change(function() {
        var value = $(this).val();
        var parent = $(this).parent();

        // display selected slots for each activity
        parent.next().find('.selected_slots').val(value.join("\n"));

        // update custom selector
        setCustomSelections(parent.find('.multi_select'), value);
    }); 

    $('#add_activity').click(function () {
        // close custom select
        $('.multi_options').hide();

        // add a new acitivity
        addActivity(1);

        return false;
    });    

    $('.remove_activity').click(function () {
        // close custom select
        $('.multi_options').hide();

        // check if only one activity line will be left
        var one_left = ($('.activity').length == 2);

        // remove current activity line smoothly
        removeActivity($(this).closest('.activity'), one_left);

        return false;
    });


    /////////// Filter schedules ////////////


    // opens filtering widget for schedules
    $('.filter_program').click(function () {
         // close custom select
        $('.multi_options').hide();

        // Show error if no schedules
        if (itineraries.get_unfiltered_count() == 0) {
            setAlert('.alert-danger', "No schedules available.");
            return false;
        }

        // dismiss alerts
        $('.alert').fadeOut();

        // show filter pane
        $('#filter_pane').css("width", "100%");
        $('#filter_contents').fadeIn(1250);

        // prevent scroll and page jump
        var scroll_width = window.innerWidth - $(document).width();
        $('body').css({"overflow" : "hidden", "margin-right" : scroll_width + "px"});
        $('nav').css({"left" : -scroll_width + "px"});

        return false;
    });

    // closes filtering widget for schedules
    $('#close_filter').click(function () {
        // close custom select
        $('.multi_options').hide();

        // hide filter pane
        closeFilterPane();

        return false;
    });

    // handle select change in filter pane
    $('.f_act_slot_selector').change(function() {
        var value = $(this).val();
        var parent = $(this).parent();

        // update custom selector
        setCustomSelections(parent.find('.multi_select'), value);

        // update links in corral
        setCorralValues(parent.next(), value);
    });

    // select all available time slots
    $('.f_add_all').click(function () {
        // close custom select
        $('.multi_options').hide();

        // show all tags
        $(this).parent().prev().find('.tag').fadeIn(300);
        
        // get line
        var line = $(this).parents('.f_activity');

        // select all in mobile select
        line.find('.f_act_slot_selector option').prop('selected', true);

        // check all in custom select
        var selections = line.find('.f_act_slot_selector').val();
        setCustomSelections(line.find('.multi_select'), selections);

        return false;
    });

    // unselect all available time slots
    $('.f_remove_all').click(function () {
        // close custom select
        $('.multi_options').hide();

        // hide all tags
        $(this).parent().prev().find('.tag').fadeOut(300);
        
        // get line
        var line = $(this).parents('.f_activity');

        // clear custom select
        resetCustomSelector(line.find('.multi_select'));

        // clear mobile select
        line.find('.f_act_slot_selector').val([]);

        return false;
    });

    // apply selected filters to the schedules
    $('#apply_filter').click(function () {
        // close custom select
        $('.multi_options').hide();

        // prevent double click
        if (filtering.in_progress()) {
            return false;
        }
        filtering.start();

        // show loading overlay
        $('.loading').removeClass('hidden');

        itineraries.reset_filter(); // reset filter
        var remove_list = [];
        var remove_map = {};
        
        // for each activity
        $('.f_activity').each(function (index) {
            var unselected = $(this).find('.f_act_slot_selector option:not(:selected)');
            var activity = $(this).find('.f_act_name').text();
            
            // for each unselected slot
            unselected.each(function (i) {
                var slot_id = slot_converter.text_to_id($(this).val());
                var itinerary_ids = itineraries.get_itineraries_for(activity, slot_id);
                
                // for each pertinent itinerary
                for (var i = 0; i < itinerary_ids.length; i++) {
                    // if itinerary not set for removal, set it now
                    if (remove_map[itinerary_ids[i]] === undefined) {
                        remove_map[itinerary_ids[i]] = true;
                        remove_list.push(itinerary_ids[i]);
                    }
                }
            });
        });

        itineraries.filter_out(remove_list); // filter itineraries
        showItinerary(false); // update schedule table

        // hide loader
        $('.loading').addClass('hidden');

        // hide filter pane
        closeFilterPane();

        // success message
        setAlert('.alert-success', "Schedules filtered successfully.");

        filtering.stop();
        return false;
    });

    
    ////////// Generate Schedules ///////////


    // Generate possible itineraries for the activities in the form
    $('#generate').click(function () {
        // close custom select
        $('.multi_options').hide();

        // only run query once
        if (generating.in_progress()) {
            return false;
        }
        generating.start();

        // generate programs in backend
        generatePrograms(false, {"size" : 0});

        return false;
    });


    ///////////////////////////////
    ////////// Helpers ////////////
    ///////////////////////////////


    ////////// Generate Schedules ///////////


    // Generate possible itineraries for the given activities. If none given,
    // use activities in the form. The is_trigger argument indicates whether user
    // click or programatic call.
    function generatePrograms(is_trigger, activities) {
        // dismiss alerts
        $('.alert-success').fadeOut();

        // reset itineraries
        itineraries = buildItineraries({"size" : 0, "itineraries" : []});

        // reset program panel
        $('.program_index').html('&nbsp;');

        // reset schedule table
        $('#schedule').find('.activity_display').text('')
                                                .hide();

        // get and validate activity info
        if (activities.size === 0) {
            var form_val = getAndValidateActivities();
        } else {
            // use given activities (from history)
            form_val = activities;
        }

        // if data is valid
        if (form_val.size > 0) {
            // dismiss alert
            $('.alert-danger').fadeOut();

            // show loading overlay after 0.3 secs
            var loadingTO = setTimeout(function() {
                $('.loading').removeClass('hidden');
            }, 300);

            // Add current state to page history
            if (!is_trigger) {
                history.pushState({"data" : form_val}, '', '');
            }

            // ajax post request
            $.ajax({
                url: "/ajax/generate_programs",
                type: "POST",
                data: JSON.stringify(form_val),
                dataType: 'json',
                success: function(data, status) {
                    // Show error if success is False
                    if (!data.success) {
                        hideLoader(loadingTO);
                        setAlert('.alert-danger', "Fatal error: " + data.error);
                        generating.stop();
                        return;
                    }

                    // Show error if no viable programs
                    if (data.size <= 0) {
                        hideLoader(loadingTO);
                        setAlert('.alert-danger', "No schedules meet your requirements.");
                        generating.stop();
                        return;
                    }

                    // Set global itineraries
                    itineraries = buildItineraries(data);

                    // Fill filter pane
                    fillFilterPane();

                    // Show first itinerary
                    showItinerary(false);

                    // Hide loader
                    hideLoader(loadingTO);

                    // Show success alert
                    setAlert('.alert-success', "Your schedule options are ready.");
                    generating.stop();
                },
                error: function(xhr, errmsg, err) {
                    hideLoader(loadingTO);
                    setAlert('.alert-danger', "Unexpected error. Reload the page and try again.");
                    generating.stop();
                    console.log(err);
                }
            });
        } else {
            generating.stop();
        }
    }


    /////////// Loader ////////////


    // hide loading screen
    function hideLoader(loadingTO) {
        clearTimeout(loadingTO);
        $('.loading').addClass('hidden');           
    }


    /////////// Alerts ////////////


    // create sticky alert
    function setAlert(id, msg) {
        var alert = $(id);

        // fade out other alert type
        if (id == '.alert-danger') {
            $('.alert-success').fadeOut();
        } else {
            $('.alert-danger').fadeOut();
        }

        // fade out this alert type, if already present
        alert.fadeOut(100, function() {
            // set alert text and fade in
            alert.find("strong").text(msg);
            alert.fadeIn();
        });
    }


    ///////////// Activity form ////////////


    // create as many new activity lines as the given count. Count >= 1.
    function addActivity(count) {
        // clone an activity line
        var activity_lines = $('.activity');
        var last_activity = activity_lines.last();
        var new_activity = last_activity.clone(true);
        var activities = $();

        // reset its values
        new_activity.find("input[type='text']").val('');
        new_activity.find(".selected_slots").val('');
        resetCustomSelector(new_activity.find('.multi_select'));
        new_activity.find(".act_slot_selector").val([]);
        new_activity.find('.remove_activity').removeClass('hidden');

        // initialize activity array
        activities = activities.add(new_activity);

        // add any extra lines
        for (var i = 1; i < count; i++) {
            var extra_activity = new_activity.clone(true);
            activities = activities.add(extra_activity);
        }

        // append activities to document smoothly w/ spacers
        activities.each(function () {
            $(this).insertAfter(last_activity).hide().slideDown(500, function () {
                $('<div class="act_spacer spacer20"></div>').insertBefore(this).hide().slideDown(500);
            });
        });

        // unhide x from first activity
        activity_lines.first().find('.remove_activity').removeClass('hidden');
    }

    // remove the given activity line (jquery object)
    // one_left expects a boolean indicating whether only one activity will be left
    function removeActivity(activity, one_left) {
        var spacer = activity.prev('.act_spacer');
        var activities = $('.activity');
        var first_activity = 0;

        // if first activity, get next spacer
        if (spacer.length === 0) {
            spacer = activity.next('.act_spacer');
            first_activity = 1;
        }

        // if one activity left, hide x
        if (one_left) {
            activities.eq(first_activity).find('.remove_activity').addClass('hidden');
        }

        // remove activity and previous spacer smoothly
        activity.slideUp(500, function () {
            $(this).remove();

            spacer.slideUp(500, function () {
                $(this).remove();
            });
        });
    }


    ///////////// Display itinerary /////////////


    // show the itinerary at the current index on the schedule table
    // toggle argument indicates whether calling from a prev/next event -  no need to recalculate size
    function showItinerary(toggle) {
        var schedule_table = $('#schedule');
        var cells = schedule_table.find('.activity_display');

        // Clear calendar
        cells.text('')
             .css({"background-color" : "", "color" : ""});

        if (!toggle) {
            cells.height('auto');
        }

        // If any itineraries are available for display
        if (itineraries.get_count() > 0) {
            // Get itinerary
            var activities = itineraries.get_activities();
            var max_h = 0;

            // For every activity in the itinerary
            for (var j = 0; j < activities.length; j++) {
                // Create display text for activity
                var text = activities[j].code + " - " + truncate(activities[j].name, activity_name_length) +
                            " (" + activities[j].category.substring(0, 2) + ")";

                // For every activity slot
                for (var k = 0; k < activities[j].slots.length; k++) {
                    // Calculate position in calendar and show activity
                    var row = Math.floor((activities[j].slots[k] - 1) / weeks_per_row) + 1;
                    var month = Math.floor(((activities[j].slots[k] - 1) % weeks_per_row) / weeks_per_month) + 1;
                    var cell = ((activities[j].slots[k] - 1) % weeks_per_month) + 1;

                    // Set activity text
                    var div = schedule_table.find('.row_' + row).find('.month_' + month).find('.cell_' + cell);
                    div.text(text);

                    // Set activity color
                    if (j < default_colors.length) {
                        div.css("background-color", default_colors[j][0])
                           .css("color", default_colors[j][1]);
                    }

                    if (!toggle) {
                        // Compare activity div height to current max
                        var h = schedule_table.find('.row_' + row + ':visible').find('.month_' + month).find('.cell_' + cell).height();
                        max_h = Math.max(h, max_h);
                    }
                }
            }

            if (!toggle) {
                // Set all activity divs to have the same height
                cells.height((max_h + 1) + "px")
                     .show();
            }
        } else {
            cells.hide(); // hide cells
        }

        // If itinerary is not null
        if (itineraries.get_unfiltered_count() > 0) {
            // Update itinerary counter
            var filtered = itineraries.is_filtered() ? '<strong>Filtered: </strong>' : '';
            var index = (itineraries.get_count() == 0) ? 0 : itineraries.get_index() + 1;
            $('.program_index').html(filtered + index + ' of ' + itineraries.get_count());
        } else {
            $('.program_index').html('&nbsp;'); // reset counter
        }
    }

    // truncate given string to the given size
    function truncate(phrase, size) {
        // return phrase if short enough
        if (phrase.length <= size) {
            return phrase;
        }

        // return truncated phrase
        return phrase.substring(0, size - 3).trim() + '...';
    }


    /////////// Import - export /////////////


    // fill activity form w/ the given contents (json array) 
    function generateActivities(contents) {
        var size = contents.size; // # of activities in array

        // check json length
        if (size == undefined || size < 1) {
            throw "Invalid array size";
        }

        // add activity lines to match json length
        var count = size - $('.activity').length;

        if (count > 0) {
            addActivity(count);
        }

        // get activity objects (w/ newly added)
        var activity_lines = $('.activity');

        // iterate over activities in imported file, add contents to form
        for (var i = 0; i < size; i++) {
            var activity_line = activity_lines.eq(i);
            var activity = contents["activities"][i];
            var slots = activity["slots"];

            activity_line.find('.act_code').val(activity["code"]);
            activity_line.find('.act_name').val(activity["name"]);
            activity_line.find('.act_category').val(activity["category"]);
            activity_line.find('.act_slot_selector').val(slots);
            setCustomSelections(activity_line.find('.multi_select'), slots);
            activity_line.find('.act_length').val(activity["length"]);
            activity_line.find('.selected_slots').val(slots.join("\n"));
        }

        // check if only one line will be left
        var one_left = (size <= 1);

        // remove any extra activities smoothly
        for (var i = (activity_lines.length - 1); i >= Math.max(size, 1); i--) {
            removeActivity(activity_lines.eq(i), one_left);
            one_left = false;
        }
    }

    // reset activities form to default view
    function resetActivities() {
        var activities = $('.activity');
        var activity = activities.first();
        var one_left = true;

        // clear all info on the first activity
        activity.find("input[type='text']").val('');
        activity.find('select').val('');
        activity.find('.act_slot_selector').val([]);
        setCustomSelections(activity.find('.multi_select'), []);
        activity.find('.selected_slots').val('');

        // remove all activities after the first
        for (var i = 1; i < activities.length; i++) {
            removeActivity(activities.eq(i), one_left);
            one_left = false;
        }
    }

    // build an object with info from activity form and return it, if valid
    // otherwise, return size 0 object
    function getAndValidateActivities() {
        var export_val = {"activities" : []};
        var valid = true;
        var names = {};

        // iterate over all activities
        $('.activity').each(function(index) {
            var activity = {};

            // store values
            activity["code"] = $(this).find('.act_code').val().trim();
            activity["name"] = $(this).find('.act_name').val().trim();
            activity["category"] = $(this).find('.act_category').val();
            activity["slots"] = $(this).find('.act_slot_selector').val();
            activity["length"] = $(this).find('.act_length').val();

            // check unique names
            if (names[activity["name"]] === undefined) {
                names[activity["name"]] = true;
            } else {
                // name repeated, break and report error
                setAlert('.alert-danger', "Activity names must be unique.");
                valid = false;
                return false;
            }

            // validate values
            if (activity["code"] == "" || activity["name"] == "" || activity["category"] == null ||
                activity["slots"].length == 0 || activity["length"] == null) {
                // if blank, break and report error
                setAlert('.alert-danger', "Activity number " + (index + 1) + " is incomplete.");
                valid = false;
                return false;
            }

            export_val.activities.push(activity);
        });

        // if data is valid
        if (valid) {
            // set size value, return data
            export_val["size"] = export_val.activities.length;
            return export_val;
        }

        // return invalid
        return {"size" : 0, "activities" : []};
    }


    ///////////// Filtering ////////////


    // create filter pane objects for a set of itineraries
    function fillFilterPane() {
        var filter_pane = $('#filter_pane');

        // get objects
        var activity_lines = filter_pane.find('.f_activity');
        var activity_names = itineraries.get_activity_names();
        var new_lines = activity_names.length - activity_lines.length;

        // add activities to be filtered
        if (new_lines > 0) {
            addFilterLines(new_lines);
        }

        // remove any extra lines
        for (var i = (activity_lines.length - 1); i >= activity_names.length; i--) {
            activity_lines.eq(i).next('hr').remove();
            activity_lines.eq(i).remove();
        }

        activity_lines = filter_pane.find('.f_activity'); // updated lines

        // set values for each activity
        activity_lines.each(function (index) {
            var activity = activity_names[index];
            var length = itineraries.get_activity_length(activity);
            var slots = itineraries.get_activity_slots(activity)
                                   .map(slot_converter.id_to_text);

            // set activity name
            $(this).find('.f_act_name').text(activity);

            // set multi select options for activity
            createCustomOptions($(this).find('.multi_select'), slots);

            // set mobile options for activity
            createOptionsMobileSelect($(this).find('.f_act_slot_selector'), slots);

            // empty tag container
            var top_div = $(this).find('.top_div');
            top_div.empty();

            // set corral to have all options
            for (var i = 0; i < slots.length; i++) {
                var tag = $('<div class="tag"><span class="start_tag">' + slots[i] + '</span>' +
                            '<span>&nbsp;-&nbsp;' + slot_converter.get_end_slot(slots[i], length) + '</span>' +
                            '<a href="#" class="close remove_tag">&times;</a></div>');
                top_div.append(tag);
            }

            // register click event on tag removing 'x'
            $('.remove_tag').click(function () {
                removeTagHandler($(this).parents('.tag'));
                return false;
            })
        });
    }


    // create as many new lines on the filtering pane as the given count. Count >= 1.
    function addFilterLines(count) {
        // clone last line
        var last_line = $('.f_activity').last();
        var new_line = last_line.clone(true);
        var lines = $();

        // reset its values
        new_line.find('.f_act_name').text('');
        new_line.find('select.f_act_slot_selector').val([]);
        resetCustomSelector(new_line.find('.multi_select'));
        new_line.find('.top_div').empty();

        // initialize line array
        lines = lines.add(new_line);

        // add any extra lines
        for (var i = 1; i < count; i++) {
            var extra_line = new_line.clone(true);
            lines = lines.add(extra_line);
        }

        // add lines to document
        lines.each(function () {
            $(this).insertAfter(last_line.next('hr'));
            $('<hr class="w-90-pc mtb-2_em">').insertAfter(this);
        });
    }

    // create the given options for the given mobile select (jquery obj)
    function createOptionsMobileSelect(select, options) {
        select.empty(); // remove existing options

        // for each slot option
        for (var i = 0; i < options.length; i++) {
            // add option to select
            var option = $('<option value="' + options[i] + '">' + options[i] + '</option>');

            option.appendTo(select)
                  .prop('selected', true);
        }
    }

    // handle tag removal (start slot) from corral, on 'x' click
    function removeTagHandler(tag) {
        // close custom select
        $('.multi_options').hide();

        // get jquery line, slot value
        var line = tag.parents('.f_activity');
        var slot = tag.find('.start_tag').text();

        // hide tag
        tag.fadeOut(300);

        // uncheck in custom selector
        line.find('.multi_options input[type="checkbox"][value="' + slot + '"]').prop("checked", false);

        // unselect in mobile selector
        line.find('.f_act_slot_selector option[value="' + slot + '"]').prop("selected", false);

        // update custom selector text
        var selections = line.find('.f_act_slot_selector').val().length;
        updateCustomSelectorText(line.find('.multi_select'), selections);
    }

    // hide filter pane and restore scrolling
    function closeFilterPane() {
        var filter_pane = $('#filter_pane');

        // fade out contents
        $('#filter_contents').fadeOut(100);

        // hide filter pane
        filter_pane.css("width", "0");

        // reset scrolling and page settings
        $('body').css({"overflow" : "auto", "margin-right" : "0"});
        $('nav').css({"left" : "0"});

        // scroll to top of filter pane
        filter_pane.scrollTop(0);
    }


    ////////// Ajax setup //////////


    // Get cookie for ajax request
    function getCookie(name) {
        var cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var cookie = jQuery.trim(cookies[i]);
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    // needed to sumbit ajax request to django server
    var csrftoken = getCookie('csrftoken');

    function csrfSafeMethod(method) {
        // these HTTP methods do not require CSRF protection
        return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
    }

    $.ajaxSetup({
        crossDomain: false, // obviates need for sameOrigin test
        beforeSend: function(xhr, settings) {
            if (!csrfSafeMethod(settings.type)) {
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            }
        }
    });


    ////////// Copy Program Support /////////////


    function copyToClipboard(text) {
        if (window.clipboardData && window.clipboardData.setData) {
            // IE specific code path to prevent textarea being shown while dialog is visible.
            return clipboardData.setData("Text", text); 

        } else if (document.queryCommandSupported && document.queryCommandSupported("copy")) {
            var textarea = document.createElement("textarea");
            textarea.textContent = text;
            textarea.style.position = "fixed";  // Prevent scrolling to bottom of page in MS Edge.
            document.body.appendChild(textarea);
            textarea.select();
            try {
                return document.execCommand("copy");  // Security exception may be thrown by some browsers.
            } catch (ex) {
                console.warn("Copy to clipboard failed.", ex);
                return false;
            } finally {
                document.body.removeChild(textarea);
            }
        }
    }


    ////////// Download support ///////////


    function download(filename, text) {
        if (window.navigator.msSaveBlob) { // IE
            var blob = new Blob([text], {type:  "text/plain;charset=utf-8;"});
            return window.navigator.msSaveBlob(blob, filename);
        } else { // others
            var element = document.createElement('a');
            element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
            element.setAttribute('download', filename);

            element.style.display = 'none';
            document.body.appendChild(element);

            element.click();

            document.body.removeChild(element);
        }
    }

});