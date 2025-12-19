import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { Package } from 'lucide-react';
import { useEffect, useState } from 'react';
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

interface NFTInventoryProps {
  selectedSkins: SelectedSkins;
  onSelectSkin: (nft: NFTItem) => void;
  onRemoveSkin: (choice: 'rock' | 'paper' | 'scissors') => void;
}

const CHOICE_ICONS = {
  scissors: '✌️',
  rock: '👊',
  paper: '✋',
};

const CHOICE_LABELS = {
  scissors: 'Kéo',
  rock: 'Búa',
  paper: 'Bao',
};

const NFT_PACKAGE_ID =
  '0x1bda5ec5dda87f86896b45e95e12636e4fbbf58562b81a3fbfb8426589e13e5c';

export default function NFTInventory({
  selectedSkins,
  onSelectSkin,
  onRemoveSkin,
}: NFTInventoryProps) {
  const account = useCurrentAccount();
  const client = useSuiClient();

  const [nftInventory, setNftInventory] = useState<NFTItem[]>([]);
  const [isLoadingNFTs, setIsLoadingNFTs] = useState(false);

  useEffect(() => {
    if (account) {
      fetchUserNFTs();
    }
  }, [account]);

  async function fetchUserNFTs() {
    if (!account?.address) return;

    setIsLoadingNFTs(true);

    try {
      const objects = await client.getOwnedObjects({
        owner: account.address,
        options: {
          showContent: true,
          showType: true,
        },
      });

      const NFT_TYPE = `${NFT_PACKAGE_ID}::gg_nft::NFT`;
      const nfts: NFTItem[] = [];

      for (const obj of objects.data) {
        if (
          obj.data?.content?.dataType === 'moveObject' &&
          obj.data.type === NFT_TYPE
        ) {
          const fields = obj.data.content.fields as any;

          // ===== ✅ FIX: decode string::String =====
          const rawDescription =
            typeof fields.description === 'string'
              ? fields.description
              : fields.description?.bytes ?? '';

          const description = rawDescription.toLowerCase();

          let type: 'rock' | 'paper' | 'scissors' | null = null;

          if (
            description.includes('scissors') ||
            description.includes('kéo') ||
            description.includes('keo')
          ) {
            type = 'scissors';
          } else if (
            description.includes('rock') ||
            description.includes('búa') ||
            description.includes('bua')
          ) {
            type = 'rock';
          } else if (
            description.includes('paper') ||
            description.includes('bao') ||
            description.includes('giấy') ||
            description.includes('giay')
          ) {
            type = 'paper';
          }

          // ===== ✅ FIX: decode url::Url =====
          const imageUrl =
            typeof fields.image_url === 'string'
              ? fields.image_url
              : fields.image_url?.url ||
                fields.image_url?.fields?.url ||
                '';

          // ===== ✅ FIX: decode name =====
          const name =
            typeof fields.name === 'string'
              ? fields.name
              : fields.name?.bytes ?? 'Unnamed NFT';

          if (type && imageUrl) {
            nfts.push({
              id: obj.data.objectId,
              name,
              description: rawDescription,
              image_url: imageUrl,
              type,
            });
          }
        }
      }

      setNftInventory(nfts);
      console.log('Loaded NFTs:', nfts);
    } catch (error) {
      console.error('Error fetching NFTs:', error);
      toast.error('Không thể tải NFTs');
    } finally {
      setIsLoadingNFTs(false);
    }
  }

  if (!account) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-lg p-12 rounded-2xl border border-white/10 text-center">
        <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-white text-xl">Kết nối ví để xem NFT của bạn</p>
      </div>
    );
  }

  if (isLoadingNFTs) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-lg p-12 rounded-2xl border border-white/10 text-center">
        <p className="text-white text-xl animate-pulse">
          ⏳ Đang tải NFTs...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Selected Skins */}
      <div className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-2xl border border-white/10">
        <h3 className="text-white font-bold text-xl mb-4">
          ✨ Skin đang dùng
        </h3>

        <div className="grid grid-cols-3 gap-4">
          {(['scissors', 'rock', 'paper'] as const).map((choice) => {
            const skin = selectedSkins[choice];

            return (
              <div
                key={choice}
                className="bg-gray-900/50 p-4 rounded-xl text-center"
              >
                <div className="text-gray-300 text-sm mb-2 font-semibold">
                  {CHOICE_LABELS[choice]} {CHOICE_ICONS[choice]}
                </div>

                {skin ? (
                  <div className="relative">
                    <img
                      src={skin.image_url}
                      alt={skin.name}
                      className="w-full h-32 object-cover rounded-lg mb-2 border-2 border-emerald-500/30"
                    />

                    <button
                      onClick={() => onRemoveSkin(choice)}
                      className="absolute top-1 right-1 bg-red-600 hover:bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-lg transition-colors"
                    >
                      ✕
                    </button>

                    <p className="text-white text-xs truncate font-medium">
                      {skin.name}
                    </p>
                  </div>
                ) : (
                  <div className="h-32 flex items-center justify-center text-5xl bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-600">
                    {CHOICE_ICONS[choice]}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Inventory by Type */}
      {(['scissors', 'rock', 'paper'] as const).map((type) => {
        const nftsOfType = nftInventory.filter((nft) => nft.type === type);

        return (
          <div
            key={type}
            className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-2xl border border-white/10"
          >
            <h3 className="text-white font-bold text-xl mb-4">
              {CHOICE_LABELS[type]} {CHOICE_ICONS[type]} ({nftsOfType.length}{' '}
              NFT)
            </h3>

            {nftsOfType.length === 0 ? (
              <p className="text-gray-400 text-center py-8">
                Chưa có NFT loại này
              </p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {nftsOfType.map((nft) => {
                  const isSelected = selectedSkins[type]?.id === nft.id;

                  return (
                    <button
                      key={nft.id}
                      onClick={() => onSelectSkin(nft)}
                      className={`bg-gray-900/50 hover:bg-gray-900/70 p-3 rounded-xl transition-all transform hover:scale-105 border-2 ${
                        isSelected
                          ? 'border-emerald-500 shadow-lg shadow-emerald-500/20'
                          : 'border-transparent hover:border-gray-600'
                      }`}
                    >
                      <img
                        src={nft.image_url}
                        alt={nft.name}
                        className="w-full h-24 object-cover rounded-lg mb-2"
                      />
                      <p className="text-white text-sm font-semibold truncate">
                        {nft.name}
                      </p>
                      {isSelected && (
                        <span className="text-emerald-400 text-xs font-bold">
                          ✓ Đang dùng
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {nftInventory.length === 0 && (
        <div className="bg-gray-800/50 backdrop-blur-lg p-12 rounded-2xl border border-white/10 text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-white text-xl">Bạn chưa có NFT nào</p>
          <p className="text-gray-400 mt-2">
            Mint hoặc mua NFT để dùng làm skin
          </p>
        </div>
      )}
    </div>
  );
}