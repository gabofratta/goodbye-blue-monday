$(document).ready(function() {


    ////////// Globals ///////////


    var weeks_per_row = 12;
    var weeks_per_month = 4;
    var itinerary_index = null;
    var itinerary_count = 0;
    var itineraries = [];
    var activity_name_length = 15
    var default_colors = [["RED", "WHITE"], ["BLUE", "WHITE"], ["PURPLE", "WHITE"], ["GREEN", "WHITE"], ["GRAY", "WHITE"], ["#aa6e28", "WHITE"],
                          ["NAVY", "WHITE"], ["MAROON", "WHITE"], ["OLIVE", "WHITE"], ["TEAL", "WHITE"], ["BLACK", "WHITE"], ["YELLOW", "BLACK"], 
                          ["LIME", "BLACK"], ["AQUA", "BLACK"], ["FUCHSIA", "BLACK"], ["ORANGE", "BLACK"], ["PINK", "BLACK"], ["SILVER", "BLACK"]];


    ////////// Event handlers ///////////


    // dismissable option
    $('.close').click(function () {
        // dismiss alert
        $(this).closest('.alert').fadeOut();
        return false;
    });

    $('.prev_program').click(function () {
        // Show error if no schedules
        if (itinerary_count == 0) {
            setAlert('.alert-danger', "No schedules to display.");
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
        // Show error if no schedules
        if (itinerary_count == 0) {
            setAlert('.alert-danger', "No schedules to display.");
            return false;
        }

        // Increase itinerary index w/ loop around
        itinerary_index = (itinerary_index + 1) % itinerary_count;

        // Show new itinerary
        showItinerary(itinerary_index);
        return false;
    });

    $('.copy_program').click(function () {
    	// Show error if no schedules
        if (itinerary_count == 0) {
            setAlert('.alert-danger', "No schedules to copy.");
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

    	// Flash success alert
    	setAlert('.alert-success', "Schedule copied to clipboard.");
        return false;
    });

    $('.act_slot_selector').change(function() {
        // display selected slots for each activity
        $(this).parent().next().find('.selected_slots').val($(this).val().join("\n"));
    }); 

    $('#add_activity').click(function () {
        // clone an activity line
        var last_activity = $('.activity').last();
        var new_activity = last_activity.clone(true);

        // reset values
        new_activity.find("input[type='text']").val("");
        new_activity.find(".selected_slots").val("");
        new_activity.find("select.act_slot_selector").val([]);

        // add another line to the form
        new_activity.hide();
        new_activity.find('.remove_activity').removeClass('hidden');
        new_activity.insertAfter(last_activity);
        new_activity.before('<div class="act_spacer spacer20"></div>');
        new_activity.fadeIn();
        return false;
    });    

    $('.remove_activity').click(function () {
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

        // dismissable option
        $('.alert-success').fadeOut();

        // reset itinerary globals
        itinerary_index = null;
        itinerary_count = 0;
        itineraries = [];

        // reset program panel
        $('.program_index').text('');
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
                setAlert('.alert-danger', "Activity number " + (index + 1) + " is incomplete.")
                valid = false;
                return false;
            }
        });

        // data is valid
        if (valid) {
            // dismissable option
            $('.alert-danger').fadeOut();

            // show loading overlay
            // $('.loading').removeClass('hidden');

            // ajax post
            $.ajax({
                url: "/scheduler/ajax/generate_programs",
                type: "POST",
                data: JSON.stringify(activities),
                dataType: 'json',
                success: function(data, status) {
                    // Show error if success is False
                    if (!data.success) {
                        $('.loading').addClass('hidden');
                        setAlert('.alert-danger', "Fatal error: " + data.error);
                        return;
                    }
                    // Show error if no viable programs
                    if (data.size <= 0) {
                        $('.loading').addClass('hidden');
                        setAlert('.alert-danger', "No schedules meet your requirements.");
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
                    $('.loading').addClass('hidden');

                    // Flash success alert
                    setAlert('.alert-success', "Your schedule options are ready.");
                },
                error: function(xhr, errmsg, err) {
                    setAlert('.alert-danger', "Unexpected error. Reload the page and try again.");
                    console.log(err);
                }
            });
        }

        return false;
    });

        
    ////////// Helpers ////////////


    function setAlert(id, msg) {
        var alert = $(id);

        // fade out if present
        alert.fadeOut(100, function() {
            // set alert text and fade in
            alert.find("strong").text(msg);
            alert.fadeIn();
        })
     
        // flash alert
        // alert.fadeTo("slow", 1, function () {
        //     $(this).delay(2000).fadeOut("slow");
        // })
    }

    function showItinerary(index) {        
        // Clear calendar
        $('#schedule').find('[class*=cell_]').text('');
        $('#schedule').find('[class*=cell_]').removeClass('hidden');
        $('#schedule').find('[class*=cell_]').css({"background-color" : "", "color" : ""});
        $('#schedule').find('[class*=cell_]').height('auto');

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
                var div = $('#schedule').find('.row_' + row).find('.month_' + month).find('.cell_' + cell);
                div.text(text);

                // Set activity color
                if (j < default_colors.length) {
                    div.css("background-color", default_colors[j][0]);
                    div.css("color", default_colors[j][1]);
                }

                // Compare activity div height
                max_h = Math.max(div.height(), max_h);
            }
        }

        // Update counter
        $('.program_index').text((index + 1) + ' of ' + itinerary_count);

        // Set activity div heights
        $('#schedule').find('.activity_display').height(max_h + "px");
    }

    function truncate(phrase, size) {
        // return phrase if short enough
        if (phrase.length <= size) {
            return phrase;
        }

        // return truncated phrase
        return phrase.substring(0, size - 3).trim() + '...';
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

});