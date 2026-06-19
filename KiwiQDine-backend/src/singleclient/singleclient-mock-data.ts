import { SingleClient } from './singleclient';
import { ISingleClient } from './interface/singleclient.interface';
import { Audit } from '../domain/audit/audit';
import { auditMockData } from '../audit/audit-mock-data';


export const singleclientMock: ISingleClient = {
  firstName: 'Ola',
  lastName: 'Ola',
  email: 'ola@tesla.com',
  organisationName: 'Tesla',
  phoneNumber: '123456',
  passwordHash: '',
  role: 'admin',
  isActive: true,
  status: 'onboard',
  organisationAddress: 'Malaysia',
  audit: Audit.create(auditMockData).getValue(),
};

export const singleclientMockData = SingleClient.create(singleclientMock, "");

const singleclient = singleclientMockData.getValue();
const singleclients: SingleClient[] = [];
singleclients.push(singleclient);
export const singleclientMockDatas = singleclients;
