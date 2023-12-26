import React, { memo, useEffect, useRef } from 'react';
import {IonImg, IonItem, IonLabel, createAnimation, useIonViewDidEnter, useIonViewWillEnter } from '@ionic/react';
import { getLogger } from '../core';
import { CarProps } from './CarProps';

const log = getLogger('Car');

interface CarPropsExt extends CarProps {
  onEdit: (id?: string) => void;
}

const Car: React.FC<CarPropsExt> = ({ _id, brand, model, year, photoBase64, onEdit }) => {

    const carItemRef = useRef<HTMLIonItemElement>(null);

    const growKeyframes = [
        { offset: 0, transform: 'scale(1)', opacity: '1' },
        { offset: 0.2, transform: 'scale(1.1)', opacity: '0.5' }
    ]

    const mouseEnterAnimation = () => {
        if(carItemRef.current !== null) {
            const animation = createAnimation()
                .addElement(carItemRef.current)
                .duration(1000)
                .keyframes(growKeyframes);

            animation.play();
        }
    };

    return (
        <IonItem ref={carItemRef} onMouseEnter={() => mouseEnterAnimation()} lines="none" button={true} className="w-full my-2 rounded-lg" onClick={() => onEdit(_id)}>
            <div className="flex flex-col my-4">
                <div className="flex justify-center w-full h-auto mr-2">
                    {
                        photoBase64 ?
                            <IonImg src={`data:image/jpeg;base64,${photoBase64}`} />
                            : <IonImg src={'src/default.jpg'} />
                    }
                </div>
                <div className="flex justify-around mt-4">
                    <IonLabel className="">{brand}</IonLabel>
                    <IonLabel className="">{model}</IonLabel>
                    <IonLabel className="">{year}</IonLabel>
                </div>
            </div>
        </IonItem>
    );
};

export default memo(Car);
