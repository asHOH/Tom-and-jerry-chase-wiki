'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

import { ChatBubbleIcon } from '@/components/icons/CommonIcons';

export interface FeedbackSectionRef {
  openFeedback: () => void;
  isOpen: () => boolean;
}

const FeedbackSection =
  process.env.NEXT_PUBLIC_DISABLE_FEEDBACK_EMAIL === '1'
    ? forwardRef<FeedbackSectionRef>(function FeedbackSection(_, ref) {
        useImperativeHandle(ref, () => ({
          openFeedback: () => null,
          isOpen: () => false,
        }));
        return null;
      })
    : forwardRef<FeedbackSectionRef>(function FeedbackSection(_, ref) {
        const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
        const [feedbackFormData, setFeedbackFormData] = useState({
          type: 'suggestion',
          content: '',
          contact: '',
        });
        const [isSubmitting, setIsSubmitting] = useState(false);
        const [submitted, setSubmitted] = useState(false);
        const [isAnonymous, setIsAnonymous] = useState(false);
        const textareaRef = useRef<HTMLTextAreaElement | null>(null);

        useImperativeHandle(ref, () => ({
          openFeedback: () => setIsFeedbackOpen(true),
          isOpen: () => isFeedbackOpen,
        }));

        const handleFeedbackSubmit = async (e: React.FormEvent) => {
          e.preventDefault();
          setIsSubmitting(true);

          try {
            const payload = isAnonymous ? { ...feedbackFormData, contact: '' } : feedbackFormData;
            const response = await fetch('/api/feedback', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(payload),
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
            const contactText = isAnonymous ? '匿名' : feedbackFormData.contact;
            const body = `反馈类型: ${subject}\n\n内容:\n${feedbackFormData.content}\n\n联系方式: ${contactText}`;
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

        useEffect(() => {
          if (isFeedbackOpen && !submitted) {
            textareaRef.current?.focus();
          }
        }, [isFeedbackOpen, submitted]);

        useEffect(() => {
          if (!isFeedbackOpen) return;
          const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
              setIsFeedbackOpen(false);
            }
          };
          window.addEventListener('keydown', onKeyDown);
          return () => window.removeEventListener('keydown', onKeyDown);
        }, [isFeedbackOpen]);

        return (
          <>
            {/* Feedback Button */}
            <button
              type='button'
              onClick={() => setIsFeedbackOpen(true)}
              className='flex min-w-[180px] flex-col items-center justify-center gap-2 rounded-md border-none bg-gray-200 px-6 py-4 text-center text-gray-800 shadow-md transition-colors duration-200 focus:outline-none dark:border-gray-700 dark:bg-black dark:text-gray-200 dark:hover:bg-gray-900'
              aria-label='反馈建议'
            >
              <div className='flex items-center gap-3'>
                <ChatBubbleIcon className='h-8 w-8' strokeWidth={2} />
                <span className='text-2xl font-bold whitespace-nowrap'>反馈建议</span>
              </div>
              <div className='mt-1 text-sm text-gray-500 dark:text-gray-400'>
                提交建议或报告问题
              </div>
            </button>

            {/* Feedback Modal */}
            {isFeedbackOpen && (
              <>
                <div
                  className='fixed inset-0 z-40 bg-gray-900/30 backdrop-blur-sm'
                  onClick={() => setIsFeedbackOpen(false)}
                  onDoubleClick={(e) => e.stopPropagation()}
                  aria-hidden='true'
                />

                <div
                  className='fixed inset-5 z-50 overflow-hidden rounded-lg bg-white shadow-xl md:inset-auto md:top-1/2 md:left-1/2 md:h-auto md:max-h-[80vh] md:w-1/2 md:max-w-2xl md:min-w-md md:-translate-x-1/2 md:-translate-y-1/2 md:transform dark:bg-gray-800'
                  onDoubleClick={(e) => e.stopPropagation()}
                  role='dialog'
                  aria-modal='true'
                  aria-labelledby='feedback-title'
                >
                  {submitted ? (
                    <div className='p-6 text-center' role='alert' aria-live='polite'>
                      <div className='mb-4 text-4xl'>✅</div>
                      <h3 className='mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100'>
                        感谢您的反馈！
                      </h3>
                      <p className='mb-4 text-gray-600 dark:text-gray-400'>
                        我们会认真考虑您的建议。
                      </p>
                      <button
                        type='button'
                        onClick={() => {
                          setSubmitted(false);
                          setIsFeedbackOpen(false);
                        }}
                        className='rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700'
                      >
                        关闭
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleFeedbackSubmit} className='p-6'>
                      <div className='mb-4 flex items-center justify-between'>
                        <h3
                          id='feedback-title'
                          className='text-lg font-semibold text-gray-900 dark:text-gray-100'
                        >
                          📝 反馈建议
                        </h3>
                        <button
                          type='button'
                          onClick={() => setIsFeedbackOpen(false)}
                          className='text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                          aria-label='关闭反馈窗口'
                        >
                          ✕
                        </button>
                      </div>

                      {/* QQ Group Info */}
                      <div className='mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-700 dark:bg-blue-900/20'>
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
                            className='rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700'
                          >
                            加入
                          </button>
                        </div>
                      </div>
                      <div className='space-y-4'>
                        <div>
                          <label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
                            反馈类型
                          </label>
                          <select
                            value={feedbackFormData.type}
                            onChange={(e) =>
                              setFeedbackFormData({ ...feedbackFormData, type: e.target.value })
                            }
                            className='w-full rounded-lg border border-gray-300 bg-white p-2 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100'
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
                          <label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
                            详细描述
                          </label>
                          <textarea
                            ref={textareaRef}
                            value={feedbackFormData.content}
                            onChange={(e) =>
                              setFeedbackFormData({ ...feedbackFormData, content: e.target.value })
                            }
                            placeholder='请详细描述您的建议或遇到的问题...'
                            className='h-32 w-full resize-none rounded-lg border border-gray-300 bg-white p-3 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100'
                            required
                          />
                        </div>

                        <div>
                          <div className='mb-2 flex items-center justify-between'>
                            <label
                              htmlFor='contact'
                              className='text-sm font-medium text-gray-700 dark:text-gray-300'
                            >
                              {isAnonymous ? '联系方式（已匿名）' : '联系方式'}
                            </label>
                            <label
                              htmlFor='anonymous'
                              className='inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300'
                            >
                              <input
                                id='anonymous'
                                type='checkbox'
                                checked={isAnonymous}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setIsAnonymous(checked);
                                  // Preserve contact value so users can toggle back without losing input
                                }}
                                className='h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                                aria-controls='contact'
                                aria-label='匿名提交'
                              />
                              匿名
                            </label>
                          </div>
                          <input
                            id='contact'
                            type='text'
                            value={feedbackFormData.contact}
                            onChange={(e) =>
                              setFeedbackFormData({ ...feedbackFormData, contact: e.target.value })
                            }
                            placeholder={
                              isAnonymous ? '已匿名' : '请填写QQ号或其他联系方式，便于回复'
                            }
                            className='w-full rounded-lg border border-gray-300 bg-white p-2 text-gray-900 disabled:bg-gray-100 disabled:text-gray-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 disabled:dark:bg-gray-700/60 disabled:dark:text-gray-500'
                            disabled={isAnonymous}
                            aria-disabled={isAnonymous}
                            aria-describedby='contact-help'
                            required={!isAnonymous}
                          />
                          {/^\s*wxid_/i.test(feedbackFormData.contact || '') && !isAnonymous && (
                            <div
                              id='contact-help'
                              className='mt-1 text-xs text-gray-500 dark:text-gray-400'
                            >
                              <span className='ml-1 text-red-600 dark:text-red-400'>
                                注意：以 wxid_ 开头的微信ID无法通过搜索添加，请更换其他联系方式
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className='mt-6 flex space-x-3'>
                        <button
                          type='button'
                          onClick={() => setIsFeedbackOpen(false)}
                          className='flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                        >
                          取消
                        </button>
                        <button
                          type='submit'
                          disabled={
                            isSubmitting ||
                            !feedbackFormData.content.trim() ||
                            (!isAnonymous && !feedbackFormData.contact.trim())
                          }
                          className='flex-1 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-gray-400'
                        >
                          {isSubmitting ? '提交中...' : '提交反馈'}
                        </button>
                      </div>

                      <div className='mt-4 border-t border-gray-200 pt-3 dark:border-gray-600'>
                        <p className='text-center text-xs text-gray-500 dark:text-gray-400'>
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
      });

export default FeedbackSection;
