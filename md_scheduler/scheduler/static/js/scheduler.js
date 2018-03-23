$(document).ready(function() {


    ////////// Globals ///////////


    // hammer element on schedule table for mobile swipe events
    var hammer = new Hammer(document.getElementById('schedule'), {});

    var importing = false;
    var generating = false;
    var weeks_per_row = 12;
    var weeks_per_month = 4;

    var itinerary_index = null;
    var itinerary_count = 0;
    var itineraries = [];

    var activity_name_length = 25;
    var default_colors = [["RED", "WHITE"], ["BLUE", "WHITE"], ["PURPLE", "WHITE"], ["GREEN", "WHITE"], ["GRAY", "WHITE"], ["#aa6e28", "WHITE"],
                          ["NAVY", "WHITE"], ["MAROON", "WHITE"], ["OLIVE", "WHITE"], ["TEAL", "WHITE"], ["BLACK", "WHITE"], ["YELLOW", "BLACK"], 
                          ["LIME", "BLACK"], ["AQUA", "BLACK"], ["FUCHSIA", "BLACK"], ["ORANGE", "BLACK"], ["PINK", "BLACK"], ["SILVER", "BLACK"]];


    ////////// Event handlers ///////////


    // dismissable option
    $('.close').click(function () {
        // close multi select
        $('.multi_options').hide();

        // dismiss alert
        $(this).closest('.alert').fadeOut();
        return false;
    });


    hammer.on('swiperight', function() {
        // close multi select
        $('.multi_options').hide();

        // Show error if no schedules
        if (itinerary_count == 0) {
            return false;
        }

        // Decrease itinerary index w/ loop around
        if (itinerary_index == 0) {
            itinerary_index = itinerary_count - 1;
        } else {
            itinerary_index--;
        }

        // Show new itinerary
        showItinerary(itinerary_index);
        return false;
    });

   hammer.on('swipeleft', function() {
        // close multi select
        $('.multi_options').hide();

        // Show error if no schedules
        if (itinerary_count == 0) {
            return false;
        }

        // Increase itinerary index w/ loop around
        itinerary_index = (itinerary_index + 1) % itinerary_count;

        // Show new itinerary
        showItinerary(itinerary_index);
        return false;
    });

    $('.prev_program').click(function () {
        // close multi select
        $('.multi_options').hide();

        // Show error if no schedules
        if (itinerary_count == 0) {
            setAlert('.alert-danger', "You must generate some schedules first.");
            return false;
        }

        // Decrease itinerary index w/ loop around
        if (itinerary_index == 0) {
            itinerary_index = itinerary_count - 1;
        } else {
            itinerary_index--;
        }

        // Show new itinerary
        showItinerary(itinerary_index);
        return false;
    });

    $('.next_program').click(function () {
        // close multi select
        $('.multi_options').hide();

        // Show error if no schedules
        if (itinerary_count == 0) {
            setAlert('.alert-danger', "You must generate some schedules first.");
            return false;
        }

        // Increase itinerary index w/ loop around
        itinerary_index = (itinerary_index + 1) % itinerary_count;

        // Show new itinerary
        showItinerary(itinerary_index);
        return false;
    });

    $('.copy_program').click(function () {
        // close multi select
        $('.multi_options').hide();

        // Show error if no schedules
        if (itinerary_count == 0) {
            setAlert('.alert-danger', "You must generate some schedules first.");
            return false;
        }

        var text = "";
        var activities = itineraries[itinerary_index];
        var slot_opts = $('.act_slot_selector').last().children();

        // Build program text
        for (var j = 0; j < activities.length; j++) {
            var line = activities[j].code + " - " + activities[j].name + " - " + activities[j].category + ": ";
            for (var k = 0; k < activities[j].slots.length; k++) {
                var week = slot_opts.eq(activities[j].slots[k] - 1).text();
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

    $('.export_acts').click(function () {
        var activities = {};
        var valid = true;

        // close multi select
        $('.multi_options').hide();

        // iterate over all activities
        $('.activity').each(function(index) {
            // store values
            activities["size"] = index + 1;
            activities["code_" + index] = $(this).find('.act_code').val();
            activities["name_" + index] = $(this).find('.act_name').val();
            activities["category_" + index] = $(this).find('.act_category').val();
            activities["slots_" + index] = $(this).find('.act_slot_selector').val();
            activities["length_" + index] = $(this).find('.act_length').val();

            // validate values
            if (activities["code_" + index].trim() == "" || activities["name_" + index].trim() == "" ||
                activities["category_" + index] == null || activities["slots_" + index].length == 0 ||
                activities["length_" + index] == null) {
                // if blank, break and report error
                setAlert('.alert-danger', "Activity number " + (index + 1) + " is incomplete.");
                valid = false;
                return false;
            }
        });

        // download text file, if data is valid
        if (valid) {
            download("ms4planner_activities.txt", JSON.stringify(activities))
        }
        return false;
    });

    $('.import_acts').click(function () {
        // prevent double hit
        if (importing) {
            return false;
        }
        importing = true;

        // close multi select
        $('.multi_options').hide();

        // call hidden file uploader
        $('#file_input').click();

        return false;
    });

    $('#file_input').change(function () {
        // check if browser supports FileReader
        if (!(window.File && window.FileReader && window.FileList && window.Blob)) {
            setAlert('.alert-danger', "Your browser does not support this feature.");
            $(this).val('');
            importing = false;
            return false;
        }

        // get file object
        var file = $(this)[0].files[0];

        // no file selected
        if (file == undefined) {
            $(this).val('');
            importing = false;
            return false;
        }

        // check that file is .txt.
        if (file.type != 'text/plain') {
            setAlert('.alert-danger', "Invalid file type. Expecting a text file.");
            $(this).val('');
            importing = false;
            return false;
        }

        // check file size
        if (file.size = 0 || file.size > 2000) {
            setAlert('.alert-danger', "Invalid file size.");
            $(this).val('');
            importing = false;
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
                    // alert error, reset activity pane
                    setAlert('.alert-danger', "There was something wrong with the imported file.");
                    resetActivities();
                } finally {
                    hideLoader(loadingTO);
                    importing = false;
                }
            }
        })(reader);

        // read file
        reader.readAsText(file);

        // clear form
        $(this).val('');
    });

    $('.act_slot_selector').change(function() {
        var value = $(this).val();
        var parent = $(this).parent();

        // display selected slots for each activity
        parent.next().find('.selected_slots').val(value.join("\n"));

        // Update custom selector
        setSelections(parent.find('.multi_select'), value);
    }); 

    $('#add_activity').click(function () {
        // close multi select
        $('.multi_options').hide();

        // add a new acitivity
        addActivity();

        return false;
    });    

    $('.remove_activity').click(function () {
        // close multi select
        $('.multi_options').hide();

        // remove current activity line
        $(this).closest('.activity').fadeOut(400, function () {
            $(this).prev('.act_spacer').remove();
            $(this).closest('.activity').remove();
        });
        return false;
    });

    
    ////////// Form submit ///////////


    $('#generate').click(function () {
        var activities = {};
        var valid = true;

        // only run query once
        if (generating) {
            return false;
        }
        generating = true;

        // close multi select
        $('.multi_options').hide();

        // dismissable option
        $('.alert-success').fadeOut();

        // reset itinerary globals
        itinerary_index = null;
        itinerary_count = 0;
        itineraries = [];

        // reset program panel
        $('.program_index').html('&nbsp;');
        $('#schedule').find('[class*=cell_]').text('');
        $('#schedule').find('[class*=cell_]').addClass('hidden');

        // iterate over all activities
        $('.activity').each(function(index) {
            // store values
            activities["size"] = index + 1;
            activities["code_" + index] = $(this).find('.act_code').val();
            activities["name_" + index] = $(this).find('.act_name').val();
            activities["category_" + index] = $(this).find('.act_category').val();
            activities["slots_" + index] = $(this).find('.act_slot_selector').val();
            activities["length_" + index] = $(this).find('.act_length').val();

            // process time slots
            for (var i = 0; i < activities["slots_" + index].length; i++) {
                activities["slots_" + index][i] = activities["slots_" + index][i].replace(" (", "_").replace(")", "");
            }

            // validate values
            if (activities["code_" + index].trim() == "" || activities["name_" + index].trim() == "" || 
                activities["category_" + index] == null || activities["slots_" + index].length == 0 || 
                activities["length_" + index] == null) {
                // if blank, break and report error
                setAlert('.alert-danger', "Activity number " + (index + 1) + " is incomplete.");
                generating = false;
                valid = false;
                return false;
            }
        });

        // data is valid
        if (valid) {
            // dismissable option
            $('.alert-danger').fadeOut();

            // show loading overlay after 1 sec
            var loadingTO = setTimeout(function() {
                $('.loading').removeClass('hidden');
            }, 1000);

            // ajax post
            $.ajax({
                url: "/ajax/generate_programs",
                type: "POST",
                data: JSON.stringify(activities),
                dataType: 'json',
                success: function(data, status) {
                    // Show error if success is False
                    if (!data.success) {
                        hideLoader(loadingTO);
                        setAlert('.alert-danger', "Fatal error: " + data.error);
                        generating = false;
                        return;
                    }
                    // Show error if no viable programs
                    if (data.size <= 0) {
                        hideLoader(loadingTO);
                        setAlert('.alert-danger', "No schedules meet your requirements.");
                        generating = false;
                        return;
                    } 

                    // Set itinerary globals
                    itinerary_index = 0;
                    itinerary_count = data.size;

                    for (var i = 0; i < data.size; i++) {
                        itineraries.push(data["itinerary_" + i]);
                    }

                    // Show first itinerary
                    showItinerary(0);

                    // Hide loader, show success alert
                    hideLoader(loadingTO);
                    setAlert('.alert-success', "Your schedule options are ready.");
                    generating = false;
                },
                error: function(xhr, errmsg, err) {
                    hideLoader(loadingTO);
                    setAlert('.alert-danger', "Unexpected error. Reload the page and try again.");
                    generating = false
                    console.log(err);
                }
            });
        }

        return false;
    });

        
    ////////// Helpers ////////////


    function hideLoader(loadingTO) {
        clearTimeout(loadingTO);
        $('.loading').addClass('hidden');           
    }

    function setAlert(id, msg) {
        var alert = $(id);

        // fade out other alert
        if (id == '.alert-danger') {
            $('.alert-success').fadeOut();
        } else {
            $('.alert-danger').fadeOut();
        }

        // fade out this alert, if present
        alert.fadeOut(100, function() {
            // set alert text and fade in
            alert.find("strong").text(msg);
            alert.fadeIn();
        });
    }

    function addActivity() {
        // clone an activity line
        var last_activity = $('.activity').last();
        var new_activity = last_activity.clone(true);

        // reset values
        new_activity.find("input[type='text']").val("");
        new_activity.find(".selected_slots").val("");
        resetSelector(new_activity.find('.multi_select'));
        new_activity.find("select.act_slot_selector").val([]);

        // add another line to the form
        new_activity.hide();
        new_activity.find('.remove_activity').removeClass('hidden');
        new_activity.insertAfter(last_activity);
        new_activity.before('<div class="act_spacer spacer20"></div>');
        new_activity.fadeIn();
    }

    function showItinerary(index) {
        var schedule_table = $('#schedule');
        var cells = schedule_table.find('[class*=cell_]');

        // Clear calendar
        cells.text('');
        cells.removeClass('hidden');
        cells.css({"background-color" : "", "color" : ""});
        cells.height('auto');

        // Get itinerary
        var activities = itineraries[index];
        var max_h = 0;

        // For every activity in the itinerary
        for (var j = 0; j < activities.length; j++) {
            // For every activity slot
            for (var k = 0; k < activities[j].slots.length; k++) {
                // Calculate position in calendar and show activity
                var row = Math.floor((activities[j].slots[k] - 1) / weeks_per_row) + 1;
                var month = Math.floor(((activities[j].slots[k] - 1) % weeks_per_row) / weeks_per_month) + 1;
                var cell = ((activities[j].slots[k] - 1) % weeks_per_month) + 1;

                // Create id string for activity
                var text = activities[j].code + " - " + truncate(activities[j].name, activity_name_length) + 
                            " (" + activities[j].category.substring(0, 2) + ")";

                // Set activity text
                var div = schedule_table.find('.row_' + row).find('.month_' + month).find('.cell_' + cell);
                div.text(text);

                // Set activity color
                if (j < default_colors.length) {
                    div.css("background-color", default_colors[j][0]);
                    div.css("color", default_colors[j][1]);
                }

                // Compare activity div height
                var h = schedule_table.find('.row_' + row + ':visible').find('.month_' + month).find('.cell_' + cell).height();
                max_h = Math.max(h, max_h);
            }
        }

        // Update counter
        $('.program_index').text((index + 1) + ' of ' + itinerary_count);

        // Set activity div heights
        cells.height(max_h + "px");
    }

    function truncate(phrase, size) {
        // return phrase if short enough
        if (phrase.length <= size) {
            return phrase;
        }

        // return truncated phrase
        return phrase.substring(0, size - 3).trim() + '...';
    }

    function generateActivities(contents) {
        var size = contents.size; // # of activities in array

        // check json length
        if (size == undefined || size < 1) {
            throw "Invalid array size";
        }

        // add activity lines to match json length
        for (var i = 0; i < (size - $('.activity').length); i++) {
            addActivity();
        }

        // activity dom objects
        var activities = $('.activity');

        // iterate over activities in imported file
        for (var i = 0; i < size; i++) {
            var activity = activities.eq(i);
            activity.find('.act_code').val(contents["code_" + i]);
            activity.find('.act_name').val(contents["name_" + i]);
            activity.find('.act_category').val(contents["category_" + i]);
            activity.find('.act_slot_selector').val(contents["slots_" + i]);
            setSelections(activity.find('.multi_select'), contents["slots_" + i]);
            activity.find('.act_length').val(contents["length_" + i]);
            activity.find('.selected_slots').val(contents["slots_" + i].join("\n"));
        }

        // activity line count
        var activity_cnt = activities.length;

        // remove any extra activities
        for (var i = (activity_cnt - 1); i >= size; i--) {
            var activity = activities.eq(i);
            activity.prev('.act_spacer').remove();
            activity.remove();
        }
    }

    function resetActivities() {
        var activities = $('.activity');
        var activity = activities.first();

        // clear all info on first activity
        activity.find("input[type='text']").val('');
        activity.find('select').val("");
        activity.find('.act_slot_selector').val([]);
        setSelections(activity.find('.multi_select'), []);
        activity.find('.selected_slots').val('');

        // remove all activities after first
        for (var i = 1; i < activities.length; i++) {
            var activity = activities.eq(i);
            activity.prev('.act_spacer').remove();
            activity.remove();
        }
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


    ////////// Export activities support ///////////


    function download(filename, text) {
        var element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        element.setAttribute('download', filename);

        element.style.display = 'none';
        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);
    }

});