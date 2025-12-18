import React, { useState } from 'react';
import {
  ConnectButton,
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
} from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { useGGCBalance } from './hooks/useGGCBalance';

// Move module configuration
const TREASURY_CAP_ID =
  '0x92b8d0bdd87b2aefecb694dae9e621bf79a176be286294ae1b297f4ec4343b33';
const PACKAGE_ID =
  '0x4d21dfddf16121831decde8457856f41060d7ec43ee2d6bd2778703535d5e063';
const MODULE_NAME = 'ggc';
const HOUSE_OBJECT_ID =
  '0x2e22048c933eb925e9ab03159f34ebd95160eb3634f7f8602937300caa920185';

type Choice = 'rock' | 'paper' | 'scissors';
type GameResult = 'win' | 'lose' | 'draw' | null;

const CHOICES = {
  rock: '👊',
  paper: '✋',
  scissors: '✌️',
};

export default function RockPaperScissorsGame() {
  const account = useCurrentAccount();
  const client = useSuiClient();
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
  const { data: balance, refetch: refetchBalance } = useGGCBalance();

  const [playerChoice, setPlayerChoice] = useState<Choice | null>(null);
  const [botChoice, setBotChoice] = useState<Choice | null>(null);
  const [result, setResult] = useState<GameResult>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [scores, setScores] = useState({ player: 0, bot: 0, draws: 0 });

  const getRandomChoice = (): Choice => {
    const choices: Choice[] = ['rock', 'paper', 'scissors'];
    return choices[Math.floor(Math.random() * choices.length)];
  };

  const determineWinner = (player: Choice, bot: Choice): GameResult => {
    if (player === bot) return 'draw';
    if (
      (player === 'rock' && bot === 'scissors') ||
      (player === 'paper' && bot === 'rock') ||
      (player === 'scissors' && bot === 'paper')
    ) {
      return 'win';
    }
    return 'lose';
  };

  const payAndPlay = async (choice: Choice) => {
    if (!account) {
      alert('Please connect your wallet first!');
      return;
    }

    setIsProcessing(true);
    setPlayerChoice(choice);
    setBotChoice(null);
    setResult(null);

    // Step 1: User pays first (payout to house)
    const tx = new Transaction();
    tx.moveCall({
      target: `${PACKAGE_ID}::${MODULE_NAME}::payout`,
      arguments: [
        tx.object(HOUSE_OBJECT_ID),
        tx.object(TREASURY_CAP_ID),
        tx.pure.address(HOUSE_OBJECT_ID), // Payment goes to house first
      ],
    });

    signAndExecute(
      { transaction: tx },
      {
        onSuccess: async (res) => {
          console.log('Payment successful', res);

          // Step 2: After payment confirmed, run game logic
          setTimeout(() => {
            // Simulate on-chain game logic
            const bot = getRandomChoice();
            setBotChoice(bot);

            const gameResult = determineWinner(choice, bot);
            setResult(gameResult);

            // Update scores
            setScores((prev) => ({
              player: prev.player + (gameResult === 'win' ? 1 : 0),
              bot: prev.bot + (gameResult === 'lose' ? 1 : 0),
              draws: prev.draws + (gameResult === 'draw' ? 1 : 0),
            }));

            // Step 3: If player wins, send payout
            if (gameResult === 'win') {
              const payoutTx = new Transaction();
              payoutTx.moveCall({
                target: `${PACKAGE_ID}::${MODULE_NAME}::payout`,
                arguments: [
                  payoutTx.object(HOUSE_OBJECT_ID),
                  payoutTx.object(TREASURY_CAP_ID),
                  payoutTx.pure.address(account.address),
                ],
              });

              signAndExecute(
                { transaction: payoutTx },
                {
                  onSuccess: () => {
                    console.log('Payout to winner successful');
                    refetchBalance();
                  },
                  onError: (err) => {
                    console.error('Payout failed', err);
                  },
                }
              );
            }

            setIsProcessing(false);
            setShowModal(true);
            refetchBalance();
          }, 1500); // Simulate blockchain processing time
        },
        onError: (err) => {
          console.error('Payment failed', err);
          alert('Payment failed. Please try again.');
          setIsProcessing(false);
          setPlayerChoice(null);
        },
      }
    );
  };

  const confirmEndRound = () => {
    setShowModal(false);
    setPlayerChoice(null);
    setBotChoice(null);
    setResult(null);
  };

  const getResultColor = () => {
    if (result === 'win') return 'bg-green-500';
    if (result === 'lose') return 'bg-red-500';
    if (result === 'draw') return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  const getResultText = () => {
    if (result === 'win') return 'You Win! 🎉';
    if (result === 'lose') return 'You Lose 😢';
    if (result === 'draw') return "It's a Draw! 🤝";
    if (isProcessing) return 'Processing payment...';
    return 'Rock, Paper, Scissors?';
  };

  return (
    <div className="flex justify-center items-center bg-gradient-to-br from-purple-600 to-blue-600 p-4 min-h-screen">
      <div
        className={`${getResultColor()} shadow-2xl rounded-2xl w-full max-w-2xl relative`}
      >
        {/* Game Display */}
        <div className="mb-8 p-8 rounded-xl text-white transition-all duration-300">
          <div className="flex flex-col gap-8">
            {/* Bot Side */}
            {botChoice && (
              <div className="text-center">
                <div className="opacity-90 mb-2 font-semibold text-sm">
                  🤖 Bot
                </div>
                <div className="p-8 text-8xl animate-bounce">
                  {CHOICES[botChoice]}
                </div>
              </div>
            )}

            <h2 className="font-bold text-2xl text-center">
              {getResultText()}
            </h2>

            {/* Player Side */}
            <div className="text-center">
              <div className="opacity-90 mb-2 font-semibold text-sm">You</div>
              <div className="p-8 text-8xl">
                {playerChoice ? CHOICES[playerChoice] : '❓'}
              </div>
            </div>
          </div>

          {/* Choice Buttons */}
          <div className="gap-4 grid grid-cols-3">
            {(Object.keys(CHOICES) as Choice[]).map((choice) => (
              <button
                key={choice}
                onClick={() => payAndPlay(choice)}
                disabled={isProcessing || !account || showModal}
                className={`
                bg-gradient-to-br from-purple-500 to-pink-500 
                hover:from-purple-600 hover:to-pink-600
                disabled:from-gray-300 disabled:to-gray-400
                text-white rounded-xl p-6 text-6xl
                transform transition-all duration-200
                hover:scale-110 active:scale-95
                disabled:cursor-not-allowed disabled:hover:scale-100
                shadow-lg hover:shadow-xl
              `}
              >
                {CHOICES[choice]}
              </button>
            ))}
          </div>
        </div>

        {/* Instructions */}
        {!account ? (
          <div className="bg-yellow-100 mt-6 p-4 border border-yellow-300 rounded-lg text-yellow-800 text-center">
            Please connect your wallet to start playing!
            <div className="mt-2">
              <ConnectButton />
            </div>
          </div>
        ) : (
          <div className="flex justify-between items-center mt-6 p-4 rounded-lg text-white text-center">
            <ConnectButton />
            <div className="font-semibold">{balance} GGC</div>
          </div>
        )}

        {/* Score Display */}
        <div className="gap-4 grid grid-cols-3 p-4">
          <div className="bg-white bg-opacity-20 p-3 rounded-lg text-center">
            <div className="font-bold text-2xl">{scores.player}</div>
            <div className="opacity-90 text-xs">Wins</div>
          </div>
          <div className="bg-white bg-opacity-20 p-3 rounded-lg text-center">
            <div className="font-bold text-2xl">{scores.draws}</div>
            <div className="opacity-90 text-xs">Draws</div>
          </div>
          <div className="bg-white bg-opacity-20 p-3 rounded-lg text-center">
            <div className="font-bold text-2xl">{scores.bot}</div>
            <div className="opacity-90 text-xs">Losses</div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="z-50 fixed inset-0 flex justify-center items-center bg-black/50">
          <div className="bg-white shadow-2xl mx-4 p-8 rounded-2xl w-full max-w-md">
            <div className="text-center">
              <div className="mb-4 text-6xl">
                {result === 'win' ? '🎉' : result === 'lose' ? '😢' : '🤝'}
              </div>
              <h3 className="mb-4 font-bold text-gray-800 text-3xl">
                {result === 'win'
                  ? 'You Won!'
                  : result === 'lose'
                  ? 'You Lost!'
                  : "It's a Draw!"}
              </h3>
              <div className="flex justify-center gap-8 mb-6">
                <div>
                  <div className="mb-1 text-gray-600 text-sm">You</div>
                  <div className="text-5xl">
                    {playerChoice && CHOICES[playerChoice]}
                  </div>
                </div>
                <div className="flex items-center text-gray-400 text-3xl">
                  vs
                </div>
                <div>
                  <div className="mb-1 text-gray-600 text-sm">Bot</div>
                  <div className="text-5xl">
                    {botChoice && CHOICES[botChoice]}
                  </div>
                </div>
              </div>
              <p className="mb-6 text-gray-600">
                {result === 'win'
                  ? 'Congratulations! You won GGC tokens!'
                  : result === 'lose'
                  ? 'Better luck next time!'
                  : 'No winner this round!'}
              </p>
              <button
                onClick={confirmEndRound}
                className="bg-gradient-to-r from-purple-500 hover:from-purple-600 to-pink-500 hover:to-pink-600 px-8 py-3 rounded-lg w-full font-bold text-white hover:scale-105 transition-all transform"
              >
                Play Again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
