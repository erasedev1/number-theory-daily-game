import { Modal } from './Modal';
import type { Settings, ThemePref } from '../game/storage';

const THEMES: Array<[ThemePref, string]> = [
  ['system', 'System'],
  ['light', 'Light'],
  ['dark', 'Dark'],
];

export function SettingsModal({ settings, onChange, onClose }: { settings: Settings; onChange: (p: Partial<Settings>) => void; onClose: () => void }) {
  return (
    <Modal title="Settings" onClose={onClose}>
      <div className="space-y-5">
        <div>
          <div className="mb-2 text-sm font-semibold">Theme</div>
          <div className="grid grid-cols-3 gap-1 rounded-xl bg-surface p-1" role="radiogroup" aria-label="Theme">
            {THEMES.map(([value, label]) => (
              <button
                key={value}
                role="radio"
                aria-checked={settings.theme === value}
                onClick={() => onChange({ theme: value })}
                className={`rounded-lg py-2 text-sm font-semibold transition ${settings.theme === value ? 'bg-bg shadow-sm' : 'text-muted hover:text-ink'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <label className="flex cursor-pointer items-center justify-between gap-4">
          <span>
            <span className="block text-sm font-semibold">Color-blind friendly</span>
            <span className="block text-xs text-muted">Use blue instead of green for satisfied clues.</span>
          </span>
          <input type="checkbox" className="h-5 w-5 accent-[rgb(var(--good))]" checked={settings.colorblind} onChange={(e) => onChange({ colorblind: e.target.checked })} />
        </label>
        <div className="border-t border-line pt-4 text-xs text-muted">
          A new puzzle appears every day at midnight Eastern Time (America/New_York), the same for everyone. Progress and statistics are stored only in this browser.
        </div>
      </div>
    </Modal>
  );
}
