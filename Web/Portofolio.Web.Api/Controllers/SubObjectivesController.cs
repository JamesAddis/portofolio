using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System;

namespace ToDo.RestApi.Controllers
{
    public class SubObjectivesController : Controller
    {
        #region Private Members

        private readonly ILogger logger;
        private readonly IHostingEnvironment env;

        #endregion

        #region Constructors

        public SubObjectivesController(ILogger<SubObjectivesController> logger, IHostingEnvironment env)
        {
            this.logger = logger ?? throw new ArgumentNullException(nameof(logger));
            this.env = env ?? throw new ArgumentNullException(nameof(env));
        }

        #endregion

        #region Private Methods

        private async Task<IActionResult> BasicAction(
            ITodoReadService readService,
            int id,
            int index,
            Func<IToDo,Task<IActionResult>> action, 
            string timeout, 
            string error,
            CancellationToken cancellationToken)
        {
            if(index < 1)
                return StatusCode(400, ToError(Constants.Messages.Objectives.BadRequest));
            if(subIndex < 1)
                return StatusCode(400, ToError(Constants.Messages.SubObjectives.BadRequest));
            IToDo readModel = null;
            
            try
            {
                readModel = await readService.GetByIDAsync(id,cancellationToken);
            }
            catch(TimeoutException)
            {
                if(env.IsDevelopment())
                    throw;
                return StatusCode(408, ToError(timeout));
            }
            catch(TaskCancelException)
            {
                throw;
            }
            catch(Exception ex)
            {
                if(env.IsDevelopment())
                    throw;
                logger.LogError(ex);
                return StatusCode(500, ToError(error));
            }

            if(readModel == null)
                return ToDoNotFound(id);
            if(readModel.DateDeleted.HasValue)
                return ToDoDeleted(id);
            if(readModel.Objectives?.Any() !=true || readModel.Objectives?.Count() < index)
                return ToDoObjectiveNotFound(id, index);
            
            return await action(readModel);
        }

        private IActionResult ToDoObjectiveNotFound(int id, int index)
        {
            Response.Headers.Add("X-Objective-Not-Found", index.ToString());
            return StatusCode(404, new ErrorOutputModel(string.Format(Constants.Messages.ObjectiveNotFound, index)));
        }

        private IActionResult ToDoSubObjectiveNotFound(int id, int index, int subIndex)
        {
            Response.Headers.Add("X-Sub-Objective-Not-Found", subIndex.ToString());
            return StatusCode(404, new ErrorOutputModel(string.Format(Constants.Messages.SubObjectiveNotFound, index, subIndex)));
        }

        private void SetCreatedOrUpdatedHeader(bool created,int id, int index, int subIndex)
        {
            Response.Headers.Add("X-Updated", id.ToString());
            Response.Headers.Add("X-Updated-Objective", index.ToString());
            Response.Headers.Add(created ? "X-Sub-Objective-Created" :"X-Sub-Objective-Updated", index.ToString());
        }

        private void SetDeletedHeader(int id, int index, int subIndex)
        {
            Response.Headers.Add("X-Updated", id.ToString());
            Response.Headers.Add("X-Objective", index.ToString());
            Response.Headers.Add("X-Sub-Objective-Deleted", subIndex.ToString());
        }

        private string CreatedUrl(int id, int index, int subIndex)
        {
            return string.Format("~/api/todos/{0}/objectives/{1}/subobjectives/{2}", id, index, subIndex);
        }

        private async Task<IActionResult> CreatedSubObjective(
            ITodoReadService readService,
            IMapper mapper,
            int id,
            int index,
            int subIndex,
            CancellationToken cancellationToken)
        {
              
            try
            {
               var readModel = await readService.GetByIDAsync(id,cancellationToken);

                if(readModel == null)
                {
                    Response.Headers["Location"]= CreatedUrl(id, index, subIndex);
                    SetCreatedHeader(true, id, index);
                    return ToDoNotFound(id);
                }
                if(readModel.DateDeleted.HasValue)
                {
                    Response.Headers["Location"]=CreatedUrl(id, index, subIndex);
                    SetCreatedHeader(true, id, index, subIndex);
                    return ToDoDeleted(id);
                }
                SetLastModified(readModel.DateUpdated);
                return Created(CreatedUrl(id, index, subIndex), mapper.Map<ToDoSubObjectiveOutputModel>(readModel.Objectives[index].SubObjectives[subIndex]));
            }
            catch(TimeoutException)
            {
                Response.Headers["Location"]=CreatedUrl(id, index, subIndex);
                SetCreatedHeader(create, id, index, subIndex);
                return StatusCode(408);
            }
            catch(TaskCancelException)
            {
                throw;
            }
            catch(Exception ex)
            {
                if(env.IsDevelopment())
                    throw;
                logger.LogError(ex, "An error occurred after creating/updating objectives (id: {0}, index: {1})",id,index);
                Response.Headers["Location"]=CreatedUrl(id, index, subIndex);
                SetCreatedHeader(create, id, index, subIndex);
                return StatusCode(500);
            }
        }
        

