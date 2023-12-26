import { useEffect, useState } from 'react';
import { Geolocation, Position } from '@capacitor/geolocation';

interface CustomLocation {
    position?: Position | null;
    error?: Error;
}

export const useMyLocation = () => {
    const [state, setState] = useState<CustomLocation>({});

    useEffect(() => {
        watchMyLocation()
    }, []);

    return state;

    async function watchMyLocation() {
        let cancelled = false;
        let callbackId: string;
        try {
            const position = await Geolocation.getCurrentPosition();
            updateMyPosition('current', position);
        } catch (error) {
            updateMyPosition('current', null, error);
        }

        return () => {
            cancelled = true;
        };

        function updateMyPosition(source: string, position?: Position | null, error: any = undefined) {
            console.log(source, position, error);
            if (!cancelled && (position || error)) {
                setState({ position, error });
            }
        }
    }
};
