from django.shortcuts import render
from django.http import HttpResponse
from django.http import JsonResponse
from scheduler.utils import helpers
from scheduler.utils import enums
import json


def index(request):
    context = {
        "all_weeks" : [e.name.replace("_", " (") + ")" for e in enums.Weeks],
        "row_1_months" : ["May - Fall", "June - Fall", "July - Fall", "August - Fall", "September - Fall"],
        "row_2_months" : ["October - Fall", "November - Fall", "December - Fall", "January - Spring", "February - Spring"],
        "row_3_months" : ["March - Spring", "April - Spring", "May - Spring", "June - Spring", "July - Spring"],
        "row_1_activities" : [[1, 2, 3, 4], [1, 2, 3, 4], [1, 2, 3, 4], [1, 2, 3, 4], [1, 2, 3, 4]],
        "row_2_activities" : [[1, 2, 3, 4], [1, 2, 3, 4], [1, 2, 3, 4], [1, 2, 3, 4], [1, 2, 3, 4]],
        "row_3_activities" : [[1, 2, 3, 4], [1, 2, 3, 4], [1, 2, 3, 4], [1, 2, 3, 4], [1, 2, 3, 4]],
    }

    return render(request, 'scheduler/index.html', context)


def generate_programs(request):
    # check request type
    if request.method != "POST":
        raise ValueError("Wrong request type.")

    # get request data
    params = json.loads(request.body)

    # check request size
    if params.get("size", 0) < 1:
        return JsonResponse({"success": False})

    # return programs
    data = helpers.get_schedules_json(params)
    return JsonResponse(data)


def about(request):
    context = {}
    return render(request, 'scheduler/about.html', context)