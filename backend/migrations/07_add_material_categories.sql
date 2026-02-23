-- migrations/07_add_material_categories.sql

-- Add explicit categories to establish the hierarchy requested by the user: CA, MidTerm, Pyqs, Notes
ALTER TABLE materials ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'notes';

-- Add unit column to support Unit 1 to 6 inside notes and ppts
ALTER TABLE materials ADD COLUMN IF NOT EXISTS unit VARCHAR(10);

-- Update the full text search to index the category and unit as well
DROP TRIGGER IF EXISTS materials_search_update ON materials;

CREATE OR REPLACE FUNCTION materials_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    to_tsvector('english',
      coalesce(NEW.title,'') || ' ' || 
      coalesce(NEW.description,'') || ' ' ||
      coalesce(NEW.category,'') || ' ' ||
      coalesce(NEW.unit,'')
    );
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER materials_search_update
BEFORE INSERT OR UPDATE ON materials
FOR EACH ROW
EXECUTE FUNCTION materials_search_vector_update();
