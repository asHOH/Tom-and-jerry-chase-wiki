# Publish Limit Measurement

## Run contract

- Command: `npm run --silent audit:game-data-actions -- --measure-publish-limits`
- Production read: ordered `select` queries only; no mutation or RPC calls
- Fingerprint: `audit-0d91fa42a54d9c6a7fafe7f838bade4df5d7671ba8df601cc237a5600246a204`
- Rows: 1218 total, 1218 decoded, 0 malformed
- Output retained only aggregate measurements; no entries, messages, actor IDs, or row IDs

The database has no submission ID. Submission-level figures therefore group rows by the heuristic
tuple `(created_at, created_by, entity_type)` and are conservative signals, not reconstructed
provenance.

## Observed maxima

| Measurement                           | Maximum |
| ------------------------------------- | ------: |
| Stored entry bytes                    |  46,776 |
| Flattened actions per stored row      |      26 |
| Path characters                       |      48 |
| Path UTF-8 bytes                      |      58 |
| Message characters                    |     239 |
| Message UTF-8 bytes                   |     711 |
| Heuristic top-level entries           |     100 |
| Heuristic flattened actions           |     100 |
| Heuristic reconstructed request bytes | 158,157 |

## Frozen limits

The limits use at least four times the observed maximum and round upward to practical boundaries.
Request bytes are derived from the heuristic reconstructed request measurement and are not claimed
as a directly observed HTTP body size.

| Limit                  |     Value |
| ---------------------- | --------: |
| Request bytes          | 1,048,576 |
| Top-level entries      |       512 |
| Flattened actions      |       512 |
| Actions per stored row |       128 |
| Path characters        |       256 |
| Message characters     |     1,024 |
