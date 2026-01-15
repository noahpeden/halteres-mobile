import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Button,
  Dialog,
  IconButton,
  Portal,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';
import { ThumbsUp, ThumbsDown } from 'lucide-react-native';
import { useTemplateFeedback } from '@/hooks/useWorkoutFeedback';

type TemplateFeedbackButtonProps = {
  workoutId: string;
  gymId?: string;
  showStats?: boolean;
  size?: 'sm' | 'md' | 'lg';
};

export function TemplateFeedbackButton({
  workoutId,
  gymId,
  showStats = true,
  size = 'md',
}: TemplateFeedbackButtonProps) {
  const theme = useTheme();
  const { userFeedback, stats, loading, submitFeedback } = useTemplateFeedback(
    workoutId,
    gymId
  );

  const [showNotesDialog, setShowNotesDialog] = useState(false);
  const [pendingRating, setPendingRating] = useState<'thumbs_up' | 'thumbs_down' | null>(
    null
  );
  const [notes, setNotes] = useState(userFeedback?.notes || '');

  const iconSize = size === 'sm' ? 18 : size === 'md' ? 22 : 26;
  const buttonSize = size === 'sm' ? 32 : size === 'md' ? 40 : 48;

  const handleFeedback = async (rating: 'thumbs_up' | 'thumbs_down') => {
    // If clicking same rating, open notes dialog
    if (userFeedback?.rating === rating) {
      setPendingRating(rating);
      setNotes(userFeedback?.notes || '');
      setShowNotesDialog(true);
      return;
    }

    // Submit directly
    await submitFeedback(rating, notes);
  };

  const handleNotesSubmit = async () => {
    if (pendingRating) {
      await submitFeedback(pendingRating, notes);
    }
    setShowNotesDialog(false);
  };

  const openNotesDialog = (rating: 'thumbs_up' | 'thumbs_down') => {
    setPendingRating(rating);
    setNotes(userFeedback?.notes || '');
    setShowNotesDialog(true);
  };

  return (
    <>
      <View style={styles.container}>
        {/* Thumbs Up */}
        <IconButton
          icon={() => (
            <ThumbsUp
              size={iconSize}
              color={
                userFeedback?.rating === 'thumbs_up'
                  ? theme.colors.primary
                  : theme.colors.onSurfaceVariant
              }
              fill={userFeedback?.rating === 'thumbs_up' ? theme.colors.primary : 'none'}
            />
          )}
          size={buttonSize}
          onPress={() => handleFeedback('thumbs_up')}
          onLongPress={() => openNotesDialog('thumbs_up')}
          loading={loading}
          style={[
            styles.iconButton,
            userFeedback?.rating === 'thumbs_up' && {
              backgroundColor: `${theme.colors.primary}20`,
            },
          ]}
        />

        {/* Stats */}
        {showStats && stats.total > 0 && (
          <View style={styles.stats}>
            {stats.thumbs_up > 0 && (
              <Text style={[styles.statText, { color: theme.colors.primary }]}>
                {stats.thumbs_up}
              </Text>
            )}
            {stats.thumbs_up > 0 && stats.thumbs_down > 0 && (
              <Text style={styles.statDivider}>/</Text>
            )}
            {stats.thumbs_down > 0 && (
              <Text style={[styles.statText, { color: theme.colors.error }]}>
                {stats.thumbs_down}
              </Text>
            )}
          </View>
        )}

        {/* Thumbs Down */}
        <IconButton
          icon={() => (
            <ThumbsDown
              size={iconSize}
              color={
                userFeedback?.rating === 'thumbs_down'
                  ? theme.colors.error
                  : theme.colors.onSurfaceVariant
              }
              fill={userFeedback?.rating === 'thumbs_down' ? theme.colors.error : 'none'}
            />
          )}
          size={buttonSize}
          onPress={() => handleFeedback('thumbs_down')}
          onLongPress={() => openNotesDialog('thumbs_down')}
          loading={loading}
          style={[
            styles.iconButton,
            userFeedback?.rating === 'thumbs_down' && {
              backgroundColor: `${theme.colors.error}20`,
            },
          ]}
        />
      </View>

      {/* Notes Dialog */}
      <Portal>
        <Dialog visible={showNotesDialog} onDismiss={() => setShowNotesDialog(false)}>
          <Dialog.Title>
            {pendingRating === 'thumbs_up' ? '👍' : '👎'} Add Feedback Notes
          </Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={styles.dialogText}>
              Share why you{' '}
              {pendingRating === 'thumbs_up' ? 'liked' : "didn't like"} this workout.
            </Text>
            <TextInput
              mode="outlined"
              placeholder={
                pendingRating === 'thumbs_up'
                  ? 'What made this workout effective? (optional)'
                  : 'What could be improved? (optional)'
              }
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              style={styles.input}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowNotesDialog(false)}>Cancel</Button>
            <Button
              mode="contained"
              onPress={handleNotesSubmit}
              loading={loading}
              buttonColor={
                pendingRating === 'thumbs_up' ? theme.colors.primary : theme.colors.error
              }
            >
              Submit
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconButton: {
    margin: 0,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 40,
    justifyContent: 'center',
  },
  statText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statDivider: {
    fontSize: 12,
    marginHorizontal: 2,
    opacity: 0.5,
  },
  dialogText: {
    marginBottom: 12,
    opacity: 0.7,
  },
  input: {
    marginTop: 8,
  },
});
