import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { CalendarDays } from 'lucide-react-native';
import { useState } from 'react';
import { Platform, Text, TouchableOpacity, View } from 'react-native';

type DateTimeFieldProps = {
  /** ISO string or empty. */
  value: string;
  onChange: (iso: string) => void;
};

/**
 * Cross-platform date + time picker. On iOS it shows an inline spinner; on
 * Android it chains the native date picker into the time picker.
 */
export function DateTimeField({ value, onChange }: DateTimeFieldProps) {
  const [show, setShow] = useState(false);
  const [androidMode, setAndroidMode] = useState<'date' | 'time'>('date');
  const current = value ? new Date(value) : new Date();

  const handleChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      if (event.type === 'dismissed') {
        setShow(false);
        return;
      }
      if (androidMode === 'date' && selected) {
        // Keep the date, then ask for the time.
        const base = value ? new Date(value) : new Date();
        base.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
        onChange(base.toISOString());
        setAndroidMode('time');
        return;
      }
      if (androidMode === 'time' && selected) {
        const base = value ? new Date(value) : new Date();
        base.setHours(selected.getHours(), selected.getMinutes());
        onChange(base.toISOString());
      }
      setShow(false);
      setAndroidMode('date');
      return;
    }
    if (selected) onChange(selected.toISOString());
  };

  return (
    <View>
      <TouchableOpacity
        onPress={() => setShow((s) => !s)}
        activeOpacity={0.85}
        className="flex-row items-center justify-between rounded-xl border border-white/20 bg-white/10 px-4 py-3"
      >
        <Text className={value ? 'text-white' : 'text-white/40'}>
          {value ? format(new Date(value), "EEE, MMM d, yyyy 'at' h:mm a") : 'Select date & time'}
        </Text>
        <CalendarDays color="rgba(255,255,255,0.6)" size={18} />
      </TouchableOpacity>

      {show && Platform.OS === 'ios' && (
        <View className="mt-2 items-center rounded-xl border border-white/15 bg-white/10 py-2">
          <DateTimePicker
            value={current}
            mode="datetime"
            display="spinner"
            themeVariant="dark"
            minimumDate={new Date()}
            onChange={handleChange}
          />
          <TouchableOpacity
            onPress={() => setShow(false)}
            className="mt-1 rounded-lg bg-white/15 px-6 py-2"
          >
            <Text className="font-medium text-white">Done</Text>
          </TouchableOpacity>
        </View>
      )}

      {show && Platform.OS === 'android' && (
        <DateTimePicker
          value={current}
          mode={androidMode}
          display="default"
          minimumDate={androidMode === 'date' ? new Date() : undefined}
          onChange={handleChange}
        />
      )}
    </View>
  );
}
