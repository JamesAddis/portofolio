namespace ToDo.RestApi.InputModels
{
    public class ToDoCreateInputModel
    {
        public ToDoCreateInputModel()
        {
            Objectives = new List<ToDoObjectiveInputModel>();
        }
        
        public string Name {get;set;}
        public string Summary {get;set;}
        public List<ToDoObjectiveInputModel> Objectives {get;set;}
    }
}