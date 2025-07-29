'use client';

import { useState } from 'react';

export default function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: 'suggestion',
    content: '',
    contact: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitted(true);
        setFormData({ type: 'suggestion', content: '', contact: '' });
      }
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      // Fallback: create mailto link
      const subject =
        formData.type === 'bug' ? '网站错误' : formData.type === 'data' ? '数据建议' : '功能建议';
      const body = `反馈类型: ${subject}\n\n内容:\n${formData.content}\n\n联系方式: ${formData.contact}`;
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

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className='fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all duration-200 hover:scale-110'
        aria-label='反馈建议'
      >
        <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
          />
        </svg>
      </button>
    );
  }

  return (
    <>
      <div className='fixed inset-0 bg-black bg-opacity-50 z-40' onClick={() => setIsOpen(false)} />

      <div className='fixed inset-4 md:top-1/2 md:left-1/2 md:transform md:-translate-x-1/2 md:-translate-y-1/2 md:w-96 md:h-auto z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden'>
        {submitted ? (
          <div className='p-6 text-center'>
            <div className='text-4xl mb-4'>✅</div>
            <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2'>
              反馈提交成功！
            </h3>
            <p className='text-gray-600 dark:text-gray-400 mb-4'>
              感谢您的反馈，我们会认真考虑您的建议。
            </p>
            <button
              type='button'
              onClick={() => {
                setSubmitted(false);
                setIsOpen(false);
              }}
              className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg'
            >
              关闭
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className='p-6'>
            <div className='flex justify-between items-center mb-4'>
              <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
                📝 反馈建议
              </h3>
              <button
                type='button'
                onClick={() => setIsOpen(false)}
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
                      QQ群交流：615882730
                    </div>
                    <div className='text-xs text-blue-700 dark:text-blue-300'>
                      最快的反馈方式，与开发者直接交流
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
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className='w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                  aria-label='反馈类型'
                  title='选择反馈类型'
                >
                  <option value='suggestion'>功能建议</option>
                  <option value='bug'>错误报告</option>
                  <option value='data'>数据纠错</option>
                  <option value='other'>其他</option>
                </select>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                  详细描述 *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
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
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  placeholder='QQ号或其他联系方式（如需回复）'
                  className='w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                />
              </div>
            </div>

            <div className='flex space-x-3 mt-6'>
              <button
                type='button'
                onClick={() => setIsOpen(false)}
                className='flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700'
              >
                取消
              </button>
              <button
                type='submit'
                disabled={isSubmitting || !formData.content.trim()}
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
  );
}
