import { LitElement, html, css, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';

export type SelectItem =
  | string
  | { value: string; label?: string; disabled?: boolean };

export interface SelectGroup {
  group: string;
  options: SelectItem[];
}

@customElement('gtk-select')
export class GtkSelect extends LitElement {
  @property({ attribute: false }) items: Array<SelectItem | SelectGroup> = [];
  @property({ type: String }) value = '';
  @property({ type: String }) placeholder = '';
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: Boolean }) required = false;
  // Style variants
  @property({ type: Boolean, reflect: true }) flat = false;
  @property({ type: Boolean, reflect: true }) inline = false;

  static styles = css`
    :host {
      display: inline-block;
      width: 100%;
    }

    :host([disabled]) {
      pointer-events: none;
    }

    .select-wrapper {
      position: relative;
      display: inline-flex;
      align-items: center;
      width: 100%;
    }

    select {
      font-family: inherit;
      font-size: 15px;
      font-weight: 500;
      min-height: 34px;
      width: 100%;
      padding: 6px 32px 6px 12px;
      border-radius: 6px;
      border: none;
      cursor: pointer;
      appearance: none;
      -webkit-appearance: none;
      -moz-appearance: none;

      /* GTK4 Adwaita style background */
      background-color: color-mix(in srgb, currentColor 10%, transparent);
      color: rgba(0, 0, 0, 0.8);

      /* Smooth transitions */
      transition:
        background-color 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94),
        box-shadow 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94),
        outline 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }

    select:hover:not(:disabled) {
      background-color: color-mix(in srgb, currentColor 15%, transparent);
    }

    select:active:not(:disabled) {
      background-color: color-mix(in srgb, currentColor 25%, transparent);
    }

    select:focus-visible {
      outline: 2px solid #3584e4;
      outline-offset: 2px;
    }

    select:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Custom dropdown arrow */
    .arrow {
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      pointer-events: none;
      width: 12px;
      height: 12px;
      color: currentColor;
      opacity: 0.7;
    }

    .arrow svg {
      width: 100%;
      height: 100%;
      fill: currentColor;
    }

    /* Flat style */
    :host([flat]) select {
      background: transparent;
    }

    :host([flat]) select:hover:not(:disabled) {
      background-color: color-mix(in srgb, currentColor 7%, transparent);
    }

    :host([flat]) select:active:not(:disabled) {
      background-color: color-mix(in srgb, currentColor 16%, transparent);
    }

    /* Inline style - for embedding in cards */
    :host([inline]) select {
      background-color: transparent;
      border-radius: 4px;
    }

    :host([inline]) select:hover:not(:disabled) {
      background-color: color-mix(in srgb, currentColor 5%, transparent);
    }

    :host([inline]) select:focus-visible {
      background-color: color-mix(in srgb, currentColor 3%, transparent);
    }

    /* Option styles */
    option {
      background-color: var(--popover-bg, #ffffff);
      color: var(--popover-fg, rgba(0, 0, 0, 0.8));
      padding: 8px 12px;
    }

    option:disabled {
      color: rgba(0, 0, 0, 0.4);
    }

    option:checked {
      background-color: #3584e4;
      color: #ffffff;
    }

    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      select {
        background-color: color-mix(in srgb, currentColor 12%, transparent);
        color: rgba(255, 255, 255, 0.9);
      }

      select:hover:not(:disabled) {
        background-color: color-mix(in srgb, currentColor 18%, transparent);
      }

      select:active:not(:disabled) {
        background-color: color-mix(in srgb, currentColor 25%, transparent);
      }

      select:focus-visible {
        outline-color: #78aeed;
      }

      option {
        --popover-bg: #303030;
        --popover-fg: rgba(255, 255, 255, 0.9);
        background-color: var(--popover-bg);
        color: var(--popover-fg);
      }

      option:disabled {
        color: rgba(255, 255, 255, 0.4);
      }

      option:checked {
        background-color: #3584e4;
        color: #ffffff;
      }
    }
  `;

  render(): TemplateResult {
    return html`
      <div class="select-wrapper">
        <select
          .value=${this.value}
          ?disabled=${this.disabled}
          ?required=${this.required}
          @change=${this._handleChange}
          @input=${this._handleInput}
        >
          ${this.placeholder
            ? html`
                <option value="" disabled ?selected=${!this.value}>
                  ${this.placeholder}
                </option>
              `
            : ''}
          ${this.items && this.items.length > 0
            ? this.items.map((item) => this._renderItem(item))
            : html`<slot></slot>`}
        </select>
        <span class="arrow">
          <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M4.5 6L8 9.5L11.5 6"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              fill="none"
            />
          </svg>
        </span>
      </div>
    `;
  }

  private _renderItem(item: SelectItem | SelectGroup): TemplateResult {
    // Support both object format {value, label, disabled} and string format
    if (typeof item === 'string') {
      return html`
        <option value=${item} ?selected=${this.value === item}>${item}</option>
      `;
    }

    // Support grouped options
    if ('group' in item && 'options' in item) {
      return html`
        <optgroup label=${item.group}>
          ${item.options.map((opt) => this._renderItem(opt))}
        </optgroup>
      `;
    }

    const objItem = item as {
      value: string;
      label?: string;
      disabled?: boolean;
    };
    return html`
      <option
        value=${objItem.value}
        ?disabled=${objItem.disabled}
        ?selected=${this.value === objItem.value}
      >
        ${objItem.label || objItem.value}
      </option>
    `;
  }

  private _handleChange(e: Event): void {
    const target = e.target as HTMLSelectElement;
    this.value = target.value;
    this.dispatchEvent(
      new CustomEvent('change', {
        detail: {
          value: this.value,
          selectedIndex: target.selectedIndex,
          selectedItem: this.items?.[target.selectedIndex] || this.value,
        },
        bubbles: true,
        composed: true,
      })
    );
  }

  private _handleInput(e: Event): void {
    const target = e.target as HTMLSelectElement;
    this.dispatchEvent(
      new CustomEvent('input', {
        detail: { value: target.value },
        bubbles: true,
        composed: true,
      })
    );
  }

  focus(): void {
    this.shadowRoot!.querySelector('select')?.focus();
  }

  blur(): void {
    this.shadowRoot!.querySelector('select')?.blur();
  }

  // Get the currently selected item object
  getSelectedItem(): SelectItem | SelectGroup | null {
    const select = this.shadowRoot!.querySelector('select');
    if (!select || !this.items?.length) return null;
    return this.items[select.selectedIndex] || null;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gtk-select': GtkSelect;
  }
}
