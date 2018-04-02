import { ToDoSubObjectiveReadModel } from "./ToDoSubObjectiveReadModel";

export class ToDoObjectiveReadModel{
    public name:string = "";
    public summary:string = "";
    public complete:boolean =false;
    public subObjectives:ToDoSubObjectiveReadModel[] = [];
    
    public static convert(details:any){
        let model =new ToDoObjectiveReadModel();
        model.name = details.name;
        model.summary = details.summary;
        model.complete =details.complete;
        model.subObjectives= (typeof details.subObjectives !== 'undefined' 
            && details.subObjectives instanceof Array ?
            details.subObjectives : [])
            .map((x:any)=> ToDoSubObjectiveReadModel.convert(x));
        return model;
    }
}