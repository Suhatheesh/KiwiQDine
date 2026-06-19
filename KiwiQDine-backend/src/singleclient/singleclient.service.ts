import { AuthService } from '../infrastructure/auth/auth.service';
import { SingleClient as SingleClientEntity } from './../infrastructure/database/entities/singleclient.entity';
/* eslint-disable prettier/prettier */
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { SingleClientRepository } from '../infrastructure/data_access/repositories/singleclient.repository';
import { SingleClientStatus, saltRounds } from '../application/constants/constants';
import { TYPES } from '../application/constants/types';
import { Audit } from '../domain/audit/audit';
import { Result } from '../domain/result/result';
import { ISignUpTokens, IUserPayload } from '../infrastructure/auth/interfaces/auth.interface';
import { Context, IContextService } from '../infrastructure/context';
import { GenericTypeOrmRepository } from '../infrastructure/database/typeorm/generic-typeorm.repository';
import { throwApplicationError } from '../infrastructure/utilities/exception-instance';
import { SingleClient } from './../singleclient/singleclient';
import { IValidateUser } from '../utils/context-validation.interface';

import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ISingleClientService } from './interface/singleclient-service.interface';
import { IUpdateSingleClient } from './interface/update-singleclient.interface';
import { SingleClientParser } from './singleclient-parser';
import { ISingleClientResponseDTO, ISingleClientSignedInResponseDTO } from './singleclient-response.dto';
import { SingleClientMapper } from './singleclient.mapper';
import { CreateSingleClientDTO, LoginSingleClientDTO, OnBoardSingleClientDTO } from './dtos';

@Injectable()
export class SingleClientService extends AuthService implements ISingleClientService {
  constructor(
    jwtService: JwtService,
    configService: ConfigService,
    private readonly singleclientRepository: SingleClientRepository,
    private readonly singleclientMapper: SingleClientMapper,
    @Inject(TYPES.IContextService)
    private readonly contextService: IContextService,
    @Inject(TYPES.IValidateUser)
    private readonly validateSingleClient: IValidateUser<SingleClient, SingleClientEntity>,
  ) {
    super(jwtService, configService);
  }

  async createSingleClient(props: CreateSingleClientDTO): Promise<Result<ISingleClientResponseDTO>> {
    const normalizedEmail = props.email.toLowerCase();
    const context: Context = new Context(normalizedEmail);
    const existingSingleClient: Result<SingleClient> = await this.singleclientRepository.findOne({ where: { email: normalizedEmail } });
    if (existingSingleClient.isSuccess && existingSingleClient.getValue().email === normalizedEmail) {
      throwApplicationError(HttpStatus.BAD_REQUEST, `User already exists, sign in.`);
    }

    const audit: Audit = Audit.createInsertContext(context);
    const hashedPassword = await this.hashData(props.password, saltRounds);
    const singleclient: SingleClient = SingleClient.create({
      email: normalizedEmail,
      passwordHash: hashedPassword,
      role: props.role || 'USER',
      firstName: props.firstName,
      lastName: props.lastName,
      organisationName: props.organisationName,
      phoneNumber: props.phoneNumber,
      organisationAddress: props.organisationAddress,
      isActive: false,
      status: 'onBoarding',
      audit,
    }).getValue();
    const singleclientModel = this.singleclientMapper.toPersistence(singleclient);
    const docResult = await this.singleclientRepository.create(singleclientModel);
    if (!docResult.isSuccess) {
      throwApplicationError(HttpStatus.SERVICE_UNAVAILABLE, 'Error while creating singleclient');
    }

    const newSingleClient = docResult.getValue();
    return Result.ok(SingleClientParser.createSingleClientResponse(newSingleClient));
  }

  async getSingleClientById(id: string): Promise<Result<ISingleClientResponseDTO>> {
    const context: Context = this.contextService.getContext();
    const isValidUser = await this.validateContext();
    if (!isValidUser) {
      throwApplicationError(HttpStatus.FORBIDDEN, 'Invalid Email');
    }
    const result = await this.singleclientRepository.findOne({ where: { id } });
    if (!result.isSuccess) {
      throwApplicationError(HttpStatus.NOT_FOUND, 'SingleClient does not exist');
    }
    const singleclient: SingleClient = result.getValue();
    if (context.email !== singleclient.email) {
      throwApplicationError(HttpStatus.UNAUTHORIZED, 'You dont have sufficient priviledge');
    }
    return Result.ok(SingleClientParser.createSingleClientResponse(singleclient));
  }

  async getSingleClients(): Promise<Result<ISingleClientResponseDTO[]>> {
    const isValidUser = await this.validateContext();
    if (!isValidUser) {
      throwApplicationError(HttpStatus.FORBIDDEN, 'Invalid Email');
    }
    const result = await this.singleclientRepository.find({});
    const singleclients = result.getValue();
    return Result.ok(SingleClientParser.singleclientsResponse(singleclients));
  }

