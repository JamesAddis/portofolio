namespace ToDo.RestApi.Validators
{
    public class ToDoValidator :AbstractValidator<ToDoInputModel>
    {
        public ToDoValidator()
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
            RulesFor(x=>x.Objectives)
                .NotNull()
                .Validator<ToDoObjectiveValidator>()
                .MaxLength(10);
        }
    }
}