        #endregion

        #region  Public Methods

        [HttpGet("~/api/todos/{id:int}/objectives/{index:int}/subobjectives")]
        public async Task<IActionResult> GetSubObjectives(
            [FromServices] IMapper mapper,
            [FromServices] ITodoReadService readService,
            [FromRoute] int id, 
            [FromRoute] int index,
            CancellationToken cancellationToken =default(CancellationToken))
        {
            // check required dependencies
            if(mapper == null)
                throw new ArgumentNullException(nameof(mapper));
            if(readService == null)
                throw new ArgumentNullException(nameof(readService));
            if(cancellationToken == null)
                throw new ArgumentNullException(nameof(cancellationToken));
            return await BasicAction(
                readService,
                id,
                index,
                async readModel=>
                {
                    if(lastModified.HasValue && lastModified == readModel.DateUpdated)
                        return StatusCode(304);
                    return Ok(mapper.Map<ToDoSubObjectiveOutputModel>(readModel.Objectives[index].SubObjectives[subIndex]));
                },
                Constants.Messages.SubObjectives.GetTimeout,
                Constants.Messages.SubObjectives.GetError,
                cancellationToken);
        }

        [HttpGet("~/api/todos/{id:int}/objectives/{index:int}/subobjectives/{subIndex:int}")]
        public async Task<IActionResult> GetSubObjective(
            [FromServices] IMapper mapper,
            [FromServices] ITodoReadService readService,
            [FromRoute]int id, 
            [FromRoute]int index, 
            [FromRoute]int subIndex, 
            CancellationToken cancellationToken =default(CancellationToken))
        {
            // check required dependencies
            if(mapper == null)
                throw new ArgumentNullException(nameof(mapper));
            if(readService == null)
                throw new ArgumentNullException(nameof(readService));
            
            if(cancellationToken == null)
                throw new ArgumentNullException(nameof(cancellationToken));
            if(subIndex < 1)
                return StatusCode(400, ToError(Constants.Messages.SubObjectives.BadRequest));

            return await BasicAction(
                readService,
                id, 
                index,
                async readModel=>
                {
                    if(readModel.Objectives[index].SubObjectives?.Any() != true 
                    || readModel.Objectives[index].SubObjectives.Count() < subIndex)
                        return ToDoSubObjectiveNotFound(id, index, subIndex);
            
                    if(lastModified.HasValue && lastModified == readModel.DateUpdated)
                        return StatusCode(304);
                    SetLastModified(readModel.DateUpdated);
                    return Ok(mapper.Map<ToDoSubObjectiveOutputModel>(readModel.Objectives[index].SubObjectives[subIndex]));
                },
                Constants.Messages.SubObjectives.GetPagedTimeout,
                Constants.Messages.SubObjectives.GetPagedError,
                cancellationToken);
        }