  private async updateSingleClientRefreshToken(
    singleclient: SingleClient,
    token: ISignUpTokens,
  ): Promise<SingleClient> {
    const hash = await this.hashData(token.refreshToken, saltRounds);
    const docResult: Result<SingleClient> = await this.singleclientRepository.updateOne(
      { id: singleclient.id },
      { refreshTokenHash: hash },
    );
    if (!docResult.isSuccess) {
      throwApplicationError(HttpStatus.NOT_MODIFIED, 'SingleClient could not be updated');
    }
    return docResult.getValue();
  }

  async signIn(props: LoginSingleClientDTO): Promise<Result<ISingleClientSignedInResponseDTO>> {
    const normalizedEmail = props.email.toLowerCase();
    const result: Result<SingleClient> = await this.singleclientRepository.findOne({
      where: {
        email: normalizedEmail,
      }
    });
    if (!result.isSuccess) {
      throwApplicationError(HttpStatus.NOT_FOUND, 'SingleClient does not exist');
    }
    const singleclient: SingleClient = result.getValue();
    const comparePassWord: boolean = await bcrypt.compare(props.password, singleclient.passwordHash);
    if (!comparePassWord) {
      throwApplicationError(400, 'Incorrect Username or Password');
    }
    const { id, email, role } = singleclient;
    const userProps: IUserPayload = { userId: id, email, role };
    const tokens = await this.generateAuthTokens(userProps);
    this.updateSingleClientRefreshToken(singleclient, tokens);
    const parsedResponse = SingleClientParser.createSingleClientResponse(singleclient, tokens, true);
    return Result.ok(parsedResponse);
  }

  async onBoardSingleClient(
    props: OnBoardSingleClientDTO,
    id: string,
  ): Promise<Result<ISingleClientResponseDTO>> {
    const context: Context = this.contextService.getContext();
    const isValidUser = await this.validateContext();
    if (!isValidUser) {
      throwApplicationError(HttpStatus.FORBIDDEN, 'Invalid Email');
    }
    const result = await this.singleclientRepository.findOne({ where: { id } });
    if (!result.isSuccess) {
      throwApplicationError(HttpStatus.NOT_FOUND, 'SingleClient does not exist');
    }
    const singleclient: SingleClient = result.getValue();

    if (context.email !== singleclient.email) {
      throwApplicationError(HttpStatus.FORBIDDEN, 'Invalid email');
    }

    const data = {
      auditModifiedBy: context.email,
      auditModifiedDateTime: new Date().toISOString(),
      status: SingleClientStatus.boarded,
      ...props,
    };

    this.updateSingleClientData(data, singleclient, context);

    const docResult: Result<SingleClient> = await this.singleclientRepository.updateOne(
      { id: singleclient.id },
      data as any,
    );
    if (!docResult.isSuccess) {
      throwApplicationError(HttpStatus.NOT_MODIFIED, 'SingleClient could not be updated');
    }

    const updatedSingleClient: SingleClient = docResult.getValue();
    return Result.ok(SingleClientParser.createSingleClientResponse(updatedSingleClient));
  }

  updateSingleClientData(data: IUpdateSingleClient, singleclient: SingleClient, context: Context) {
    const { firstName, lastName, organisationAddress, organisationName, phoneNumber } = data;
    for (const [key] of Object.entries(data)) {
      switch (key) {
        case firstName:
          singleclient.firstName = firstName;
          break;
        case lastName:
          singleclient.lastName = lastName;
          break;
        case organisationAddress:
          singleclient.organisationAddress = organisationAddress;
          break;
        case organisationName:
          singleclient.organisationName = organisationName;
          break;
        case phoneNumber:
          singleclient.phoneNumber = phoneNumber;
          break;
        default:
          break;
      }
    }
    Audit.updateContext(context.email, singleclient);
  }

  async getAccessTokenAndUpdateRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<Result<{ accessToken: string }>> {
    const singleclientRepo: SingleClientRepository = this.singleclientRepository;
    const accessToken = await this.refreshSingleClientToken(singleclientRepo, userId, refreshToken);
    return Result.ok(accessToken);
  }

  private async refreshSingleClientToken(
    model: GenericTypeOrmRepository<any, any>,
    userId: string,
    refreshToken: string,
  ): Promise<{ accessToken: string }> {
    return await this.updateRefreshToken(model, userId, refreshToken);
  }

  private async logOutSingleClient(model: GenericTypeOrmRepository<any, any>, userId: string): Promise<void> {
    return this.logOut(model, userId);
  }

  async signOut(userId: string): Promise<void> {
    return this.logOutSingleClient(this.singleclientRepository, userId);
  }

  /**
   * private method to validate user context
   *
   * @param {GenericanyRepository<any>} model
   * @returns {void}`
   * @memberof AuthService
   */
  async validateContext(): Promise<boolean> {
    const context: Context = this.contextService.getContext();
    console.log(context);
    return await this.validateSingleClient.getUser(this.singleclientRepository, { email: context.email });
  }
}
