namespace ToDo.WebSite.Controllers
{
    public class ToDoController
    {
        #region Private Members

        private readonly ILogger logger;
        private readonly IHostingEnvironment env;

        #endregion

        #region Contructors

        public ToDoController(ILogger<ToDoController> logger, IHostingEnvironment env)
        {
            this.logger = logger ?? throw new ArgumentNullException(nameof(logger));
            this.env = env ?? throw new ArgumentNullException(nameof(env));
        }

        #endregion

        #region Private Methods

        private IActionResult ErrorPageWithLink(int statusCode, string title, string message, string url, bool ajax)
        {
            Response.StatusCode = statusCode;
            ViewData["ErrorMessage"] = message;
            ViewData["Title"] = title;
            if(ajax)
                return PartialView("ErrorWithLink",model:url);
            return View("ErrorWithLink",model:url);
        }

        private IActionResult HttpError(int statusCode, string title, string message, bool ajax)
        {
            Response.StatusCode = statusCode;
            ViewData["ErrorMessage"] = message;
            ViewData["Title"] = title;
            if(ajax)
                return PartialView("ErrorPage");
            return View("ErrorPage");
        }

        #endregion

        #region Public Methods

        public async Task<IActionResult> GetCreatePage(
            [IsAJAX] bool ajax = false, 
            CancellationToken cancellationToken = default(cancellationToken))
        {
            if(cancellationToken == null)
                throw new ArgumentNullException(nameof(cancellationToken));
            
            var viewModel = new ToDoViewModel();

            if(ajax)
                return PartialView("Create",viewModel);
            return View("Create",viewModel);
        }

        [ValidateAntiForgeryToken]
        public async Task<IActionResult> PostSubmit(
            [FromServices] IToDoWriteService writeService,
            [FromServices] IToDoReadService readService,
            [FromForm, Bind(Exclude="ID"), CustomValidator("Create")] ToDoViewModel viewModel,
            [IsAJAX] bool ajax = false,
            CancellationToken cancellationToken = default(CancellationToken))
        {
            if(writeService == null)
                throw new ArgumentNullException(nameof(writeService));
                
            if(readService == null)
                throw new ArgumentNullException(nameof(readService));
                
            if(cancellationToken == null)
                throw new ArgumentNullException(nameof(cancellationToken));

            if(viewModel == null)
                return HttpError(400, "Bad Request", "Server unable to understand request",ajax);
            
            if(!ModelState.IsValid)
            {
                Response.StatusCode = 422;
                ViewData["ErrorMessage"] = "Unable to create todo, due to validation failures detected, please check inputs and try again";
                if(ajax)
                    return PartialView("Create",viewModel);
                return View("Create",viewModel);
            }
            int id;
            try
            {
                id = await writeService.CreateAsync(viewModel, cancellationToken);
            }
            catch(TimeoutException)
            {
                Response.StatusCode = 408;
                ViewData["ErrorMessage"] = "Unable to create todo, due to your request taking too long and timed out, please try again later";
                ViewData["IncludeErrorContact"] = true;
                if(ajax)
                    return PartialView("Create",viewModel);
                return View("Create",viewModel);
            }
            catch(TaskCancelException)
            {
                throw;
            }
            catch(Exception ex)
            {
                logger.LogError(ex, "Sorry! An error occurred whilst attempting to create todo on site");
                Response.StatusCode = 500;
                ViewData["ErrorMessage"] = "Unable to create todo, due to an error occurring, please try again later";
                ViewData["IncludeErrorContact"] = true;
                if(ajax)
                    return PartialView("Create",viewModel);
                return View("Create",viewModel);
            }

            try
            {
                var readModel = await readService.GetByIDAsync(id,cancellationToken);

                if(readModel == null)
                {
                    Response.Headers.Add("X-Created",id.ToString());
                    
                    return ErrorPageWithLink(408, "Todo Not Found", "Successfully created todo, but unable to find todo afterwards, please try the link provided to back to the list page", url, ajax);
                }
                
                if(readModel.DateDeleted.HasValue)
                {
                    return ErrorPageWithLink(410, "Todo Deleted", "Successfully created todo, but has since been deleted, please try the link provided to back to the list page", url, ajax);
                }

                Response.StatusCode=201;
                var updatedViewModel = new ToDoViewModel(readModel);
                if(ajax)
                {
                    if(Response.Headers.ContainsKey("Location"))
                        Response.Headers["Location"] = Url.RouteUrl(Constants.Routes.ToDoControllerRoutes.GetEditPage, new{id});
                    else
                    {
                        Response.Headers.Add("Location",Url.RouteUrl(Constants.Routes.ToDoControllerRoutes.GetEditPage, new{id}));
                    }
                    ViewData["SuccessMessage"] = "Successfully created Todo";
                    return PartialView("Edit",viewModel);
                }
                
                TempData["SuccessMessage"] = "Successfully created Todo";
                return RedirectToRoute(Contants.Routes.ToDoControllerRoutes.GetEdit, new{id});
            }
            catch(TimeoutException)
            {   
                if(!Response.Headers.ContainsKey("X-Created"))
                    Response.Headers.Add("X-Created",id.ToString());
                var url = Url.Routes(Constants.Routes.ToDoControllerRoutes.GetEditPage, new {id});
                return ErrorPageWithLink(408, "Timeout", "Successfully created todo, but your request timed out afterwards, please try the link provided", url, ajax);
                
            }
            catch(TaskCancelException)
            {
                throw;
            }
            catch(Exception ex)
            {
                if(!Response.Headers.ContainsKey("X-Created"))
                    Response.Headers.Add("X-Created",id.ToString());
                
                logger.LogError(ex, "Sorry! An error occurred after creating todo ({0}) on site",id);
                var url = Url.Routes(Constants.Routes.ToDoControllerRoutes.GetEditPage, new {id});
                return ErrorPageWithLink(500, "Error", "Successfully created todo, but an error occurred whilst attempting to get newly created todo's details, please try the link provided", url, ajax);   
            }
        }
        
