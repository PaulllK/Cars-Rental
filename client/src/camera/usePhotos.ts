import { useFilesystem } from "../filesystem/useFilesystem";
import { useCamera } from "./useCamera";

export function usePhotos() {
    const { getPhoto } = useCamera();
    const { readFile, writeFile } = useFilesystem();

    return {
        takePhoto
    }

    async function takePhoto() {
        const { base64String } = await getPhoto();
        const filepath = new Date().getTime() + '.jpeg';
        await writeFile(filepath, base64String!);

        return base64String;
    }
}