        [HttpPut("~/api/todos/{id:int}/objectives/{index:int}/subobjectives/{subIndex:int}")]
        public async Task<IActionResult> PutCreateOrUpdateObjective(
            [FromServices] IMapper mapper,
            [FromServices] ITodoReadService readService,
            [FromServices] ITodoWriteService writeService,
            [FromRoute]int id, 
            [FromRoute]int index,
            [FromRoute]int subIndex,
            [FromBody] ToDoSubObjectiveInputModel inputModel,
            [FromHeader(Name= "If-Unmodfied-Since")] DateTime? lastModified = null,
            CancellationToken cancellationToken =default(CancellationToken))
        {
            // check required dependencies
            if(mapper == null)
                throw new ArgumentNullException(nameof(mapper));
            if(readService == null)
                throw new ArgumentNullException(nameof(readService));
            if(writeService == null)
                throw new ArgumentNullException(nameof(writeService));
            if(cancellationToken == null)
                throw new ArgumentNullException(nameof(cancellationToken));

            if(subIndex < 1)
                return StatusCode(400, ToError(Constants.Messages.SubObjectives.BadRequest));

            return await BasicAction(
                readService,
                id, 
                index,
                async readModel=>
                {
                    if(lastModified.HasValue && lastModified < readModel.DateUpdated)
                        return StatusCode(412, ModelState.ToOutputModel(Constants.Messages.UpdateConflict));
                    if(!ModelState.IsValid)
                        return StatusCode(422, ModelState.ToOutputModel(Constants.Messages.UpdateUnprocessable));
                    bool create = false;
                    int newIndex =subIndex;
                    try
                    {
                        if(readModel.Objectives[index].SubObjectives?.Any() !=true || readModel.Objectives[index].SubObjectives?.Count() < index)
                        {
                            create = true;
                        
                            newIndex = await writeService.CreateSubObjectiveAsync(id, index, inputModel,User?.Identity?.Name, cancellationToken);
                        }
                        else
                        {
                            await writeService.UpdateSubObjectiveAsync(id, index, subIndex,inputModel,User?.Identity?.Name, cancellationToken);
                        }
                    }
                    catch(AcceptedException)
                    {
                        return StatusCode(202, AcceptedOutput(commandID));
                    }
                    catch(TimeoutException)
                    {
                        if(env.IsDevelopment())
                            throw;
                        return StatusCode(408, ToError(Constants.Messages.UpdateTimeout));
                    }
                    catch(TaskCancelException)
                    {
                        throw;
                    }
                    catch(ConcurrencyException)
                    {
                        readModel = await readService.GetByIDAsync(id,cancellationToken);

                        if(readModel == null)
                            return ToDoNotFound(id);
                        if(readModel.DateDeleted.HasValue)
                            return ToDoDeleted(id);
                        if(readModel.Objectives?.Any() !=true || readModel.Objectives?.Count() < index)
                            return ToDoObjectiveNotFound(id, index);
                        if(lastModified.HasValue && lastModified < readModel.DateUpdated)
                            return StatusCode(412, ModelState.ToOutputModel(Constants.Messages.UpdateConflict));
                             
                        return StatusCode(409, ModelState.ToOutputModel(Constants.Messages.UpdateConflict));
                    }
                    catch(Exception ex)
                    {
                        if(env.IsDevelopment())
                            throw;
                        logger.LogError(ex);
                        return StatusCode(500, ToError(Constants.Messages.UpdateError));
                    }
                    if(create)
                        return await CreatedSubObjective(readService, mapper, id, index, newIndex, cancellationToken);
                    return await UpdatedSubObjective(readService, mapper, id, index, subIndex, cancellationToken);
                },
                Constants.Messages.SubObjectives.UpdateTimeout,
                Constants.Messages.SubObjectives.UpdateError,
                cancellationToken);
        }

        [HttpPost("~/api/todos/{id:int}/objectives/{index:int}/subobjectives")]
        public async Task<IActionResult> PostCreateObjective(
            [FromServices] ITodoReadService readService,
            [FromServices] ITodoWriteService writeService,
            [FromRoute]int id,
            [FromRoute]int index,
            [FromBody] ToDoSubObjectiveInputModel inputModel,
            [FromHeader(Name= "If-Unmodfied-Since")] DateTime? lastModified = null,
            CancellationToken cancellationToken =default(CancellationToken))
        {
            if(readService == null)
                throw new ArgumentNullException(nameof(readService));
            
            if(writeService == null)
                throw new ArgumentNullException(nameof(writeService));
            
            if(cancellationToken == null)
                throw new ArgumentNullException(nameof(cancellationToken));

            if(index < 1)
                return StatusCode(400);

            ToDoItem readModel = null;

            readModel = await readService.GetByIDAsync(id,cancellationToken);

            if(readModel == null)
                return ToDoNotFound(id);
            if(readModel.DateDeleted.HasValue)
                return ToDoDeleted(id);
            if(readModel.Objectives?.Any() !=true || readModel.Objectives?.Count() < index)
                return ToDoObjectiveNotFound(id, index);
            if(lastModified.HasValue && lastModified < readModel.DateUpdated)
                return StatusCode(412, ModelState.ToOutputModel());
            if(!ModelState.IsValid)
                return StatusCode(422, ModelState.ToOutputModel());

            int subIndex= -1;
            try
            {
                subIndex = await writeService.CreateSubObjectiveAsync(id, index, inputModel,User?.Identity?.Name, cancellationToken);
            }
            catch(AcceptedException)
            {
                return StatusCode(202, AcceptedOutput(commandID));
            }
            catch(ConcurrencyException)
            {
                readModel = await readService.GetByIDAsync(id,cancellationToken);

                if(readModel == null)
                    return ToDoNotFound(id);
                if(readModel.DateDeleted.HasValue)
                    return ToDoDeleted(id);
                if(readModel.Objectives?.Any() !=true || readModel.Objectives?.Count() < index)
                    return ToDoObjectiveNotFound(id, index);
                if(lastModified.HasValue && lastModified < readModel.DateUpdated)
                    return StatusCode(412, ModelState.ToOutputModel());
                    
                return StatusCode(409, ModelState.ToOutputModel());
            }
            return await CreatedSubObjective(readService, mapper, id, index, subIndex, cancellationToken); 
        }
        
