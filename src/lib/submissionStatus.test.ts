import { getSubmissionStatusPresentation, SUBMISSION_STATUSES } from './submissionStatus';

it.each([
  ['article', ['待审核', '已发布', '已拒绝', '状态未知', '已撤销']],
  ['contribution', ['待审核', '已通过', '未通过', '已同步', '已撤销']],
  ['gameData', ['待审核', '已批准', '已拒绝', '已同步', '已撤销']],
] as const)('preserves the status vocabulary for %s', (context, labels) => {
  expect(
    SUBMISSION_STATUSES.map((status) => getSubmissionStatusPresentation(status, context).label)
  ).toEqual(labels);
});

it.each([null, undefined, 'future-status', 'constructor'])(
  'shows %s as an unknown status in every context',
  (status) => {
    for (const context of ['article', 'contribution', 'gameData'] as const) {
      expect(getSubmissionStatusPresentation(status, context)).toEqual(
        getSubmissionStatusPresentation('unknown', context)
      );
      expect(getSubmissionStatusPresentation(status, context).label).toBe('状态未知');
    }
  }
);
