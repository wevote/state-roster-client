import { lazy, Suspense, useSyncExternalStore } from 'react';
import { renderLog } from '../../common/utils/logging';
// Type-only, so the dialogs stay out of the main bundle.
import type { RulesetPreset } from '../Rulesets/RulesetDialog';
import type { StartRunPreset } from '../StartRun/StartRunDialog';

// Every modal in the console, and the small store of show flags that open them, like WebApp's HeaderBarModals
// and AppObservableStore. The setShow functions work from anywhere, not only components.

const FindRulesetDialog = lazy(() => import('../Rulesets/FindRulesetDialog'));
const RulesetDialog = lazy(() => import('../Rulesets/RulesetDialog'));
const StartRunDialog = lazy(() => import('../StartRun/StartRunDialog'));


interface ModalsState {
  showStartRunModal: boolean;
  startRunPreset: StartRunPreset;
  showFindRulesetModal: boolean;
  showRulesetModal: boolean;
  rulesetPreset: RulesetPreset;
}

let state: ModalsState = {
  showStartRunModal: false,
  startRunPreset: {},
  showFindRulesetModal: false,
  showRulesetModal: false,
  rulesetPreset: {},
};
const listeners = new Set<() => void>();

// A new object each time, so React sees the change.
function update (changes: Partial<ModalsState>) {
  state = { ...state, ...changes };
  listeners.forEach((listener) => listener());
}

function subscribe (listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function setShowStartRunModal (show: boolean, preset: StartRunPreset = {}) {
  update({ showStartRunModal: show, startRunPreset: preset });
}

export function setShowFindRulesetModal (show: boolean) {
  update({ showFindRulesetModal: show });
}

export function setShowRulesetModal (show: boolean, preset: RulesetPreset = {}) {
  update({ showRulesetModal: show, rulesetPreset: preset });
}

/** Renders every modal whose flag is on. Each one's code is only downloaded the first time it opens. */
export default function AppModals () {
  renderLog('AppModals');
  const modals = useSyncExternalStore(subscribe, () => state);

  return (
    <Suspense fallback={null}>
      {modals.showStartRunModal && <StartRunDialog preset={modals.startRunPreset} onClose={() => setShowStartRunModal(false)} />}
      {modals.showFindRulesetModal && (
        <FindRulesetDialog
          onFound={(rulesetId) => { setShowFindRulesetModal(false); setShowRulesetModal(true, { rulesetId }); }}
          onClose={() => setShowFindRulesetModal(false)}
        />
      )}
      {modals.showRulesetModal && (
        <RulesetDialog preset={modals.rulesetPreset} onClose={() => setShowRulesetModal(false)} />
      )}
    </Suspense>
  );
}
