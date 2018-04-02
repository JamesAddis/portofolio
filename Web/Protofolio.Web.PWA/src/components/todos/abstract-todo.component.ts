import { IToDoInputModel } from "../../models/ToDoInputModel";
import { FormGroup, FormControl, Validators, FormArray } from "@angular/forms";
import {Router} from "@angular/router";

export class AbstractTodoComponent{
    
    public inputModel:FormGroup;
    public message:string;
    public messageClass:string;
    public errorTitle:string;
    public errorLink:string;

    public status:string= "loading";

    constructor(protected router:Router){

    }

    protected errorPage(title:string, message:string, link?:string){
        this.errorTitle =title;
        this.message = message;
        if(typeof link === 'string' && link.trim().length > 0){
            this.errorLink =link;
        } else{
            this.errorLink = null;
        }
        this.status = "errorPage";
    }

    public routeDataError(err:any){
        if(typeof err == 'object'){
            this.errorPage(err.title, err.message, err.link);
        } else{
            this.router.navigate(["/error"], {skipLocationChange:true});
        }
    }

    public ngOnInit(){
        // setup form with validation
        this.inputModel = new FormGroup({
            name:new FormControl('', [
                Validators.required, 
                Validators.minLength(3), 
                Validators.maxLength(250)
            ]),
            summary: new FormControl('', [Validators.maxLength(500)]),
            objectives: new FormArray([
                new FormGroup({
                    name: new FormControl('', [
                        Validators.required, 
                        Validators.minLength(3), 
                        Validators.maxLength(250)
                    ]),
                    summary: new FormControl('',[Validators.maxLength(500)]),
                    complete: new FormControl(false),
                    subObjectives: new FormArray([
                        new FormGroup({
                            name: new FormControl('',[
                                Validators.required, 
                                Validators.minLength(3), 
                                Validators.maxLength(250)
                            ]),
                            summary: new FormControl('',[Validators.maxLength(500)]),
                            complete: new FormControl(false)
                        })
                    ])
                }),
            ])
        });
    }

    public addObjective($event:any){
        $event.stopPropogation();
        let objs =(this.inputModel.controls.objectives as FormArray);
        if(objs.length >= 10){
            return false;
        }
        objs.push(new FormGroup({
            name:new FormControl('',[
                Validators.required, 
                Validators.minLength(3), 
                Validators.maxLength(250)
            ]),
            summary: new FormControl('',[Validators.maxLength(500)]),
            complete: new FormControl(false),
            subObjectives:new FormArray([])
        }));
        return false;
    }

    public removeObjective(index:number,$event:any){
        $event.stopPropogation();
        let objs= (this.inputModel.controls.Objectives as FormArray);
        
        if(objs.length < index){
            return false;
        }

        objs.removeAt(index);

        return false;
    }
    
    public addSubObjective(index:number){
        let objs =(this.inputModel.controls.Objectives as FormArray);
        
        if(objs.length <= index){
            return;
        }

        let subObjs = ((objs.controls[index] as FormGroup)
            .controls.subObjectives as FormArray);
        
        if(subObjs.length >= 10){
            return;
        }

        subObjs.push(new FormGroup({
            name:new FormControl('',[
                Validators.required, 
                Validators.minLength(3), 
                Validators.maxLength(250)
            ]),
            summary: new FormControl('', [Validators.maxLength(500)]),
            complete: new FormControl(false)
        }));
    }
    
    public removeSubObjective(
        objectiveIndex:number, 
        subObjectiveIndex:number){
        let objs =(this.inputModel.controls.objectives as FormArray);
        
        if(objs.length <= objectiveIndex){
            return;
        }

        let subObjs= ((objs.controls[objectiveIndex] as FormGroup)
            .controls.subObjectives as FormArray);
        
        if(subObjs.length <= subObjectiveIndex){
            return;
        }
        
        subObjs.removeAt(subObjectiveIndex);
    }
}