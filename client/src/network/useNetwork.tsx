import { PluginListenerHandle } from "@capacitor/core";
import { ConnectionStatus, Network } from "@capacitor/network";
import { useEffect, useState } from "react"
import { getLogger } from "../core";

const log = getLogger('useNetwork');

const initialState = {
    connected: false,
    connectionType: 'unknown',
}

export const useNetwork = () => {
    const [networkStatus, setNetworkStatus] = useState(initialState);

    useEffect(() => {
        let handler: PluginListenerHandle;
        registerNetworkStatusChange();
        Network.getStatus().then(handleNetworkStatusChange);
        let canceled = false;

        return () => {
            canceled = true;
            handler?.remove();
        }

        async function registerNetworkStatusChange() {
            handler = await Network.addListener('networkStatusChange', handleNetworkStatusChange);
          }

          async function handleNetworkStatusChange(status: ConnectionStatus) {
            console.log('useNetwork - status change', status);
            if (!canceled) {
              setNetworkStatus(status);
            }
        }
    }, []);

    return { networkStatus };
}
