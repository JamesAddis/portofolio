CREATE TABLE dbo.ToDo(
    ID int NOT NULL,
    Title NVARCHAR(250) NOT NULL,
    Summary NVARCHAR(500) NULL,
    DateCreated DATETIME NOT NULL,
    DateUpdated DATETIME NULL,
    DateDeleted DATETIME NULL,
    UserCreatedID NVARCHAR(MAX) NOT NULL,
    UserUpdatedID NVARCHAR(MAX) NULL,
    UserDeletedID NVARCHAR(MAX) NULL
)