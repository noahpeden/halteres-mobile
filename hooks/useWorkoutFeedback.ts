import { useCallback, useEffect, useState } from 'react';
import { getAuthToken } from '@/lib/auth/token';
import { API_BASE } from '@/lib/api/getApiUrl';

type FeedbackRating = 'thumbs_up' | 'thumbs_down';

type TemplateFeedback = {
  id: string;
  workout_id: string;
  user_id: string;
  rating: FeedbackRating;
  notes: string | null;
  created_at: string;
};

type TemplateStats = {
  thumbs_up: number;
  thumbs_down: number;
  total: number;
  recent_notes?: string[];
};

type ResultFeedback = {
  id: string;
  workout_result_id: string;
  from_user_id: string;
  to_user_id: string;
  feedback_type: 'self_assessment' | 'coach_to_athlete';
  rating: FeedbackRating;
  notes: string | null;
  created_at: string;
  from_user?: {
    id: string;
    display_name: string | null;
    profile_photo_url: string | null;
  };
};

/**
 * Hook for managing template (workout design) feedback
 */
export function useTemplateFeedback(workoutId: string, gymId?: string) {
  const [userFeedback, setUserFeedback] = useState<TemplateFeedback | null>(null);
  const [stats, setStats] = useState<TemplateStats>({ thumbs_up: 0, thumbs_down: 0, total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFeedback = useCallback(async () => {
    if (!workoutId) return;

    try {
      const token = await getAuthToken();
      if (!token) return;

      const response = await fetch(
        `${API_BASE}/api/workout-feedback/template?workoutId=${workoutId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.userFeedback) {
        setUserFeedback(data.userFeedback);
      }
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Error fetching template feedback:', err);
    }
  }, [workoutId]);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  const submitFeedback = async (rating: FeedbackRating, notes?: string) => {
    setLoading(true);
    setError(null);

    try {
      const token = await getAuthToken();
      if (!token) {
        setError('Not authenticated');
        return { success: false, error: 'Not authenticated' };
      }

      const response = await fetch(`${API_BASE}/api/workout-feedback/template`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          workoutId,
          rating,
          notes: notes || null,
          gymId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setUserFeedback(data.feedback);
        setStats(data.stats);
        return { success: true };
      } else {
        setError(data.error || 'Failed to submit feedback');
        return { success: false, error: data.error };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit feedback';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const deleteFeedback = async () => {
    setLoading(true);
    try {
      const token = await getAuthToken();
      if (!token) return { success: false };

      const response = await fetch(
        `${API_BASE}/api/workout-feedback/template?workoutId=${workoutId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        setUserFeedback(null);
        await fetchFeedback(); // Refresh stats
        return { success: true };
      }
      return { success: false };
    } catch (err) {
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  return {
    userFeedback,
    stats,
    loading,
    error,
    submitFeedback,
    deleteFeedback,
    refetch: fetchFeedback,
  };
}

/**
 * Hook for managing result (performance) feedback
 */
export function useResultFeedback(workoutResultId: string, gymId?: string) {
  const [selfAssessment, setSelfAssessment] = useState<ResultFeedback | null>(null);
  const [coachFeedback, setCoachFeedback] = useState<ResultFeedback[]>([]);
  const [userFeedback, setUserFeedback] = useState<ResultFeedback | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFeedback = useCallback(async () => {
    if (!workoutResultId) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch(
        `${API_BASE}/api/workout-feedback/result?workoutResultId=${workoutResultId}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      const data = await response.json();

      if (data.selfAssessment) {
        setSelfAssessment(data.selfAssessment);
      }
      if (data.coachFeedback) {
        setCoachFeedback(data.coachFeedback);
      }
      if (data.userFeedback) {
        setUserFeedback(data.userFeedback);
      }
    } catch (err) {
      console.error('Error fetching result feedback:', err);
    }
  }, [workoutResultId]);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  const submitFeedback = async (
    rating: FeedbackRating,
    notes?: string,
    feedbackType?: 'self_assessment' | 'coach_to_athlete'
  ) => {
    setLoading(true);
    setError(null);

    try {
      const token = await getAuthToken();
      if (!token) {
        setError('Not authenticated');
        return { success: false, error: 'Not authenticated' };
      }

      const response = await fetch(`${API_BASE}/api/workout-feedback/result`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          workoutResultId,
          rating,
          notes: notes || null,
          gymId,
          feedbackType,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setUserFeedback(data.feedback);
        if (data.feedback.feedback_type === 'self_assessment') {
          setSelfAssessment(data.feedback);
        }
        return { success: true };
      } else {
        setError(data.error || 'Failed to submit feedback');
        return { success: false, error: data.error };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit feedback';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return {
    selfAssessment,
    coachFeedback,
    userFeedback,
    loading,
    error,
    submitFeedback,
    refetch: fetchFeedback,
  };
}
