from django.shortcuts import render
from django.http import HttpResponse


def index(request):
    context = {
    	#TODO calculate year
    	#TODO add year to month name?
    	#TODO differentiate May, June, July weeks w/ year?
    	#TODO week dates?
    	"fall_year" : "2017",
    	"spring_year" : "2018",
    	"all_weeks" : ["A1", "A2", "A3", "A4", "S1", "S2", "S3", "S4", "O1", "O2", "O3", "O4", "N1", "N2", "N3", 
    					"N4", "D1", "D2", "D3", "D4", "E1", "E2", "E3", "E4", "F1", "F2", "F3", "F4", "M1", "M2", 
						"M3", "M4", "B1", "B2", "B3", "B4"],
    	"row_1_months" : ["May", "June", "July", "August", "September", "October"],
    	"row_2_months" : ["November", "December", "January", "February", "March", "April"],
    	"row_3_months" : ["May", "June", "July"],
    	#TODO fill these up with actual valus:
    	"row_1_activities" : [[1, 2, 3, 4], [1, 2, 3, 4], [1, 2, 3, 4], [1, 2, 3, 4], [1, 2, 3, 4], [1, 2, 3, 4]],
    	"row_2_activities" : [[1, 2, 3, 4], [1, 2, 3, 4], [1, 2, 3, 4], [1, 2, 3, 4], [1, 2, 3, 4], [1, 2, 3, 4]],
    	"row_3_activities" : [[1, 2, 3, 4], [1, 2, 3, 4], [1, 2, 3, 4]],
    }
    return render(request, 'scheduler/index.html', context)

def about(request):
	context = { }
	return render(request, 'scheduler/about.html', context)