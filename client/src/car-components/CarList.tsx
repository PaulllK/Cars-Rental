import React, { useContext, useEffect, useRef, useState } from 'react';
import { RouteComponentProps } from 'react-router';
import {
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonList, IonLoading,
  IonPage,
  IonTitle,
  IonToolbar,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonItem,
  IonAvatar,
  IonLabel,
  IonSpinner,
  IonSearchbar,
  IonButtons,
  IonButton,
  IonText,
  CreateAnimation
} from '@ionic/react';
import { add, logOut } from 'ionicons/icons';
import Car from './Car';
import { getLogger } from '../core';
import { CarContext } from './CarProvider';
import {NetworkStatus} from "../network";
import {AuthContext} from "../auth";
import {useNetwork} from "../network/useNetwork";
import {LogoutButton} from "./LogoutButton";

const log = getLogger('CarList');

const CarList: React.FC<RouteComponentProps> = ({ history }) => {
  const { cars, fetching, fetchingError, fetchMoreCars } = useContext(CarContext);
  const { logout } = useContext(AuthContext);

  const { networkStatus } = useNetwork();

  const [disableInfiniteScroll, setDisableInfiniteScroll] = useState(false);
  const [searchModel, setSearchModel] = useState('');
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  log('render');

  // const pulseKeyFrames = [
  //   { offset: 0, transform: 'scale(1)' },
  //   { offset: 0.3, transform: 'scale(1.1)' },
  //   { offset: 0.5, transform: 'scale(1)' },
  //   { offset: 0.7, transform: 'scale(1.2)' },
  //   { offset: 1, transform: 'scale(1)' }
  // ]

  useEffect(() => {
    if(cars)
      if(cars.length < 15)
        setDisableInfiniteScroll(true);
  }, [cars]);

  useEffect(() => {
    if(!networkStatus.connected) {
      setDisableInfiniteScroll(true);
    } else {
      setDisableInfiniteScroll(false);
    }
  }, [networkStatus]);

  return (
    <IonPage>
      <IonHeader>
        <NetworkStatus></NetworkStatus>
        <IonToolbar>
          <IonTitle>Car rental</IonTitle>
          <LogoutButton logoutCallback={logout} />
        </IonToolbar>
        <IonSearchbar
            value={searchModel}
            animated={true}
            placeholder="search for model"
            showClearButton="focus"
            className="w-full sm:w-1/2 sm:mx-auto md:w-1/3"
            color="light"
            debounce={500}
            onIonInput={e => setSearchModel(e.detail.value!)}
        >
        </IonSearchbar>
      </IonHeader>
      <IonContent>
        {/*<IonLoading isOpen={fetching} message="Fetching cars" />*/}
        {cars &&
          <>
            <IonList className="bg-theme-black flex flex-col items-center py-2 px-4">
              {cars
                  .filter(car => car.model.indexOf(searchModel) >= 0)
                  .map(({ _id, brand, model, year, photoBase64}) =>
                    <Car
                        key={_id}
                        _id={_id}
                        brand={brand}
                        model={model}
                        year={year}
                        photoBase64={photoBase64}
                        onEdit={id => history.push(`/car/${id}`)}
                    />
                  )
              }
            </IonList>
            <IonInfiniteScroll
              onIonInfinite={(ev) => {
                fetchMoreCars && fetchMoreCars().then((response) => {
                  if(response < 15) { // last cars returned
                    setDisableInfiniteScroll(true);
                  }
                });
                ev.target.complete();
              }}
              disabled={disableInfiniteScroll}
            >
              <IonInfiniteScrollContent className="flex items-center">
                <IonSpinner></IonSpinner>
              </IonInfiniteScrollContent>
            </IonInfiniteScroll>
          </>
        }
        {fetchingError && (
          <div>{fetchingError.message || 'Failed to fetch cars'}</div>
        )}

        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={() => history.push('/car')}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>
      </IonContent>
    </IonPage>
  );
};

export default CarList;

