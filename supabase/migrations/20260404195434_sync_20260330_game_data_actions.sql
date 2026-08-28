UPDATE public.game_data_actions
SET status = 'synced'
WHERE id IN (
  'a7f59fea-007a-4360-a0c1-1946a7536007',
  '681abde3-b978-4f0a-83d2-674438722284',
  '7be98a27-78e8-49ef-a46f-ed9d4deb49e9',
  '74c170ff-88c1-4529-baed-27472a81d352'
)
  AND status = 'approved';
