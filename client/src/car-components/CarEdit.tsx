import React, { useCallback, useContext, useEffect, useState } from 'react';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonLoading,
  IonPage,
  IonTitle,
  IonToolbar,
  IonList,
  IonItem,
  IonFab,
  IonFabButton,
  IonIcon
} from '@ionic/react';
import { getLogger } from '../core';
import { CarContext } from './CarProvider';
import { RouteComponentProps } from 'react-router';
import { CarProps } from './CarProps';
import {NetworkStatus} from "../network";
import { camera } from 'ionicons/icons';
import {usePhotos} from "../camera/usePhotos";
import CustomMap from "../maps/CustomMap";
import {useMyLocation} from "../maps/useMyLocation";

const log = getLogger('CarEdit');

interface CarEditProps extends RouteComponentProps<{
  id?: string;
}> {}

const CarEdit: React.FC<CarEditProps> = ({ history, match }) => {
  const { cars, saving, savingError, saveCar } = useContext(CarContext);

  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState(0);
  const [photoBase64, setPhotoBase64] = useState('');

  const [car, setCar] = useState<CarProps>();

  const { takePhoto } = usePhotos();

  const { latitude: lat, longitude: lng } = useMyLocation().position?.coords || {};
  const [latitude, setLatitude] = useState(0.0);
  const [longitude, setLongitude] = useState(0.0);

  useEffect(() => {
    log('useEffect');
    const routeId = match.params.id || '';
    const car = cars?.find(c => c._id === routeId);
    setCar(car);
    if (car) {
      setBrand(car.brand);
      setModel(car.model);
      setYear(car.year);
      setPhotoBase64(car.photoBase64 || '');
      setLongitude(car.longitude);
      setLatitude(car.latitude);
    }
  }, [match.params.id, cars]);
  const handleSave = useCallback(() => {
    const editedCar = car ? { ...car, brand, model, year, photoBase64, longitude, latitude } : { brand, model, year, photoBase64, longitude, latitude };
    saveCar && saveCar(editedCar).then(() => history.goBack());
  }, [car, saveCar, brand, model, year, photoBase64, latitude, longitude, history]);
  log('render');
  return (
    <IonPage>
      <IonHeader>
        <NetworkStatus></NetworkStatus>
        <IonToolbar>
          <IonTitle>Edit</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleSave}>
              Save
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonList className="px-4">
          <IonItem>
            <IonInput value={brand} placeholder="enter brand name" onIonChange={e => setBrand(e.detail.value || '')} />
          </IonItem>
          <IonItem>
            <IonInput value={model} placeholder="enter model" onIonChange={e => setModel(e.detail.value || '')} />
          </IonItem>
          <IonItem>
            <IonInput value={year} placeholder="enter fabrication year" type="number" onIonChange={e => setYear(Number(e.detail.value) || -1)} />
          </IonItem>
        </IonList>
        <CustomMap
            lat={latitude || lat || 0.0}
            lng={longitude || lng || 0.0}
            onMapClick = {({ latitude, longitude }) =>  { setLatitude(latitude); setLongitude(longitude); }}
        />
        <IonLoading isOpen={saving} />
        {savingError && (
          <div>{savingError.message || 'Failed to save car'}</div>
        )}
        <IonFab vertical="bottom" horizontal="center" slot="fixed">
          <IonFabButton onClick={() => takePhoto().then(res => {setPhotoBase64(res || '')})}>
            <IonIcon icon={camera}/>
          </IonFabButton>
        </IonFab>
      </IonContent>
    </IonPage>
  );
};

export default CarEdit;
