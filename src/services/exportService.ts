import { Song } from '../types';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Album } from '../types/album';

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

interface PlatformRequirements {
  audioFormat: string;
  bitrateKbps: number;
  maxFileSize: number;
  metadataFormat: string;
}

const platformRequirements: Record<string, PlatformRequirements> = {
  spotify: {
    audioFormat: 'WAV',
    bitrateKbps: 1411,
    maxFileSize: 200 * 1024 * 1024, // 200MB
    metadataFormat: 'JSON'
  },
  apple: {
    audioFormat: 'AIFF',
    bitrateKbps: 1411,
    maxFileSize: 2 * 1024 * 1024 * 1024, // 2GB
    metadataFormat: 'XML'
  },
  amazon: {
    audioFormat: 'FLAC',
    bitrateKbps: 1411,
    maxFileSize: 500 * 1024 * 1024, // 500MB
    metadataFormat: 'JSON'
  },
  youtube: {
    audioFormat: 'MP3',
    bitrateKbps: 320,
    maxFileSize: 1024 * 1024 * 1024, // 1GB
    metadataFormat: 'JSON'
  }
};

export const exportAlbum = async (album: Album): Promise<void> => {
  try {
    const zip = new JSZip();
    
    // Create a folder for each selected platform
    for (const platform of album.selectedPlatforms) {
      const requirements = platformRequirements[platform];
      const platformFolder = zip.folder(platform);
      
      if (!platformFolder) continue;
      
      // Add metadata file
      const metadata = {
        title: album.title,
        artist: album.artist,
        releaseDate: album.releaseDate,
        genre: album.genre,
        description: album.description,
        tracks: album.songs.map((song, index) => ({
          trackNumber: index + 1,
          title: song.title,
          artist: song.artist,
          duration: song.duration,
          isrc: song.metadata?.isrc || '',
          genre: song.metadata?.genre || [],
          bpm: song.metadata?.bpm || null,
          key: song.metadata?.key || '',
          featuring: song.metadata?.featuring || []
        }))
      };
      
      // Add metadata file in the appropriate format
      if (requirements.metadataFormat === 'JSON') {
        platformFolder.file('metadata.json', JSON.stringify(metadata, null, 2));
      } else if (requirements.metadataFormat === 'XML') {
        // Convert metadata to XML format
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<album>
  <title>${metadata.title}</title>
  <artist>${metadata.artist}</artist>
  <releaseDate>${metadata.releaseDate}</releaseDate>
  <genre>${metadata.genre}</genre>
  <description>${metadata.description}</description>
  <tracks>
    ${metadata.tracks.map(track => `
    <track>
      <trackNumber>${track.trackNumber}</trackNumber>
      <title>${track.title}</title>
      <artist>${track.artist}</artist>
      <duration>${track.duration}</duration>
      <isrc>${track.isrc}</isrc>
      <genre>${track.genre.join(',')}</genre>
      <bpm>${track.bpm || ''}</bpm>
      <key>${track.key}</key>
      <featuring>${track.featuring.join(',')}</featuring>
    </track>
    `).join('')}
  </tracks>
</album>`;
        platformFolder.file('metadata.xml', xml);
      }
      
      // Create a folder for audio files
      const audioFolder = platformFolder.folder('audio');
      if (!audioFolder) continue;
      
      // Add placeholder for audio files (in real implementation, you would convert and add actual audio files)
      album.songs.forEach((song, index) => {
        const trackNumber = (index + 1).toString().padStart(2, '0');
        const fileName = `${trackNumber}_${song.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${requirements.audioFormat.toLowerCase()}`;
        audioFolder.file(fileName, 'Audio file placeholder');
      });
      
      // Add cover art if available
      if (album.coverImage) {
        platformFolder.file('cover.jpg', 'Cover image placeholder');
      }
      
      // Add README with platform-specific instructions
      platformFolder.file('README.txt', `Export package for ${platform.toUpperCase()}
Audio Format: ${requirements.audioFormat}
Bitrate: ${requirements.bitrateKbps}kbps
Maximum File Size: ${requirements.maxFileSize / (1024 * 1024)}MB

This package contains:
1. Audio files in the required format
2. Metadata file in ${requirements.metadataFormat} format
3. Cover artwork
4. Platform-specific requirements and guidelines

Please ensure all files meet the platform's requirements before uploading.`);
    }
    
    // Generate and download the zip file
    const content = await zip.generateAsync({ type: 'blob' });
    const fileName = `${album.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_export.zip`;
    saveAs(content, fileName);
  } catch (error) {
    console.error('Error exporting album:', error);
    throw error;
  }
}; 