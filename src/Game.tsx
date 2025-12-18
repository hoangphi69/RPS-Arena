import { ConnectButton, useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { Wallet, Sparkles, Trophy, Coins, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { useSuiBalance } from './hooks/useSuiBalance';
import type { SuiEvent } from '@mysten/sui/client';
import { useEffect, useState } from 'react';

// Move module configuration
const PACKAGE_ID = '0x8ca87bbc53db9ddd044c3e0b622bb1c86a04fd4d528ac278673996ad8dea904c';
const MODULE_NAME = 'rps';
const HOUSE_OBJECT_ID = '0xf16da9961209675d42cdba104d3a7f3ce0ff87f6615b71ecdec097e66b763fa1';
const BET_AMOUNT_SUI = 0.1;
const BET_AMOUNT_MIST = BET_AMOUNT_SUI * 1_000_000_000;

type Choice = 'rock' | 'paper' | 'scissors' | null;

export default function GamePage() {
  const account = useCurrentAccount()!;
  const client = useSuiClient();
  const { data: balance, refetch: balanceRefetch } = useSuiBalance();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction({
    execute: async ({ bytes, signature }) =>
      await client.executeTransactionBlock({
        transactionBlock: bytes,
        signature,
        options: {
          showRawEffects: true,
          showEvents: true,
          showObjectChanges: true,
        },
      }),
  });

  const [houseBalance, setHouseBalance] = useState<number>(0);
  const [playerChoice, setPlayerChoice] = useState<Choice>(null);
  const [houseChoice, setHouseChoice] = useState<Choice>(null);
  const [gameStatus, setGameStatus] = useState<'idle' | 'betting' | 'revealing' | 'result'>('idle');
  const [result, setResult] = useState<'win' | 'lose' | 'draw' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    getHouseBalance();
  }, []);

  const hasEnoughBalance = balance ? +balance >= BET_AMOUNT_SUI : false;

  const choices: { value: Choice; icon: string; label: string; color: string }[] = [
    { value: 'rock', icon: '✊', label: 'Búa', color: 'bg-red-500 hover:bg-red-600' },
    { value: 'paper', icon: '✋', label: 'Bao', color: 'bg-blue-500 hover:bg-blue-600' },
    { value: 'scissors', icon: '✌️', label: 'Kéo', color: 'bg-green-500 hover:bg-green-600' },
  ];

  function getRandomChoice(): Choice {
    const options: Choice[] = ['rock', 'paper', 'scissors'];
    return options[Math.floor(Math.random() * 3)];
  }

  function determineWinner(player: Choice, house: Choice): 'win' | 'lose' | 'draw' {
    if (player === house) return 'draw';
    if (
      (player === 'rock' && house === 'scissors') ||
      (player === 'paper' && house === 'rock') ||
      (player === 'scissors' && house === 'paper')
    ) {
      return 'win';
    }
    return 'lose';
  }

  function handleChoiceSelect(choice: Choice) {
    if (gameStatus !== 'idle' || isProcessing) return;
    
    setPlayerChoice(choice);
    setGameStatus('betting');
  }

  function resetGame() {
    setPlayerChoice(null);
    setHouseChoice(null);
    setGameStatus('idle');
    setResult(null);
  }

  async function placeBet() {
    if (!playerChoice || isProcessing) return;

    setIsProcessing(true);
    const generatedHouseChoice = getRandomChoice();
    setHouseChoice(generatedHouseChoice);
    
    const tx = new Transaction();
    const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(BET_AMOUNT_MIST)]);

    // Convert choice to bool (adjust based on your contract)
    const choiceBool = playerChoice === 'rock';

    tx.moveCall({
      target: `${PACKAGE_ID}::${MODULE_NAME}::play_game`,
      arguments: [
        tx.object(HOUSE_OBJECT_ID),
        coin,
        tx.pure.bool(choiceBool),
        tx.object('0x8'),
      ],
    });

    signAndExecute(
      { transaction: tx },
      {
        onSuccess: async (res) => {
          console.log('Game completed:', res);
          
          setGameStatus('revealing');
          
          setTimeout(() => {
            const gameOutcome = determineWinner(playerChoice, generatedHouseChoice);
            setResult(gameOutcome);
            setGameStatus('result');
            
            if (gameOutcome === 'win') {
              toast.success(`🎉 Bạn thắng! +${BET_AMOUNT_SUI * 2} SUI`);
            } else if (gameOutcome === 'lose') {
              toast.error(`😢 Bạn thua! -${BET_AMOUNT_SUI} SUI`);
            } else {
              toast.info('🤝 Hòa! Hoàn tiền');
            }
            
            balanceRefetch();
            getHouseBalance();
            setIsProcessing(false);
          }, 2000);
        },
        onError: (error) => {
          console.error('Error:', error);
          toast.error('Giao dịch thất bại!');
          resetGame();
          setIsProcessing(false);
        },
      }
    );
  }

  async function getHouseBalance() {
    const houseObject = await client.getObject({
      id: HOUSE_OBJECT_ID,
      options: { showContent: true },
    });

    if (houseObject.data?.content?.dataType === 'moveObject') {
      const fields = houseObject.data.content.fields as any;
      const balance = parseInt(fields.balance || '0') / 1_000_000_000;
      setHouseBalance(balance);
    }
  }

  return (
    <div className="bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4 min-h-screen">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8 pt-6">
          <h1 className="text-5xl font-bold text-white mb-2 flex items-center justify-center gap-3">
            <Sparkles className="w-10 h-10 text-yellow-400" />
            Kéo Búa Bao
            <Sparkles className="w-10 h-10 text-yellow-400" />
          </h1>
          <p className="text-purple-200 text-lg">Cược {BET_AMOUNT_SUI} SUI - Thắng nhận {BET_AMOUNT_SUI * 2} SUI</p>
        </div>

        {/* Wallet & House Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20">
            <div className="flex items-center gap-2 mb-4">
              <Wallet className="w-5 h-5 text-yellow-400" />
              <h3 className="text-white font-semibold">Ví của bạn</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-purple-200">Địa chỉ:</span>
                <span className="text-white font-mono text-xs">
                  {account.address.slice(0, 6)}...{account.address.slice(-4)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-purple-200">Số dư:</span>
                <span className="text-white font-bold">{balance} SUI</span>
              </div>
              <div className="pt-2">
                <ConnectButton />
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20">
            <div className="flex items-center gap-2 mb-4">
              <Coins className="w-5 h-5 text-green-400" />
              <h3 className="text-white font-semibold">Nhà cái</h3>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-purple-200">Quỹ nhà cái:</span>
              <span className="text-white font-bold">{houseBalance.toFixed(2)} SUI</span>
            </div>
          </div>
        </div>

        {/* Game Arena */}
        <div className="bg-white/10 backdrop-blur-lg p-8 rounded-3xl border border-white/20 mb-6">
          {/* Player vs House Display */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {/* Player Side */}
            <div className="text-center">
              <div className="text-purple-200 text-sm mb-2">BẠN</div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-8 h-40 flex items-center justify-center border-4 border-blue-300 shadow-xl">
                {playerChoice ? (
                  <span className="text-7xl">{choices.find(c => c.value === playerChoice)?.icon}</span>
                ) : (
                  <span className="text-white text-4xl">?</span>
                )}
              </div>
            </div>

            {/* VS */}
            <div className="flex items-center justify-center">
              <div className="text-yellow-400 font-bold text-3xl animate-pulse">VS</div>
            </div>

            {/* House Side */}
            <div className="text-center">
              <div className="text-purple-200 text-sm mb-2">NHÀ CÁI</div>
              <div className="bg-gradient-to-br from-red-500 to-red-700 rounded-2xl p-8 h-40 flex items-center justify-center border-4 border-red-300 shadow-xl">
                {gameStatus === 'revealing' || gameStatus === 'result' ? (
                  <span className="text-7xl">{choices.find(c => c.value === houseChoice)?.icon}</span>
                ) : (
                  <span className="text-white text-4xl">?</span>
                )}
              </div>
            </div>
          </div>

          {/* Result Message */}
          {gameStatus === 'result' && result && (
            <div className={`text-center p-6 rounded-xl mb-6 ${
              result === 'win' ? 'bg-green-500/20 border-2 border-green-400' :
              result === 'lose' ? 'bg-red-500/20 border-2 border-red-400' :
              'bg-yellow-500/20 border-2 border-yellow-400'
            }`}>
              <div className="flex items-center justify-center gap-3">
                {result === 'win' && <Trophy className="w-8 h-8 text-yellow-400" />}
                <span className={`text-3xl font-bold ${
                  result === 'win' ? 'text-green-300' :
                  result === 'lose' ? 'text-red-300' :
                  'text-yellow-300'
                }`}>
                  {result === 'win' ? '🎉 BẠN THẮNG!' :
                   result === 'lose' ? '😢 BẠN THUA!' :
                   '🤝 HÒA!'}
                </span>
              </div>
            </div>
          )}

          {/* Choice Selection */}
          {gameStatus === 'idle' && (
            <div>
              <h3 className="text-white text-center mb-4 text-xl font-semibold">Chọn một:</h3>
              <div className="grid grid-cols-3 gap-4">
                {choices.map((choice) => (
                  <button
                    key={choice.value}
                    onClick={() => handleChoiceSelect(choice.value)}
                    disabled={!hasEnoughBalance}
                    className={`${choice.color} text-white p-6 rounded-2xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl`}
                  >
                    <div className="text-6xl mb-2">{choice.icon}</div>
                    <div className="font-bold text-lg">{choice.label}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bet Confirmation */}
          {gameStatus === 'betting' && (
            <div className="text-center space-y-4">
              <p className="text-white text-xl">
                Bạn đã chọn: <span className="font-bold text-yellow-400">{choices.find(c => c.value === playerChoice)?.label}</span>
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={placeBet}
                  disabled={isProcessing}
                  className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-xl transform hover:scale-105 transition-all disabled:opacity-50"
                >
                  {isProcessing ? '⏳ Đang xử lý...' : `🎲 Cược ${BET_AMOUNT_SUI} SUI`}
                </button>
                <button
                  onClick={resetGame}
                  disabled={isProcessing}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-xl transform hover:scale-105 transition-all disabled:opacity-50"
                >
                  ❌ Hủy
                </button>
              </div>
            </div>
          )}

          {/* Processing/Result State */}
          {(gameStatus === 'revealing' || gameStatus === 'result') && (
            <div className="text-center">
              {gameStatus === 'revealing' && (
                <p className="text-white text-xl animate-pulse">🎰 Đang mở kết quả...</p>
              )}
              {gameStatus === 'result' && (
                <button
                  onClick={resetGame}
                  className="bg-purple-500 hover:bg-purple-600 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-xl transform hover:scale-105 transition-all mt-4"
                >
                  🔄 Chơi lại
                </button>
              )}
            </div>
          )}
        </div>

        {/* Warning */}
        {!hasEnoughBalance && (
          <div className="bg-red-500/20 border-2 border-red-400 p-4 rounded-xl text-center">
            <p className="text-red-300 font-semibold">
              ⚠️ Số dư không đủ! Cần tối thiểu {BET_AMOUNT_SUI} SUI để chơi.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}