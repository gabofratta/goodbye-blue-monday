from scheduler.utils import enums


class Activity(object):
    """ An activity, as imported from the frontend data. It has
    the following properties:

    Attributes:
        code: A string with a class code or some custom value 
        name: A string with the name of the activity
        category: "Class", "Rotation", or "Custom"
        slot: A list of members of the Weeks enum. 
        length: An integer with the length of the activity in weeks
    """

    def __init__(self, code, name, category, slots, length):
        self.code = code
        self.name = name
        self.category = category
        self.slots = slots
        self.length = int(length)

    def __repr__(self):
        return """Activity: code is %s; name is %s; category is %s; slots are %s; 
                  length is %s""" % (self.code, self.name, self.category, ', '.join([e.name for e in self.slots]), self.length)      


class Activity_Instance(Activity):
    """ An activity instance to be included in an itinerary. It has
    the following properties:

    Attributes:
        code: A string with a class code or some custom value 
        name: A string with the name of the activity
        category: "Class", "Rotation", or "Custom"
        slot: A single member of the Weeks enum.
        length: An integer with the length of the activity in weeks
    """

    def __init__(self, activity, slot):
        self.code = activity.code
        self.name = activity.name
        self.category = activity.category
        self.slot = slot
        self.length = int(activity.length)

    def __repr__(self):
        return """Activity: code is %s; name is %s; category is %s; slots are %s; 
                  length is %s""" % (self.code, self.name, self.category, self.slot.name, self.length)

    def export(self):
        """ Returns the Activity's info as a dict, to be exported
        to the frontend """
        return {"code" : self.code, "name" : self.name, "category" : self.category, 
                "slots" : [self.slot.value + i for i in range(self.length)]}


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
            key = (activity.slot.value + i)
            self.blackouts[key] = True