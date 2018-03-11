from scheduler.utils import enums
from scheduler.utils import classes
import copy


def get_schedules_json(data):
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
            itinerary.add_activity(activity.get_instance(slot))
            itinerary_list.append(itinerary)

    # Iterate over remaining activities
    while len(activity_list) > 0:
        activity = activity_list.pop()
        itinerary_count = len(itinerary_list)
        # For each itinerary
        for i in range(itinerary_count):
            itinerary = itinerary_list.pop(0)
            # For each activity time slot
            for slot in activity.slots:
                # If no conflict, add activity w/ time slot to itinerary
                if not itinerary.has_conflict(slot, activity.length):
                    itinerary_copy = copy.deepcopy(itinerary)
                    itinerary_copy.add_activity(activity.get_instance(slot))
                    itinerary_list.append(itinerary_copy)

    # Prepare return array
    ret_val = {"success" : len(itinerary_list) > 0, "size" : len(itinerary_list)}

    for itinerary in itinerary_list:
        print(itinerary)
    print("len" + str(len(itinerary_list)))

    return ret_val



