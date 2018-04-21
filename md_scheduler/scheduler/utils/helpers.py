from scheduler.utils import enums
from datetime import datetime
import copy


def generate_schedules(data):
    # Calculate itineraries
    itineraries = get_itineraries(data)

    # If successful, calculate supporting structures and return both
    if itineraries["success"]:
        support = get_supporting_structures(itineraries)
        return {**itineraries, **support}

    # Return unsuccessful itineraries
    return itineraries


def get_itineraries(data):
    timeout = 15 # in seconds
    activities = {}
    itineraries = []
    size = data["size"]

    # Build a dict of activity data
    for i in range(size):
        activity = data["activities"][i]
        activity["slots"] = [e.replace(" (", "_").replace(")", "") for e in activity["slots"]]
        activities[i] = {"code" : activity["code"], "name" : activity["name"], "category" : activity["category"],
                         "slots" : [enums.Weeks[e].value for e in activity["slots"]], "length" : int(activity["length"])}

    # First activity
    first = activities[0]

    # Initialize itineraries with first activity
    for slot in first["slots"]:
        length = first["length"]
        weeks = [(slot + i) for i in range(length)]
        itineraries.append([(0, weeks)])

    # Prevent infinite looping
    t1 = datetime.now()

    # For each activity after the first
    for i in range(1, size):
        new_itineraries = []
        slots = activities[i]["slots"]
        length = activities[i]["length"]

        # For each itinerary already in the list
        for j in range(len(itineraries)):

            # For each slot in the current activity
            for slot in slots:
                weeks = [slot + k for k in range(length)]
                conflict = False

                # For each activity in the current itinerary
                for activity in itineraries[j]:

                    # For each week in the current activity's length
                    for week in weeks:

                        # Check for time conflict
                        if week in activity[1]:
                            conflict = True

                # Add activity if no conflict
                if not conflict:
                    copy = itineraries[j].copy()
                    copy.append((i, weeks))
                    new_itineraries.append(copy)

        # Check timeout
        if (datetime.now() - t1).seconds > timeout:
            return {"success" : False, "error" : "Operation timed out."}

        # Only interested in up to date itineraries
        itineraries = new_itineraries

    ret_val = {"success": True, "itineraries" : []}

    # For each itinerary
    for itinerary in itineraries:
        new_itinerary = []
        # For each activity in the itinerary
        for activity in itinerary:
            # Set activity info
            new_activity = activities[activity[0]].copy()
            new_activity["slots"] = activity[1]
            new_itinerary.append(new_activity)

        # Add itinerary to return array
        ret_val["itineraries"].append(new_itinerary)

    ret_val["size"] = len(ret_val["itineraries"])
    return ret_val


def get_supporting_structures(data):
    activity_names = []
    activity_slots = {}
    activity_lengths = {}
    activity_slot_itineraries = {}

    size = data["size"]
    itineraries = data["itineraries"]

    # Iterate over all itineraries
    for i in range(size):
        # Iterate over all activities in itinerary
        for j in range(len(itineraries[i])):
            # Activity info
            activity = itineraries[i][j]
            name = activity["name"]
            first_slot = activity["slots"][0]

            # If new activity, add to structures
            if name not in activity_slots:
                activity_names.append(name)
                activity_slots[name] = []
                activity_lengths[name] = activity["length"]
                activity_slot_itineraries[name] = {}

            # If new starting slot, add to stuctures
            if first_slot not in activity_slot_itineraries[name]:
                activity_slot_itineraries[name][first_slot] = [i]
                activity_slots[name].append(first_slot)
            else:
                # Add itinerary to matrix
                activity_slot_itineraries[name][first_slot].append(i)

        # If last itinerary, sort starting slots for each activity
        if i == size - 1:
            activity_slots[name].sort()

    return {"activity_names" : activity_names, "activity_slots" : activity_slots,
            "activity_lengths" : activity_lengths, "activity_slot_itineraries" : activity_slot_itineraries}