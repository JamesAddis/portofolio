CREATE TABLE dbo.tbToDoObjectives(
    ObjIndex int NOT NULL,
    ToDoID int NOT NULL,
    Complete bit NOT NULL,
    Summary NVARCHAR(500) NULL,
    Title NVARCHAR(250) NOT NULL
)