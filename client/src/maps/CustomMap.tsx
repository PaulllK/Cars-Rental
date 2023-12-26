import { GoogleMap } from '@capacitor/google-maps';
import { useEffect, useRef } from 'react';
import { mapsApiKey } from './mapsApiKey';

interface MyMapProps {
    lat: number;
    lng: number;
    style?: {};
    onMapClick: (e: any) => void,
}

const CustomMap: React.FC<MyMapProps> = ({ lat, lng, style={ display: 'block', width: 300, height: 300 }, onMapClick }) => {
    const mapRef = useRef<HTMLElement>(null);

    useEffect(myMapEffect, [mapRef.current]);

    return (
        <div className="component-wrapper my-4">
            <capacitor-google-map ref={mapRef} style={ {...style, marginLeft: "auto", marginRight: "auto"} }></capacitor-google-map>
        </div>
    );

    function myMapEffect() {
        let canceled = false;
        let googleMap: GoogleMap | null = null;

        createMap();

        return () => {
            canceled = true;
            googleMap?.removeAllMapListeners();
        }

        async function createMap() {
            if (!mapRef.current) {
                return;
            }

            console.log(lat, lng);

            googleMap = await GoogleMap.create({
                id: 'map',
                element: mapRef.current,
                apiKey: mapsApiKey,
                config: {
                    center: { lat, lng },
                    zoom: 1,
                }
            })

            console.log('gm created');

            let myLocationMarkerId = await googleMap.addMarker({ coordinate: { lat, lng }, title: 'My location' });

            await googleMap.setOnMapClickListener(({ latitude, longitude }) => {
                googleMap?.removeMarker(myLocationMarkerId).then(() =>
                    googleMap?.addMarker({ coordinate: { lat: latitude, lng: longitude }, title: 'My location' }).then((value) => myLocationMarkerId = value));
                onMapClick({ latitude, longitude });
            });
        }
    }
}

export default CustomMap;
