import { CategoryMapper } from './../../../category/category.mapper';
import { expect } from 'chai';
import mongoose, { Connection, Types } from 'mongoose';
import * as sinon from 'ts-sinon';
import { Mock } from 'typemoq';
import { GenericanyRepository } from '../../../infrastructure';
import { restaurantMockany } from '../../../restaurant/restaurant-mock-data';
import { AuditMapper } from './../../../audit/audit.mapper';
import { Result } from './../../../domain/result/result';
import { ItemMapper } from './../../../item/item.mapper';
import { LocationMapper } from './../../../location/location.mapper';
import { MenuMapper } from './../../../menu/menu.mapper';
import { SingleClientMapper } from './../../../singleclient/singleclient.mapper';
import { Restaurant } from './../../../restaurant/restaurant';
import { RestaurantMapper } from './../../../restaurant/restaurant.mapper';
import { SingleClientRepository } from './singleclient.repository';
import { RestaurantRepository } from './restaurant.repository';
import { Restaurantany } from './schemas/restaurant.schema';

describe('test the restaurant service', () => {
  let connection: Connection;
  let modelId: string;
  let restaurantsRepositoryMock: any;
  let restaurantRepository: RestaurantRepository;
  let restaurantMapperStub: any;
  beforeEach(async () => {
    connection = new Connection();
    modelId = "";
    const auditMapperStub = new AuditMapper();
    const singleclientRepositoryStub: SingleClientRepository = sinon.stubInterface<SingleClientRepository>();
    const locationMapperStub = new LocationMapper(auditMapperStub);
    const singleclientMapperStub = new SingleClientMapper(auditMapperStub);
    const itemMapperStub = new ItemMapper(auditMapperStub);
    const categoryMapperStub = new CategoryMapper();
    const menuMapper = new MenuMapper(auditMapperStub, itemMapperStub, categoryMapperStub);
    restaurantMapperStub = new RestaurantMapper(
      auditMapperStub,
      locationMapperStub,
      singleclientMapperStub,
      menuMapper,
    );
    restaurantsRepositoryMock = Mock.ofType<GenericanyRepository<Restaurant, Restaurantany>>();
    restaurantRepository = new RestaurantRepository(
      restaurantsRepositoryMock.target,
      connection,
      singleclientRepositoryStub,
      restaurantMapperStub,
    );
  });
  afterEach(() => {
    connection.close();
    mongoose.disconnect();
  });
  const restaurantanyPromise = new Promise<Restaurantany>((resolve) => {
    return resolve(restaurantMockany);
  });

  it('Should return a restaurant', async () => {
    restaurantsRepositoryMock
      .setup((restaurantany) => restaurantany.findOne())
      .returns(() => restaurantanyPromise);
    const result: Result<Restaurant> = await restaurantRepository.findOne({
      name: 'Sheraton',
    });
    expect(result).to.have.length;
    expect(result.getValue().name).to.eq('Sheraton');
  });

  it('Should find a restaurant by id', async () => {
    restaurantsRepositoryMock
      .setup((restaurantany) => restaurantany.findOne())
      .returns(() => restaurantanyPromise);
    const result: Result<Restaurant> = await restaurantRepository.findOne({
      _id: modelId,
    });
    expect(result).to.have.length;
    expect(result.getValue().isActive).to.be.true;
  });

  it('Should create a restaurant', async () => {
    const result = Restaurant.create(restaurantMockany, "").getValue();
    expect(result.email).to.eq('support@Sheraton.com');
  });

  it('Should find a restaurant and update a property', async () => {
    const query = { name: 'Sharaton' };
    restaurantsRepositoryMock.setup((restaurantany) => restaurantany.findOneAndUpdate());
    restaurantsRepositoryMock
      .setup((restaurantany) => restaurantany.findByIdAndUpdate())
      .returns(() => restaurantanyPromise);
    const result: Result<Restaurant> = await restaurantRepository.findOneAndUpdate(query, {
      $set: {
        name: 'Transcorp Hilton',
      },
    });
    expect(result);
  });
});
