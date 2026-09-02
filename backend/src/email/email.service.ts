import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { UserService } from 'src/user/user.service';
import { forwardRef, Inject } from '@nestjs/common';
import { I18nContext, I18nService, i18nValidationMessage } from 'nestjs-i18n';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private readonly mailerService: MailerService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    private readonly i18n: I18nService,
  ) {}

  private get currentLang(): string {
    return I18nContext.current()?.lang!;
  }

  async sendVerificationOtp(email: string, otp: string) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #1e293b; text-align: center; margin-bottom: 8px;">Verify Your Email</h2>
        <p style="color: #475569; text-align: center;">Use the code below to complete your registration:</p>
        <div style="text-align: center; margin: 28px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #2563eb; background: #eff6ff; padding: 12px 24px; border-radius: 6px; border: 1px dashed #bfdbfe;">
            ${otp}
          </span>
        </div>
        <p style="color: #64748b; font-size: 13px; text-align: center;">This OTP expires in <strong>1 minute</strong>.</p>
      </div>
    `;

    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Your Account Verification Code',
        html,
      });
      return { message: 'OTP sent successfully' };
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${email}`,
        (error as Error).stack,
      );
      throw error;
    }
  }
  async verifyOtp(dto: VerifyOtpDto) {
    const user = await this.userService.findByEmail(dto.email);

    if (user.isVerified) {
      throw new BadRequestException({
        message: this.i18n.translate('errors.user.email_already_verified', {
          lang: this.currentLang,
        }),
      });
    }

    if (!user.otpCode || user.otpCode !== dto.otp) {
      throw new BadRequestException({
        message: this.i18n.translate('errors.user.invalid_otp', {
          lang: this.currentLang,
        }),
      });
    }

    if (user.otpExpiresAt && new Date() > user.otpExpiresAt) {
      throw new BadRequestException({
        message: this.i18n.translate('errors.user.otp_expired', {
          lang: this.currentLang,
        }),
      });
    }

    // Mark as verified & clear OTP data
    user.isVerified = true;
    user.otpCode = null;
    user.otpExpiresAt = null;
    await this.userService.update(user.id, {
      isVerified: true,
      otpCode: null,
      otpExpiresAt: null,
    });

    return { message: 'Email verified successfully.' };
  }
}
