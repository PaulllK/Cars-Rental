import React, { useCallback, useContext, useEffect, useReducer } from 'react';
import PropTypes from 'prop-types';
import { getLogger } from '../core';
import { CarProps } from './CarProps';
import {createCar, getCars, newWebSocket, updateCar} from './carApi';
import {AuthContext} from "../auth";
import {useNetwork} from "../network/useNetwork";
import networkStatus from "../network/NetworkStatus";

const log = getLogger('CarProvider');

type SaveCarFn = (car: CarProps) => Promise<any>;
type FetchCarsFn = () => Promise<any>;

export interface CarsState {
  cars?: CarProps[],
  fetching: boolean,
  fetchingError?: Error | null,
  saving: boolean,
  savingError?: Error | null,
  saveCar?: SaveCarFn,
  fetchMoreCars?: FetchCarsFn,
  temporaryId?: number,
  locallySavedCars?: CarProps[]
}

interface ActionProps {
  type: string,
  payload?: any,
}

const initialState: CarsState = {
  fetching: false,
  saving: false
};

const FETCH_CARS_STARTED = 'FETCH_CARS_STARTED';
const FETCH_CARS_SUCCEEDED = 'FETCH_CARS_SUCCEEDED';
const FETCH_MORE_CARS_SUCCEEDED = 'FETCH_MORE_CARS_SUCCEEDED';
const FETCH_CARS_FAILED = 'FETCH_CARS_FAILED';
const SAVE_CAR_STARTED = 'SAVE_CAR_STARTED';
const SAVE_CAR_SUCCEEDED = 'SAVE_CAR_SUCCEEDED';
const SAVE_CAR_FAILED = 'SAVE_CAR_FAILED';
const CHANGE_CARS = 'CHANGE_CARS';
const CHANGE_LOCALLY_SAVED_CARS = 'CHANGE_LOCALLY_SAVED_CARS';
const RESET_LOCAL_STORAGE = 'RESET_LOCAL_STORAGE';

const TEMPORARY_ID_PREFIX = 'TEMPORARY_ID_PREFIX';

const reducer: (state: CarsState, action: ActionProps) => CarsState =
  (state, { type, payload }) => {
    switch(type) {
      case FETCH_CARS_STARTED:
        return { ...state, fetching: true, fetchingError: null };
      case FETCH_CARS_SUCCEEDED:
        return { ...state, cars: payload.cars, fetching: false };
      case FETCH_MORE_CARS_SUCCEEDED:
        return { ...state, cars: [...(state.cars || []), ...(payload.cars || [])], fetching: false }; // copy new fetched cars to cars state
      case FETCH_CARS_FAILED:
        return { ...state, fetchingError: payload.error, fetching: false };
      case SAVE_CAR_STARTED:
        return { ...state, savingError: null, saving: true };
      case SAVE_CAR_SUCCEEDED:
        const cars = [...(state.cars || [])];
        const locallySavedCars = [...(state.locallySavedCars || [])]

        const car = payload.car;
        const index = cars.findIndex(c => c._id === car._id);

        if (index === -1) {
          cars.splice(0, 0, car);
        } else {
          cars[index] = car;
        }

        if(payload.networkStatus && !payload.networkStatus.connected) {
          const index = locallySavedCars.findIndex(c => c._id === car._id);
          if (index === -1) {
            locallySavedCars.splice(0, 0, car);
          } else {
            locallySavedCars[index] = car;
          }
        }
        console.log(locallySavedCars);
        return { ...state, cars: cars, saving: false, temporaryId: payload.newTemporaryId, locallySavedCars: locallySavedCars };
      case SAVE_CAR_FAILED:
        return { ...state, savingError: payload.error, saving: false };
      case CHANGE_CARS:
        return { ...state, cars: payload.cars };
      case CHANGE_LOCALLY_SAVED_CARS:
        return { ...state, locallySavedCars: payload.cars };
      case RESET_LOCAL_STORAGE:
        return { ...state, temporaryId: 0, locallySavedCars: [] }
      default:
        return state;
    }
  };

export const CarContext = React.createContext<CarsState>(initialState);

interface CarProviderProps {
  children: PropTypes.ReactNodeLike,
}

