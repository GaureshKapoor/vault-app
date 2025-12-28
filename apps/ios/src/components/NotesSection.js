import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { supabase } from '../../shared';

export default function NotesSection({ ideaId }) {
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');

  const fetchNotes = async () => {
    const { data, error } = await supabase
      .from('idea_notes')
      .select('id, content, created_at')
      .eq('idea_id', ideaId)
      .order('created_at', { ascending: false });
    if (!error) {
      setNotes(data || []);
    }
  };

  useEffect(() => {
    if (ideaId) fetchNotes();
  }, [ideaId]);

  const addNote = async () => {
    if (!newNote.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from('idea_notes')
      .insert({ idea_id: ideaId, user_id: user.id, content: newNote.trim() })
      .select()
      .single();
    if (error) {
      Alert.alert('Failed to add note', error.message);
    } else {
      setNotes((prev) => [data, ...prev]);
      setNewNote('');
    }
  };

  return (
    <View style={{ gap: 12 }}>
      <View style={{ borderRadius: 16, borderWidth: 1, borderColor: '#27272a', padding: 12 }}>
        <Text style={{ color: '#fff', fontWeight: '600', marginBottom: 8 }}>Notes</Text>
        <TextInput
          placeholder="Add a note..."
          placeholderTextColor="#71717a"
          value={newNote}
          onChangeText={setNewNote}
          multiline
          style={{ minHeight: 60, color: '#fff' }}
        />
        {newNote.trim() && (
          <Pressable onPress={addNote} style={({ pressed }) => ({ alignSelf: 'flex-end', padding: 10, borderRadius: 10, backgroundColor: pressed ? '#1e1b4b' : '#1d1b25' })}>
            <Text style={{ color: '#a78bfa', fontWeight: '600' }}>Add note</Text>
          </Pressable>
        )}
      </View>
      {notes.map((note) => (
        <View key={note.id} style={{ borderRadius: 16, borderWidth: 1, borderColor: '#27272a', padding: 12 }}>
          <Text style={{ color: '#ddd' }}>{note.content}</Text>
          <Text style={{ color: '#71717a', fontSize: 12, marginTop: 6 }}>{new Date(note.created_at).toLocaleString()}</Text>
        </View>
      ))}
    </View>
  );
}
