const Koa = require('koa');
const app = new Koa();
const server = require('http').createServer(app.callback());
const WebSocket = require('ws');
const wss = new WebSocket.Server({ server });
const Router = require('koa-router');
const cors = require('koa-cors');
const bodyparser = require('koa-bodyparser');

app.use(bodyparser());
app.use(cors());
app.use(async (ctx, next) => {
  const start = new Date();
  await next();
  const ms = new Date() - start;
  console.log(`${ctx.method} ${ctx.url} ${ctx.response.status} - ${ms}ms`);
});

app.use(async (ctx, next) => {
  await new Promise(resolve => setTimeout(resolve, 2000));
  await next();
});

app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    ctx.response.body = { issue: [{ error: err.message || 'Unexpected error' }] };
    ctx.response.status = 500;
  }
});

class Car {
  constructor({ id, brand, model, year, date, version }) {
    this.id = id;
    this.brand = brand;
    this.model = model;
    this.year = year;
    this.date = date;
    this.version = version;
  }
}

const cars = [];

cars.push(new Car({ id: "0", brand: "BMW", model: "E90", year: 2006, date: Date.now(), version: 1 }));
cars.push(new Car({ id: "1", brand: "Audi", model: "A5", year: 2006, date: Date.now() + 1, version: 1 }));
cars.push(new Car({ id: "2", brand: "Mercedes", model: "C300", year: 2006, date: Date.now() + 2, version: 1 }));

for (let i = 1; i <= 100; i++)
  cars.push(new Car({ id: (i + 2).toString(), brand: `BMW ${i}`, model: `model ${i}`, year: 2006, date: Date.now() + i + 2, version: 1 }));

let lastUpdated = cars[cars.length - 1].date;
let lastId = cars[cars.length - 1].id;
let carsLoadedOnClient = 0;

const pageSize = 15;

const broadcast = data => {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

const router = new Router();

router.get('/cars', ctx => {
  ctx.response.body = cars.slice(carsLoadedOnClient, carsLoadedOnClient + pageSize); // load next sequence of cars unloaded
  ctx.response.status = 200;
  carsLoadedOnClient += pageSize;
});

router.get('/cars/:id', async (ctx) => {
  const carId = ctx.request.params.id;
  const car = cars.find(car => carId === car.id);
  if (car) {
    ctx.response.body = car;
    ctx.response.status = 200; // ok
  } else {
    ctx.response.body = { message: `item with id ${carId} not found` };
    ctx.response.status = 404; // NOT FOUND (if you know the resource was deleted, then return 410 GONE)
  }
});

const createCar = async (ctx) => {
  const car = ctx.request.body;
  if (!car.brand || !car.model || !car.year) { // validation
    ctx.response.body = { message: 'Brand, model or year is missing' };
    ctx.response.status = 400; //  BAD REQUEST
    return;
  }
  car.id = `${parseInt(lastId) + 1}`;
  lastId = car.id;
  car.date = new Date();
  car.version = 1;
  cars.push(car);
  ctx.response.body = car;
  ctx.response.status = 201; // CREATED
  broadcast({ event: 'created', payload: { car: car } });
};

router.post('/cars', async (ctx) => {
  await createCar(ctx);
});

router.put('/cars/:id', async (ctx) => {
  const id = ctx.params.id;
  const car = ctx.request.body;
  car.date = new Date();
  const carId = car.id;
  if (carId && id !== car.id) {
    ctx.response.body = { message: `Param id and body id should be the same` };
    ctx.response.status = 400; // BAD REQUEST
    return;
  }
  if (!carId) {
    await createCar(ctx);
    return;
  }
  const index = cars.findIndex(car => car.id === id);
  if (index === -1) {
    ctx.response.body = { issue: [{ error: `car with id ${id} not found` }] };
    ctx.response.status = 400; // BAD REQUEST
    return;
  }
  const carVersion = parseInt(ctx.request.get('ETag')) || car.version;
  if (carVersion < cars[index].version) {
    ctx.response.body = { issue: [{ error: `Version conflict` }] };
    ctx.response.status = 409; // CONFLICT
    return;
  }
  car.version++;
  cars[index] = car;
  lastUpdated = new Date();
  ctx.response.body = car;
  ctx.response.status = 200; // OK
  broadcast({ event: 'updated', payload: { car: car } });
});

router.del('/cars/:id', ctx => {
  const id = ctx.params.id;
  const index = cars.findIndex(car => id === car.id);
  if (index !== -1) {
    const car = cars[index];
    cars.splice(index, 1);
    lastUpdated = new Date();
    broadcast({ event: 'deleted', payload: { car: car } });
  }
  ctx.response.status = 204; // no content
});

// setInterval(() => {
//   lastUpdated = new Date();
//   lastId = `${parseInt(lastId) + 1}`;
//   const item = new Car({ id: lastId, text: `item ${lastId}`, date: lastUpdated, version: 1 });
//   cars.push(item);
//   console.log(`New item: ${item.text}`);
//   broadcast({ event: 'created', payload: { item } });
// }, 5000);

app.use(router.routes());
app.use(router.allowedMethods());

server.listen(3000);
