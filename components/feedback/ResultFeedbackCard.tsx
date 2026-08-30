import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Button,
  Card,
  Dialog,
  Divider,
  IconButton,
  Portal,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';
import { ThumbsUp, ThumbsDown } from 'lucide-react-native';
import { useResultFeedback } from '@/hooks/useWorkoutFeedback';

type ResultFeedbackCardProps = {
  workoutResultId: string;
  resultOwnerId: string;
  currentUserId: string;
  gymId?: string;
  showCoachFeedback?: boolean;
  compact?: boolean;
};

export function ResultFeedbackCard({
  workoutResultId,
  resultOwnerId,
  currentUserId,
  gymId,
  showCoachFeedback = false,
  compact = false,
}: ResultFeedbackCardProps) {
  const theme = useTheme();
  const {
    selfAssessment,
    coachFeedback,
    userFeedback,
    loading,
    submitFeedback,
  } = useResultFeedback(workoutResultId, gymId);

  const [showNotesDialog, setShowNotesDialog] = useState(false);
  const [pendingRating, setPendingRating] = useState<'thumbs_up' | 'thumbs_down' | null>(
    null
  );
  const [notes, setNotes] = useState(userFeedback?.notes || '');

  const isOwnResult = currentUserId === resultOwnerId;
  const feedbackType = isOwnResult ? 'self_assessment' : 'coach_to_athlete';

  const handleFeedback = async (rating: 'thumbs_up' | 'thumbs_down') => {
    if (userFeedback?.rating === rating) {
      setPendingRating(rating);
      setNotes(userFeedback?.notes || '');
      setShowNotesDialog(true);
      return;
    }
    await submitFeedback(rating, notes, feedbackType);
  };

  const handleNotesSubmit = async () => {
    if (pendingRating) {
      await submitFeedback(pendingRating, notes, feedbackType);
    }
    setShowNotesDialog(false);
  };

  const openNotesDialog = (rating: 'thumbs_up' | 'thumbs_down') => {
    setPendingRating(rating);
    setNotes(userFeedback?.notes || '');
    setShowNotesDialog(true);
  };

  // Compact mode - just buttons inline
  if (compact) {
    return (
      <>
        <View style={styles.compactContainer}>
          <Text variant="labelSmall" style={styles.compactLabel}>
            {isOwnResult ? 'How did it go?' : 'Feedback:'}
          </Text>
          <IconButton
            icon={() => (
              <ThumbsUp
                size={16}
                color={
                  userFeedback?.rating === 'thumbs_up'
                    ? theme.colors.primary
                    : theme.colors.onSurfaceVariant
                }
                fill={userFeedback?.rating === 'thumbs_up' ? theme.colors.primary : 'none'}
              />
            )}
            size={28}
            onPress={() => handleFeedback('thumbs_up')}
            onLongPress={() => openNotesDialog('thumbs_up')}
            style={[
              styles.compactButton,
              userFeedback?.rating === 'thumbs_up' && {
                backgroundColor: `${theme.colors.primary}20`,
              },
            ]}
          />
          <IconButton
            icon={() => (
              <ThumbsDown
                size={16}
                color={
                  userFeedback?.rating === 'thumbs_down'
                    ? theme.colors.error
                    : theme.colors.onSurfaceVariant
                }
                fill={
                  userFeedback?.rating === 'thumbs_down' ? theme.colors.error : 'none'
                }
              />
            )}
            size={28}
            onPress={() => handleFeedback('thumbs_down')}
            onLongPress={() => openNotesDialog('thumbs_down')}
            style={[
              styles.compactButton,
              userFeedback?.rating === 'thumbs_down' && {
                backgroundColor: `${theme.colors.error}20`,
              },
            ]}
          />
        </View>

        <NotesDialog
          visible={showNotesDialog}
          onDismiss={() => setShowNotesDialog(false)}
          rating={pendingRating}
          notes={notes}
          setNotes={setNotes}
          onSubmit={handleNotesSubmit}
          loading={loading}
          isOwnResult={isOwnResult}
          theme={theme}
        />
      </>
    );
  }

  // Full card mode
  return (
    <>
      <Card style={styles.card} mode="outlined">
        <Card.Title
          title={isOwnResult ? '🎯 Self Assessment' : '🏋️ Feedback'}
          titleVariant="titleSmall"
        />
        <Card.Content>
          {/* Existing feedback */}
          {userFeedback && (
            <View style={styles.existingFeedback}>
              <Text
                style={[
                  styles.feedbackEmoji,
                  {
                    color:
                      userFeedback.rating === 'thumbs_up'
                        ? theme.colors.primary
                        : theme.colors.error,
                  },
                ]}
              >
                {userFeedback.rating === 'thumbs_up' ? '👍' : '👎'}
              </Text>
              {userFeedback.notes && (
                <Text variant="bodySmall" style={styles.feedbackNotes}>
                  "{userFeedback.notes}"
                </Text>
              )}
            </View>
          )}

          {/* Feedback prompt and buttons */}
          <View style={styles.feedbackRow}>
            <Text variant="bodySmall" style={styles.prompt}>
              {userFeedback
                ? 'Change your rating:'
                : isOwnResult
                ? 'How did this workout go?'
                : 'How did this workout go?'}
            </Text>
            <View style={styles.buttons}>
              <IconButton
                icon={() => (
                  <ThumbsUp
                    size={20}
                    color={
                      userFeedback?.rating === 'thumbs_up'
                        ? theme.colors.primary
                        : theme.colors.onSurfaceVariant
                    }
                    fill={
                      userFeedback?.rating === 'thumbs_up' ? theme.colors.primary : 'none'
                    }
                  />
                )}
                size={36}
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
              <IconButton
                icon={() => (
                  <ThumbsDown
                    size={20}
                    color={
                      userFeedback?.rating === 'thumbs_down'
                        ? theme.colors.error
                        : theme.colors.onSurfaceVariant
                    }
                    fill={
                      userFeedback?.rating === 'thumbs_down' ? theme.colors.error : 'none'
                    }
                  />
                )}
                size={36}
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
          </View>

          {/* Coach feedback section (for athletes viewing own results) */}
          {isOwnResult && showCoachFeedback && coachFeedback.length > 0 && (
            <>
              <Divider style={styles.divider} />
              <Text variant="labelSmall" style={styles.coachTitle}>
                Coach Feedback
              </Text>
              {coachFeedback.map((fb) => (
                <View key={fb.id} style={styles.coachFeedbackItem}>
                  <Text
                    style={[
                      styles.feedbackEmoji,
                      {
                        color:
                          fb.rating === 'thumbs_up'
                            ? theme.colors.primary
                            : theme.colors.error,
                      },
                    ]}
                  >
                    {fb.rating === 'thumbs_up' ? '👍' : '👎'}
                  </Text>
                  <View style={styles.coachFeedbackText}>
                    {fb.from_user?.display_name && (
                      <Text variant="labelSmall" style={styles.coachName}>
                        {fb.from_user.display_name}:
                      </Text>
                    )}
                    {fb.notes && (
                      <Text variant="bodySmall" style={styles.coachNotes}>
                        {fb.notes}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </>
          )}
        </Card.Content>
      </Card>

      <NotesDialog
        visible={showNotesDialog}
        onDismiss={() => setShowNotesDialog(false)}
        rating={pendingRating}
        notes={notes}
        setNotes={setNotes}
        onSubmit={handleNotesSubmit}
        loading={loading}
        isOwnResult={isOwnResult}
        theme={theme}
      />
    </>
  );
}

// Notes Dialog Component
function NotesDialog({
  visible,
  onDismiss,
  rating,
  notes,
  setNotes,
  onSubmit,
  loading,
  isOwnResult,
  theme,
}: {
  visible: boolean;
  onDismiss: () => void;
  rating: 'thumbs_up' | 'thumbs_down' | null;
  notes: string;
  setNotes: (notes: string) => void;
  onSubmit: () => void;
  loading: boolean;
  isOwnResult: boolean;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Title>
          {rating === 'thumbs_up' ? '👍' : '👎'} Add Notes
        </Dialog.Title>
        <Dialog.Content>
          <Text variant="bodyMedium" style={styles.dialogText}>
            {isOwnResult
              ? rating === 'thumbs_up'
                ? 'What went well in this workout?'
                : 'What was challenging or could be improved?'
              : rating === 'thumbs_up'
              ? 'What went well in this workout?'
              : 'What could be improved in this workout?'}
          </Text>
          <TextInput
            mode="outlined"
            placeholder="Add optional notes..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            style={styles.input}
          />
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss}>Cancel</Button>
          <Button
            mode="contained"
            onPress={onSubmit}
            loading={loading}
            buttonColor={
              rating === 'thumbs_up' ? theme.colors.primary : theme.colors.error
            }
          >
            Submit
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
  },
  existingFeedback: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  feedbackEmoji: {
    fontSize: 20,
  },
  feedbackNotes: {
    flex: 1,
    fontStyle: 'italic',
    opacity: 0.8,
  },
  feedbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  prompt: {
    flex: 1,
    opacity: 0.7,
  },
  buttons: {
    flexDirection: 'row',
    gap: 4,
  },
  iconButton: {
    margin: 0,
  },
  divider: {
    marginVertical: 12,
  },
  coachTitle: {
    marginBottom: 8,
    opacity: 0.6,
  },
  coachFeedbackItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  coachFeedbackText: {
    flex: 1,
  },
  coachName: {
    fontWeight: '600',
  },
  coachNotes: {
    opacity: 0.8,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  compactLabel: {
    opacity: 0.6,
    marginRight: 4,
  },
  compactButton: {
    margin: 0,
  },
  dialogText: {
    marginBottom: 12,
    opacity: 0.7,
  },
  input: {
    marginTop: 8,
  },
});
