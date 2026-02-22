-- migrations/05_discovery_schema.sql

-- 1. Full Text Search
ALTER TABLE materials ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Update existing rows explicitly (if any exist)
UPDATE materials SET search_vector = to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''));

-- Create or Replace trigger function
CREATE OR REPLACE FUNCTION materials_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    to_tsvector('english',
      coalesce(NEW.title,'') || ' ' || coalesce(NEW.description,'')
    );
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS materials_search_update ON materials;
CREATE TRIGGER materials_search_update
BEFORE INSERT OR UPDATE ON materials
FOR EACH ROW
EXECUTE FUNCTION materials_search_vector_update();

CREATE INDEX IF NOT EXISTS idx_materials_search_vector
ON materials
USING GIN(search_vector);

-- 2. Engagement Stats Additions
ALTER TABLE material_stats ADD COLUMN IF NOT EXISTS avg_last_page NUMERIC DEFAULT 0;
ALTER TABLE material_stats ADD COLUMN IF NOT EXISTS completion_rate NUMERIC DEFAULT 0;

-- Trigger to update engagement stats upon progress updates
CREATE OR REPLACE FUNCTION update_material_engagement() RETURNS trigger AS $$
BEGIN
  UPDATE material_stats
  SET 
    avg_last_page = (
        SELECT COALESCE(AVG(last_page), 0) FROM material_progress WHERE material_id = NEW.material_id
    ),
    completion_rate = (
        SELECT COALESCE(COUNT(*) FILTER (WHERE total_pages > 0 AND last_page >= total_pages) * 100.0 / NULLIF(COUNT(*), 0), 0)
        FROM material_progress WHERE material_id = NEW.material_id
    )
  WHERE material_id = NEW.material_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_material_engagement ON material_progress;
CREATE TRIGGER trigger_update_material_engagement
AFTER INSERT OR UPDATE ON material_progress
FOR EACH ROW
EXECUTE FUNCTION update_material_engagement();
