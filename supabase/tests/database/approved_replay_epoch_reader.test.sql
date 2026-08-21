BEGIN;
SELECT plan(4);

SELECT has_function(
  'public',
  'read_game_data_approved_replay_epoch',
  ARRAY[]::text[],
  'approved replay epoch reader exists'
);

SELECT function_returns(
  'public',
  'read_game_data_approved_replay_epoch',
  ARRAY[]::text[],
  'bigint',
  'approved replay epoch reader returns one scalar bigint'
);

SELECT function_privs_are(
  'public',
  'read_game_data_approved_replay_epoch',
  ARRAY[]::text[],
  'anon',
  ARRAY['EXECUTE'],
  'anon can execute the epoch-only RPC'
);

SELECT function_privs_are(
  'public',
  'read_game_data_approved_replay_epoch',
  ARRAY[]::text[],
  'authenticated',
  ARRAY['EXECUTE'],
  'authenticated can execute the epoch-only RPC'
);

SELECT * FROM finish();
ROLLBACK;
