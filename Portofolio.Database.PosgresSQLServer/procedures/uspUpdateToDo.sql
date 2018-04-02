CREATE FUNCTION dbo.uspUpdateToDo(
    @id INT NOT NULL,
    @username NVARCHAR(MAX) NOT NULL,
    @summary NVARCHAR(500) NULL,
    @title NVARCHAR(250) NOT NULL
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

    UPDATE dbo.tbToDos
    SET Title = @title,
        Summary = @summary,
        UserUpdatedID = @username,
        DateUpdated= NOW()
    WHERE ID = @id
END