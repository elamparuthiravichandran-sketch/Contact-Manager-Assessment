-- Optional manual SQL Server setup. Docker setup creates and seeds the same schema automatically.
-- Run with sqlcmd or SQL Server Management Studio against a local development instance.
IF DB_ID(N'ContactsDb') IS NULL CREATE DATABASE ContactsDb;
GO
USE ContactsDb;
GO
IF OBJECT_ID(N'dbo.Contacts', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Contacts (
        Id uniqueidentifier NOT NULL CONSTRAINT PK_Contacts PRIMARY KEY,
        FirstName nvarchar(80) NOT NULL,
        LastName nvarchar(80) NOT NULL,
        Email nvarchar(254) NOT NULL,
        PhoneNumber nvarchar(30) NOT NULL,
        Address nvarchar(200) NOT NULL,
        City nvarchar(80) NOT NULL,
        State nvarchar(80) NOT NULL,
        Country nvarchar(80) NOT NULL,
        PostalCode nvarchar(20) NOT NULL,
        CreatedAtUtc datetime2 NOT NULL,
        Version uniqueidentifier NOT NULL
    );
    CREATE INDEX IX_Contacts_CreatedAtUtc ON dbo.Contacts(CreatedAtUtc);
END;
GO
INSERT dbo.Contacts (Id, FirstName, LastName, Email, PhoneNumber, Address, City, State, Country, PostalCode, CreatedAtUtc, Version)
SELECT v.Id, v.FirstName, v.LastName, v.Email, v.PhoneNumber, v.Address, v.City, v.State, v.Country, v.PostalCode, v.CreatedAtUtc, NEWID()
FROM (VALUES
 (CAST('00000000-0000-0000-0000-000000000001' AS uniqueidentifier), N'Ananya', N'Raman', N'ananya.raman@example.com', N'+91 90000 00001', N'12 Demo Street', N'Chennai', N'Tamil Nadu', N'India', N'600001', CAST('2026-01-01T12:00:00' AS datetime2)),
 ('00000000-0000-0000-0000-000000000002', N'Arjun', N'Shah', N'arjun.shah@example.com', N'+91 90000 00002', N'24 Sample Road', N'Bengaluru', N'Karnataka', N'India', N'560001', '2026-01-01T11:59:00'),
 ('00000000-0000-0000-0000-000000000003', N'Maya', N'Thomas', N'maya.thomas@example.com', N'+91 90000 00003', N'8 Example Avenue', N'Kochi', N'Kerala', N'India', N'682001', '2026-01-01T11:58:00'),
 ('00000000-0000-0000-0000-000000000004', N'Daniel', N'Lee', N'daniel.lee@example.com', N'+1 202 555 0104', N'45 Demo Lane', N'Seattle', N'Washington', N'United States', N'98101', '2026-01-01T11:57:00'),
 ('00000000-0000-0000-0000-000000000005', N'Sara', N'Wilson', N'sara.wilson@example.com', N'+44 7700 900005', N'10 Sample Close', N'London', N'England', N'United Kingdom', N'SW1A 1AA', '2026-01-01T11:56:00'),
 ('00000000-0000-0000-0000-000000000006', N'Noah', N'Martin', N'noah.martin@example.com', N'+61 2 5550 0106', N'33 Example Way', N'Sydney', N'New South Wales', N'Australia', N'2000', '2026-01-01T11:55:00')
) v(Id, FirstName, LastName, Email, PhoneNumber, Address, City, State, Country, PostalCode, CreatedAtUtc)
WHERE NOT EXISTS (SELECT 1 FROM dbo.Contacts c WHERE c.Id = v.Id);
GO
