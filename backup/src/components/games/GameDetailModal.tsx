import { Game } from '../../types';
import Badge from '../common/Badge';
import Modal from '../common/Modal';

interface GameDetailModalProps {
  game: Game | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function GameDetailModal({ game, isOpen, onClose }: GameDetailModalProps) {
  if (!game) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Game Cover */}
        <div className="w-full md:w-1/3 flex-shrink-0">
          <img
            src={game.coverImage}
            alt={game.name}
            className="w-full h-64 md:h-80 object-cover rounded-xl"
          />
        </div>

        {/* Game Info */}
        <div className="flex-1">
          <div className="flex items-start justify-between gap-4 mb-4">
            <h2 className="text-2xl font-bold">{game.name}</h2>
            <div className="flex items-center gap-1 text-yellow-400">
              <StarIcon className="w-5 h-5" />
              <span className="font-bold">{game.rating}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="primary">{game.genre}</Badge>
            {game.platform.map((p) => (
              <Badge key={p} variant="default">{p}</Badge>
            ))}
          </div>

          <p className="text-dark-300 mb-6">{game.description}</p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-dark-700/50 rounded-lg p-4">
              <p className="text-xs text-dark-400 mb-1">Active Players</p>
              <p className="text-xl font-bold text-green-400">
                {game.activePlayers.toLocaleString()}
              </p>
            </div>
            <div className="bg-dark-700/50 rounded-lg p-4">
              <p className="text-xs text-dark-400 mb-1">Avg Playtime</p>
              <p className="text-xl font-bold text-primary-400">
                {game.avgPlaytime}h
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button className="btn-primary flex-1">
              <PlayIcon className="w-5 h-5" />
              Play Now
            </button>
            <button className="btn-secondary flex-1">
              <HeartIcon className="w-5 h-5" />
              Add to Wishlist
            </button>
          </div>

          <p className="text-xs text-dark-500 mt-4">
            Released: {new Date(game.releaseDate).toLocaleDateString()}
          </p>
        </div>
      </div>
    </Modal>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
    </svg>
  );
}

function HeartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  );
}
