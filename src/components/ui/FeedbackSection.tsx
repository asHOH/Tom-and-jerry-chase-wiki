'use client';

import { useState } from 'react';

export default function FeedbackSection() {
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackFormData, setFeedbackFormData] = useState({
    type: 'suggestion',
    content: '',
    contact: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedbackFormData),
      });

      if (response.ok) {
        setSubmitted(true);
        setFeedbackFormData({ type: 'suggestion', content: '', contact: '' });
      }
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      // Fallback: create mailto link
      const subject =
        feedbackFormData.type === 'bug'
          ? '网站错误'
          : feedbackFormData.type === 'data'
            ? '数据建议'
            : '功能建议';
      const body = `反馈类型: ${subject}\n\n内容:\n${feedbackFormData.content}\n\n联系方式: ${feedbackFormData.contact}`;
      window.location.href = `mailto:your-email@example.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQQGroupClick = () => {
    window.open(
      'https://qun.qq.com/universal-share/share?ac=1&authKey=%2BgPPblp3JfnQP2o3BI5PO1NmwvsNciCCaVCtSI9T6RAbv6yV2QHzzjz6gwY%2Bva9U&busi_data=eyJncm91cENvZGUiOiI2MTU4ODI3MzAiLCJ0b2tlbiI6Ijg3Ym9kMk9HTUVFTnJSU25GU2JCdWJoNEwxNGNOUlhWMGgvK3lMTWRGdy80Z0FnaUd4Yy9LYkZsYUJ5ZStTbUgiLCJ1aW4iOiIyOTAxODMzMjI1In0%3D&data=0yzCZAnaW0ZOxf01YibLkPBLkN17DRX2fS1NGi5Nndx2Qq2DMFDdWr1pxH3J8F9RefUGjWh_Zel5Rfjy-dPZ2A&svctype=4&tempid=h5_group_info',
      '_blank'
    );
  };

  return (
    <>
      {/* Feedback Button */}
      <div className='mt-6 flex justify-center'>
        <button
          type='button'
          onClick={() => setIsFeedbackOpen(true)}
          className='px-6 py-4 flex flex-col items-center justify-center gap-2 text-center min-w-[180px] bg-gray-200 text-gray-800 shadow-md rounded-md border-none focus:outline-none dark:bg-black dark:text-gray-200 dark:hover:bg-gray-900 dark:border-gray-700 transition-colors duration-200'
          aria-label='反馈建议'
        >
          <div className='flex items-center gap-3'>
            <svg className='w-8 h-8' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
              />
            </svg>
            <span className='text-2xl font-bold whitespace-nowrap'>反馈建议</span>
          </div>
          <div className='text-sm text-gray-500 mt-1 dark:text-gray-400'>提交建议或报告问题</div>
        </button>
      </div>

      {/* Feedback Modal */}
      {isFeedbackOpen && (
        <>
          <div
            className='fixed inset-0 bg-gray-900/30 backdrop-blur-sm z-40'
            onClick={() => setIsFeedbackOpen(false)}
          />

          <div className='fixed inset-5 md:inset-auto md:top-1/2 md:left-1/2 md:transform md:-translate-x-1/2 md:-translate-y-1/2 md:w-1/2 md:max-w-2xl md:min-w-[28rem] md:h-auto md:max-h-[80vh] z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden'>
            {submitted ? (
              <div className='p-6 text-center'>
                <div className='text-4xl mb-4'>✅</div>
                <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2'>
                  感谢您的反馈！
                </h3>
                <p className='text-gray-600 dark:text-gray-400 mb-4'>我们会认真考虑您的建议。</p>
                <button
                  type='button'
                  onClick={() => {
                    setSubmitted(false);
                    setIsFeedbackOpen(false);
                  }}
                  className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg'
                >
                  关闭
                </button>
              </div>
            ) : (
              <form onSubmit={handleFeedbackSubmit} className='p-6'>
                <div className='flex justify-between items-center mb-4'>
                  <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
                    📝 反馈建议
                  </h3>
                  <button
                    type='button'
                    onClick={() => setIsFeedbackOpen(false)}
                    className='text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                  >
                    ✕
                  </button>
                </div>

                {/* QQ Group Info */}
                <div className='mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center space-x-2'>
                      <span className='text-lg'>💬</span>
                      <div>
                        <div className='text-sm font-medium text-blue-900 dark:text-blue-100'>
                          QQ群：615882730
                        </div>
                        <div className='text-xs text-blue-700 dark:text-blue-300'>
                          与开发者直接交流
                        </div>
                      </div>
                    </div>
                    <button
                      type='button'
                      onClick={handleQQGroupClick}
                      className='text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded'
                    >
                      加入
                    </button>
                  </div>
                </div>
                <div className='space-y-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                      反馈类型
                    </label>
                    <select
                      value={feedbackFormData.type}
                      onChange={(e) =>
                        setFeedbackFormData({ ...feedbackFormData, type: e.target.value })
                      }
                      className='w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                      aria-label='反馈类型'
                      title='选择反馈类型'
                    >
                      <option value='suggestion'>功能建议</option>
                      <option value='bug'>网站错误</option>
                      <option value='data'>数据建议</option>
                      <option value='other'>其他</option>
                    </select>
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                      详细描述 *
                    </label>
                    <textarea
                      value={feedbackFormData.content}
                      onChange={(e) =>
                        setFeedbackFormData({ ...feedbackFormData, content: e.target.value })
                      }
                      placeholder='请详细描述您的建议或遇到的问题...'
                      className='w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 h-32 resize-none'
                      required
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                      联系方式（可选）
                    </label>
                    <input
                      type='text'
                      value={feedbackFormData.contact}
                      onChange={(e) =>
                        setFeedbackFormData({ ...feedbackFormData, contact: e.target.value })
                      }
                      placeholder='QQ号或其他联系方式（如需回复）'
                      className='w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                    />
                  </div>
                </div>

                <div className='flex space-x-3 mt-6'>
                  <button
                    type='button'
                    onClick={() => setIsFeedbackOpen(false)}
                    className='flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700'
                  >
                    取消
                  </button>
                  <button
                    type='submit'
                    disabled={isSubmitting || !feedbackFormData.content.trim()}
                    className='flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg'
                  >
                    {isSubmitting ? '提交中...' : '提交反馈'}
                  </button>
                </div>

                <div className='mt-4 pt-3 border-t border-gray-200 dark:border-gray-600'>
                  <p className='text-xs text-gray-500 dark:text-gray-400 text-center'>
                    感谢您帮助改进猫和老鼠手游百科！
                  </p>
                </div>
              </form>
            )}
          </div>
        </>
      )}
    </>
  );
}
