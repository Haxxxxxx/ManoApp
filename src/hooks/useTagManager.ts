import { useState, useMemo, useCallback } from 'react';

interface TagCategories {
  genres: string[];
  moods: string[];
  instruments: string[];
  production: string[];
}

interface UseTagManagerReturn {
  selectedTags: string[];
  setSelectedTags: React.Dispatch<React.SetStateAction<string[]>>;
  newTag: string;
  setNewTag: React.Dispatch<React.SetStateAction<string>>;
  showTagSuggestions: boolean;
  setShowTagSuggestions: React.Dispatch<React.SetStateAction<boolean>>;
  defaultTags: TagCategories;
  allDefaultTags: string[];
  filteredTags: string[];
  handleAddTag: (tag: string) => void;
  handleRemoveTag: (tagToRemove: string) => void;
  handleAddCustomTag: () => void;
  handleTagSelect: (tag: string) => void;
}

export function useTagManager(): UseTagManagerReturn {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);

  // Default tags for different genres and moods - memoized to prevent recreation
  const defaultTags = useMemo<TagCategories>(
    () => ({
      genres: ['Pop', 'Rock', 'Hip Hop', 'Electronic', 'Jazz', 'Classical', 'R&B', 'Country', 'Folk', 'Metal'],
      moods: [
        'Happy',
        'Sad',
        'Energetic',
        'Calm',
        'Aggressive',
        'Melancholic',
        'Upbeat',
        'Dark',
        'Peaceful',
        'Dramatic',
      ],
      instruments: [
        'Piano',
        'Guitar',
        'Drums',
        'Bass',
        'Strings',
        'Synth',
        'Vocals',
        'Saxophone',
        'Trumpet',
        'Violin',
      ],
      production: [
        'Studio',
        'Live',
        'Demo',
        'Remix',
        'Cover',
        'Original',
        'Acoustic',
        'Electronic',
        'Experimental',
        'Traditional',
      ],
    }),
    []
  );

  const allDefaultTags = useMemo(
    () => [...defaultTags.genres, ...defaultTags.moods, ...defaultTags.instruments, ...defaultTags.production],
    [defaultTags]
  );

  // Filter tags based on input - memoized for performance
  const filteredTags = useMemo(() => {
    if (newTag.trim()) {
      return allDefaultTags.filter(
        (tag) => tag.toLowerCase().includes(newTag.toLowerCase()) && !selectedTags.includes(tag)
      );
    }
    return allDefaultTags.filter((tag) => !selectedTags.includes(tag));
  }, [newTag, selectedTags, allDefaultTags]);

  const handleAddTag = useCallback(
    (tag: string) => {
      if (tag && !selectedTags.includes(tag)) {
        setSelectedTags((prev) => [...prev, tag]);
      }
    },
    [selectedTags]
  );

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setSelectedTags((prev) => prev.filter((tag) => tag !== tagToRemove));
  }, []);

  const handleAddCustomTag = useCallback(() => {
    if (newTag.trim() && !selectedTags.includes(newTag.trim())) {
      setSelectedTags((prev) => [...prev, newTag.trim()]);
      setNewTag('');
      setShowTagSuggestions(false);
    }
  }, [newTag, selectedTags]);

  const handleTagSelect = useCallback(
    (tag: string) => {
      if (tag && !selectedTags.includes(tag)) {
        setSelectedTags((prev) => [...prev, tag]);
      }
      setNewTag('');
      setShowTagSuggestions(false);
    },
    [selectedTags]
  );

  return {
    selectedTags,
    setSelectedTags,
    newTag,
    setNewTag,
    showTagSuggestions,
    setShowTagSuggestions,
    defaultTags,
    allDefaultTags,
    filteredTags,
    handleAddTag,
    handleRemoveTag,
    handleAddCustomTag,
    handleTagSelect,
  };
}
