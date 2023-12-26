import axios from 'axios';
import { authConfig, baseUrl, getLogger, withLogs } from '../core';
import { CarProps } from './CarProps';

const carUrl = `http://${baseUrl}/api/cars`;

export const getCars: (token: string, numberOfLoadedCars: number) => Promise<CarProps[]> = (token, numberOfLoadedCars) => {
  return withLogs(axios.get(carUrl, authConfig(token, numberOfLoadedCars)), 'getCars');
}

export const createCar: (token: string, car: CarProps) => Promise<CarProps[]> = (token, car) => {
  return withLogs(axios.post(carUrl, car, authConfig(token)), 'createCar');
}

export const updateCar: (token: string, car: CarProps) => Promise<CarProps[]> = (token, car) => {
  return withLogs(axios.put(`${carUrl}/${car._id}`, car, authConfig(token)), 'updateCar');
}

interface MessageData {
  type: string;
  payload: CarProps;
}

const log = getLogger('ws');

export const newWebSocket = (token: string, onMessage: (data: MessageData) => void) => {
  const ws = new WebSocket(`ws://${baseUrl}`);
  ws.onopen = () => {
    log('web socket onopen');
    ws.send(JSON.stringify({ type: 'authorization', payload: { token } }));
  };
  ws.onclose = () => {
    log('web socket onclose');
  };
  ws.onerror = error => {
    log('web socket onerror', error);
  };
  ws.onmessage = messageEvent => {
    log('web socket onmessage');
    onMessage(JSON.parse(messageEvent.data));
  };
  return () => {
    ws.close();
  }
}
