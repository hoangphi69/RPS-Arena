// App.tsx
import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit';
import { Wallet, Sparkles, Lock } from 'lucide-react';
import GamePage from './Game';

export default function App() {
  const account = useCurrentAccount();

  // Nếu chưa đăng nhập, hiển thị trang welcome
  if (!account) {
    return (
      <div className="bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6 min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full">
          <div className="bg-white/10 backdrop-blur-lg p-8 rounded-3xl border border-white/20 shadow-2xl">
            {/* Logo/Title */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-6 rounded-full">
                  <Sparkles className="w-16 h-16 text-white" />
                </div>
              </div>
              <h1 className="text-5xl font-bold text-white mb-3">
                Kéo Búa Bao
              </h1>
              <p className="text-purple-200 text-lg">
                Game cược trên Sui Blockchain
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <div className="bg-green-500/20 p-2 rounded-lg">
                  <span className="text-2xl">✊</span>
                </div>
                <div>
                  <h3 className="text-white font-semibold">Chơi công bằng</h3>
                  <p className="text-purple-200 text-sm">Kết quả ngẫu nhiên 100% trên blockchain</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-blue-500/20 p-2 rounded-lg">
                  <span className="text-2xl">💰</span>
                </div>
                <div>
                  <h3 className="text-white font-semibold">Thắng x2</h3>
                  <p className="text-purple-200 text-sm">Cược 0.1 SUI - Thắng nhận 0.2 SUI</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-purple-500/20 p-2 rounded-lg">
                  <span className="text-2xl">⚡</span>
                </div>
                <div>
                  <h3 className="text-white font-semibold">Nhanh chóng</h3>
                  <p className="text-purple-200 text-sm">Kết quả tức thì, rút tiền ngay lập tức</p>
                </div>
              </div>
            </div>

            {/* Connect Wallet Section */}
            <div className="bg-white/5 p-6 rounded-2xl border border-white/10 mb-6">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Lock className="w-5 h-5 text-yellow-400" />
                <h3 className="text-white font-semibold">Kết nối để chơi</h3>
              </div>
              <p className="text-purple-200 text-sm text-center mb-4">
                Bạn cần kết nối ví Sui để bắt đầu chơi game
              </p>
              <div className="flex justify-center">
                <ConnectButton />
              </div>
            </div>

            {/* Footer */}
            <div className="text-center">
              <p className="text-purple-300 text-xs">
                🔒 An toàn • ⚡ Nhanh chóng • 🎲 Công bằng
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Nếu đã đăng nhập, hiển thị trang game
  return <GamePage />;
}