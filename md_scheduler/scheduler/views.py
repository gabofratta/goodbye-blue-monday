from django.shortcuts import render
from django.http import HttpResponse
from django.http import JsonResponse
from scheduler.utils import program_calculator
import json


def index(request):
    context = {
        "all_weeks" : ["May1", "May2", "May3", "May4", "Jun1", "Jun2", "Jun3", "Jun4", "Jul1", "Jul2", "Jul3", "Jul4",
                        "Aug1", "Aug2", "Aug3", "Aug4", "Sep1", "Sep2", "Sep3", "Sep4", "Oct1", "Oct2", "Oct3", 
                        "Oct4", "Nov1", "Nov2", "Nov3", "Nov4", "Dec1", "Dec2", "Dec3", "Dec4", "Jan1", "Jan2", 
                        "Jan3", "Jan4", "Feb1", "Feb2", "Feb3", "Feb4", "Mar1", "Mar2", "Mar3", "Mar4", "Apr1", 
                        "Apr2", "Apr3", "Apr4"],
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