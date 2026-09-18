import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
  Matches,
} from 'class-validator';

export class RegisterDto {
  @IsString({ message: 'nome deve ser um texto' })
  @IsNotEmpty({ message: 'nome é obrigatório' })
  @Length(2, 64, { message: 'nome deve ter entre 2 e 64 caracteres' })
  name: string;

  @IsString({ message: 'username deve ser um texto' })
  @IsNotEmpty({ message: 'username é obrigatório' })
  @Length(2, 32, { message: 'username deve ter entre 2 e 32 caracteres' })
  @Matches(/^[a-zA-Z0-9_.-]+$/, {
    message: 'username deve conter apenas letras, números, ponto, hífen ou underline',
  })
  username: string;

  @IsEmail({}, { message: 'email inválido' })
  @IsNotEmpty({ message: 'email é obrigatório' })
  email: string;

  @IsString({ message: 'senha deve ser um texto' })
  @IsNotEmpty({ message: 'senha é obrigatória' })
  @Length(8, 72, { message: 'senha deve ter pelo menos 8 caracteres' })
  password: string;
}
