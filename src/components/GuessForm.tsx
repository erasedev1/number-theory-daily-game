import { useRef, useState, type FormEvent } from 'react';
import { ArrowRight } from 'lucide-react';

interface Props {
  max: number;
  /** Returns an error message, or null on success. */
  onSubmit: (raw: string) => string | null;
}

export function GuessForm({ max, onSubmit }: Props) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [shakeKey, setShakeKey] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const err = onSubmit(value);
    if (err) {
      setError(err);
      setShakeKey((k) => k + 1);
    } else {
      setError(null);
      setValue('');
    }
    inputRef.current?.focus();
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-2">
      <div key={shakeKey} className={`flex gap-2 ${error ? 'anim-shake' : ''}`}>
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError(null);
          }}
          inputMode="numeric"
          autoComplete="off"
          autoFocus
          enterKeyHint="go"
          aria-label="Your guess"
          aria-invalid={!!error}
          aria-describedby="guess-help"
          placeholder={`1 – ${max.toLocaleString('en-US')}`}
          className={`num min-w-0 flex-1 rounded-xl border-2 bg-bg px-4 py-3 text-xl font-semibold outline-none transition placeholder:font-normal placeholder:text-muted/60 focus:border-ink ${
            error ? 'border-bad' : 'border-line'
          }`}
        />
        <button type="submit" className="btn bg-ink text-bg hover:opacity-90">
          Submit <ArrowRight size={18} />
        </button>
      </div>
      <p id="guess-help" role={error ? 'alert' : undefined} className={`min-h-5 text-sm ${error ? 'text-bad' : 'text-muted'}`}>
        {error ?? `Today's number is a whole number from 1 to ${max.toLocaleString('en-US')}.`}
      </p>
    </form>
  );
}
