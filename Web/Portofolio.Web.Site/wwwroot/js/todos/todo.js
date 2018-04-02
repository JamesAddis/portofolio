(function($, document){
    
    function generateRules(){
        var rules={
            name:{ 
                required:true, 
                minlength:3, 
                maxlength:250
            },
            summary:{
                maxlength:500
            }
        };
        var messages={
            username:{
                required:"Name required",
                minlength:"Name is at least 3 characters long",
                maxlength:"Name cannot be more than 250 characters long"
            },
            summary:{
                required:"Summary",
                maxlength:"Summary cannot be more than 500 characters long"
            }
        };

        for(var c=0, d=$("#Objectives").length; c<d; c++){
            var objectiveName = "Objectives["+ c + "]";
            rules[objectiveName+".Name"]= { 
                required:true, 
                minlength:3, 
                maxlength:250
            };
            messages[objectiveName + ".Name"] = {
                required:"Name required",
                minlength:"Name is at least 3 characters long",
                maxlength:"Name cannot be more than 250 characters long"
            };
            rules[objectiveName+".Summary"]= { 
                maxlength:500
            };
            messages[objectiveName + ".Summary"] = {
                maxlength:"Summary cannot be more than 500 characters long"
            };
            for(var e=0, f=$("#Objectives_"+c+"__SubObjectives > li").length; e<f; e++){
                var subObjectiveName =objectiveName+ ".SubObjectives["+e+"]";
                rules[subObjectiveName+".Name"]= { 
                    required:true, 
                    minlength:3, 
                    maxlength:250
                }; 
                messages[subObjectiveName + ".Name"] = {
                    required:"Name required",
                    minlength:"Name is at least 3 characters long",
                    maxlength:"Name cannot be more than 250 characters long"
                };
                rules[subObjectiveName+".Summary"]= { 
                    maxlength:500
                };
                messages[subObjectiveName + ".Summary"] = {
                    maxlength:"Summary cannot be more than 500 characters long"
                };
            }
        }
        return {rules:rules, messages:messages};
    }

    function setupValidation(){
        var result = generateRules();
        $("#login-form")
            .validate({
                rules:result.rules,
                messages:result.messages,
                errorElement: "em",
                errorPlacement: function ( error, element ) {
                    // Add the `help-block` class to the error element
                    error.addClass("help-block");

                    if (element.prop( "type" ) === "checkbox") {
                        error.insertAfter(element.parent("label"));
                    } else {
                        error.insertAfter(element);
                    }
                },
                highlight: function (element, errorClass, validClass) {
                    $(element)
                    .parents(".form-group")
                    .addClass("has-error")
                    .removeClass("has-success");
                },
                unhighlight: function (element, errorClass, validClass) {
                    $(element)
                    .parents(".form-group")
                    .addClass("has-success")
                    .removeClass("has-error");
                }
            });
    }

    function addObjective($event){
        $event.preventDefault();

        var i= $("#Objectives").length;

        if(i < 10){
            var objectiveName = "Objectives["+ i + "]",
                objectiveID = "Objectives_"+ i + "_",
                subObjectiveID =objectiveID +"_SubObjectives",
                subObjectiveName = objectiveName +".SubObjectives";
            var nameInputDiv =$("<div></div>")
                .addClass("form-group")
                .append($("<label>Name</label>")
                    .addClass("control-label")
                    .addClass("col-md-2")
                    .attr("for",objectiveID+"_Name"))
                .append($("<div></div>")
                    .addClass("col-md-10")
                    .append($("<input/>")
                        .addClass("form-control")
                        .attr("id", objectiveID+"_Name")
                        .attr("name", objectiveName+".Name")
                        .attr("required","")
                        .attr("minlength",3)
                        .attr("maxlength",250)
                        .attr("aria-describedby", objectiveID+"_Name-error")))
                .append($("<em></em>")
                    .addClass("field-validation-valid")
                    .addClass("help-block")
                    .attr("id", objectiveID+"_Name-error"));
                    
            var summaryInputDiv =$("<div></div>")
                .addClass("form-group")
                .append($("<label>Summary</label>")
                    .addClass("control-label")
                    .addClass("col-md-2")
                    .attr("for",objectiveID+"_Summary"))
                .append($("<div></div>")
                    .addClass("col-md-10")
                    .append($("<textarea></textarea>")
                        .addClass("form-control")
                        .attr("id", objectiveID+"_Summary")
                        .attr("name", objectiveName+".Summary")
                        .attr("maxlength",500)
                        .attr("aria-describedby", objectiveID+"_Summary-error")))
                .append($("<em></em>")
                    .addClass("field-validation-valid")
                    .addClass("help-block")
                    .attr("id", objectiveID+"_Summary-error"));
            var completeInputDiv =$("<div></div>")
                .addClass("form-group")
                .append($("<label></label>")
                    .addClass("control-label")
                    .addClass("col-md-2")
                    .attr("for",objectiveID+"_Complete")
                    .append($("<input/>")
                        .attr("id", objectiveID+"_Complete")
                        .attr("name", objectiveName+".Complete")
                        .attr("value", true))
                        .attr("aria-describedby", objectiveID+"_Complete-error"))
                .append($("<em></em>")
                    .addClass("field-validation-valid")
                    .addClass("help-block")
                    .attr("id", objectiveID+"_Complete-error"));
            var subObjectiveFieldSet =$("<fieldset></fieldset>")
                .append($("<legend></legend>")
                    .text("Sub-Objectives")
                    .attr("id","lbl-"+ subObjectiveID))
                .append($("<ol></ol>")
                    .attr(subObjectiveID))
                .append($("<button></button>")
                    .addClass("btn")
                    .addClass("btn-default")
                    .attr("type","submit")
                    .on("click", addSubObjectiveEvent)
                    .append($("<i></i>")
                        .addClass("fa")
                        .addClass("fa-plus")
                        .attr("aria-hidden",true))
                    .append($("<span></span>")
                        .addClass("sr-only")
                        .text("Add Sub-Objective")));
            var removeButton =$("<button></button>")
                .addClass("btn")
                .addClass("btn-danger")
                .append($("<i></i>")
                    .addClass("fa")
                    .addClass("fa-trash")
                    .attr("aria-hidden",true))
                .append($("<span></span>")
                    .addClass("sr-only")
                    .text("Remove Objective"))
                .on("change", removeObjective);
            $("#Objectives > ol")
                .append($("<li></li>")
                    .append(nameInputDiv)
                    .append(summaryInputDiv)
                    .append(completeInputDiv)
                    .append(subObjectiveFieldSet)
                    .append(removeButton));
            setupValidation();
        }
        
        return false;
    }
    
    function removeObjective($event){
        $event.preventDefault();
        // remove Objective
        $(this).parents("li").remove();
        // reset ids and names for objectives and subobjectives
        $("#Objectives >li").each(function(el,i){
            var objectiveID = "Objectives_" +i +"_",
                objectiveName = "Objectives["+i +"]";
                $(el).find("[id^='Objectives_']").each(function(el2,j){
                    $(el2).attr("id", "Objectives_"+ i+ /Objectives_\d+(.+)/.exec($(el2).attr("id"))[1]);
                });
                $(el).find("[for^='Objectives_']").each(function(el2,j){
                    $(el2).attr("for", "Objectives_"+ i+ /Objectives_\d+(.+)/.exec($(el2).attr("for"))[1]);
                });
                $(el).find("[name^='Objectives[']").each(function(el2, j){
                    $(el2).attr("name", "Objectives["+ i+ /Objectives\[\d+(.+)/.exec($(el2).attr("name"))[1]);
                });
                
                $(el).find("[aria-describedby^='Objectives_']").each(function(el2, j){
                    $(el2).attr("aria-describedby", "Objectives_"+ i+ /Objectives_\d+(.+)/.exec($(el2).attr("aria-describedby"))[1]);
                });
                $(el).find("legend").attr("id","lbl-Objectives_" + i + "__SubObjectives");
        });
        setupValidation();
        return false;
    }
    
    
    function removeSubObjective($event){
        $event.preventDefault();
        var subObjectivesList= $(this).parents("ol");
        // remove subobjectives
        $(this).parents("li").remove();
        // reset ids and names for subobjectives
        subObjectivesList.find("li").each(function(el,j){
            var i= /Objectives_\d+__SubObjectives_(\d+)__Summary/.exec($(el).find("textarea").attr("id"))[1];
            $(el).find("[name]").each(function(el2, k){
               var propName= /Objectives\[\d+\]\.SubObjectives\[\d+\]\.(.+)/.exec($(el2).attr("name"))[1],
                    propID ="Objectives_"+ i + "__SubObjectives_"+j +"__" +propName,
                    errorMessageID ="Objectives_"+ i + "__SubObjectives_"+j +"__" +propName+"-error";
                $("#"+$(el2).attr("aria-describedby")).attr("id",errorMessageID);
                $("label[for='"+$(el2).attr("id")+"']").attr("for",propID);
                $(el2)
                    .attr("id", propID)
                    .attr("name",  "Objectives["+ i + "].SubObjectives["+j +"]." +propName)
                    .attr("aria-describedby", errorMessageID);
            });
        });
        setupValidation();
        return false;
    }

    function addSubObjective($event){
        var i =/Objectives_(\d+)__SubObjectives/.exec($(this)
            .parents("[id$=_SubObjectives]")
            .attr("id"))[1],
        subObjectiveID= "Objectives_"+ i +"__SubObjectives_" + j+ "_",
        subObjectiveName= "Objectives["+ i +"].SubObjectives[" + j +"]",
        j =$("#Objectives_" + i+"__SubObjectives > li").length;

        if(j < 10){
            $("#Objectives_" + i+"__SubObjectives")
            .append($("<li></li>")
                .append($("<div></div>")
                    .addClass("form-group")
                    .append($("<label>Name</label>")
                        .addClass("control-label")
                        .addClass("col-md-2")
                        .attr("for",subObjectiveID+"_Name"))
                    .append($("<div></div>")
                        .addClass("col-md-10")
                        .append($("<input/>")
                            .addClass("form-control")
                            .attr("id", subObjectiveID+"_Name")
                            .attr("name", subObjectiveName+".Name")
                            .attr("required","")
                            .attr("minlength",3)
                            .attr("maxlength",250)
                            .attr("aria-describedby", subObjectiveID+"_Name-error")))
                    .append($("<em></em>")
                        .addClass("field-validation-valid")
                        .addClass("help-block")
                        .attr("id", subObjectiveID+"_Name-error")))
                .append($("<div></div>")
                    .addClass("form-group")
                    .append($("<label>Summary</label>")
                        .addClass("control-label")
                        .addClass("col-md-2")
                        .attr("for",subObjectiveID+"_Summary"))
                    .append($("<div></div>")
                        .addClass("col-md-10")
                        .append($("<textarea></textarea>")
                            .addClass("form-control")
                            .attr("id", subObjectiveID+"_Summary")
                            .attr("name", subObjectiveName+".Summary")
                            .attr("maxlength",500)
                            .attr("aria-describedby", subObjectiveID+"_Summary-error")))
                    .append($("<em></em>")
                        .addClass("field-validation-valid")
                        .addClass("help-block")
                        .attr("id", subObjectiveID+"_Summary-error")))
                .append($("<div></div>")
                    .addClass("form-group")
                    .append($("<label></label>")
                        .addClass("control-label")
                        .addClass("col-md-2")
                        .attr("for",objectiveID+"_Complete")
                        .append($("<input/>")
                            .attr("id", subObjectiveID+"_Complete")
                            .attr("name", subObjectiveName+".Complete")
                            .attr("value", true))
                            .attr("aria-describedby", subObjectiveID+"_Complete-error"))
                    .append($("<em></em>")
                        .addClass("field-validation-valid")
                        .addClass("help-block")
                        .attr("id", subObjectiveID+"_Complete-error"))));
            setupValidation();
        }

        return false;
    }

    $(document).ready(setupValidation);
})(jQuery,document);