import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { UserService } from 'src/user/user.service';
import { forwardRef, Inject } from '@nestjs/common';
import { I18nContext, I18nService, i18nValidationMessage } from 'nestjs-i18n';
import { accountVerificationTemplate } from './html-templates/account-verification';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private readonly mailerService: MailerService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    private readonly i18n: I18nService,
  ) { }

  private get currentLang(): string {
    return I18nContext.current()?.lang!;
  }

  async sendVerificationOtp(email: string, otp: string, html: any) {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Your Account Verification Code',
        html,
      });
      const user = await this.userService.findByEmail(email);
      user.otpCode = otp;
      user.otpExpiresAt = new Date(Date.now() + 60 * 1000); // 10 minutes
      await this.userService.update(user.id, {
        otpCode: otp,
        otpExpiresAt: user.otpExpiresAt,
      });
      return {
        message: this.i18n.translate('errors.email.otp_sent', {
          lang: this.currentLang,
        }),
      };
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
        message: this.i18n.translate('errors.email.invalid_otp', {
          lang: this.currentLang,
        }),
      });
    }

    if (user.otpExpiresAt && new Date() > user.otpExpiresAt) {
      throw new BadRequestException({
        message: this.i18n.translate('errors.email.otp_expired', {
          lang: this.currentLang,
        }),
      });
    }

    // Mark as verified & clear OTP data
    await this.userService.update(user.id, {
      isVerified: true,
      otpCode: null,
      otpExpiresAt: null,
    });

    return { message: 'Email verified successfully.' };
  }

  async verifyOtpPassword(dto: VerifyOtpDto) {
    const user = await this.userService.findByEmail(dto.email);


    if (!user.otpCode || user.otpCode !== dto.otp) {
      throw new BadRequestException({
        message: this.i18n.translate('errors.email.invalid_otp', {
          lang: this.currentLang,
        }),
      });
    }

    if (user.otpExpiresAt && new Date() > user.otpExpiresAt) {
      throw new BadRequestException({
        message: this.i18n.translate('errors.email.otp_expired', {
          lang: this.currentLang,
        }),
      });
    }

    if (user.otpCode != dto.otp) {
      throw new BadRequestException({
        message: this.i18n.translate('errors.email.invalid_otp', {
          lang: this.currentLang,
        }),
      });
    }

    return { message: 'success' };
  }

}
