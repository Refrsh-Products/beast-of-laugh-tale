import { useState } from 'react';
import { View } from 'react-native';
import {
  OTHER_UNIVERSITY,
  PHONE_PURPOSE_HELP,
  UNIVERSITY_OPTIONS,
  YEAR_OF_STUDY_OPTIONS,
  type YearOfStudy,
} from '@freshr/shared';
import { Button } from '@/components/ui/button';
import { ButtonSpinner } from '@/components/ui/button-spinner';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Text } from '@/components/ui/text';

export interface ProfileValues {
  firstName: string;
  lastName: string;
  phone: string;
  university: string;
  yearOfStudy: YearOfStudy | '';
}

/**
 * Step 2 — the only step that collects anything. Deliberately one screen: at
 * five fields, paginating would add friction and buy nothing.
 */
export function ProfileStep({
  initialFirstName,
  initialLastName,
  saving,
  error,
  onSubmit,
}: {
  initialFirstName: string;
  initialLastName: string;
  saving: boolean;
  error: string;
  onSubmit: (values: ProfileValues) => void;
}) {
  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [phone, setPhone] = useState('');
  const [universityChoice, setUniversityChoice] = useState('');
  const [universityOther, setUniversityOther] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState<YearOfStudy | ''>('');
  const [showErrors, setShowErrors] = useState(false);

  const missing = {
    firstName: !firstName.trim(),
    lastName: !lastName.trim(),
    phone: !phone.trim(),
  };

  // One value goes to the server whether it came from the list or the "Other"
  // box. Blank is fine — university is optional.
  const university =
    universityChoice === OTHER_UNIVERSITY ? universityOther.trim() : universityChoice;

  const handleSubmit = () => {
    if (Object.values(missing).some(Boolean)) {
      setShowErrors(true);
      return;
    }
    setShowErrors(false);
    onSubmit({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      university,
      yearOfStudy,
    });
  };

  const shownError = error || (showErrors ? 'Please fill in all required fields.' : '');

  return (
    <View>
      <Text className="mb-2 text-3xl font-bold">A bit about you</Text>
      <Text className="mb-8 text-base text-muted-foreground">
        This is how we&apos;ll address you around the app.
      </Text>

      {shownError ? <Text className="mb-5 text-sm text-destructive">{shownError}</Text> : null}

      <View className="gap-5">
        <View className="flex-row gap-3">
          <View className="flex-1 gap-1.5">
            <Text className="text-xs font-semibold text-muted-foreground">FIRST NAME *</Text>
            <Input
              className="h-14 rounded-xl"
              placeholder="Jane"
              value={firstName}
              onChangeText={setFirstName}
              aria-invalid={showErrors && missing.firstName}
              editable={!saving}
            />
          </View>
          <View className="flex-1 gap-1.5">
            <Text className="text-xs font-semibold text-muted-foreground">LAST NAME *</Text>
            <Input
              className="h-14 rounded-xl"
              placeholder="Smith"
              value={lastName}
              onChangeText={setLastName}
              aria-invalid={showErrors && missing.lastName}
              editable={!saving}
            />
          </View>
        </View>

        <View className="gap-1.5">
          <Text className="text-xs font-semibold text-muted-foreground">PHONE NUMBER *</Text>
          <Input
            className="h-14 rounded-xl"
            placeholder="+1 (555) 000-0000"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={(t) => setPhone(t.replace(/[^\d+\-\s().]/g, ''))}
            aria-invalid={showErrors && missing.phone}
            editable={!saving}
          />
          <Text className="text-xs text-muted-foreground">{PHONE_PURPOSE_HELP}</Text>
        </View>

        <SearchableSelect
          label="UNIVERSITY (OPTIONAL)"
          value={universityChoice}
          onChange={setUniversityChoice}
          options={UNIVERSITY_OPTIONS}
          pinnedOption={{ value: OTHER_UNIVERSITY, label: 'Other — type it in' }}
          placeholder="Select your university"
          searchPlaceholder="Search universities…"
          sheetTitle="Your university"
          emptyMessage={'No matches — choose "Other" below.'}
          disabled={saving}
        />

        {universityChoice === OTHER_UNIVERSITY && (
          <View className="gap-1.5">
            <Text className="text-xs font-semibold text-muted-foreground">UNIVERSITY NAME</Text>
            <Input
              className="h-14 rounded-xl"
              placeholder="Type your university"
              value={universityOther}
              onChangeText={setUniversityOther}
              editable={!saving}
            />
          </View>
        )}

        {/* Also a sheet rather than an inline dropdown: this is the last field
            before the button, so an inline panel would open against the bottom
            of the ScrollView and clip. */}
        <SearchableSelect
          label="YEAR OF STUDY (OPTIONAL)"
          value={yearOfStudy}
          onChange={(v) => setYearOfStudy(v as YearOfStudy)}
          options={YEAR_OF_STUDY_OPTIONS}
          searchable={false}
          sheetHeight={420}
          placeholder="Select your year"
          sheetTitle="Year of study"
          disabled={saving}
        />

        <Button className="mt-2 h-14 rounded-xl" onPress={handleSubmit} disabled={saving}>
          {saving ? <ButtonSpinner /> : <Text className="text-base font-semibold">Continue</Text>}
        </Button>
      </View>
    </View>
  );
}
