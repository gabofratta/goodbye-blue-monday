from scheduler.utils import enums
from scheduler.utils import classes
from datetime import datetime
import copy


def get_schedules(data):
    timeout = 10 # in seconds
    activity_list = []
    itinerary_list = []

    # Build a list of all activities
    for i in range(data["size"]):
        code = data["code_" + str(i)]
        name = data["name_" + str(i)]
        category = data["category_" + str(i)]
        slots = [enums.Weeks[e] for e in data["slots_" + str(i)]]
        length = data["length_" + str(i)]
        activity = classes.Activity(code, name, category, slots, length)
        activity_list.append(activity)

    # Create seed itineraries
    if len(activity_list) > 0:
        activity = activity_list.pop()
        # Make itinerary for each activity slot
        for slot in activity.slots:
            itinerary = classes.Itinerary()
            instance = classes.Activity_Instance(activity, slot)
            itinerary.add_activity(instance)
            itinerary_list.append(itinerary)

    # Prevent infinite looping
    t1 = datetime.now()

    # Iterate over remaining activities
    while len(activity_list) > 0:
        activity = activity_list.pop()
        itinerary_count = len(itinerary_list)

        # Check timeout
        if (datetime.now() - t1).seconds > timeout:
            return {"success" : False, "error" : "Operation timed out."}

        # For each itinerary
        for i in range(itinerary_count):
            itinerary = itinerary_list.pop(0)
            # For each activity time slot
            for slot in activity.slots:
                # If no conflict, add activity w/ time slot to itinerary
                if not itinerary.has_conflict(slot, activity.length):
                    itinerary_copy = copy.deepcopy(itinerary)
                    instance = classes.Activity_Instance(activity, slot)
                    itinerary_copy.add_activity(instance)
                    itinerary_list.append(itinerary_copy)

    # Prepare return array
    ret_val = {"success" : True, "size" : len(itinerary_list)}

    # Add itineraries w/ activities to return array
    for i in range(len(itinerary_list)):
        ret_val["itinerary_" + str(i)] = [e.export() for e in itinerary_list[i].activities]

    return ret_val



