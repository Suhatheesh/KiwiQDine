import { ISignUpTokens } from '../infrastructure/auth/interfaces/auth.interface';

import { IAudit } from '../infrastructure/database/mongoDB/base-document.interface';
export interface ISingleClientResponseDTO extends IAudit {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  organisationName: string;
  phoneNumber: string;
  role: string;
  isActive: boolean;
  status?: string;
  organisationAddress: string;
  tokens?: ISignUpTokens;
}

export interface ISingleClientSignedInResponseDTO extends ISingleClientResponseDTO {
  tokenExpiresIn?: number;
}
