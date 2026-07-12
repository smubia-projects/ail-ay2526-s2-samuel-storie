import { Link } from 'react-router-dom';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import StoryActions from './StoryActions';

export default function StorybookList({ storybooks, loading, onDelete }) {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!storybooks?.length) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4 font-display text-retro-brown">✦</div>
        <h3 className="text-xl font-display font-semibold text-retro-dark mb-2">No storybooks yet</h3>
        <p className="text-retro-brown mb-6 font-retro">Create your first magical storybook!</p>
        <Link to="/create">
          <Button>Create New Story</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {storybooks.map((book) => (
        <div key={book.id} className="bg-retro-paper border-3 border-retro-dark shadow-retro overflow-hidden hover:shadow-retro-lg hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all">
          <div className="h-40 bg-retro-sepia flex items-center justify-center relative border-b-3 border-retro-dark">
            {book.preview_image_url ? (
              <img 
                src={book.preview_image_url} 
                alt={book.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-5xl font-display text-retro-brown">✦</span>
            )}
          </div>
          <div className="p-4 bg-retro-paper">
            <h3 className="font-display font-bold text-lg text-retro-dark mb-1">{book.title}</h3>
            <p className="text-sm text-retro-brown mb-2 font-retro">for {book.child_name}</p>
            <div className="flex items-center gap-2 mb-4">
              <span className={`text-xs px-2 py-1 font-retro uppercase tracking-wide border-2 ${
                book.status === 'ready' 
                  ? 'bg-retro-green/20 text-retro-green border-retro-green' 
                  : book.status === 'generating'
                  ? 'bg-retro-gold/20 text-retro-gold border-retro-gold'
                  : 'bg-retro-red/20 text-retro-red border-retro-red'
              }`}>
                {book.status}
              </span>
              <span className="text-xs text-retro-brown font-retro">
                {new Date(book.created_at).toLocaleDateString()}
              </span>
            </div>
            <div className="flex gap-2">
              {book.status === 'ready' ? (
                <>
                  <Link to={`/story/${book.id}`} className="flex-1">
                    <Button variant="primary" size="sm" className="w-full">View</Button>
                  </Link>
                  <Link to={`/edit/${book.id}`} className="flex-1">
                    <Button variant="secondary" size="sm" className="w-full">Edit</Button>
                  </Link>
                  <Button 
                    variant="danger" 
                    size="sm"
                    onClick={() => onDelete(book.id)}
                  >
                    Delete
                  </Button>
                </>
              ) : book.status === 'generating' ? (
                <>
                  <Link to={`/edit/${book.id}`} className="flex-1">
                    <Button variant="secondary" size="sm" className="w-full">View Progress</Button>
                  </Link>
                  <Button 
                    variant="danger" 
                    size="sm"
                    onClick={() => onDelete(book.id)}
                  >
                    Delete
                  </Button>
                </>
              ) : (
                <Button 
                  variant="danger" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => onDelete(book.id)}
                >
                  Delete
                </Button>
              )}
            </div>
            {book.status === 'ready' && (
              <div className="mt-3 pt-3 border-t-2 border-retro-sepia">
                <StoryActions storybook={book} compact />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
