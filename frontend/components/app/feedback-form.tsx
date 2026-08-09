'use client';

import React, { useState } from 'react';
import { Star, Send, Check } from 'lucide-react';
import { toast } from 'sonner';

interface FeedbackFormProps {
  sessionId?: string;
  onSubmitted?: () => void;
}

export function FeedbackForm({ sessionId, onSubmitted }: FeedbackFormProps) {
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) {
      toast.error('Please select a star rating (1-5)');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionId || 'general_session',
          rating,
          feedbackText: comment,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
        toast.success('Feedback saved to SQLite database!');
        if (onSubmitted) onSubmitted();
      } else {
        toast.error(data.error || 'Failed to submit feedback');
      }
    } catch (err) {
      console.error('Error submitting feedback:', err);
      toast.error('Failed to connect to server');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
        <Check className="size-4 shrink-0 text-emerald-400" />
        <span>Thank you! Your feedback has been recorded in the database.</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
      <div className="text-xs font-semibold text-slate-200">
        Rate your AI Financial Assistant call
      </div>
      
      {/* Star Rating Picker */}
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            className="p-1 rounded hover:scale-110 transition-transform focus:outline-none"
          >
            <Star
              className={`size-5 transition-colors ${
                (hoverRating || rating) >= star
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-slate-600 hover:text-slate-400'
              }`}
            />
          </button>
        ))}
        <span className="text-xs text-slate-400 ml-2 font-medium">
          {rating ? `${rating} / 5 stars` : 'Select rating'}
        </span>
      </div>

      {/* Optional feedback text */}
      <input
        type="text"
        placeholder="How helpful was the safety advice? (Optional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="w-full text-xs bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
      />

      <button
        type="submit"
        disabled={submitting || !rating}
        className="flex items-center justify-center gap-2 w-full text-xs font-semibold py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white transition-all shadow-md"
      >
        <Send className="size-3.5" />
        {submitting ? 'Saving to Database...' : 'Submit Rating to Database'}
      </button>
    </form>
  );
}
