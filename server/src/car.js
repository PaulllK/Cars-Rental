import Router from 'koa-router';
import dataStore from 'nedb-promise';
import { broadcast } from './wss.js';

export class CarStore {
  static numberOfCarsPerRequest = 15;

  constructor({ filename, autoload }) {
    this.store = dataStore({ filename, autoload });
  }

  async find(props, numberOfLoadedCars) {
    let carsForUser = await this.store.find(props);

    let carsToBeLoaded = carsForUser.slice(
      numberOfLoadedCars,
      numberOfLoadedCars + CarStore.numberOfCarsPerRequest
    );

    // function delay(time) {
    //   return new Promise(resolve => setTimeout(resolve, time));
    // }
    // async function test() {
    //   console.log('start timer');
    //   await delay(1000);
    //   console.log('after 1 second');
    // }
    // await test();

    return carsToBeLoaded;
  }

  async findOne(props) {
    return this.store.findOne(props);
  }

  async insert(car) {
    // validation
    // if (!car.brand) {
    //   throw new Error('Missing brand property')
    // }
    // if (!car.model) {
    //   throw new Error('Missing model property')
    // }
    // if (!car.year) {
    //   throw new Error('Missing year property')
    // }
    // if (!car.longitude) {
    //   throw new Error('Missing longitude property')
    // }
    // if (!car.latitude) {
    //   throw new Error('Missing latitude property')
    // }

    return this.store.insert(car);
  };

  async update(props, car) {
    return this.store.update(props, car);
  }

  async remove(props) {
    return this.store.remove(props);
  }
}

const carStore = new CarStore({ filename: './db/cars.json', autoload: true });

export const carRouter = new Router();

carRouter.get('/', async (ctx) => {
  const userId = ctx.state.user._id;
  const numberOfLoadedCars = ctx.query.numberOfLoadedCars;
  ctx.response.body = await carStore.find({ userId }, numberOfLoadedCars);
  ctx.response.status = 200; // ok
});

carRouter.get('/:id', async (ctx) => {
  const userId = ctx.state.user._id;
  const car = await carStore.findOne({ _id: ctx.params.id });
  const response = ctx.response;
  if (car) {
    if (car.userId === userId) {
      ctx.response.body = car;
      ctx.response.status = 200; // ok
    } else {
      ctx.response.status = 403; // forbidden
    }
  } else {
    ctx.response.status = 404; // not found
  }
});

const createCar = async (ctx, car, response) => {
  try {
    const userId = ctx.state.user._id;
    car.userId = userId;
    const carWithId = await carStore.insert(car);
    response.body = carWithId;
    response.status = 201; // created
    broadcast(userId, { type: 'created', payload: carWithId });
  } catch (err) {
    response.body = { message: err.message };
    response.status = 400; // bad request
  }
};

carRouter.post('/', async ctx => await createCar(ctx, ctx.request.body, ctx.response));

carRouter.put('/:id', async ctx => {
  const car = ctx.request.body;
  const id = ctx.params.id;
  const carId = car._id;
  const response = ctx.response;
  if (carId && carId !== id) {
    response.body = { message: 'Param id and body id should be the same' };
    response.status = 400; // bad request
    return;
  }
  if (!carId) {
    await createCar(ctx, car, response);
  } else {
    const userId = ctx.state.user._id;
    car.userId = userId;
    const updatedCount = await carStore.update({ _id: id }, car);
    if (updatedCount === 1) {
      response.body = car;
      response.status = 200; // ok
      broadcast(userId, { type: 'updated', payload: car });
    } else {
      response.body = { message: 'Resource no longer exists' };
      response.status = 405; // method not allowed
    }
  }
});

carRouter.del('/:id', async (ctx) => {
  const userId = ctx.state.user._id;
  const car = await carStore.findOne({ _id: ctx.params.id });
  if (car && userId !== car.userId) {
    ctx.response.status = 403; // forbidden
  } else {
    await carStore.remove({ _id: ctx.params.id });
    //TODO broadcast deletion to clients
    ctx.response.status = 204; // no content
  }
});
