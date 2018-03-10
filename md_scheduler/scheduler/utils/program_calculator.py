from scheduler.utils import weeks
import copy

def get_schedules_json(rows):
    activity_list = []
    itinerary_list = []

    # Build a list of all activities
    for i in range(rows["size"]):
        code = rows["code_" + str(i)]
        name = rows["name_" + str(i)]
        category = rows["category_" + str(i)]
        slots = [weeks.Weeks[e] for e in rows["slots_" + str(i)]]
        length = rows["length_" + str(i)]
        activity = Activity(code, name, category, slots, length)
        activity_list.append(activity)

    # Create seed itineraries
    if len(activity_list) > 0:
        activity = activity_list.pop()
        # Make itinerary for each activity slot
        for slot in activity.slots:
            itinerary = Itinerary()
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
                if not itinerary.has_conflict(activity.term, slot, activity.length):
                    itinerary_copy = copy.deepcopy(itinerary)
                    itinerary_copy.add_activity(activity.get_instance(slot))
                    itinerary_list.append(itinerary_copy)

    for itinerary in itinerary_list:
        print(itinerary)
    print("len" + str(len(itinerary_list)))

    return {"success": True}



class Activity(object):
    """ An activity to be included in an itinerayr. It has
    the following properties:

    Attributes:
        code: A string with a class code or some custom value 
        name: A string with the name of the activity
        category: "Class", "Rotation", or "Custom"
        slot: A list of members of the Weeks enum. If instance, a single member.
        length: An integer with the length of the activity in weeks
        isntance: Boolean indicating whether the list is an instance
    """

    def __init__(self, code, name, category, slots, length, instance = False):
        self.code = code
        self.name = name
        self.category = category
        self.slots = slots
        self.length = int(length)
        self.instance = instance

    def __repr__(self):
        # Pritn approapriate slot format
        if self.instance:
            slot = self.slots.name
        else:
            slot = ', '.join([e.name for e in self.slots])

        return """Activity: code is %s; name is %s; category is %s; slots are %s; 
                  length is %s""" % (self.code, self.name, self.category, slot, self.length)      

    def get_instance(self, slot):
        """ Returns an activity with a single slot, copying
        all other parameters. """
        if slot not in self.slots:
            # Don't create Activity if slot is not valid
            raise ValueError('Given slot is not an option for this acitivity.')
        return Activity(self.code, self.name, self.category, slot, self.length, True)


class Itinerary(object):
    """ An itinerary made up of non-conflicting activities. It has
    the following properties:

    Attributes:
        blackouts: Dictionary with week names as keys. Week names 
            present in the dictionary are not available.
        activities: a list of non-conflicting activities. 
    """

    def __init__(self):
        self.blackouts = {}
        self.activities = []

    def __repr__(self):
        return """Itinerary: %s""" % (', '.join([str(e) for e in self.activities]))

    def has_conflict(self, start_week, length):
        """ Returns a boolean value indicating whether the given 
        start week and week length conflict with the itinerary. """
        for i in range(length):
            # Iterate over length of activity
            key = (start_week.value + i)
            # If one of the weeks is already taken, return False
            if key in self.blackouts:
                return True
        return False

    def add_activity(self, activity):
        """ Adds an Activity object to the list and blacks out its date. 
        Must check that activity does not conflict before using this. """
        self.activities.append(activity)

        # Add all of the activity's weeks to blackout dict
        for i in range(activity.length):
            key = (activity.slots.value + i)
            self.blackouts[key] = True