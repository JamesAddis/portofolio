namespace ToDo.RestApi.Services
{
    public class ToDoReadService : IToDoService
    {
        private readonly _context;

        public ToDoReadService(ToDoContext dbContext)
        {
            this._context = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        }

        public IToDo GetByID(int id)
        {
            return _context.ToDos.Find(id);
        }

        public async Task<IToDo> GetByIDAsync(int id, CancellationToken cancellationToken =default(CancellationToken))
        {
            return await _context.ToDo.FindAsync(id,cancellationToken);
        }

        public IPagedList<IToDo> GetPaged(int page, int itemsPerPage)
        {
            return _context
                .ToDos
                .Where(x=>x.DateDeleted != null)
                .ToPagedList(page,itemsPerPage);
        }

        public async Task<IPagedList<IToDo>> GetPagedAsync(int page, int itemsPerPage, CancellationToken  cancellationToken = default(CancellationToken))
        {
            return await _context
                .ToDos
                .Where(x=>x.DateDeleted != null)
                .ToPagedListAsync(page,itemsPerPage,cancellationToken);
        }
    }
}