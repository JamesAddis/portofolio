CREATE FUNCTION dbo.uspCreateToDo(
    @summary NVARCHAR(500) NULL,
    @title NVARCHAR(250) NOT NULL,
    @username NVARCHAR(MAX) NOT NULL
)
RETURNS INT AS @newID
BEGIN
    IF NOT EXISTS(SELECT * FROM dbo.tbUsers WHERE Username = @username)
    BEGIN
        RAISERROR(403,'Username not found:' + @username)
    END

    INSERT INTO dbo.tbToDos(Title,Summary,UserCreatedID,DateCreated)
    VALUES(@title,@summary,@username,NOW());

    RETURN SELECT currval(pg_get_serial_sequence('tbToDos','ID'));
END