export const ACTION_PROCESSING_ERROR_CODES = Object.freeze([
  'invalid_shape',
  'empty_row',
  'unknown_field',
  'invalid_path',
  'invalid_array_index',
  'missing_new_value',
  'missing_path',
  'invalid_array_length',
  'clone_failed',
  'apply_failed',
  'invariant_failed',
] as const);

export type ActionProcessingErrorCode = (typeof ACTION_PROCESSING_ERROR_CODES)[number];

export type ActionDecodeErrorCode = Extract<
  ActionProcessingErrorCode,
  | 'invalid_shape'
  | 'empty_row'
  | 'unknown_field'
  | 'invalid_path'
  | 'missing_new_value'
  | 'clone_failed'
>;
