import {IonIcon, IonText } from "@ionic/react";
import { getLogger } from "../core";
import { useNetwork } from "./useNetwork"
import { logoIonic, warningOutline } from "ionicons/icons";

const log = getLogger('NetworkStatus');

const NetworkStatus: React.FC = () => {
    const { networkStatus } = useNetwork();
    let status: String;

    if (networkStatus.connected) {
        status = 'Online';
    } else {
        status = 'Offline';
    }

    log('render');

    return (
        status === 'Offline'
            ?
            <div className="flex items-center my-1">
                <IonIcon icon={warningOutline} className="mx-2" size="large" color="warning"></IonIcon>
                <IonText>
                    App status: {status} - any changes will not be sent to the server
                </IonText>
            </div>
            :
            <></>
    );
}

export default NetworkStatus;
