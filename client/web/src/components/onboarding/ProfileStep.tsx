import { useId, useState, type ReactNode } from "react";
import {
  OTHER_UNIVERSITY,
  PHONE_PURPOSE_HELP,
  UNIVERSITY_OPTIONS,
  YEAR_OF_STUDY_OPTIONS,
  type YearOfStudy,
} from "@freshr/shared";
import Combobox from "../ui/Combobox";
import Dropdown from "../ui/Dropdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * The label + required/optional marker around any control. Split out of `Field`
 * so the university combobox and the year-of-study select can share it — `Field`
 * renders its own <Input> and so can only ever wrap a text input.
 */
function FieldShell({
  label,
  required = false,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  htmlFor?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex-1">
      <Label
        htmlFor={htmlFor}
        className="text-muted-foreground mb-1.5 text-xs font-semibold tracking-[0.12em] uppercase"
      >
        {label}{" "}
        {required ? (
          <span className="text-destructive" aria-hidden="true">
            *
          </span>
        ) : (
          <span className="font-normal opacity-60">(optional)</span>
        )}
      </Label>
      {children}
      {hint && <p className="text-muted-foreground mt-1.5 text-xs">{hint}</p>}
    </div>
  );
}

/**
 * One labelled input. Required fields mark themselves with aria-invalid once
 * the form has been submitted empty, which drives both the red outline (via
 * the Input variant) and the announcement — the old version painted the
 * border directly and told assistive tech nothing.
 *
 * Deliberately `aria-required` rather than the native `required` attribute:
 * this form validates in JS so it can show one combined message and mark
 * every offending field at once. A native `required` would make the browser
 * block submission first with its own single-field tooltip, and handleSubmit
 * would never run.
 */
function Field({
  label,
  required = false,
  invalid = false,
  hint,
  ...props
}: {
  label: string;
  required?: boolean;
  invalid?: boolean;
  hint?: string;
} & React.ComponentProps<typeof Input>) {
  const id = useId();
  return (
    <FieldShell label={label} required={required} htmlFor={id} hint={hint}>
      <Input
        id={id}
        aria-required={required || undefined}
        aria-invalid={invalid}
        {...props}
      />
    </FieldShell>
  );
}

export interface ProfileValues {
  firstName: string;
  lastName: string;
  phone: string;
  university: string;
  yearOfStudy: YearOfStudy | "";
}

/**
 * Step 2 — the only step that collects anything. Deliberately one screen: at
 * five fields, paginating would add friction and buy nothing.
 */
export default function ProfileStep({
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
  const universityId = useId();
  const yearId = useId();

  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [phone, setPhone] = useState("");
  const [universityChoice, setUniversityChoice] = useState("");
  const [universityOther, setUniversityOther] = useState("");
  const [yearOfStudy, setYearOfStudy] = useState<YearOfStudy | "">("");
  const [showErrors, setShowErrors] = useState(false);

  // One value goes to the server whether it came from the list or the "Other"
  // box. Blank is fine — university is optional.
  const university =
    universityChoice === OTHER_UNIVERSITY
      ? universityOther.trim()
      : universityChoice;

  const missing = (value: string) => showErrors && !value.trim();

  function handleSubmit() {
    if (!firstName.trim() || !lastName.trim() || !phone.trim()) {
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
  }

  const validationError = showErrors ? "Please fill in all required fields." : "";
  const shownError = error || validationError;

  return (
    <div className="flex flex-col">
      <h1 className="font-heading text-foreground mb-2 text-2xl leading-tight font-bold tracking-tight">
        A bit about you
      </h1>
      <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
        This is how we'll address you around the app.
      </p>

      {shownError && (
        <p role="alert" className="text-destructive mb-5 text-sm">
          {shownError}
        </p>
      )}

      <form
        className="flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:gap-3">
          <Field
            label="First name"
            required
            invalid={missing(firstName)}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Jane"
            autoComplete="given-name"
            autoFocus
          />
          <Field
            label="Last name"
            required
            invalid={missing(lastName)}
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Smith"
            autoComplete="family-name"
          />
        </div>

        <Field
          label="Phone number"
          required
          invalid={missing(phone)}
          hint={PHONE_PURPOSE_HELP}
          type="tel"
          value={phone}
          onChange={(e) =>
            setPhone(e.target.value.replace(/[^\d+\-\s().]/g, ""))
          }
          placeholder="+1 (555) 000-0000"
          autoComplete="tel"
        />

        <FieldShell label="University" htmlFor={universityId}>
          <Combobox
            id={universityId}
            value={universityChoice}
            onChange={setUniversityChoice}
            options={UNIVERSITY_OPTIONS}
            pinnedOption={{
              value: OTHER_UNIVERSITY,
              label: "Other — type it in",
            }}
            placeholder="Search for your university"
            emptyMessage="No matches — choose Other below."
          />
        </FieldShell>

        {universityChoice === OTHER_UNIVERSITY && (
          <Field
            label="University name"
            value={universityOther}
            onChange={(e) => setUniversityOther(e.target.value)}
            placeholder="Type your university"
            autoFocus
          />
        )}

        <FieldShell label="Year of study" htmlFor={yearId}>
          <Dropdown
            id={yearId}
            value={yearOfStudy}
            onChange={(v) => setYearOfStudy(v as YearOfStudy)}
            placeholder="Select your year"
            options={YEAR_OF_STUDY_OPTIONS}
          />
        </FieldShell>

        <Button
          type="submit"
          size="lg"
          className="mt-2 w-full"
          disabled={saving}
        >
          {saving ? "Saving…" : "Continue"}
        </Button>
      </form>
    </div>
  );
}
