import type { GtkButton } from '../components/gtk-button';

/**
 * Enable or disable all gtk-button elements within the #output-actions container.
 */
export function enableDisableOutputButtons(disabled: boolean): void {
  console.log(`Setting output buttons disabled=${disabled}`);
  const outputActions = document.getElementById('output-actions');
  console.log('Output actions:', outputActions);
  const buttons = outputActions!.querySelectorAll(
    'gtk-button'
  ) as NodeListOf<GtkButton>;
  buttons.forEach((button) => {
    button.disabled = disabled;
    console.log(`Disabled button:`, button);
  });
}
