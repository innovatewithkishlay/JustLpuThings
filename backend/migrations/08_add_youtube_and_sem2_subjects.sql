-- Step 1: Add youtube_url to materials
ALTER TABLE materials
ADD COLUMN IF NOT EXISTS youtube_url VARCHAR(255);

-- Make file_key nullable to allow Youtube-only postings (where no file implies a pure video material)
ALTER TABLE materials ALTER COLUMN file_key DROP NOT NULL;

-- Step 2: Ensure Semester 2 exists and seed subjects
-- Assuming Semester 2 belongs to the first college. We find the semester id for number 2.
DO $$ 
DECLARE
    sem2_id UUID;
    first_college_id UUID;
BEGIN
    SELECT id INTO first_college_id FROM colleges LIMIT 1;
    
    -- If no college exists, exit gracefully (shouldn't happen on dev DB)
    IF first_college_id IS NULL THEN
        RETURN;
    END IF;

    -- Upsert semester 2 for the default college
    INSERT INTO semesters (college_id, number)
    VALUES (first_college_id, 2)
    ON CONFLICT (college_id, number) DO UPDATE SET number = EXCLUDED.number
    RETURNING id INTO sem2_id;

    -- Insert Semester 2 Subjects (from Screenshot)
    -- Int 306, Phy 110, Cse 121, Cse 101, Mec 136, Cse320, Pel 121, Pel 125, Pel 130, Ece 249, Che 110
    INSERT INTO subjects (semester_id, name, slug) VALUES 
        (sem2_id, 'INT306', 'int306'),
        (sem2_id, 'PHY110', 'phy110'),
        (sem2_id, 'CSE121', 'cse121'),
        (sem2_id, 'CSE101', 'cse101'),
        (sem2_id, 'MEC136', 'mec136'),
        (sem2_id, 'CSE320', 'cse320'),
        (sem2_id, 'PEL121', 'pel121'),
        (sem2_id, 'PEL125', 'pel125'),
        (sem2_id, 'PEL130', 'pel130'),
        (sem2_id, 'ECE249', 'ece249'),
        (sem2_id, 'CHE110', 'che110')
    ON CONFLICT (semester_id, slug) DO UPDATE SET name = EXCLUDED.name;
END $$;
