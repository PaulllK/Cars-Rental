import React, {useEffect, useState } from 'react';
import { createAnimation, IonModal, IonButton, IonContent, IonText, IonIcon } from '@ionic/react';
import {CarProps} from "./CarProps";
import {LogoutFn} from "../auth";
import { logOut } from 'ionicons/icons';

interface LogoutModalProps {
    logoutCallback?: LogoutFn
}

export const LogoutButton: React.FC<LogoutModalProps> = ({logoutCallback}) => {
    const [showModal, setShowModal] = useState(false);

    const enterAnimation = (baseEl: any) => {
        const root = baseEl.shadowRoot;
        const backdropAnimation = createAnimation()
            .addElement(root.querySelector('ion-backdrop')!)
            .fromTo('opacity', '0.01', 'var(--backdrop-opacity)');

        const wrapperAnimation = createAnimation()
            .addElement(root.querySelector('.modal-wrapper')!)
            .keyframes([
                { offset: 0, opacity: '0', transform: 'scale(0)' },
                { offset: 1, opacity: '0.99', transform: 'scale(1)' }
            ]);

        return createAnimation()
            .addElement(baseEl)
            .easing('ease-out')
            .duration(500)
            .addAnimation([backdropAnimation, wrapperAnimation]);
    }

    const leaveAnimation = (baseEl: any) => {
        return enterAnimation(baseEl).direction('reverse');
    }

    return (
        <>
            <IonButton className="mx-2" size="small" slot="end" color="primary" onClick={() => setShowModal(true)}>
                <IonIcon className="text-3xl" icon={logOut}></IonIcon>
                <IonText>log out</IonText>
            </IonButton>
            {/*TODO when clicking outside of modal, and modal closes, clicking logout button doesn't open modal anymore*/}
            <IonModal isOpen={showModal} enterAnimation={enterAnimation} leaveAnimation={leaveAnimation}>
                <div className="my-auto flex flex-col align-middle justify-between">
                    <p className="flex justify-center mb-2">Are you sure you want to log out?</p>
                    <div className="mt-2 mx-auto">
                        <IonButton className="w-16 mx-1" onClick={ () => { setShowModal(false); logoutCallback && logoutCallback(); } }>Yes</IonButton>
                        <IonButton className="w-16 mx-1" onClick={ () => {setShowModal(false)} }>No</IonButton>
                    </div>
                </div>
            </IonModal>
        </>
    );
};