        [HttpDelete("~/api/todos/{id:int}/objectives/{index:int}/subobjectives/{subIndex:int}")]
        public async Task<IActionResult> DeleteRemoveObjective(
            [FromServices] ITodoReadService readService,
            [FromServices] ITodoWriteService writeService,
            [FromRoute]int id, 
            [FromRoute]int index,
            [FromRoute]int subIndex,
            [FromHeader(Name= "If-Unmodfied-Since")] DateTime? lastModified = null,
            CancellationToken cancellationToken = default(CancellationToken))
        {
            if(readService == null)
                throw new ArgumentNullException(nameof(readService));
            
            if(writeService == null)
                throw new ArgumentNullException(nameof(writeService));
            
            if(cancellationToken == null)
                throw new ArgumentNullException(nameof(cancellationToken));

            if(index < 1)
                return StatusCode(400);
            if(subIndex < 1)
                return StatusCode(400);
            ToDoItem readModel = null;

            readModel = await readService.GetByIDAsync(id,cancellationToken);

            if(readModel == null)
                return ToDoNotFound(id);
            if(readModel.DateDeleted.HasValue)
                return ToDoDeleted(id);
            if(readModel.Objectives?.Any() !=true || readModel.Objectives?.Count() < index)
                return ToDoObjectiveNotFound(id, index);
            
            if(readModel.Objectives[index].SubObjectives?.Any() !=true 
            || readModel.Objectives[index].SubObjectives?.Count() < subIndex)
                return ToDoSubObjectiveNotFound(id, index, subIndex);
            if(lastModified.HasValue && lastModified < readModel.DateUpdated)
                return StatusCode(412, ModelState.ToOutputModel());

            try
            {
                await writeService.DeleteSubObjectiveAsync(id, index, subIndex, User?.Identity?.Name, cancellationToken);
            }
            catch(ConcurrencyException)
            {
                readModel = await readService.GetByIDAsync(id,cancellationToken);

                if(readModel == null)
                    return ToDoNotFound(id);
                if(readModel.DateDeleted.HasValue)
                    return ToDoDeleted(id);
                if(readModel.Objectives[index].SubObjectives?.Any() !=true 
                || readModel.Objectives[index].SubObjectives?.Count() < subIndex)
                    return ToDoSubObjectiveNotFound(id, index, subIndex);
                if(lastModified.HasValue && lastModified < readModel.DateUpdated)
                    return StatusCode(412, ModelState.ToOutputModel());
                    
                return StatusCode(409, ModelState.ToOutputModel());
            }
               
            return NoContent();
        }
        
