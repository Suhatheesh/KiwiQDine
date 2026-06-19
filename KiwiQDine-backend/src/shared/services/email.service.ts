import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
    private transporter: nodemailer.Transporter;
    private readonly logger = new Logger(EmailService.name);

    constructor(private configService: ConfigService) {
        // Create transporter using SMTP or Gmail
        this.transporter = nodemailer.createTransport({
            host: this.configService.get('SMTP_HOST') || 'smtp.gmail.com',
            port: this.configService.get('SMTP_PORT') || 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: this.configService.get('SMTP_USER'),
                pass: this.configService.get('SMTP_PASS'),
            },
        });
    }

    /**
     * Send password reset email with temporary password
     */
    async sendPasswordResetEmail(
        to: string,
        userName: string,
        temporaryPassword: string,
    ): Promise<void> {
        const mailOptions = {
            from: `"DineFlow Support" <${this.configService.get('SMTP_USER')}>`,
            to,
            subject: 'Password Reset - DineFlow',
            html: this.getPasswordResetEmailTemplate(userName, temporaryPassword),
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            this.logger.log(`Password reset email sent to ${to}: ${info.messageId}`);
        } catch (error) {
            this.logger.error(`Failed to send password reset email to ${to}:`, error);
            throw new Error('Failed to send password reset email');
        }
    }

    /**
     * HTML template for password reset email
     */
    private getPasswordResetEmailTemplate(
        userName: string,
        temporaryPassword: string,
    ): string {
        return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background-color: #f9f9f9;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .header {
            background-color: #4CAF50;
            color: white;
            padding: 20px;
            border-radius: 10px 10px 0 0;
            text-align: center;
          }
          .content {
            background-color: white;
            padding: 30px;
            border-radius: 0 0 10px 10px;
          }
          .password-box {
            background-color: #f0f0f0;
            border-left: 4px solid #4CAF50;
            padding: 15px;
            margin: 20px 0;
            font-family: 'Courier New', monospace;
            font-size: 18px;
            font-weight: bold;
            letter-spacing: 2px;
          }
          .warning {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 12px;
            color: #666;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background-color: #4CAF50;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset</h1>
          </div>
          <div class="content">
            <p>Hello <strong>${userName}</strong>,</p>
            
            <p>Your password has been reset as requested. Below is your temporary password:</p>
            
            <div class="password-box">
              ${temporaryPassword}
            </div>
            
            <div class="warning">
              <strong>⚠️ Important Security Notice:</strong>
              <ul>
                <li>This is a temporary password</li>
                <li>Please change it immediately after logging in</li>
                <li>Do not share this password with anyone</li>
                <li>This email should be deleted after use</li>
              </ul>
            </div>
            
            <p><strong>How to use your temporary password:</strong></p>
            <ol>
              <li>Go to the DineFlow login page</li>
              <li>Enter your email address</li>
              <li>Use the temporary password above</li>
              <li>You will be prompted to change your password</li>
            </ol>
            
            <p>If you did not request this password reset, please contact your administrator immediately.</p>
            
            <div class="footer">
              <p>This is an automated message from DineFlow. Please do not reply to this email.</p>
              <p>&copy; ${new Date().getFullYear()} DineFlow. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
    }

    /**
     * Send test email to verify configuration
     */
    async sendTestEmail(to: string): Promise<void> {
        const mailOptions = {
            from: `"DineFlow Support" <${this.configService.get('SMTP_USER')}>`,
            to,
            subject: 'Test Email - DineFlow',
            html: '<h1>Test Email</h1><p>If you received this, your email configuration is working correctly!</p>',
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            this.logger.log(`Test email sent to ${to}: ${info.messageId}`);
        } catch (error) {
            this.logger.error(`Failed to send test email to ${to}:`, error);
            throw new Error('Failed to send test email');
        }
    }
}
