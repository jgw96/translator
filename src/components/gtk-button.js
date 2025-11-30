import { LitElement, html, css } from 'lit';

export class GtkButton extends LitElement {
  static properties = {
    disabled: { type: Boolean, reflect: true },
    loading: { type: Boolean, reflect: true },
    type: { type: String },
    // Style variants
    suggested: { type: Boolean, reflect: true },
    destructive: { type: Boolean, reflect: true },
    flat: { type: Boolean, reflect: true },
    circular: { type: Boolean, reflect: true },
    pill: { type: Boolean, reflect: true },
    raised: { type: Boolean, reflect: true },
    // Icon support
    iconOnly: { type: Boolean, reflect: true, attribute: 'icon-only' },
  };

  static styles = css`
    :host {
      display: inline-block;
    }

    :host([disabled]) {
      pointer-events: none;
    }

    button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      font-family: inherit;
      font-size: 15px;
      font-weight: 500;
      min-height: 34px;
      min-width: 34px;
      padding: 6px 12px;
      border-radius: 6px;
      border: none;
      cursor: pointer;

      /* GTK4 uses color-mix with currentColor for subtle tinting */
      background-color: color-mix(in srgb, currentColor 10%, transparent);
      color: rgba(0, 0, 0, 0.8);

      /* Smooth transitions */
      transition:
        background-color 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94),
        box-shadow 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94),
        opacity 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }

    button:hover:not(:disabled) {
      background-color: color-mix(in srgb, currentColor 15%, transparent);
    }

    button:active:not(:disabled) {
      background-color: color-mix(in srgb, currentColor 30%, transparent);
    }

    button:focus-visible {
      outline: 2px solid #3584e4;
      outline-offset: 2px;
    }

    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Loading state */
    :host([loading]) button {
      cursor: wait;
      position: relative;
    }

    .spinner {
      display: none;
      width: 16px;
      height: 16px;
      border: 2px solid currentColor;
      border-right-color: transparent;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    :host([loading]) .spinner {
      display: block;
    }

    :host([loading]) .content {
      opacity: 0.6;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    /* Suggested action style (blue button) */
    :host([suggested]) button {
      background-color: #3584e4;
      color: #ffffff;
    }

    :host([suggested]) button:hover:not(:disabled) {
      background-color: #3987e5;
      background-image: linear-gradient(
        color-mix(in srgb, currentColor 10%, transparent),
        color-mix(in srgb, currentColor 10%, transparent)
      );
    }

    :host([suggested]) button:active:not(:disabled) {
      background-color: #1c71d8;
      background-image: linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2));
    }

    :host([suggested]) button:focus-visible {
      outline-color: #78aeed;
    }

    /* Destructive action style (red button) */
    :host([destructive]) button {
      background-color: #e01b24;
      color: #ffffff;
    }

    :host([destructive]) button:hover:not(:disabled) {
      background-color: #e41c26;
      background-image: linear-gradient(
        color-mix(in srgb, currentColor 10%, transparent),
        color-mix(in srgb, currentColor 10%, transparent)
      );
    }

    :host([destructive]) button:active:not(:disabled) {
      background-color: #c01c28;
      background-image: linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2));
    }

    :host([destructive]) button:focus-visible {
      outline-color: #ff7b63;
    }

    /* Flat button style */
    :host([flat]) button {
      background: transparent;
      box-shadow: none;
    }

    :host([flat]) button:hover:not(:disabled) {
      background-color: color-mix(in srgb, currentColor 7%, transparent);
    }

    :host([flat]) button:active:not(:disabled) {
      background-color: color-mix(in srgb, currentColor 16%, transparent);
    }

    /* Raised button style (for toolbars) */
    :host([raised]) button {
      background-color: color-mix(in srgb, currentColor 10%, transparent);
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }

    :host([raised]) button:hover:not(:disabled) {
      background-color: color-mix(in srgb, currentColor 15%, transparent);
    }

    :host([raised]) button:active:not(:disabled) {
      background-color: color-mix(in srgb, currentColor 25%, transparent);
      box-shadow: none;
    }

    /* Circular button style */
    :host([circular]) button {
      border-radius: 9999px;
      min-width: 34px;
      min-height: 34px;
      padding: 6px;
    }

    /* Pill button style */
    :host([pill]) button {
      border-radius: 9999px;
      padding: 10px 24px;
    }

    /* Icon only button */
    :host([icon-only]) button {
      padding: 6px;
    }

    /* Icon slot styles */
    ::slotted([slot='icon']) {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
    }

    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      button {
        background-color: color-mix(in srgb, currentColor 12%, transparent);
        color: rgba(255, 255, 255, 0.9);
      }

      button:hover:not(:disabled) {
        background-color: color-mix(in srgb, currentColor 18%, transparent);
      }

      button:active:not(:disabled) {
        background-color: color-mix(in srgb, currentColor 30%, transparent);
      }

      button:focus-visible {
        outline-color: #78aeed;
      }

      :host([suggested]) button {
        background-color: #3584e4;
        color: #ffffff;
      }

      :host([suggested]) button:hover:not(:disabled) {
        background-color: #4a90e8;
      }

      :host([suggested]) button:active:not(:disabled) {
        background-color: #2f7bdb;
      }

      :host([destructive]) button {
        background-color: #e01b24;
        color: #ffffff;
      }

      :host([destructive]) button:hover:not(:disabled) {
        background-color: #e63942;
      }

      :host([destructive]) button:active:not(:disabled) {
        background-color: #c01c28;
      }

      :host([raised]) button {
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
      }
    }
  `;

  constructor() {
    super();
    this.disabled = false;
    this.loading = false;
    this.type = 'button';
    this.suggested = false;
    this.destructive = false;
    this.flat = false;
    this.circular = false;
    this.pill = false;
    this.raised = false;
    this.iconOnly = false;
  }

  render() {
    return html`
      <button
        type=${this.type}
        ?disabled=${this.disabled || this.loading}
        @click=${this._handleClick}
        part="button"
      >
        ${this.loading ? html`<span class="spinner"></span>` : ''}
        <slot name="icon"></slot>
        <span class="content">
          <slot></slot>
        </span>
      </button>
    `;
  }

  _handleClick(e) {
    if (this.disabled || this.loading) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    this.dispatchEvent(
      new CustomEvent('gtk-click', {
        detail: { originalEvent: e },
        bubbles: true,
        composed: true,
      })
    );
  }

  focus() {
    this.shadowRoot.querySelector('button')?.focus();
  }

  blur() {
    this.shadowRoot.querySelector('button')?.blur();
  }
}

customElements.define('gtk-button', GtkButton);
