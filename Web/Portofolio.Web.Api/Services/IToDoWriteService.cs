namespace ToDo.RestApi.Services
{
    public interface IToDoWriteService
    {
        int Create(IToDo inputModel, string username);

        Task<int> CreateAsync(IToDo inputModel, string username, CancellationToken cancellationToken = default(cancellationToken));

        void Update(IToDo inputModel, string username);

        Task UpdateAsync(IToDo inputModel, string username, CancellationToken cancellationToken = default(CancellationToken));

        void Delete(int id, string username);

        Task DeleteAsync(int id, string username, CancellationToken cancellationToken = default(cancellationToken));

        int CreateObjective(int id, IToDoObjective inputModel, string username);

        Task<int> CreateObjectiveAsync(int id, IToDoObjective inputModel, string username, CancellationToken cancellationToken =default(CancellationToken));

        void UpdateObjective(int id, int index, IToDoObjective inputModel, string username);

        Task UpdateObjectiveAsync(int id, int index, IToDoObjective inputModel, string username, CancellationToken cancellationToken =default(CancellationToken));

        void DeleteObjective(int id, int index, string username);

        Task DeleteObjectiveAsync(int id, int index, string username, CancellationToken cancellationToken =default(CancellationToken));

        int CreateSubObjective(int id, int index, IToDoSubObjective inputModel, string username);

        Task<int> CreateSubObjectiveAsync(int id, int index, IToDoSubObjective inputModel, string username, CancellationToken cancellationToken= default(CancellationToken));

        void UpdateSubObjective(int id, int index, int subIndex, IToDoSubObjective inputModel, string username);

        Task UpdateSubObjectiveAsync(int id, int index, int subIndex, IToDoSubObjective inputModel, string username, CancellationToken cancellationToken = default(CancellationToken));

        void DeleteSubObjective(int id, int index, int subIndex, string username);

        Task DeleteSubObjectiveAsync(int id, int index, int subIndex, string username, CancellationToken cancellationToken =default(CancellationToken));
    }
}