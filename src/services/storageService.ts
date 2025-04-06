import { ref, listAll, getDownloadURL, FirebaseStorage } from 'firebase/storage';
import { storage } from '../firebase/config';

const SHARED_DRIVE_FOLDER = 'shared-drive';
const NOTION_TEMPLATES_FOLDER = 'notion-templates';

export const getSharedDriveFiles = async () => {
  if (!storage) {
    throw new Error('Storage service is not available. Please enable Firebase Storage in the Firebase Console.');
  }

  try {
    const storageRef = ref(storage as FirebaseStorage, SHARED_DRIVE_FOLDER);
    const result = await listAll(storageRef);
    
    const files = await Promise.all(
      result.items.map(async (item) => {
        const url = await getDownloadURL(item);
        return {
          name: item.name,
          url,
          path: item.fullPath
        };
      })
    );
    
    return files;
  } catch (error) {
    console.error('Error accessing shared drive:', error);
    throw error;
  }
};

export const getNotionTemplate = async (templateName: string) => {
  if (!storage) {
    throw new Error('Storage service is not available. Please enable Firebase Storage in the Firebase Console.');
  }

  try {
    const templateRef = ref(storage as FirebaseStorage, `${NOTION_TEMPLATES_FOLDER}/${templateName}`);
    const url = await getDownloadURL(templateRef);
    return url;
  } catch (error) {
    console.error('Error accessing Notion template:', error);
    throw error;
  }
}; 