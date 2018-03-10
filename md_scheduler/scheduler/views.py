from django.shortcuts import render
from django.http import HttpResponse
from django.http import JsonResponse
from scheduler.utils import program_calculator
from scheduler.utils import weeks
import json


def index(request):
    context = {
        "all_weeks" : [e.name.replace("_", " (") + ")" for e in weeks.Weeks],
        "row_1_months" : ["May", "June", "July", "August", "September", "October"],
        "row_2_months" : ["November", "December", "January", "February", "March", "April"],
        "row_3_months" : ["May", "June", "July"],
        "row_1_activities" : [[1, 2, 3, 4], [1, 2, 3, 4], [1, 2, 3, 4], [1, 2, 3, 4], [1, 2, 3, 4], [1, 2, 3, 4]],
        "row_2_activities" : [[1, 2, 3, 4], [1, 2, 3, 4], [1, 2, 3, 4], [1, 2, 3, 4], [1, 2, 3, 4], [1, 2, 3, 4]],
        "row_3_activities" : [[1, 2, 3, 4], [1, 2, 3, 4], [1, 2, 3, 4]],
    }

    return render(request, 'scheduler/index.html', context)


def generate_programs(request):
    # check request type
    if request.method != "POST":
        return JsonResponse({"success": False})

    # get request data
    params = json.loads(request.body)

    # check request size
    if params.get("size", 0) < 1:
        return JsonResponse({"success": False})

    # return programs
    data = program_calculator.get_schedules_json(params)
    return JsonResponse(data)


def about(request):
    context = {}
    return render(request, 'scheduler/about.html', context)