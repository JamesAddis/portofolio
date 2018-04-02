import {Input, Output, EventEmitter, Component} from "@angular/core";
import { FormGroup, FormControl, Validators, FormArray } from '@angular/forms';
import {ToDoSubObjectiveReadModel} from "./../../models/ToDoSubObjectiveReadModel";

import{ IToDoObjectiveInputModel} from "./../../models/ToDoInputModel";

@Component({
    selector:"todo-objective",
    template:"./todo-objective.component.html"
})
export class TodoObjectiveComponent{
    
    @Input()
    public objective:FormGroup;

    @Input()
    public objectiveIndex:number;

    @Output()
    public removed:EventEmitter<any> = new EventEmitter();

    @Input()
    public validationErrors:{name:string, message:string}[];

    public get subobjectiveClass(){
        return this.objective.controls.Complete.value === true ? "todo-complete" : "";
    }

    public get nameAttrPrefix(){
        return `Objectives[${this.objectiveIndex}]`;
    }

    public get IdAttrPrefix(){
        return `Objectives_${this.objectiveIndex}_`;
    }

    public get nameNameAttr(){
        return `${this.nameAttrPrefix}.Name`;
    }

    public get nameIdAttr(){
        return `${this.IdAttrPrefix}_Name`;
    }

    public get nameErrorMessageID(){
        return `${this.nameIdAttr}-error`;
    }

    public get summaryNameAttr(){
        return `${this.nameAttrPrefix}.Summary`;
    }

    public get summaryIdAttr(){
        return `${this.IdAttrPrefix}_Summary`;
    }

    public get summaryErrorMessageID(){
        return `${this.summaryIdAttr}-error`;
    }
    
    public get completeNameAttr(){
        return `${this.nameAttrPrefix}.Complete`;
    }

    public get completeIdAttr(){
        return `${this.IdAttrPrefix}_Complete`;
    }

    public get completeErrorMessageID(){
        return `${this.completeIdAttr}-error`;
    }
    
    /**
     * Remove Objective
     * @param $event
     */
    public remove($event:any){
        $event.stopPropogration();
        this.removed.emit(this.objectiveIndex);
        return false;
    }

    /**
     * Add Subobjective
     * @param $event
     */
    public addSubObjective($event:any){
        $event.stopPropogration();

        (this.objective.controls.SubObjectives as FormArray)
            .push(new FormGroup({
                Name:new FormControl('',[
                    Validators.required, 
                    Validators.minLength(3), 
                    Validators.maxLength(250)
                ]),
                Summary: new FormControl('',[Validators.maxLength(500)]),
                Complete:new FormControl(false)
            }));

        return  false;
    }

    /**
     * Remove Subobjective
     * @param $event
     * @param index 
     */
    public removeSubObjective($event:any, index:number){
        $event.stopPropogration();
        (this.objective.controls.SubObjectives as FormArray).removeAt(index);
        return false;
    }
}