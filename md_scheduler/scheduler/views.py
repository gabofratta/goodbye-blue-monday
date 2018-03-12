from django.shortcuts import render
from django.http import HttpResponse
from django.http import JsonResponse
from scheduler.utils import helpers
from scheduler.utils import enums
import json


def index(request):
    context = {
        "all_weeks" : [e.name.replace("_", " (") + ")" for e in enums.Weeks],
        "row_1_months" : ["May - Fall", "June - Fall", "July - Fall"],
        "row_2_months" : ["August - Fall", "September - Fall", "October - Fall"],
        "row_3_months" : ["November - Fall", "December - Fall", "January - Spring"],
        "row_4_months" : ["February - Spring", "March - Spring", "April - Spring"],
        "row_5_months" : ["May - Spring", "June - Spring", "July - Spring"],
        "row_months" : [1, 2, 3],
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