        public async Task<IActionResult> GetEditPage(
            [FromServices] IToDoReadService readService,
            [FromRoute] int id,
            [IsAJAX] bool ajax = false,
            CancellationToken cancellationToken = default(CancellationToken))
        {
            if(cancellationToken == null)
                throw new ArgumentNullException(nameof(cancellationToken));
            if(readService == null)
                throw new ArgumentNullException(nameof(readService));
            if(writeService == null)
                throw new ArgumentNllException(nameof(writeService));
            
            if(viewModel == null)
                return HttpError(400, "Bad Request", "Server unable to understand request",ajax);
            if(viewModel.ID != id)
                return HttpError(400, "Bad Request", string.Format("ID in url ({0}) was found to be different from ID submitted in body ({1})"),ajax);
            
            var readModel = await readService.GetByIDAsync(id,cancellationToken);
        
            if(readModel == null)
                return ToDoNotFound(id,ajax);
            if(readModel.DateDeleted.HasValue)
                return ToDoDeleted(id,ajax);
            
            var viewModel = new ToDoViewModel(readModel);

            if(ajax)
                return PartialView("Edit",viewModel);
            return View("Edit",viewModel);
        }

        [ValidateAntiForgeryToken]
        public async Task<IActionResult> PostUpdate(
            [FromServices] IToDoReadService readService,
            [FromServices] IToDoWriteService writeService,
            [FromRoute] int id,
            [FromForm] ToDoViewModel viewModel,
            [IsAJAX] bool ajax = false,
            CancellationToken cancellationToken = default(CancellationToken))
        {
            if(cancellationToken == null)
                throw new ArgumentNullException(nameof(cancellationToken));
            if(readService == null)
                throw new ArgumentNullException(nameof(readService));
            if(writeService == null)
                throw new ArgumentNllException(nameof(writeService));
            
            var readModel = await readService.GetByIDAsync(id,cancellationToken);

            if(readModel == null)
                return ToDoNotFound(id,ajax);
            if(readModel.DateDeleted.HasValue)
                return ToDoDeleted(id,ajax);
            if(viewModel.LastModified != readModel.LastModified)
            {
                Response.StatusCode =409;
                ViewData["ErrorMessage"] = "Unable to update todo, due to version differences detected (todo has been altered), please check inputs and try again";
                if(ajax)
                    return PartialView("Edit",viewModel);
                return View("Edit",viewModel);
            }
            else if(!ModelState.IsValid)
            {
                Response.StatusCode =422;
                ViewData["ErrorMessage"] = "Unable to update todo, due to validation failures detected, please check inputs and try again";
                if(ajax)
                    return PartialView("Edit",viewModel);
                return View("Edit",viewModel);
            }
            
            try
            {
                await writeService.UpdateAsync(viewModel,cancellationToken);
            }
            catch(ConcurrencyException)
            {
                readModel = await readService.GetByIDAsync(id,cancellationToken);
                if(readModel == null)
                    return ToDoNotFound(id,ajax);
                if(readModel.DateDeleted.HasValue)
                    return ToDoDeleted(id,ajax);
                Response.StatusCode =409;
                ViewData["ErrorMessage"] = "Unable to update todo, due to version differences detected (todo has been altered), please check inputs and try again";
                viewModel = new ToDoViewModel(readModel);
                if(ajax)
                    return PartialView("Edit",viewModel);
                return View("Edit",viewModel);
            }
            catch(TimeoutException)
            {
                Response.StatusCode =408;
                ViewData["ErrorMessage"] = "Sorry! Your request took too long and timed out, please try again later";
                ViewData["IncludeErrorContact"] = true;
                if(ajax)
                    return PartialView("Edit",viewModel);
                return View("Edit",viewModel);
            }
            catch(TaskCancelException)
            {
                throw;
            }
            catch(Exception ex)
            {
                logger.LogError(ex,"An error occurred whilst attempting to update todo ({0})",id);
                Response.StatusCode = 500;
                ViewData["ErrorMessage"] = "Sorry! An error occurred whilst attempting to update todo, please try again later";
                ViewData["IncludeErrorContact"] = true;
                if(ajax)
                    return PartialView("Edit",viewModel);
                return View("Edit",viewModel);
            }
            try
            {
                Response.Headers.Add("X-Updated",id.ToString());

                readModel = await readService.GetByIDAsync(id,cancellationToken);
                
                if(readModel == null)
                    return ToDoNotFound(id,ajax);
                if(readModel.DateDeleted.HasValue)
                    return ToDoDeleted(id,ajax);

                viewModel = new ToDoViewModel(readModel);

                if(ajax)
                {
                    ViewData["SuccessMessage"] = "Successfully updated Todo";
                    return PartialView("Edit",viewModel);
                }
                    
                TempData["SuccessMessage"] = "Successfully updated Todo";
                return RedirectToRoute(Contants.Routes.ToDoControllerRoutes.GetEdit, new{id});
            }
            catch(TimeoutException)
            {   
                if(!Response.Headers.ContainsKey("X-Updated"))
                    Response.Headers.Add("X-Updated",id.ToString());
                var url = Url.Routes(Constants.Routes.ToDoControllerRoutes.GetEditPage, new {id});
                return ErrorPageWithLink(500, "Error","Successfully updated todo, but your request took too long and timed out, please try the link provided", url,ajax);
            }
            catch(TaskCancelException)
            {
                throw;
            }
            catch(Exception ex)
            {
                logger.LogError(ex, "An error occurred after updating todo ({0})",id);
                
                if(!Response.Headers.ContainsKey("X-Updated"))
                    Response.Headers.Add("X-Updated",id.ToString());
                var url = Url.Routes(Constants.Routes.ToDoControllerRoutes.GetEditPage, new {id});
                return ErrorPageWithLink(500, "Error","Successfully updated todo, but an error occurred whilst attempting to get updated details, please try the link provided", url,ajax);
            }
        }

