import{ Input, Output, EventEmitter} from "@angular/core";
import {ToDoObjectiveComponent} from "./todo-objective.component";
import{Subscription} from "rxjs/Subscription";
export class TodoEditObjectiveComponent extends ToDoObjectiveComponent{
    @Output()
    public objectiveChanged: EventEmitter<{
            name?:string,
            summary?:string, 
            subObjectives?:{
                index:number,
                name?:string,
                messages?:string, 
                complete?:boolean
            }[]
        }> = new EventEmitter();

    @Input()
    public id:number;

    @Input()
    public lastModifed:Date;

    public nameChange($event){
        super.nameChange($event);
    }
    
    public summaryChange($event){
        super.summaryChange($event);
    }

    public subObjectiveChanged(index:number, changes:{name?:string, summary?:string, complete?:boolean}){

    }
}