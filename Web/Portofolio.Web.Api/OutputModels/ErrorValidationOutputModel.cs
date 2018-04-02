using System.Collections.Generic;

namespace ToDo.RestApi.OutputModels
{
    public class ErrorOutputModel
    {
        public class ValidationErrorOutputModel
        {
            public string Name { get; set; }
            
            public string Message { get; set; }
        }

        public ErrorOutputModel()
        {
            ValidationErrors = new List<ValidationErrorOutputModel>();
        }

        public string Message { get; set; }

        public IList<ValidationErrorOutputModel> ValidationErrors { get; set; }
    }
}