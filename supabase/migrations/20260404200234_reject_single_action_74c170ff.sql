UPDATE public.game_data_actions
SET status = 'rejected'
WHERE id = '74c170ff-88c1-4529-baed-27472a81d352'
  AND status IN ('approved', 'synced');
