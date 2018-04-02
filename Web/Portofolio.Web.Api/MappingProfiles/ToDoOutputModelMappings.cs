namespace ToDo.RestApi.MappingProfiles
{
    public class ToDoOutputModelMappings : Profile
    {
        public ToDoOutputModelMappings()
        {
            CreateMapping<IToDo,ToDoOutputModel>();
            CreateMapping<IToDoObjective,ToDoObjectiveOutputModel>();
            CreateMapping<IToDoSubObjective,ToDoSubObjectiveOutputModel>();
        }
    }
}