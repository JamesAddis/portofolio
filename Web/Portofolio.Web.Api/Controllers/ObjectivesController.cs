namespace ToDo.RestApi.Controllers
{
    public class ObjectivesController : Controller
    {
        #region Private Members

        private readonly ILogger logger;
        private readonly IHostingEnvironment env;

        #endregion

        #region Constructors

        public ObjectivesController(ILogger<ObjectivesController> logger, IHostingEnvironment env)
        {
            this.logger = logger ?? throw new ArgumentNullException(nameof(logger));
            this.env = env ?? throw new ArgumentNullException(nameof(env));
        }

        #endregion

        #region Private Methods

        private IActionResult ToDoObjectiveNotFound(int id, int index)
        {
            Response.Headers.Add("X-Objective-Not-Found", index.ToString());
            return StatusCode(404, new ErrorOutputModel(string.Format(Constants.Messages.ObjectiveNotFound, index)));
        }

        private void SetCreatedOrUpdatedHeader(bool created,int id, int index)
        {
            Response.Headers.Add("X-Updated", id.ToString());
            Response.Headers.Add(created ? "X-Created-Objective" :"X-Updated-Objective", index.ToString());
        }

        private void SetDeletedHeader(int id, int index)
        {
            Response.Headers.Add("X-Updated", id.ToString());
            Response.Headers.Add("X-Deleted-Objective", index.ToString());
        }

        private async Task<IActionResult> CreatedObjective(
            IMapper mapper,
            ITodoReadService readService,
            int id,
            int index,
            CancellationToken cancellationToken)
        {
            try
            {
                var readModel = await readService.GetByIDAsync(id,cancellationToken);

                if(readModel == null)
                {
                    Response.Headers["Location"]=string.Format("~/api/todos/{0}/objectives/{1}", id, index);
                    SetCreatedOrUpdatedHeader(true, id, index);
                    return ToDoNotFound(id);
                }
                if(readModel.DateDeleted.HasValue)
                {
                    Response.Headers["Location"]=string.Format("~/api/todos/{0}/objectives/{1}", id, index);
                    SetCreatedOrUpdatedHeader(true, id, index);
                    return ToDoDeleted(id);
                }
                SetLastModified(readModel.DateUpdated);
                return Created(string.Format("~/api/todos/{0}/objectives/{1}", id, index), readModel.Objectives[index]);
            }
            catch(TimeoutException)
            {
                if(env.IsDevelopment)
                    throw;
                Response.Headers["Location"]=string.Format("~/api/todos/{0}/objectives/{1}", id, index);
                SetCreatedOrUpdatedHeader(create, id, index);
                return StatusCode(408, ToError(Constants.Messages.Objectives.CreatedTimeout));
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
                Response.Headers["Location"]=string.Format("~/api/todos/{0}/objectives/{1}", id, index);
                SetCreatedOrUpdatedHeader(create, id, index);
                return StatusCode(500, ToError(Constants.Messages.Objectives.CreatedError));
            };    
        }

        private async Task<IActionResult> UpdatedObjective(
            IMapper mapper,
            ITodoReadService readService,
            int id, 
            int index, 
            CancellationToken cancellationToken)
        {
            try
            {
                var readModel = await readService.GetByIDAsync(id,cancellationToken);
                
                if(readModel == null)
                    return ToDoNotFound(id);
                if(readModel.DateDeleted.HasValue)
                    return ToDoDeleted(id);
                if(readModel.Objectives?.Any() !=true || readModel.Objectives?.Count() < index)
                    return ToDoObjectiveNotFound(id, index);
                return Ok(mapper.Map<ToDoObjectiveOutputModel>(readModel.Objective[index]);
            }
            catch(TimeoutException)
            {
                if(env.IsDevelopment())
                    throw;
                
                return StatusCode(408, ToError(Constants.Messages.UpdatedTimeout));
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
                return StatusCode(408, ToError(Constants.Messages.UpdatedTimeout));
            }
            finally
            {
                SetUpdatedHeader(id,index);
            }
        }

        private async Task<IActionResult> BasicAction(
            ITodoReadService readService,
            int id,
            Func<IToDo,Task<IActionResult>> action, 
            string timeout, 
            string error,
            CancellationToken cancellationToken)
        {
            if(index < 1)
                return StatusCode(400, ToError(Constants.Messages.Objectives.BadRequest));
            
            IToDo readModel = null;
            
            try
            {
                readModel = await readService.GetByIDAsync(id,cancellationToken);
            }
            catch(TimeoutException)
            {
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
            
            return await action(readModel);
        }

        #endregion

        #region Public Methods

        [HttpGet("~/api/todos/{id:int}/objectives/{index:int}")]
        public async Task<IActionResult> GetObjective(
            [FromServices] IMapper mapper,
            [FromServices] ITodoReadService readService,
            [FromRoute]int id, 
            [FromRoute]int index,
            [FromHeader(Name= Constants.Headers.ModifiedSince)] DateTime? lastModified = null,
            CancellationToken cancellationToken =default(CancellationToken))
        {
            if(mapper == null)
                throw new ArgumentNullException(nameof(mapper));
            
            if(readService == null)
                throw new ArgumentNullException(nameof(readService));
            
            if(cancellationToken == null)
                throw new ArgumentNullException(nameof(cancellationToken));

            return await BasicAction(
                readModel,
                id,
                async readModel=>
                {
                    if(readModel.Objectives?.Any() !=true || readModel.Objectives?.Count() < index)
                        return ToDoObjectiveNotFound(id, index);
                    if(lastModified.HasValue && readModel.DateUpdated == lastModified)
                        return StatusCode(304);
                    SetLastModified(readModel.DateUpdated);
                    return Ok(mapper.Map<ToDoObjectiveOutputModel>(readModel.Objectives[index]));
                },
                Constants.Messages.Objectives.GetTimeout,
                Constants.Messages.Objectives.GetError,
                cancellationToken);
        }

        [HttpGet("~/api/todos/{id:int}/objectives")]
        public async Task<IActionResult> GetObjectives(
            [FromServices] IMapper mapper,
            [FromServices] ITodoReadService readService,
            [FromRoute]int id,
            [FromHeader(Name= Constants.Headers.ModifiedSince)] DateTime? lastModified = null,
            CancellationToken cancellationToken =default(CancellationToken))
        {
            if(mapper == null)
                throw new ArgumentNullException(nameof(readService));
            if(readService == null)
                throw new ArgumentNullException(nameof(readService));
            if(cancellationToken == null)
                throw new ArgumentNullException(nameof(cancellationToken));

            return await BasicAction(
                readService,
                id,
                async readModel=>
                {
                    if(lastModified.HasValue && readModel.DateUpdated == lastModified)
                        return StatusCode(304);
                    SetLastModified(readModel.DateUpdated);
                    return Ok(readModel.Objectives.Select(x=>mapper.Map<ToDoObjectiveOutputModel>(x).ToArray()));
                },
                Constants.Messages.Objectives.GetTimeout,
                Constants.Messages.Objectives.GetError,
                cancellationToken);
        }

        [HttpPut("~/api/todos/{id:int}/objectives/{index:int}")]
        public async Task<IActionResult> PutCreateOrUpdateObjective(
            [FromServices] IMapper mapper,
            [FromServices] ITodoReadService readService,
            [FromServices] ITodoWriteService writeService,
            [FromRoute]int id, 
            [FromRoute]int index,
            [FromBody] ToDoObjectiveInputModel inputModel,
            [FromHeader(Name= Constants.Headers.UnmodifiedSince)] DateTime? lastModified = null,
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

            return await BasicAction(
                readService,
                id,
                async readModel=>
                {
                    if(lastModified.HasValue && lastModified < readModel.DateUpdated)
                        return StatusCode(412, ModelState.ToOutputModel(Constants.Messages.Objectives.UpdateConflict));
                    if(!ModelState.IsValid)
                        return StatusCode(422, ModelState.ToOutputModel(Constants.Messages.Objectives.UpdateConflict));
                    var create = false;
                    int createdIndex= index;
                    try
                    {
                        if(readModel.Objectives?.Any() !=true || readModel.Objectives?.Count() < index)
                        {
                            create = true;
                        
                            createdIndex= await writeService.CreateObjectiveAsync(id, index, inputModel, User?.Identity?.Name, cancellationToken);
                        }
                        else
                        {
                            await writeService.UpdateObjectiveAsync(id, index, inputModel, User?.Identity?.Name, cancellationToken);
                        }
                    }
                    catch(TimeoutException)
                    {
                        if(env.IsDevelopment())
                            throw;
                        return StatusCode(408, ToError(Constants.Messages.Objectives.UpdateTimeout));
                    }
                    catch(ConcurrencyException)
                    {
                        readModel = await readService.GetByIDAsync(id,cancellationToken);

                        if(readModel == null)
                            return ToDoNotFound(id);
                        if(readModel.DateDeleted.HasValue)
                            return ToDoDeleted(id);
                        if(lastModified.HasValue && lastModified < readModel.DateUpdated)
                            return StatusCode(412, ModelState.ToOutputModel(Constants.Messages.Objectives.UpdateConflict));
                            
                        return StatusCode(409, ModelState.ToOutputModel(Constants.Messages.Objectives.UpdateConflict));
                    }
                    catch(Exception ex)
                    {
                        if(env.IsDevelopment())
                            throw;
                        return StatusCode(500, ToError(Constants.Messages.Objectives.UpdateError));
                    }
                    if(create)
                        return CreatedObjective(mapper, readModel, id, createdIndex, cancellationToken);
                    return UpdatedObjective(mapper, readService, id,index, cancellationToken);
                },
                Constants.Messages.Objectives.UpdateTimeout,
                Constants.Messages.Objectives.UpdateError,
                cancellationToken);
        }

        [HttpPost("~/api/todos/{id:int}/objectives")]
        public async Task<IActionResult> PostCreateObjective(
            [FromServices] IMapper mapper,
            [FromServices] ITodoReadService readService,
            [FromServices] ITodoWriteService writeService,
            [FromRoute]int id,
            [FromBody] ToDoObjectiveInputModel inputModel,
            [FromHeader(Name= Constants.Headers.UnmodifiedSince)] DateTime? lastModified = null,
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

            return await BasicAction(
                readService,
                id,
                async readModel=>
                {
                    if(lastModified.HasValue && lastModified < readModel.DateUpdated)
                        return StatusCode(412, ModelState.ToOutputModel(Constants.Messages.Objectives.CreateConflict));
                    if(!ModelState.IsValid)
                        return StatusCode(422, ModelState.ToOutputModel(Constants.Messages.Objectives.CreateUnprocessable));

                    int index= 1;
                    try
                    {
                        index = await writeService.CreateObjectiveAsync(
                            id,
                            inputModel, 
                            User?.Identity?.Name, 
                            cancellationToken);
                    }
                    catch(TimeoutException)
                    {
                        if(env.IsDevelopment)
                            throw;
                        return StatusCode(408, ToError(Constants.Messages.Objectives.CreateTimeout));
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
                        if(lastModified.HasValue && lastModified < readModel.DateUpdated)
                            return StatusCode(412, ModelState.ToOutputModel(Constants.Messages.Objectives.CreateConflict));
                            
                        return StatusCode(409, ModelState.ToOutputModel(Constants.Messages.Objectives.CreateConflict));
                    }
                    catch(Exception ex)
                    {
                        if(env.IsDevelopment())
                            throw;

                        logger.LogError(ex, "An error occurred whilst attempting to get create objective");
                        return StatusCode(500, ToError(Constants.Messages.Objectives.CreateError));
                    }
                    
                    return await CreatedObjective(mapper,readService, id, index,cancellationToken);
                },
                Constants.Messages.Objectives.CreateTimeout,
                Constants.Messages.Objectives.CreateError,
                cancellationToken);
        }
        
        [HttpDelete("~/api/todos/{id:int}/objectives/{index:int}")]
        public async Task<IActionResult> DeleteRemoveObjective(
            [FromServices] ITodoReadService readService,
            [FromServices] ITodoWriteService writeService,
            [FromRoute] int id, 
            [FromRoute] int index,
            [FromHeader(Name= Constants.Headers.UnmodifiedSince)] DateTime? lastModified = null,
            CancellationToken cancellationToken =default(CancellationToken))
        {
            if(mapper == null)
                throw new ArgumentNullException(nameof(mapper));
            if(readService == null)
                throw new ArgumentNullException(nameof(readService));
            
            if(writeService == null)
                throw new ArgumentNullException(nameof(writeService));
            
            if(cancellationToken == null)
                throw new ArgumentNullException(nameof(cancellationToken));

            return await BasicAction(
                readService,
                id,
                async readModel=>
                {
                    if(readModel.Objectives?.Any() !=true || readModel.Objectives?.Count() < index)
                        return ToDoObjectiveNotFound(id, index);
                    
                    try
                    {
                        await writeService.DeleteObjectiveAsync(id, index, User?.Identity?.Name, cancellationToken);
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
                            return StatusCode(412, ModelState.ToOutputModel(Constants.Messages.Objectives.DeleteConflict));
                            
                        return StatusCode(409, ModelState.ToOutputModel(Constants.Messages.Objectives.DeleteConflict));
                    }
                    
                    return NoContent();
                },
                Constants.Messages.Objectives.DeleteTimeout,
                Constants.Messages.Objectives.DeleteError,
                cancellationToken);
        }
        
        [HttpPatch("~/api/todos/{id:int}/objectives/{index:int}")]
        public async Task<IActionResult> PatchUpdateObjective(
            [FromServices] ITodoReadService readService,
            [FromServices] ITodoWriteService writeService,
            [FromRoute]int id, 
            [FromRoute]int index,
            [FromBody] JsonPatchDocument<ToDoObjectiveInputModel> patch
            [FromHeader(Name= Constants.Headers.UnmodifiedSince)] DateTime? lastModified = null,
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

            return await BasicAction(
                readService,
                id,
                async readModel=>
                {
                    if(readModel.Objectives?.Any() !=true || readModel.Objectives?.Count() < index)
                        return ToDoObjectiveNotFound(id, index);
                    if(lastModified.HasValue && lastModified < readModel.DateUpdated)
                        return StatusCode(412, ModelState.ToOutputModel(Constants.Messages.Objectives.UpdateConflict));
                    var inputModel = mapper.Map<ToDoObjectiveInputModel>(readModel.Objectives[index]);
                    patch.ApplyTo(inputModel, ModelState);
                    if(!ModelState.IsValid)
                        return StatusCode(422, ModelState.ToOutputModel(Constants.Messages.Objectives.UpdateUnprocessable));
                    try
                    {
                        await writeService.UpdateObjectiveAsync(
                            id, 
                            index, 
                            inputModel, 
                            User?.Identity?.Name,
                            cancellationToken);
                    }
                    catch(AcceptedException)
                    {
                        return StatusCode(202, AcceptedOutput(commandID));
                    }
                    catch(TimeoutException)
                    {
                        if(env.IsDevelopment())
                            throw;
                        return StatusCode(408,ToError(Constants.Messages.Objectives.UpdateTimeout));
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
                            return StatusCode(412, ModelState.ToOutputModel(Constants.Messages.Objectives.UpdateConflict));
                            
                        return StatusCode(409, ModelState.ToOutputModel(Constants.Messages.Objectives.UpdateConflict));
                    }
                    catch(Exception ex)
                    {
                        if(env.IsDevelopment())
                            throw;
                        logger.LogError(ex);
                        return StatusCode(500, ToError(Constants.Messages.UpdateError));
                    }
                    
                    return await UpdatedObjective(mapper, readService, id,index, cancellationToken);
                },
                Constants.Messages.Objectives.UpdatedTimeout,
                Constants.Messages.Objectives.UpdatedError,
                cancellationToken);
        }

        #endregion
    }
}