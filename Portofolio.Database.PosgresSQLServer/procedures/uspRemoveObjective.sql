CREATE FUNCTION dbo.uspRemoveObjective(
    @id int NOT NULL,
    @objectiveIndex int NOT NULL,
    @username NVARCHAR(MAX) NOT NULL
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

    DELETE dbo.tbToDoObjectives
    WHERE ID = @id AND ObjIndex = @objectiveIndex;

    DELETE dbo.tbToDoSubObjectives
    WHERE ID = @id AND ObjIndex = @objectiveIndex;

    UPDATE dbo.tbToDoObjectives
    SET ObjIndex = ObjIndex - 1
    WHERE ID = @id AND ObjIndex > @objectiveIndex;

    UPDATE dbo.tbToDos
    SET UserUpdatedID = @username,
        DateUpdated= NOW()
    WHERE ID = @id AND DateDeleted IS NULL;
END