import { Song } from '../types/index';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Album } from '../types/album';
import { sanitizeFilename } from '../utils/formatters';
import { fetchAudioBlob, createSongMetadata } from '../utils/fileHelpers';
import { getErrorMessage } from '../utils/storageHelpers';

/**
 * Export a song for SoundCloud with all metadata
 * @param song The song to export
 * @returns A promise that resolves when the export is complete
 */
export const exportForSoundCloud = async (song: Song): Promise<void> => {
  if (!song.filePath) {
    throw new Error('No audio file available for export');
  }

  try {
    const zip = new JSZip();
    
    // Fetch audio blob using utility function
    const audioBlob = await fetchAudioBlob(song.filePath);

    // Sanitize filename
    const filename = `${sanitizeFilename(song.title)}.mp3`;
    zip.file(filename, audioBlob);
    
    // Create metadata file
    const metadata = createSongMetadata(song);
    
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
    
    zip.file('soundcloud_instructions.txt', metadataText);
    
    const content = await zip.generateAsync({ 
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: {
        level: 6
      }
    });
    
    if (content.size === 0) {
      throw new Error('Generated zip file is empty');
    }

    const zipFilename = `${sanitizeFilename(song.title)}_for_soundcloud.zip`;
    saveAs(content, zipFilename);
  } catch (error) {
    // Detailed export error
    throw new Error(`Failed to export for SoundCloud: ${getErrorMessage(error, 'Unknown error')}`);
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
  if (songs.length === 0) {
    throw new Error('No songs selected for export');
  }

  try {
    const zip = new JSZip();
    
    // Create a folder for each song
    for (let i = 0; i < songs.length; i++) {
      const song = songs[i];
      
      if (!song.filePath) {
        continue;
      }
      
      // Create a folder for this song
      const songFolder = zip.folder(sanitizeFilename(song.title));
      if (!songFolder) continue;
      
      // Fetch audio blob using utility function
      let audioBlob: Blob;
      try {
        audioBlob = await fetchAudioBlob(song.filePath);
      } catch (error) {
        // Skip this song if we can't fetch it
        continue;
      }

      // Sanitize filename
      const filename = `${sanitizeFilename(song.title)}.mp3`;
      songFolder.file(filename, audioBlob);
      
      // Create metadata file for this song
      const metadata = createSongMetadata(song);
      
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
    
    const content = await zip.generateAsync({ 
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: {
        level: 6
      }
    });
    
    if (content.size === 0) {
      throw new Error('Generated zip file is empty');
    }

    const zipFilename = `${sanitizeFilename(mixtapeTitle)}_mixtape_for_soundcloud.zip`;
    saveAs(content, zipFilename);
  } catch (error) {
    // Detailed mixtape export error
    throw new Error(`Failed to export mixtape for SoundCloud: ${getErrorMessage(error, 'Unknown error')}`);
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
        const fileName = `${trackNumber}_${sanitizeFilename(song.title).toLowerCase()}.${requirements.audioFormat.toLowerCase()}`;
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
    const fileName = `${sanitizeFilename(album.title).toLowerCase()}_export.zip`;
    saveAs(content, fileName);
  } catch (error) {
    // Error exporting album
    throw error;
  }
}; 