
import { Result } from '../../domain/result/result';
import { LoginSingleClientDTO } from '../dtos';
import { CreateSingleClientDTO } from '../dtos/create-singleclient.dto';
import { OnBoardSingleClientDTO } from '../dtos/on-board-singleclient.dto';
import { ISingleClientResponseDTO } from '../singleclient-response.dto';

export interface ISingleClientService {
  createSingleClient(props: CreateSingleClientDTO): Promise<Result<ISingleClientResponseDTO>>;

  getSingleClientById(id: string): Promise<Result<ISingleClientResponseDTO>>;

  signIn(props: LoginSingleClientDTO): Promise<Result<ISingleClientResponseDTO>>;

  onBoardSingleClient(props: OnBoardSingleClientDTO, id: string): Promise<Result<ISingleClientResponseDTO>>;

  getAccessTokenAndUpdateRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<Result<{ accessToken: string }>>;

  signOut(userId: string): Promise<void>;
  validateContext(): Promise<boolean>;
  getSingleClients(): Promise<Result<ISingleClientResponseDTO[]>>;
}
