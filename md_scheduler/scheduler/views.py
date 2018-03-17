from django.shortcuts import render
from django.http import HttpResponse
from django.http import JsonResponse
from scheduler.utils import helpers
from scheduler.utils import enums
import json


def index(request):
    context = {
        "all_weeks" : [e.name.replace("_", " (") + ")" for e in enums.Weeks],
        "row_1_months" : [[1, "May - Fall"], [2, "June - Fall"], [3, "July - Fall"]],
        "row_2_months" : [[1, "August - Fall"], [2, "September - Fall"], [3, "October - Fall"]],
        "row_3_months" : [[1, "November - Fall"], [2, "December - Fall"], [3, "January - Spring"]],
        "row_4_months" : [[1, "February - Spring"], [2, "March - Spring"], [3, "April - Spring"]],
        "row_5_months" : [[1, "May - Spring"], [2, "June - Spring"], [3, "July - Spring"]],
        "row_weeks"  : [1, 2, 3, 4], 
    }

    return render(request, 'scheduler/index.html', context)


def generate_programs(request):
    # check request type
    if request.method != "POST":
        return JsonResponse({"success": False, "error" : "Unexpected request."})

    # get request data
    params = json.loads(request.body)

    # check request size
    if params.get("size", 0) < 1:
        return JsonResponse({"success": False, "error" : "Empty request."})

    # return programs
    data = helpers.get_schedules(params)
    return JsonResponse(data)


def about(request):
    context = {}
    return render(request, 'scheduler/about.html', context)
