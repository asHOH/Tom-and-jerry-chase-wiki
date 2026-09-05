import { NextRequest, NextResponse } from 'next/server';

import {
  renderWikiEmailCallout,
  renderWikiEmailDetails,
  renderWikiEmailTemplate,
} from '@/lib/emailTemplate';
import { checkRateLimit } from '@/lib/rateLimit';
import { getOptionalSupabaseAdminClient } from '@/lib/supabase/adminClient';
import { feedbackSchema, formatZodError } from '@/lib/validation/schemas';
import { SITE_SHORT_NAME } from '@/constants/brand';
import { env } from '@/env';

interface FeedbackData {
  type: string;
  content: string;
  contact: string;
  timestamp: string;
  userAgent: string;
  ip: string;
}

export async function POST(request: NextRequest) {
  try {
    const rl = await checkRateLimit(request, 'expensive', 'feedback');
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: rl.headers }
      );
    }

    const parsed = feedbackSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: formatZodError(parsed.error) },
        { status: 400 }
      );
    }
    const { type, content, contact } = parsed.data;

    // Get current timestamp
    const timestamp = new Date().toLocaleString('zh-CN', {
      timeZone: 'Asia/Shanghai',
    });

    // Format feedback data
    const feedbackData = {
      type,
      content: content.trim(),
      contact: contact?.trim() || '未提供',
      timestamp,
      userAgent: request.headers.get('user-agent') || 'Unknown',
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown',
    };

    // Save to Supabase Database
    const supabaseAdmin = getOptionalSupabaseAdminClient();
    if (supabaseAdmin) {
      try {
        const { error: dbError } = await supabaseAdmin.from('feedback').insert({
          type: feedbackData.type,
          content: feedbackData.content,
          contact: feedbackData.contact,
          user_agent: feedbackData.userAgent,
          ip_address: feedbackData.ip,
        });

        if (dbError) {
          console.error('❌ Failed to save feedback to database:', dbError);
        } else {
          console.log('✅ Feedback saved to database');
        }
      } catch (dbErr) {
        console.error('❌ Unexpected error saving to database:', dbErr);
      }
    } else {
      console.warn('⚠️ supabaseAdmin is not available, skipping database save.');
    }

    // Send feedback via email (test in development too)
    try {
      await sendFeedbackEmail(feedbackData);
      console.log('✅ Email sent successfully');
    } catch (emailError) {
      console.log('❌ Email failed, logging to console:', feedbackData);
      console.error('Email error:', emailError);
    }

    return NextResponse.json({
      success: true,
      message: '反馈提交成功，感谢您的建议！',
    });
  } catch (error) {
    console.error('Feedback submission error:', error);
    return NextResponse.json({ error: '提交失败，请稍后重试' }, { status: 500 });
  }
}

// Email implementation using Resend (works well globally including China)
async function sendFeedbackEmail(feedbackData: FeedbackData) {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.RESEND_FROM_EMAIL || 'feedback@resend.dev', // Use your domain or Resend's shared domain
        to: [env.FEEDBACK_EMAIL || 'your-email@example.com'],
        subject: `[${SITE_SHORT_NAME}] ${getFeedbackTypeText(feedbackData.type)}`,
        text: `收到新的用户反馈\n\n类型：${getFeedbackTypeText(feedbackData.type)}\n时间：${feedbackData.timestamp}\n联系方式：${feedbackData.contact}\n\n反馈内容：\n${feedbackData.content}\n\n用户代理：${feedbackData.userAgent}\nIP 地址：${feedbackData.ip}`,
        html: renderWikiEmailTemplate({
          preheader: `新的${getFeedbackTypeText(feedbackData.type)}：${feedbackData.content}`,
          eyebrow: '站点反馈',
          title: `收到新的${getFeedbackTypeText(feedbackData.type)}`,
          message: '一位百科用户提交了新的反馈，详细信息如下。',
          tone: 'warning',
          contentHtml: `${renderWikiEmailDetails([
            { label: '反馈类型', value: getFeedbackTypeText(feedbackData.type) },
            { label: '提交时间', value: feedbackData.timestamp },
            { label: '联系方式', value: feedbackData.contact },
          ])}${renderWikiEmailCallout(feedbackData.content)}${renderWikiEmailDetails([
            { label: '用户代理', value: feedbackData.userAgent },
            { label: 'IP 地址', value: feedbackData.ip },
          ])}`,
          notice: '此邮件包含用户提交的内容，请谨慎处理其中的联系方式和技术信息。',
        }),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Resend API error:', response.status, errorText);

      // Fallback to mailto if email service fails
      console.log('Falling back to console log due to email service failure');
      console.log('📧 Feedback that failed to send via email:', feedbackData);

      throw new Error(`Email service error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to send feedback email:', error);

    // In production, you might want to save to a backup location
    // For now, we'll just log it so it's not completely lost
    console.log('📧 Backup log of feedback:', feedbackData);

    throw error;
  }
}

function getFeedbackTypeText(type: string): string {
  const types: Record<string, string> = {
    suggestion: '功能建议',
    bug: '错误报告',
    data: '数据纠错',
    other: '其他反馈',
  };
  return types[type] || '未知类型';
}
