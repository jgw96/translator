import type { GtkTextarea } from '../components/gtk-textarea';
import type { GtkButton } from '../components/gtk-button';
import type { GtkSelect } from '../components/gtk-select';

export interface TranslationContext {
  outputTextarea: GtkTextarea;
  translateButton: GtkButton;
  sourceLanguageSelect: GtkSelect;
  targetLanguageSelect: GtkSelect;
  enableDisableOutputButtons: (disabled: boolean) => void;
}

export async function handleTranslation(
  text: string,
  ctx: TranslationContext
): Promise<void> {
  const { translateText } = await import('../translation-service.ts');

  const translationStream = await translateText(
    text,
    ctx.targetLanguageSelect.value
  );
  console.log(`Translation stream:`, translationStream);

  for await (const chunk of translationStream.stream) {
    console.log(chunk);
    ctx.outputTextarea.value += chunk;
  }

  ctx.translateButton.loading = false;

  translationStream.translator.destroy();

  ctx.enableDisableOutputButtons(false);

  const { storeTranslation } = await import('../storage-service.ts');

  storeTranslation(
    text,
    ctx.outputTextarea.value,
    ctx.sourceLanguageSelect.value,
    ctx.targetLanguageSelect.value
  );
}
