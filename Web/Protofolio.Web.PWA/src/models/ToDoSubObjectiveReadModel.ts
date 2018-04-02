
export class ToDoSubObjectiveReadModel{
    public name:string = "";
    public summary:string = "";
    public complete:boolean =false;
    public static convert(details:any){
        let model = new ToDoSubObjectiveReadModel();
        model.name = details.name;
        model.complete = details.complete;
        model.summary = details.summary;
        return model;
    }
}