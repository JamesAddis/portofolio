
using Microsoft.AspNetCore.Mvc.ModelBinding;
using System;

namespace ToDo.RestApi.OutputModels
{
    public static class ErrorOutputModelHelpers
    {
        public static void ToError(string message)
        {
            return new ErrorOutputModel
            {
                Message = message
            };
        }
        
        public static void ToOutputModel(this ModelStateDictionary modelState, string message)
        {
            if(modelState == null)
                throw new ArgumentNullException(nameof(modelState));
            
            return new ErrorOutputModel
            {
                Message = message,
                ValidationErrors=  modelState
                    .Where(x=>x.Values.Errors.Any())
                    .SelectMany(x=>x.Values.Errors.Select(y=> new ValidationErrorOutputModel { Name=x.Key, Message= y.ErrorMessage }))
                    .ToArray()
            };
        }
    }
}