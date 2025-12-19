import { useState } from 'react';
import { toast } from 'sonner';

export interface NFTItem {
  id: string;
  name: string;
  description: string;
  image_url: string;
  type: 'rock' | 'paper' | 'scissors';
}

export interface SelectedSkins {
  rock: NFTItem | null;
  paper: NFTItem | null;
  scissors: NFTItem | null;
}

export function useNFTSkins() {
  const [selectedSkins, setSelectedSkins] = useState<SelectedSkins>({
    rock: null,
    paper: null,
    scissors: null,
  });

  const selectSkin = (nft: NFTItem) => {
    setSelectedSkins((prev) => ({
      ...prev,
      [nft.type]: nft,
    }));
    toast.success(`Đã chọn skin ${nft.name}!`);
  };

  const removeSkin = (choice: 'rock' | 'paper' | 'scissors') => {
    setSelectedSkins((prev) => ({
      ...prev,
      [choice]: null,
    }));
    toast.info('Đã xóa skin');
  };

  const getSkinForChoice = (choice: 'rock' | 'paper' | 'scissors') => {
    return selectedSkins[choice];
  };

  return {
    selectedSkins,
    selectSkin,
    removeSkin,
    getSkinForChoice,
  };
}
