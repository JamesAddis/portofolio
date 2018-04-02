CREATE FUNCTION dbo.uspUpdateObjective(
    @id int NOT NULL,
    @objectiveIndex int NOT NULL,
    @subobjectiveIndex int NOT NULL,
    @username NVARCHAR(MAX) NOT NULL,
    @title NVARCHAR(250) NOT NULL,
    @summary NVARCHAR(500) NULL,
    @complete BIT NOT NULL
)
RETURNS void as $$
BEGIN
    IF (NOT EXISTS(SELECT * FROM dbo.tbUsers WHERE Username = @username))
    BEGIN 
        RAISERROR(403, 'Username not found: ' + @username)
    END
    IF (NOT EXISTS (SELECT * FROM dbo.tbToDo WHERE ID = @id))
    BEGIN
        RAISERROR(404, 'ToDo not found: ' + @id)
    END
    IF (NOT EXISTS(SELECT * FROM dbo.tbToDos WHERE ID = @id AND DateDeleted IS NULL))
    BEGIN
        RAISERROR(410,'ToDo deleted')
    END
    IF (NOT EXISTS(SELECT * FROM dbo.tbToDoObjectives WHERE ID = @id AND ObjIndex = @objectiveIndex))
    BEGIN
        RAISERROR(404, 'ToDo Objective not found:' + @objectiveIndex)
    END
    IF (NOT EXISTS(SELECT * FROM dbo.tbToDoSubObjectives WHERE ID = @id AND ObjIndex = @objectiveIndex AND SubObjIndex = @subobjectiveIndex))
    BEGIN
        RAISERROR(404, 'ToDo Sub Objective not found:' + @subobjectiveIndex)
    END

    UPDATE dbo.tbToDoSubObjectives
    SET Title = @title,
        Summary = @summary,
        Complete =@complete
    WHERE ID = @id AND ObjIndex = @objectiveIndex AND SubObjIndex = @subobjectiveIndex
    UPDATe dbo.tbToDos
    SET UserUpdatedID = @username,
        DateUpdated= NOW()
    WHERE ID = @id AND DateDeleted IS NULL
END