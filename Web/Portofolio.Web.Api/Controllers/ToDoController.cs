namespace ToDo.RestApi.Controllers
{
    public class ToDoController : Controller
    {
        #region Private Members

        private readonly ILogger logger;
        private readonly IHostingEnvironment env;

        #endregion

        #region Constructors

        public ToDoController(ILogger<ToDoController> logger, IHostingEnvironment env)
        {
            this.logger = logger ?? throw new ArgumentNullException(nameof(logger));
            this.env = env ?? throw new ArgumentNullException(nameof(env));
        }

        #endregion

        #region Private Methods

        private async Task<IActionResult> BasicAction(
            IToDoReadService readService,
            IMapper mapper,
            int id,
            Func<IToDo, Task<IActionResult>> action,
            string timeout,
            string error,
            CancellationToken cancellationToken)
        {
            if(id < 1)
                return StatusCode(400, ToError(Constants.Messages.ToDos.BadRequest));
                
            IToDo readModel = null;
            try
            {
                readModel =await readService.GetByIDAsync(id,cancellationToken);
            }
            catch(TimeoutException)
            {
                if(env.IsDevelopment())
                    throw;
                return StatusCode(408,ToError(timeout));
            }
            catch(TaskCancelledException)
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
            return await action(readModel);
        }

        #endregion

        #region Public Methods

        [HttpPost("~/api/todos")]
        public async Task<IActionResult> PostCreate(
            [FromServices] IMapper mapper,
            [FromServices] IToDoReadService readService,
            [FromServices] IToDoWriteService writeService,
            [FromBody] ToDoInputModel inputModel, 
            CancellationToken cancellationToken = default(CancellationToken))
        {
            if(cancellationToken == null)
                throw new ArgumentNullException(nameof(cancellationToken));
            
            if(mapper == null) 
                throw new ArgumentNullException(nameof(mapper));
                
            if(readService == null)
                throw new ArgumentNullException(nameof(readService));
            
            if(writeService == null)
                throw new ArgumentNullException(nameof(writeService));
            
            if(inputModel == null)
                return StatusCode(400);
            if(!ModelState.IsValid)
                return StatusCode(422, ToValidationErrorModel("Unable to create todo, due to validation failures, please check inputs and try again"));
            int id;
            try
            {
                id = await writeService.CreateAsync(inputModel,cancellationToken);
            } 
            catch(TimeoutException)
            {
                return StatusCode(408);
            }
            catch(TaskCancelledException)
            {
                throw;
            }
            catch(Exception ex)
            {
                logger.LogError(ex,"An error occurred whilst attempting to create todo");
                return StatusCode(500);
            }
            try
            {
                //Refresh read model with updated details
                readModel = await readService.GetByIDAsync(id,cancellationToken);
                
                //Not Found
                if(readModel == null)
                {
                    Response.Headers["Location"] = string.Format("~/api/todos/{0}", id);
                    Response.Headers.Add("X-Created",id.ToString());
                    return ToDoNotFound(id);
                }
                
                //Gone
                if(readModel.DateDeleted.HasValue)
                {
                    Response.Headers["Location"] = string.Format("~/api/todos/{0}", id);
                    Response.Headers.Add("X-Created",id.ToString());
                    return ToDoGone(id);
                }
                
                //Set Cache Headers
                SetLastModified(readModel.DateUpdated);
                SetEtag(EtagHelpers.Convert(readModel));

                //Return Created response with newly created details and location
                return Created(string.Format("~/api/todos/{0}",id), readModel);
            } 
            catch(TimeoutException)
            {
                Response.Headers["Location"] = string.Format("~/api/todos/{0}", id);
                Response.Headers.Add("X-Created",id.ToString());
                return StatusCode(408);
            }
            catch(TaskCancelledException)
            {
                throw;
            }
            catch(Exception ex)
            {
                Response.Headers["Location"] = string.Format("~/api/todos/{0}", id);
                Response.Headers.Add("X-Created", id.ToString());
                return StatusCode(500);
            }
        }

        [HttpPut("~/api/todos/{id:int}")]
        public async Task<IActionResult> PutUpdate(
            [FromServices] IToDoReadService readService,
            [FromServices] IToDoWriteService writeService,
            [FromRoute] int id, 
            [FromBody] ToDoInputModel inputModel, 
            [FromHeader(Name="If-Matches")] string etag = null,
            [FromHeader(Name=Constants.Messages.UnmodifiedSince)] DateTime? lastModified = null,
            CancellationToken cancellationToken = default(CancellationToken))
        {
            if(cancellationToken == null)
                throw new ArgumentNullException(nameof(cancellationToken));
            
            if(readService == null)
                throw new ArgumentNullException(nameof(readService));
            
            if(writeService == null)
                throw new ArgumentNullException(nameof(writeService));
            
            if(inputModel == null)
                return StatusCode(400);

            if(inputModel.ID != id)
                return StatusCode(400);

            var readModel = await readService.GetByIDAsync(id,cancellationToken);

            if(readModel == null)
                return ToDoNotFound(id);
            
            if(readModel.DateDeleted.HasValue)
                return ToDoGone(id);
                
            if((!string.IsNullOrWhiteSpace(etag) 
                && EtagHelper.Convert(readModel) != etag) 
                || (string.IsNullOrWhiteSpace(etag) 
                && lastModified.HasValue 
                && readModel.LastModified != lastModified))
                return StatusCode(412, ToValidationErrorModel("Unable to update todo, due to version differences (todo has since been altered), please check inputs and try again"));

            if(!ModelState.IsValid)
                return StatusCode(422, ToValidationErrorModel("Unable to update todo, due to validation failures, please check inputs and try again"));

            try
            {
                await writeService.UpdateAsync(inputModel,cancellationToken);
            } 
            catch(ConcurrencyException)
            { 
                readModel = await readService.GetByIDAsync(id,cancellationToken);

                if(readModel == null)
                    return ToDoNotFound(id);
            
                if(readModel.DateDeleted.HasValue)
                    return ToDoGone(id);
                    
                if((!string.IsNullOrWhiteSpace(etag) 
                    && EtagHelper.Convert(readModel) != etag) 
                    || (string.IsNullOrWhiteSpace(etag) 
                    && lastModified.HasValue 
                    && readModel.LastModified != lastModified))
                    return StatusCode(412, ToValidationErrorModel("Unable to update todo, due to version differences (todo has since been altered), please check inputs and try again"));

                return StatusCode(409, ToValidationErrorModel("Unable to update todo, due to version differences (todo has since been altered), please check inputs and try again"));
            }
            try
            {
                readModel = await readService.GetByIDAsync(id,cancellationToken);
                
                if(readModel == null)
                {
                    Response.Headers.Add("X-Updated", id.ToString());
                    return ToDoNotFound(id);
                }
                
                if(readModel.DateDeleted.HasValue) 
                {
                    Response.Headers.Add("X-Updated", id.ToString());
                    return ToDoGone(id);
                }
                
                SetLastModified(readModel.LastModified);
                SetEtag(EtagHelper.Convert(readModel));
                return Ok(readModel);
            } 
            catch(TimeoutException)
            {
                Response.Headers.Add("X-Updated", id.ToString());
                return StatusCode(408);
            }
            catch(Exception ex)
            {
                if(env.IsDevelopment())
                    throw;
                logger.LogError(ex, "An error occurred after updating todo ({0})",id);
                Response.Headers.Add("X-Updated", id.ToString());
                return StatusCode(500);
            }
        }
        
        [HttpPatch("~/api/todos/{id:int}")]
        public async Task<IActionResult> PatchUpdate(
            [FromServices] IToDoReadService readService,
            [FromServices] IToDoWriteService writeService,
            [FromRoute] int id, 
            [FromBody] JsonPatchDocument<ToDoInputModel> patch, 
            [FromHeader(Name="If-Matches")] string etag = null,
            [FromHeader(Name=Constants.Messages.UnmodifiedSince)] DateTime? lastModified = null,
            CancellationToken cancellationToken = default(CancellationToken))
        {
            if(cancellationToken == null)
                throw new ArgumentNullException(nameof(cancellationToken));
            
            if(readService == null)
                throw new ArgumentNullException(nameof(readService));
            
            if(writeService == null)
                throw new ArgumentNullException(nameof(writeService));
            
            if(inputModel == null)
                return StatusCode(400);

            if(inputModel.ID != id)
                return StatusCode(400);

            var readModel = await readService.GetByIDAsync(id,cancellationToken);

            if(readModel == null)
                return ToDoNotFound(id);
            
            if(readModel.DateDeleted.HasValue)
                return ToDoGone(id);
                
            if((!string.IsNullOrWhiteSpace(etag) 
                && EtagHelper.Convert(readModel) != etag) 
                || (string.IsNullOrWhiteSpace(etag) 
                && lastModified.HasValue 
                && readModel.LastModified != lastModified))
                return StatusCode(412, ToValidationErrorModel("Unable to update todo, due to version differences (todo has since been altered), please check inputs and try again"));

            var inputModel = readModel.CopyToInputModel();

            patch.ApplyTo(inputModel, ModelState);

            if(!ModelState.IsValid)
                return StatusCode(422, ToValidationErrorModel("Unable to update todo, due to validation failures, please check inputs and try again"));

            try
            {
                await writeService.UpdateAsync(id, inputModel, cancellationToken);
            } 
            catch(ConcurrencyException)
            { 
                readModel = await readService.GetByIDAsync(id,cancellationToken);
                if(readModel == null)
                    return ToDoNotFound(id);
            
                if(readModel.DateDeleted.HasValue)
                    return ToDoGone(id);
                    
                if((!string.IsNullOrWhiteSpace(etag) 
                    && EtagHelper.Convert(readModel) != etag) 
                    || (string.IsNullOrWhiteSpace(etag) 
                    && lastModified.HasValue 
                    && readModel.LastModified != lastModified))
                    return StatusCode(412, ToValidationErrorModel("Unable to update todo, due to version differences (todo has since been altered), please check inputs and try again"));

                return StatusCode(409, ToValidationErrorModel("Unable to update todo, due to version differences (todo has since been altered), please check inputs and try again"));
            }
            try
            {
                readModel = await readService.GetByIDAsync(id,cancellationToken);
                
                if(readModel == null)
                {
                    Response.Headers.Add("X-Updated", id.ToString());
                    return ToDoNotFound(id);
                }
                
                if(readModel.DateDeleted.HasValue) 
                {
                    Response.Headers.Add("X-Updated", id.ToString());
                    return ToDoGone(id);
                }
                
                SetLastModified(readModel.LastModified);
                SetEtag(EtagHelper.Convert(readModel));
                return Ok(readModel);
            } 
            catch(TimeoutException)
            {
                Response.Headers.Add("X-Updated", id.ToString());
                return StatusCode(408);
            }
            catch(Exception ex)
            {
                if(env.IsDevelopment())
                    throw;
                logger.LogError(ex, "An error occurred after updating todo ({0})",id);
                Response.Headers.Add("X-Updated", id.ToString());
                return StatusCode(500);
            }
        }

        [HttpDelete("~/api/todos/{id:int}")]
        public async Task<IActionResult> DeleteSingle(
            [FromServices] IToDoReadService readService,
            [FromServices] IToDoWriteService writeService,
            [FromRoute] int id,
            [FromHeader(Name="E-tag")] string etag = null,
            [FromHeader(Name=Constants.Messages.UnmodifiedSince)] DateTime? lastModified = null,
            CancellationToken cancellationToken = default(CancellationToken))
        {
            if(cancellationToken == null)
                throw new ArgumentNullException(nameof(cancellationToken));
            
            if(readService == null)
                throw new ArgumentNullException(nameof(readService));
            
            if(writeService == null)
                throw new ArgumentNullException(nameof(writeService));
                
            if((!string.IsNullOrWhiteSpace(etag) 
                && EtagHelper.Convert(readModel) != etag) 
                || (string.IsNullOrWhiteSpace(etag) 
                && lastModified.HasValue 
                && readModel.LastModified != lastModified))
                return StatusCode(412, new ErrorOutputModel { Message ="Unable to delete todo, due to version differences (todo has since been altered), please check inputs and try again"});
            try
            {
                await writeService.DeleteAsync(inputModel,cancellationToken);
            } 
            catch(TimeoutException)
            {
                return StatusCode(408, new ErrorOutputModel{ Message= "Sorry! Your request took too long and timed out, please try again later"});
            }
            catch(TaskCancelledException)
            {
                throw;
            }
            catch(Exception ex)
            {
                logger.LogError(ex,"An error occurred whilst attempting to delete todo ({0})",id);
                return StatusCode(500);
            }
            return NoContent();
        }
        
        [HttpGet("~/api/todos/{id:int}")]
        public async Task<IActionResult> GetSingle(
            [FromServices] IToDoReadService readService,
            [FromRoute] int id, 
            [FromHeader(Name="If-Matches")] string etag = null,
            [FromHeader(Name=Constants.Messages.UnmodifiedSince)] DateTime? lastModified = null,
            CancellationToken cancellationToken = default(CancellationToken))
        {
            if(cancellationToken == null)
                throw new ArgumentNullException(nameof(cancellationToken));
            
            if(readService == null)
                throw new ArgumentNullException(nameof(readService));

            var readModel = await readService.GetByIDAsync(id,cancellationToken);

            if(readModel == null)
                return ToDoNotFound(id);
                
            if(readModel.DateDeleted.HasValue)
                return ToDoGone(id);
                
            if(!string.IsNullOrWhiteSpace(etag) 
                && EtagHelper.Convert(readModel) == etag) 
                || (string.IsNullOrWhiteSpace(etag) 
                && lastModified.HasValue 
                && readModel.LastModified == lastModified))
                return StatusCode(304);
            
            SetLastModified(readModel.LastModified);
            SetEtag(EtagHelper.Convert(readModel));
            return Ok(readModel);
        }
        
        [HttpGet("~/api/todos")]
        public async Task<IActionResult> GetPaged(
            [FromServices] IToDoReadService readService,
            [FromQuery] SearchParameters searchParameters = null, 
            [FromHeader(Name="If-Matches")] string etag = null,
            CancellationToken cancellationToken = default(CancellationToken))
        {
            if(cancellationToken == null)
                throw new ArgumentNullException(nameof(cancellationToken));
            
            if(readService == null)
                throw new ArgumentNullException(nameof(readService));

            if(searchParameters == null)
                return StatusCode(400);
            if(searchParameters.Page < 1)
                return StatusCode(400, new ErrorOutputModel { Message = "Page number cannot be less than 1"});
            if(searchParameters.ItemsPerPage < 1)
                return StatusCode(400, new ErrorOutputModel{ Message = "Number of items per page cannot be less than 1"});
            if(searchParameters.ItemsPerPage > 100)
                return StatusCode(400, new ErrorOutputModel { Message = "Number of items per page cannot be greater than 100"});
            var results = await readService.GetPagedAsync(searchParameters,cancellationToken);

            if(!string.IsNullOrWhiteSpace(etag) && EtagHelper.Convert(results) == etag)
                return StatusCode(304);

            SetEtag(EtagHelper.Convert(results));

            return Ok(readModel);
        }
    }

    #endregion
}