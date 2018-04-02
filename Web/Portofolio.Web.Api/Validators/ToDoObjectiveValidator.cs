namespace ToDo.RestApi.Validators
{
    public class ToDoObjectiveValidator :AbstractValidator<ToDoObjectiveInputModel>
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
            RulesFor(x=>x.Objectives)
                .NotNull()
                .Validator<ToDoSubObjectiveValidator>()
                .MaxLength(10);
        }
    }
}