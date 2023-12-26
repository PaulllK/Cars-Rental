import { useCallback, useEffect, useReducer } from 'react';
import { getLogger } from '../core';
import { CarProps } from './CarProps';
import { getCars } from './carApi';

const log = getLogger('useCars');

export interface CarsState {
  cars?: CarProps[],
  fetching: boolean,
  fetchingError?: Error,
}

export interface CarsProps extends CarsState {
  addCar: () => void,
}

interface ActionProps {
  type: string,
  payload?: any,
}

const initialState: CarsState = {
  cars: undefined,
  fetching: false,
  fetchingError: undefined,
};

const FETCH_CARS_STARTED = 'FETCH_CARS_STARTED';
const FETCH_CARS_SUCCEEDED = 'FETCH_CARS_SUCCEEDED';
const FETCH_CARS_FAILED = 'FETCH_CARS_FAILED';

const reducer: (state: CarsState, action: ActionProps) => CarsState =
  (state, { type, payload }) => {
    switch(type) {
      case FETCH_CARS_STARTED:
        return { ...state, fetching: true };
      case FETCH_CARS_SUCCEEDED:
        return { ...state, cars: payload.cars, fetching: false };
      case FETCH_CARS_FAILED:
        return { ...state, fetchingError: payload.error, fetching: false };
      default:
        return state;
    }
  };

export const useCars: () => CarsProps = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { cars, fetching, fetchingError } = state;
  const addCar = useCallback(() => {
    log('addCar - TODO');
  }, []);
  useEffect(getCarsEffect, [dispatch]);
  log(`returns - fetching = ${fetching}, items = ${JSON.stringify(cars)}`);
  return {
    cars,
    fetching,
    fetchingError,
    addCar,
  };

  function getCarsEffect() {
    let canceled = false;
    fetchCars();
    return () => {
      canceled = true;
    }

    async function fetchCars() {
      try {
        log('fetchCars started');
        dispatch({ type: FETCH_CARS_STARTED });
        const items = await getCars();
        log('fetchCars succeeded');
        if (!canceled) {
          dispatch({ type: FETCH_CARS_SUCCEEDED, payload: { cars } });
        }
      } catch (error) {
        log('fetchCars failed');
        if (!canceled) {
          dispatch({ type: FETCH_CARS_FAILED, payload: { error } });
        }
      }
    }
  }
};
