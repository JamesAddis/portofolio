CREATE FUNCTION dbo.uspAddSubObjective(
    @id int NOT NULL,
    @objectiveIndex int NOT NULL,
    @title NVARCHAR(250) NOT NULL,
    @summary NVARCHAR(500) NOT NULL,
    @complete BIT NOT NULL
)
RETURNS INT AS $newSubObjectiveIndex
BEGIN
    DECLARE @newIndex INT = (SELECT TOP 1 Count(ObjIndex) FROM dbo.tbToDoSubObjectives GROUP BY ToDoID = @id AND ObjIndex = @objectiveIndex) + 1;
    
    INSERT INTO dbo.tbToDoSubObjectives(ToDoID, ObjIndex, SubObjIndex, Title, Summary, Complete)
    VALUES(@id, @objectiveIndex,@newIndex, @title,@summary, @complete);

    RETURN @newIndex;
END