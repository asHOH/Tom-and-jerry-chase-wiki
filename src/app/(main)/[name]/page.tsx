// Single-segment root paths use the same entity resolution and disambiguation
// behavior as /goto/[name]. Existing static routes take precedence over this
// dynamic fallback.
export { default } from '@/app/(main)/goto/[name]/page';