        public async Task<IActionResult> GetDeletePage(
            [FromServices] IToDoReadService readService,
            [FromRoute] int id,
            [IsAJAX] bool ajax = false,
            CancellationToken cancellationToken =default(CancellationToken))
        {
            if(cancellationToken == null)
                throw new ArgumentNullException(nameof(cancellationToken));
            if(readService == null)
                throw new ArgumentNullException(nameof(readService));
            
            var readModel = await readService.GetByIDAsync(id,cancellationToken);

            if(readModel == null)
                return ToDoNotFound(id,ajax);
            if(readModel.DateDeleted.HasValue)
                return ToDoDeleted(id,ajax);
            
            var viewModel = new ToDoViewModel(readModel);

            if(ajax)
                return PartialView("Delete",viewModel);
            return View("Delete",viewModel);
        }

        [ValidateAntiForgeryToken]
        public async Task<IActionResult> PostDelete(
            [FromServices] IToDoReadService readService,
            [FromServices] IToDoWriteService writeService,
            [FromRoute] int id,
            [FromForm, Bind(Include="ID,LastModified")] ToDoViewModel viewModel,
            [IsAJAX] bool ajax = false,
            CancellationToken cancellationToken = default(CancellationToken))
        {
            if(cancellationToken == null)
                throw new ArgumentNullException(nameof(cancellationToken));
            if(readService == null)
                throw new ArgumentNullException(nameof(readService));
            if(writeService == null)
                throw new ArgumentNllException(nameof(writeService));
 
            if(viewModel == null)
                return HttpError(400, "Bad Request", "Server unable to understand request",ajax);
            if(viewModel.ID != id)
                return HttpError(400, "Bad Request", string.Format("ID in url ({0}) was found to be different from ID submitted in body ({1})"),ajax);
                       
            var readModel = await readService.GetByIDAsync(id,cancellationToken);

            if(readModel == null)
                return ToDoNotFound(id,ajax);
            if(readModel.DateDeleted.HasValue)
                return ToDoDeleted(id,ajax);
            if(viewModel.LastModified != readModel.LastModified)
            {
                Response.StatusCode =409;
                ViewData["ErrorMessage"] = "Unable to delete todo, due to version differences detected (todo has been altered), please check inputs and try again";
                if(ajax)
                    return PartialView("Edit",viewModel);
                return View("Edit",viewModel);
            }
            else if(!ModelState.IsValid)
            {
                Response.StatusCode =422;
                ViewData["ErrorMessage"] = "Unable to update todo, due to validation failures detected, please check inputs and try again";
                if(ajax)
                    return PartialView("Edit",viewModel);
                return View("Edit",viewModel);
            }
            
            try
            {
                await writeService.UpdateAsync(viewModel,cancellationToken);
            }
            catch(ConcurrencyException)
            {
                readModel = await readService.GetByIDAsync(id,cancellationToken);
                if(readModel == null)
                    return ToDoNotFound(id,ajax);
                if(readModel.DateDeleted.HasValue)
                    return ToDoDeleted(id,ajax);
                Response.StatusCode =409;
                ViewData["ErrorMessage"] = "Unable to delete  todo, due to version differences detected (todo has been altered), please check inputs and try again";
                viewModel = new ToDoViewModel(readModel);
                if(ajax)
                    return PartialView("Delete",viewModel);
                return View("Delete",viewModel);
            }
            catch(TimeoutException)
            {
                Response.StatusCode = 408;
                ViewData["ErrorMessage"] = "Sorry! Your request took too long and timed out, please try again later";
                ViewData["IncludeErrorContact"] = true;
                if(ajax)
                    return PartialView("Edit",viewModel);
                return View("Edit",viewModel);
            }
            catch(TaskCancelException)
            {
                throw;
            }
            catch(Exception ex)
            {
                logger.LogError(ex,"An error occurred whilst attempting to update todo ({0})",id);
                Response.StatusCode = 500;
                ViewData["ErrorMessage"] = "Sorry! An error occurred whilst attempting to update todo, please try again later";
                ViewData["IncludeErrorContact"] = true;
                if(ajax)
                    return PartialView("Edit",viewModel);
                return View("Edit",viewModel);
            }

            try
            {
                Response.Headers.Add("X-Deleted",id.ToString());

                if(ajax)
                {
                    ViewData["SuccessMessage"] = "Successfully deleted todo";
                    return PartialView("Redirect", model: Url.RouteUrl(Contants.Routes.ToDoControllerRoutes.GetList, new{id}));
                }

                TempData["SuccessMessage"] = "Successfully deleted Todo";
                return RedirectToRoute(Contants.Routes.ToDoControllerRoutes.GetList, new{id});
            }
            catch(TimeoutException)
            {   
                if(!Response.Headers.ContainsKey("X-Deleted"))
                    Response.Headers.Add("X-Deleted",id.ToString());
                var url = Url.Routes(Constants.Routes.ToDoControllerRoutes.GetList);
                return ErrorPageWithLink(500, "Error","Successfully deleted todo, but your request took too long and timed out, please try the link provided", url,ajax);
            }
            catch(TaskCancelException)
            {
                throw;
            }
            catch(Exception ex)
            {
                logger.LogError(ex, "An error occurred after deleting todo ({0})",id);
                
                if(!Response.Headers.ContainsKey("X-Deleted"))
                    Response.Headers.Add("X-Updated",id.ToString());
                var url = Url.Routes(Constants.Routes.ToDoControllerRoutes.GetList);
                return ErrorPageWithLink(500, "Error","Successfully deleted todo, but an error occurred whilst attempting to get updated details, please try the link provided", url,ajax);
            }
        }

        public async Task<IActionResult> GetListPage(
            [FromServices] IToDoReadService readService,
            [FromQuery] SearchParameters searchParameters,
            [IsAJAX] bool ajax= false,
            CancellationToken cancellationToken =default(CancellationToken))
        {
            if(cancellationToken == null)
                throw new ArgumentNullException(nameof(cancellationToken));
            if(readService == null)
                throw new ArgumentNullException(nameof(readService));
            
            if(searchParameters == null)
                return HttpError(400,"Bad Request", "Search Parameters could not be understood by server", ajax);
            if(searchParameters.Page < 1)
                return HttpError(400,"Bad Request", "Page cannot be less than 1", ajax);
            if(searchParameters.ItemsPerPage < 1)
                return HttpError(400,"Bad Request", "Number of items per page cannot be less than 1", ajax);
            if(searchParameters.ItemsPerPage > 100)
                return HttpError(400,"Bad Request", "Number of items per page cannot be greater than 100", ajax);
            
            var results = await readService.GetPagedAsync(searchParameters,cancellationToken);

            if(ajax)
                return PartialView("List",viewModel);
            return View("List",viewModel);
        }

        #endregion
    }
}