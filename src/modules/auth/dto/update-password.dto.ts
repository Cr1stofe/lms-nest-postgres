import { IsNotEmpty, IsString, Length } from 'class-validator';

export class UpdatePasswordDto {
  @IsString({ message: 'senha atual deve ser um texto' })
  @IsNotEmpty({ message: 'senha atual é obrigatória' })
  password: string;

  @IsString({ message: 'nova senha deve ser um texto' })
  @IsNotEmpty({ message: 'nova senha é obrigatória' })
  @Length(8, 72, { message: 'nova senha deve ter pelo menos 8 caracteres' })
  new_password: string;
}
