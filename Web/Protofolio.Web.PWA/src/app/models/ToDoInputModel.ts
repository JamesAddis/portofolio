export interface IToDoInputModel{
    summary:string;
    name:string;
    objectives:IToDoObjectiveInputModel[];
}
export interface IToDoObjectiveInputModel{
    summary:string;
    name:string;
    complete:boolean;
    subObjectives: IToDoSubObjectiveInputModel[];
}

export interface IToDoSubObjectiveInputModel{
    summary:string;
    name:string;
    complete:boolean;
}