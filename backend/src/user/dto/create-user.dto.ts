import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { Role } from 'src/auth/enums/role.enum';

export class CreateUserDto {
  @IsNotEmpty({
    message: i18nValidationMessage('errors.user.required_username'),
  })
  username: string;

  @IsEmail(
    {},
    {
      message: i18nValidationMessage('errors.user.invalid_email'),
    },
  )
  @IsNotEmpty({
    message: i18nValidationMessage('errors.user.required_email'),
  })
  email: string;

  @MinLength(6, {
    message: i18nValidationMessage('errors.user.password_too_short'),
  })
  @IsNotEmpty({
    message: i18nValidationMessage('errors.user.required_password'),
  })
  password: string;

  @IsNotEmpty({
    message: i18nValidationMessage('errors.user.required_role'),
  })
  role: Role;
}
