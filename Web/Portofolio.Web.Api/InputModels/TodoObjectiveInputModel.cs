namespace ToDo.RestApi.InputModels
{
    public class ToDoObjectiveInputModel
    {
        public ToDoObjectiveInputModel()
        {
            SubObjectives = new List<ToDoSubObjectiveInputModel>();
        }
        
        public string Name {get;set;}
        public string Summary {get;set;}
        public bool Complete {get;set;}
        public List<ToDoSubObjectiveInputModel> SubObjectives {get;set;}
    }
}