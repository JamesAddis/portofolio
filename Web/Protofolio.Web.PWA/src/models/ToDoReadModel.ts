import{ToDoObjectiveReadModel} from "./ToDoObjectiveReadModel";

export class ToDoReadModel {
    public id:number = null;
    
    public name:string = "";
    public summary:string = "";
    public objectives: ToDoObjectiveReadModel[] = [];

    public dateUpdated:Date =null;
    public dateCreated:Date = null;
    public userCreatedID:string= "";
    public userUpdatedID:string= "";

    public static convert(details:any){
        let model = new ToDoReadModel();
        model.id = details.id;
        model.dateCreated =details.dateCreated;
        model.dateUpdated= details.dateUpdated;
        model.name = details.name;
        model.summary = details.summary;
        model.userCreatedID =details.userCreatedID;
        model.userUpdatedID = details.userUpdatedID;
        model.objectives = (typeof details.objectives !== 'undefined' 
            && details.objectives instanceof Array ? 
            details.objectives : [])
                .map((x:any)=>(ToDoObjectiveReadModel.convert(x)));
        return model;
    }
}