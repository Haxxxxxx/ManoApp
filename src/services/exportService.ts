import { Song } from '../types';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

/**
 * Export a song for SoundCloud with all metadata
 * @param song The song to export
 * @returns A promise that resolves when the export is complete
 */
export const exportForSoundCloud = async (song: Song): Promise<void> => {
  console.log('Starting export process for song:', song);

  if (!song.filePath) {
    console.error('No file path available for song:', song);
    throw new Error('No audio file available for export');
  }

  try {
    console.log('Creating zip file...');
    const zip = new JSZip();
    
    // Handle both local and remote file URLs
    let audioBlob: Blob;
    if (song.filePath.startsWith('blob:') || song.filePath.startsWith('data:')) {
      // For blob URLs, we need to fetch them directly
      console.log('Handling blob URL...');
      const response = await fetch(song.filePath);
      audioBlob = await response.blob();
    } else if (song.filePath.startsWith('http')) {
      // For remote URLs (like Firebase Storage)
      console.log('Handling remote URL...');
      const response = await fetch(song.filePath);
      if (!response.ok) {
        throw new Error(`Failed to download audio file: ${response.status} ${response.statusText}`);
      }
      audioBlob = await response.blob();
    } else {
      // For local file paths
      console.log('Handling local file...');
      const response = await fetch(song.filePath);
      audioBlob = await response.blob();
    }
    
    console.log('Audio blob size:', audioBlob.size);
    console.log('Audio blob type:', audioBlob.type);
    
    if (audioBlob.size === 0) {
      throw new Error('Downloaded audio file is empty');
    }

    // Sanitize filename
    const filename = `${song.title.replace(/[^a-zA-Z0-9]/g, '_')}.mp3`;
    console.log('Adding audio file to zip as:', filename);
    zip.file(filename, audioBlob);
    
    // Create metadata file
    console.log('Creating metadata...');
    const metadata = {
      title: song.title,
      artist: song.artist,
      description: `${song.title} by ${song.artist}`,
      genre: song.metadata?.genre?.[0] || '',
      tags: song.metadata?.tags?.join(', ') || '',
      bpm: song.metadata?.bpm || '',
      key: song.metadata?.key || '',
      releaseDate: song.metadata?.releaseDate || '',
      notes: song.notes || ''
    };
    
    console.log('Metadata prepared:', metadata);
    
    // Add metadata as JSON
    zip.file('metadata.json', JSON.stringify(metadata, null, 2));
    
    // Add metadata as text for easy reference
    const metadataText = `
SoundCloud Upload Information
===========================

Title: ${metadata.title}
Artist: ${metadata.artist}
Description: ${metadata.description}
Genre: ${metadata.genre}
Tags: ${metadata.tags}
BPM: ${metadata.bpm}
Key: ${metadata.key}
Release Date: ${metadata.releaseDate}

Notes:
${metadata.notes}

Instructions:
1. Log in to your SoundCloud account
2. Go to "Upload" in the top navigation
3. Drag and drop the audio file (${filename})
4. Fill in the track information using the details above
5. Set the track to public or private as desired
6. Click "Save" to publish your track
`;
    
    console.log('Adding instruction file to zip...');
    zip.file('soundcloud_instructions.txt', metadataText);
    
    console.log('Generating final zip file...');
    const content = await zip.generateAsync({ 
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: {
        level: 6
      }
    });
    
    console.log('Zip file generated, size:', content.size);
    
    if (content.size === 0) {
      throw new Error('Generated zip file is empty');
    }

    console.log('Saving zip file...');
    const zipFilename = `${song.title.replace(/[^a-zA-Z0-9]/g, '_')}_for_soundcloud.zip`;
    saveAs(content, zipFilename);
    console.log('Export completed successfully!');
  } catch (error) {
    console.error('Detailed export error:', error);
    if (error instanceof Error) {
      console.error('Error stack:', error.stack);
    }
    throw new Error(`Failed to export for SoundCloud: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Export a mixtape (multiple songs) for SoundCloud with all metadata
 * @param songs The songs to export
 * @param mixtapeTitle The title of the mixtape
 * @param mixtapeDescription The description of the mixtape
 * @param mixtapeTags Tags for the mixtape
 * @returns A promise that resolves when the export is complete
 */
export const exportMixtapeForSoundCloud = async (
  songs: Song[], 
  mixtapeTitle: string,
  mixtapeDescription: string = '',
  mixtapeTags: string[] = []
): Promise<void> => {
  console.log('Starting mixtape export process for', songs.length, 'songs');

  if (songs.length === 0) {
    throw new Error('No songs selected for export');
  }

  try {
    console.log('Creating zip file...');
    const zip = new JSZip();
    
    // Create a folder for each song
    for (let i = 0; i < songs.length; i++) {
      const song = songs[i];
      
      if (!song.filePath) {
        console.warn(`Skipping song ${song.title} - no file path available`);
        continue;
      }
      
      // Create a folder for this song
      const songFolder = zip.folder(song.title.replace(/[^a-zA-Z0-9]/g, '_'));
      if (!songFolder) continue;
      
      // Handle both local and remote file URLs
      let audioBlob: Blob;
      try {
        if (song.filePath.startsWith('blob:') || song.filePath.startsWith('data:')) {
          // For blob URLs, we need to fetch them directly
          console.log(`Handling blob URL for song ${i+1}/${songs.length}...`);
          const response = await fetch(song.filePath);
          audioBlob = await response.blob();
        } else if (song.filePath.startsWith('http')) {
          // For remote URLs (like Firebase Storage)
          console.log(`Handling remote URL for song ${i+1}/${songs.length}...`);
          const response = await fetch(song.filePath);
          if (!response.ok) {
            console.warn(`Failed to download audio file for ${song.title}: ${response.status} ${response.statusText}`);
            continue;
          }
          audioBlob = await response.blob();
        } else {
          // For local file paths
          console.log(`Handling local file for song ${i+1}/${songs.length}...`);
          const response = await fetch(song.filePath);
          audioBlob = await response.blob();
        }
        
        if (audioBlob.size === 0) {
          console.warn(`Downloaded audio file for ${song.title} is empty`);
          continue;
        }

        // Sanitize filename
        const filename = `${song.title.replace(/[^a-zA-Z0-9]/g, '_')}.mp3`;
        console.log(`Adding audio file to zip as: ${filename}`);
        songFolder.file(filename, audioBlob);
        
        // Create metadata file for this song
        const metadata = {
          title: song.title,
          artist: song.artist,
          description: `${song.title} by ${song.artist}`,
          genre: song.metadata?.genre?.[0] || '',
          tags: song.metadata?.tags?.join(', ') || '',
          bpm: song.metadata?.bpm || '',
          key: song.metadata?.key || '',
          releaseDate: song.metadata?.releaseDate || '',
          notes: song.notes || ''
        };
        
        // Add metadata as JSON
        songFolder.file('metadata.json', JSON.stringify(metadata, null, 2));
        
        // Add metadata as text for easy reference
        const metadataText = `
SoundCloud Upload Information
===========================

Title: ${metadata.title}
Artist: ${metadata.artist}
Description: ${metadata.description}
Genre: ${metadata.genre}
Tags: ${metadata.tags}
BPM: ${metadata.bpm}
Key: ${metadata.key}
Release Date: ${metadata.releaseDate}

Notes:
${metadata.notes}

Instructions:
1. Log in to your SoundCloud account
2. Go to "Upload" in the top navigation
3. Drag and drop the audio file (${filename})
4. Fill in the track information using the details above
5. Set the track to public or private as desired
6. Click "Save" to publish your track
`;
        
        songFolder.file('soundcloud_instructions.txt', metadataText);
      } catch (error) {
        console.error(`Error processing song ${song.title}:`, error);
        // Continue with other songs even if one fails
      }
    }
    
    // Create a mixtape info file
    const mixtapeInfo = {
      title: mixtapeTitle,
      description: mixtapeDescription,
      tags: mixtapeTags,
      songCount: songs.length,
      songs: songs.map(song => ({
        title: song.title,
        artist: song.artist,
        duration: song.duration
      }))
    };
    
    // Add mixtape info as JSON
    zip.file('mixtape_info.json', JSON.stringify(mixtapeInfo, null, 2));
    
    // Add mixtape info as text for easy reference
    const mixtapeInfoText = `
Mixtape Information
==================

Title: ${mixtapeInfo.title}
Description: ${mixtapeInfo.description}
Tags: ${mixtapeInfo.tags.join(', ')}
Song Count: ${mixtapeInfo.songCount}

Songs:
${mixtapeInfo.songs.map((song, index) => `${index + 1}. ${song.title} - ${song.artist} (${song.duration})`).join('\n')}

Instructions:
1. This zip file contains all songs for your mixtape
2. Each song is in its own folder with metadata
3. Upload each song individually to SoundCloud
4. Use the metadata files to fill in the track information
5. Consider creating a playlist on SoundCloud to group these songs together
`;
    
    zip.file('mixtape_instructions.txt', mixtapeInfoText);
    
    console.log('Generating final zip file...');
    const content = await zip.generateAsync({ 
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: {
        level: 6
      }
    });
    
    console.log('Zip file generated, size:', content.size);
    
    if (content.size === 0) {
      throw new Error('Generated zip file is empty');
    }

    console.log('Saving zip file...');
    const zipFilename = `${mixtapeTitle.replace(/[^a-zA-Z0-9]/g, '_')}_mixtape_for_soundcloud.zip`;
    saveAs(content, zipFilename);
    console.log('Mixtape export completed successfully!');
  } catch (error) {
    console.error('Detailed mixtape export error:', error);
    if (error instanceof Error) {
      console.error('Error stack:', error.stack);
    }
    throw new Error(`Failed to export mixtape for SoundCloud: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}; 