        [HttpPatch("~/api/todos/{id:int}/objectives/{index:int}/subobjectives/{subIndex:int}")]
        public async Task<IActionResult> PatchUpdateObjective(
            [FromServices] ITodoReadService readService,
            [FromServices] ITodoWriteService writeService,
            [FromRoute]int id, 
            [FromRoute]int index,
            [FromRoute]int subIndex,
            [FromBody] JsonPatchDocument<ToDoSubObjectiveInputModel> patch,
            [FromHeader(Name= "If-Unmodfied-Since")] DateTime? lastModified = null,
            CancellationToken cancellationToken = default(CancellationToken))
        {
            if(readService == null)
                throw new ArgumentNullException(nameof(readService));
            
            if(writeService == null)
                throw new ArgumentNullException(nameof(writeService));
            
            if(cancellationToken == null)
                throw new ArgumentNullException(nameof(cancellationToken));

            return await BasicAction(
                readService,
                id, 
                index,
                async readModel=>
                {
                    if(readModel.Objectives[index]?.SubObjectives?.Any() != true
                    || readModel.Objectives[index].SubObjectives[subIndex] == null)
                        return ToDoSubObjectiveNotFound(id,index, subIndex);
                    
                    if(lastModified.HasValue && lastModified < readModel.DateUpdated)
                        return StatusCode(412, ModelState.ToOutputModel(Constants.Messages.SubObjectives.UpdateConflict));
                    var inputModel = mapper.Map<ToDoSubObjectiveOutputModel>(readModel.Objectives[index].SubObjectives[subIndex]);
                    patch.ApplyTo(value, ModelState);
                    if(!ModelState.Invalid)
                        return StatusCode(422, ModelState.ToOutputModel(Constants.Messages.SubObjectives.UpdateUnprocessable));
                    try
                    {
                        await writeService.UpdateSubObjectiveAsync(
                            id,
                            index, 
                            subIndex, 
                            inputModel, 
                            User?.Identity?.Name, 
                            cancellationToken);
                    }
                    catch(ConcurrencyException)
                    {
                        readModel = await readService.GetByIDAsync(id,cancellationToken);

                        if(readModel == null)
                            return ToDoNotFound(id);
                        if(readModel.DateDeleted.HasValue)
                            return ToDoDeleted(id);
                        if(readModel.Objectives[index].SubObjectives?.Any() !=true 
                        || readModel.Objectives[index].SubObjectives?.Count() < subIndex)
                            return ToDoSubObjectiveNotFound(id, index, subIndex);
                        if(lastModified.HasValue && lastModified < readModel.DateUpdated)
                            return StatusCode(412, ModelState.ToOutputModel(Constants.Messages.SubObjectives.UpdateConflict));
                            
                        return StatusCode(409, ModelState.ToOutputModel(Constants.Messages.SubObjectives.UpdateConflict));
                    }
                    return UpdatedSubObjective(readService, mapper, id, index, subIndex,cancellationToken);
                },
                Constants.Messages.SubObjectives.UpdateTimeout,
                Constants.Messages.SubObjectives.UpdateError);

            if(index < 1)
                return StatusCode(400);
            if(subIndex < 1)
                return StatusCode(400);
            ToDoItem readModel = null;

            readModel = await readService.GetByIDAsync(id,cancellationToken);

            if(readModel == null)
                return ToDoNotFound(id);
            if(readModel.DateDeleted.HasValue)
                return ToDoDeleted(id);
            if(readModel.Objectives?.Any() !=true || readModel.Objectives?.Count() < index)
                return ToDoObjectiveNotFound(id, index);
            
            if(readModel.Objectives[index].SubObjectives?.Any() !=true 
            || readModel.Objectives[index].SubObjectives?.Count() < subIndex)
                return ToDoSubObjectiveNotFound(id, index, subIndex);
            
              
            try
            {
                readModel = await readService.GetByIDAsync(id,cancellationToken);

                if(readModel == null)
                {
                    SetCreatedOrUpdatedHeader(false, id, index, subIndex);
                    return ToDoNotFound(id);
                }
                if(readModel.DateDeleted.HasValue)
                {
                    SetCreatedOrUpdatedHeader(false, id, index, subIndex);
                    return ToDoDeleted(id);
                }
                if(readModel.Objectives?.Any() !=true || readModel.Objectives?.Count() < index)
                {
                    SetCreatedOrUpdatedHeader(false, id, index, subIndex);
                    return ToDoObjectiveNotFound(id, index);
                }
                if(readModel.Objectives[index].SubObjectives?.Any() !=true 
                || readModel.Objectives[index].SubObjectives?.Count() < subIndex)
                {
                    SetCreatedOrUpdatedHeader(false, id, index, subIndex);
                    return ToDoSubObjectiveNotFound(id, index, subIndex);
                }
                return Ok(readModel.Objectives[index].SubObjectives[subIndex]);
            }
            catch(TimeoutException)
            {
                SetCreatedOrUpdatedHeader(false, id, index, subIndex);
                return StatusCode(408);
            }
            catch(TaskCancelException)
            {
                throw;
            }
            catch(Exception ex)
            {
                if(env.IsDevelopment())
                    throw;
                logger.LogError(ex, "An error occurred after creating/updating sub objectives (id: {0}, index: {1}, subIndex: {2})",id,index,subIndex);
                
                SetCreatedOrUpdatedHeader(false, id, index, subIndex);
                return StatusCode(500);
            }
        }

        #endregion
    }
}