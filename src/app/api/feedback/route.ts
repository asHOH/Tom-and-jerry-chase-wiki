import { NextRequest, NextResponse } from 'next/server';

import { env } from '@/env';
import { checkRateLimit } from '@/lib/rateLimit';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { feedbackSchema, formatZodError } from '@/lib/validation/schemas';

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
        subject: `[猫鼠Wiki] ${getFeedbackTypeText(feedbackData.type)}`,
        html: `
          <h2>用户反馈</h2>
          <p><strong>类型:</strong> ${getFeedbackTypeText(feedbackData.type)}</p>
          <p><strong>时间:</strong> ${feedbackData.timestamp}</p>
          <p><strong>内容:</strong></p>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
            ${feedbackData.content.replace(/\n/g, '<br>')}
          </div>
          <p><strong>联系方式:</strong> ${feedbackData.contact}</p>
          <hr>
          <p style="color: #666; font-size: 12px;">
            <strong>技术信息:</strong><br>
            用户代理: ${feedbackData.userAgent}<br>
            IP地址: ${feedbackData.ip}
          </p>
        `,
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
