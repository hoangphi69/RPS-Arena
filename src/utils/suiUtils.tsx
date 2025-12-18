import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { bcs } from '@mysten/sui/bcs';

// --- READ-ONLY FUNCTION (Dev Inspect) ---
// Useful for: get_pool_balance, checking game state, etc.
export async function moveRead(
  client: SuiClient,
  target: string, // e.g., "0x...::rps::get_pool_balance"
  args: any[] = [],
  typeArgs: string[] = []
) {
  const tx = new Transaction();

  tx.moveCall({
    target,
    arguments: args.map((arg) =>
      // Auto-detect if it's a pure value or object ID
      // (Simple heuristic; for complex cases, pass tx.object/pure explicitly)
      typeof arg === 'string' && arg.startsWith('0x')
        ? tx.object(arg)
        : tx.pure(arg)
    ),
    typeArguments: typeArgs,
  });

  const result = await client.devInspectTransactionBlock({
    transactionBlock: tx,
    sender:
      '0x0000000000000000000000000000000000000000000000000000000000000000', // Dummy sender
  });

  if (result.effects.status.status === 'failure') {
    throw new Error('Move Read Failed');
  }

  // Parse the return values (assuming simple return types for now)
  // You might need specific BCS parsers depending on your return type
  return result.results?.[0]?.returnValues?.map(([bytes, type]) => {
    // Defaulting to parsing as U64 for this example, or return raw bytes
    // In a real app, pass a 'parser' function to this utility
    return bcs.u64().parse(Uint8Array.from(bytes));
  });
}

// --- WRITE FUNCTION (Execute Transaction) ---
// Useful for: play_game, withdraw, etc.
export async function moveWrite(
  signAndExecute: any, // Pass the mutation function from useSignAndExecuteTransaction
  target: string,
  args: (tx: Transaction) => any[], // Callback to build args (allows accessing 'tx' for gas splitting)
  options: {
    typeArgs?: string[];
    paymentAmount?: number; // If you need to attach SUI (like your bet)
    onSuccess?: (result: any) => void;
    onError?: (error: any) => void;
  } = {}
) {
  const tx = new Transaction();

  // Handle Coin Splitting (Betting Logic)
  let callArgs = [];
  if (options.paymentAmount) {
    const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(options.paymentAmount)]);
    // We pass 'coin' as the *first* manual argument if payment exists,
    // but your specific contract might need it elsewhere.
    // To be safe, we let the 'args' callback handle placement.
    callArgs = args(tx);
  } else {
    callArgs = args(tx);
  }

  tx.moveCall({
    target,
    arguments: callArgs,
    typeArguments: options.typeArgs || [],
  });

  signAndExecute(
    { transaction: tx },
    {
      onSuccess: options.onSuccess,
      onError: options.onError,
    }
  );
}
