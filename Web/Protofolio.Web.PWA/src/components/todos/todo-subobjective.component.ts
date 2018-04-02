import {Input, Output, EventEmitter, Component} from "@angular/core";
import { FormGroup, FormControl, Validators } from '@angular/forms';
import{ IToDoSubObjectiveInputModel} from "./../../models/ToDoInputModel";
@Component({
    selector:"todo-subobjective",
    template:"./todo-subobjective.component.html"
})
export class TodoSubObjectiveComponent{
    
    @Input()
    public subObjective:FormGroup;
    @Input()
    public objectiveIndex:number;
    @Input()
    public subObjectiveIndex:number;
    @Output()
    public removed:EventEmitter<any> = new EventEmitter();
    @Input()
    public validationErrors:{name:string, message:string}[];

    public get subobjectiveClass(){
        return this.subObjective.controls.Complete.value === true ? "todo-complete" : "";
    }

    public get nameAttrPrefix(){
        return `Objectives[${this.objectiveIndex}].SubObjectives[${this.subObjectiveIndex}]`;
    }

    public get IdAttrPrefix(){
        return `Objectives_${this.objectiveIndex}__SubObjectives_${this.subObjectiveIndex}_`;
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

    public remove($event:any){
        $event.stopPropogation();
        this.removed.emit(this.subObjectiveIndex);
        return  false;
    }
}