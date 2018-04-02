namespace ToDo.RestApi.Services
{
    public interface IToDoReadService
    {
        IToDo GetByID(int id);

        Task<IToDo> GetByIDAsync(int id, CancellationToken cancellationToken = default(CancellationToken));   

        IPagedList<IToDo> GetPaged(int page, int itemsPerPage);

        Task<IPagedList<IToDo>> GetPagedAsync(int page, int itemsPerPage, CancellationToken cancellationToken =default(CancellationToken));
    }
}