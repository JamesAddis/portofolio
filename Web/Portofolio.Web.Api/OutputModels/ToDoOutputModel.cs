namespace ToDo.RestApi.OutputModels
{
    public class ToDoOutputModel
    {
        public int ID {get;set;}

        public string Name {get;set;}

        public string Summary {get;set;}

        public ObjectiveOutputModel[] Objectives {get;set;}
    }
}