namespace ToDo.RestApi.Validators
{
    public class ToDoSubObjectiveValidator :AbstractValidator<ToDoSubObjectiveInputModel>
    {
        public ToDoObjectiveValidator()
        {
            Rules();
        }

        private void Rules()
        {
            RulesFor(x=>x.Name)
                .NotNull()
                .Length(0,250);
            RulesFor(x=>x.Summary)
                .NotNull()
                .Length(0,500);
            RulesFor(x=>x.Complete)
                .NotNull();
        }
    }
}