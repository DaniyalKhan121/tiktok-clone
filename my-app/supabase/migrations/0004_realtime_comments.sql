-- Comments need to stream live into an open CommentDrawer; add the table to
-- the realtime publication so postgres_changes events actually fire.
alter publication supabase_realtime add table public.comments;
