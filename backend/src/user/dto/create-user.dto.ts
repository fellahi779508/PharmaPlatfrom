import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { Role } from 'src/auth/enums/role.enum';

export class CreateUserDto {
  @IsNotEmpty({
    message: i18nValidationMessage('errors.user.required_firstName'),
  })
  firstName: string;

  @IsNotEmpty({
    message: i18nValidationMessage('errors.user.required_lastName'),
  })
  lastName: string;

  @IsNotEmpty({
    message: i18nValidationMessage('errors.user.required_username'),
  })
  username: string;

  @IsNotEmpty({
    message: i18nValidationMessage('errors.user.required_phone'),
  })
  @Matches(/^(00213|\+213|0)(5|6|7)[0-9]{8}$/, {
    message: i18nValidationMessage('errors.user.invalid_phone'),
  })
  @IsString()
  phone: string;

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