export const CarProvider: React.FC<CarProviderProps> = ({ children }) => {
  const { token } = useContext(AuthContext);
  const { networkStatus } = useNetwork();
  const [state, dispatch] = useReducer(reducer, initialState);
  const { cars, fetching, fetchingError, saving, savingError, temporaryId, locallySavedCars } = state;

  useEffect(getCarsEffect, [token]);
  useEffect(wsEffect, [token]);

  useEffect(() => {
    if(networkStatus.connected) {
      if(locallySavedCars && locallySavedCars.length > 0) { // changes have been made while offline, server must be updated
        const newLocallySavedCars = [...(locallySavedCars || [])];

        newLocallySavedCars.forEach(async (car) => { // updating server
          if(car._id === undefined || car._id && car._id.startsWith(TEMPORARY_ID_PREFIX)) {
            delete car._id; // permanent id will be generated by server
            await createCar(token, car);
          } else { // car._id is defined && !car._id.startsWith(TEMPORARY_ID_PREFIX)
            await updateCar(token, car);
          }
        });

        dispatch({type: CHANGE_LOCALLY_SAVED_CARS, payload: { cars: newLocallySavedCars }});

        if(cars !== undefined) {
          let newCarsList = cars.filter((car) => { // removing locally added while offline cars (will be generated again by server with new valid and permanent IDs)
            return (car._id !== undefined && !car._id.startsWith(TEMPORARY_ID_PREFIX));
          });
          dispatch({type: CHANGE_CARS, payload: {cars: newCarsList}})
        }

        dispatch({type: RESET_LOCAL_STORAGE});
      }
    } else {
      dispatch({type: RESET_LOCAL_STORAGE});
    }
  }, [networkStatus]);

  const saveCar = useCallback<SaveCarFn>(saveCarCallback, [token, networkStatus, temporaryId]);
  const fetchMoreCars = useCallback<FetchCarsFn>(fetchCarsCallback, [token, cars]);

  const value = { cars, fetching, fetchingError, saving, savingError, saveCar, fetchMoreCars };

  log('returns');

  return (
    <CarContext.Provider value={value}>
      {children}
    </CarContext.Provider>
  );

  function getCarsEffect() {
    let canceled = false;
    if (token) {
      fetchCars();
    }
    return () => {
      canceled = true;
    }

    async function fetchCars() {
      try {
        log('fetchCars started');
        dispatch({ type: FETCH_CARS_STARTED });
        // const numberOfLoadedCars = state.cars === undefined ? 0 : state.cars.length;
        const cars = await getCars(token, 0);
        log('fetchCars succeeded');
        if (!canceled) {
          dispatch({ type: FETCH_CARS_SUCCEEDED, payload: { cars } });
        }
      } catch (error) {
        log('fetchCars failed', error);
        dispatch({ type: FETCH_CARS_FAILED, payload: { error } });
      }
    }
  }

  async function fetchCarsCallback() {
    if (token) {
      try {
        log('fetchCars started');
        const numberOfLoadedCars = state.cars === undefined ? 0 : state.cars.length;
        const cars = await getCars(token, numberOfLoadedCars);
        log('fetchCars succeeded');
        dispatch({type: FETCH_MORE_CARS_SUCCEEDED, payload: {cars: cars}});
        return cars.length;
      } catch (error) {
        log('fetchCars failed', error);
        dispatch({type: FETCH_CARS_FAILED, payload: {error}});
      }
    }
  }

  async function saveCarCallback(car: CarProps) {
    try {
      log('saveCar started');
      dispatch({ type: SAVE_CAR_STARTED });

      let savedCar;
      let incrementValue = 0;

      if(networkStatus.connected) {
        savedCar = await (car._id ? updateCar(token, car) : createCar(token, car));
      } else {
        savedCar = car;
        if(!car._id) { // undefined
          savedCar._id = TEMPORARY_ID_PREFIX + (temporaryId === undefined ? '' : temporaryId.toString());
          incrementValue = 1;
        }
      }

      log('saveCar succeeded');
      dispatch({ type: SAVE_CAR_SUCCEEDED, payload: { car: savedCar, newTemporaryId: (temporaryId === undefined ? 0 : temporaryId) + incrementValue, networkStatus: networkStatus } });
    } catch (error) {
      log('saveCar failed');
      dispatch({ type: SAVE_CAR_FAILED, payload: { error } });
    }
  }

  function wsEffect() {
    let canceled = false;
    log('wsEffect - connecting');
    let closeWebSocket: () => void;
    if (token?.trim()) {
      closeWebSocket = newWebSocket(token, message => {
        if (canceled) {
          return;
        }
        const { type, payload: car } = message;
        log(`ws message, car ${type}`);
        if (type === 'created' || type === 'updated') {
          dispatch({ type: SAVE_CAR_SUCCEEDED, payload: { car } });
        }
        //TODO dispatch action for deletion type
      });
    }
    return () => {
      log('wsEffect - disconnecting');
      canceled = true;
      closeWebSocket?.();
    }
  }
};
