import { useState } from 'react';
import { submitProposal } from '../services/governanceService';
import { PROPOSAL_CATEGORIES, ProposalCategory } from '../types/governance';
import { useApp } from '../contexts/AppContext';

interface ProposalFormProps {
  onSubmitted: () => void;
}

export const ProposalForm = ({ onSubmitted }: ProposalFormProps) => {
  const { isAuthenticated } = useApp();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ProposalCategory>('feature');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const validate = (): boolean => {
    if (!title.trim()) {
      setError('Title is required');
      return false;
    }
    if (title.length > 100) {
      setError('Title must be 100 characters or less');
      return false;
    }
    if (!description.trim()) {
      setError('Description is required');
      return false;
    }
    if (description.length > 500) {
      setError('Description must be 500 characters or less');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validate()) return;

    setSubmitting(true);
    try {
      await submitProposal(title.trim(), description.trim(), category);
      setSuccess('Proposal submitted. It will appear once the transaction confirms.');
      setTitle('');
      setDescription('');
      setCategory('feature');
      onSubmitted();
    } catch (err: any) {
      setError(err.message || 'Failed to submit proposal');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="proposal-form-auth">
        <p>Connect your wallet to submit a proposal.</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="proposal-form"
      aria-label="Submit a governance proposal"
    >
      <h3>Submit a Proposal</h3>

      <div className="form-group">
        <label htmlFor="proposal-title">
          Title <span className="required" aria-label="required">*</span>
        </label>
        <input
          id="proposal-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={100}
          placeholder="Short summary of your proposal"
          disabled={submitting}
          aria-required="true"
        />
        <small className="help-text">{title.length}/100</small>
      </div>

      <div className="form-group">
        <label htmlFor="proposal-category">Category</label>
        <select
          id="proposal-category"
          value={category}
          onChange={(e) => setCategory(e.target.value as ProposalCategory)}
          disabled={submitting}
        >
          {PROPOSAL_CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="proposal-description">
          Description <span className="required" aria-label="required">*</span>
        </label>
        <textarea
          id="proposal-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={500}
          rows={5}
          placeholder="Explain the proposal, its motivation, and expected outcome"
          disabled={submitting}
          aria-required="true"
        />
        <small className="help-text">{description.length}/500</small>
      </div>

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}
      {success && (
        <div className="success-message" role="status">
          {success}
        </div>
      )}

      <button type="submit" disabled={submitting} aria-busy={submitting}>
        {submitting ? 'Submitting...' : 'Submit Proposal'}
      </button>
    </form>
  );
};
