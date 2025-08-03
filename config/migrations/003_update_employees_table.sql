ALTER TABLE employees
  ADD COLUMN "supervisorName" VARCHAR(100),
  ADD COLUMN "unitHead" VARCHAR(100),
  ADD COLUMN "state" VARCHAR(100),
  ADD COLUMN "location" VARCHAR(100),
  ADD COLUMN "subLocation" VARCHAR(100),
  ADD COLUMN "gender" VARCHAR(50),
  ADD COLUMN "newOld" VARCHAR(50),
  ADD COLUMN "dra" VARCHAR(100),
  ADD COLUMN "fieldFloor" VARCHAR(100),
  ADD COLUMN "portfolioCode" VARCHAR(100),
  ADD COLUMN "client" VARCHAR(100),
  ADD COLUMN "product" VARCHAR(100),
  ADD COLUMN "process" VARCHAR(100),
  ADD COLUMN "ctc" DECIMAL(10, 2),
  DROP COLUMN "email",
  DROP COLUMN "phone",
  DROP COLUMN "department",
  DROP COLUMN "salary",
  DROP COLUMN "address",
  DROP COLUMN "emergencyContact",
  DROP COLUMN "bankDetails",
  DROP COLUMN "documents";

ALTER TABLE employees
  RENAME COLUMN "dateOfJoining" TO "doj";

ALTER TABLE employees
  ALTER COLUMN "employeeId" TYPE VARCHAR(10);
