UPDATE public.permission_catalog
SET
  category = '用户组',
  label_zh = CASE key
    WHEN 'group.manage' THEN '管理用户组'
    WHEN 'group.assign' THEN '分配用户组'
    ELSE label_zh
  END
WHERE key IN ('group.manage', 'group.assign');
