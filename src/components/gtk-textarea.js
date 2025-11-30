import { LitElement, html, css } from 'lit';
import './gtk-speaker.js';

export class GtkTextarea extends LitElement {
  static properties = {
    value: { type: String },
    placeholder: { type: String },
    disabled: { type: Boolean, reflect: true },
    readonly: { type: Boolean, reflect: true },
    rows: { type: Number },
    maxlength: { type: Number },
    monospace: { type: Boolean, reflect: true },
    // Validation states
    error: { type: Boolean, reflect: true },
    warning: { type: Boolean, reflect: true },
    success: { type: Boolean, reflect: true },
    // TTS support
    speakable: { type: Boolean, reflect: true },
    voice: { type: String },
  };

  static styles = css`
    :host {
      display: block;
    }

    .textarea-wrapper {
      position: relative;
      display: flex;
      flex-direction: column;
    }

    .textarea-container {
      position: relative;
    }

    textarea {
      font-family: inherit;
      font-size: 15px;
      line-height: 1.5;
      min-height: 100px;
      padding: 12px;
      padding-right: 44px; /* Make room for the speaker button */
      border-radius: 12px;
      border: none;
      resize: vertical;
      width: 100%;
      box-sizing: border-box;

      /* GTK4 Adwaita view style background */
      background-color: color-mix(in srgb, currentColor 7%, transparent);
      color: rgba(0, 0, 0, 0.8);

      /* Smooth transitions for focus and hover states */
      transition:
        background-color 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94),
        box-shadow 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94),
        outline 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }

    .speaker-button {
      position: absolute;
      top: 8px;
      right: 8px;
      z-index: 1;
    }

    textarea::placeholder {
      color: rgba(0, 0, 0, 0.5);
    }

    textarea:hover:not(:disabled):not(:focus) {
      background-color: color-mix(in srgb, currentColor 10%, transparent);
    }

    textarea:focus {
      outline: none;
      background-color: color-mix(in srgb, currentColor 4%, transparent);
      box-shadow: inset 0 0 0 2px #3584e4;
    }

    textarea:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    textarea:read-only {
      background-color: transparent;
    }

    /* Monospace style for code/logs */
    :host([monospace]) textarea {
      font-family: monospace;
    }

    /* Error state - red accent */
    :host([error]) textarea {
      box-shadow: inset 0 0 0 2px #e01b24;
    }

    :host([error]) textarea:focus {
      box-shadow: inset 0 0 0 2px #c01c28;
    }

    /* Warning state - yellow/orange accent */
    :host([warning]) textarea {
      box-shadow: inset 0 0 0 2px #e5a50a;
    }

    :host([warning]) textarea:focus {
      box-shadow: inset 0 0 0 2px #c88800;
    }

    /* Success state - green accent */
    :host([success]) textarea {
      box-shadow: inset 0 0 0 2px #2ec27e;
    }

    :host([success]) textarea:focus {
      box-shadow: inset 0 0 0 2px #26a269;
    }

    /* Card style - can be combined with .inline for embedded appearance */
    :host([card]) textarea {
      background-color: #ffffff;
      box-shadow:
        0 0 0 1px rgba(0, 0, 0, 0.03),
        0 1px 3px 1px rgba(0, 0, 0, 0.07),
        0 2px 6px 2px rgba(0, 0, 0, 0.03);
    }

    :host([card]) textarea:focus {
      background-color: #ffffff;
      box-shadow:
        0 0 0 1px rgba(0, 0, 0, 0.03),
        0 1px 3px 1px rgba(0, 0, 0, 0.07),
        0 2px 6px 2px rgba(0, 0, 0, 0.03),
        inset 0 0 0 2px #3584e4;
    }

    /* Inline style - for embedding in cards */
    :host([inline]) textarea {
      background-color: transparent;
      border-radius: 6px;
    }

    :host([inline]) textarea:hover:not(:disabled):not(:focus) {
      background-color: color-mix(in srgb, currentColor 5%, transparent);
    }

    :host([inline]) textarea:focus {
      background-color: color-mix(in srgb, currentColor 3%, transparent);
    }

    /* Frame style - adds visible border */
    :host([frame]) textarea {
      box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.15);
    }

    :host([frame]) textarea:focus {
      box-shadow: inset 0 0 0 2px #3584e4;
    }

    /* Outline style - visible border outline */
    :host([outline]) textarea {
      background-color: transparent;
      box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.2);
    }

    :host([outline]) textarea:hover:not(:disabled):not(:focus) {
      background-color: color-mix(in srgb, currentColor 3%, transparent);
      box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.3);
    }

    :host([outline]) textarea:focus {
      background-color: transparent;
      box-shadow: inset 0 0 0 2px #3584e4;
    }

    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      textarea {
        background-color: color-mix(in srgb, currentColor 10%, transparent);
        color: rgba(255, 255, 255, 0.9);
      }

      textarea::placeholder {
        color: rgba(255, 255, 255, 0.5);
      }

      textarea:hover:not(:disabled):not(:focus) {
        background-color: color-mix(in srgb, currentColor 13%, transparent);
      }

      textarea:focus {
        background-color: color-mix(in srgb, currentColor 7%, transparent);
        box-shadow: inset 0 0 0 2px #78aeed;
      }

      :host([card]) textarea {
        background-color: #303030;
        box-shadow:
          0 0 0 1px rgba(0, 0, 0, 0.5),
          0 1px 3px 1px rgba(0, 0, 0, 0.15),
          0 2px 6px 2px rgba(0, 0, 0, 0.1);
      }

      :host([card]) textarea:focus {
        background-color: #303030;
        box-shadow:
          0 0 0 1px rgba(0, 0, 0, 0.5),
          0 1px 3px 1px rgba(0, 0, 0, 0.15),
          0 2px 6px 2px rgba(0, 0, 0, 0.1),
          inset 0 0 0 2px #78aeed;
      }

      :host([frame]) textarea {
        box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1);
      }

      :host([frame]) textarea:focus {
        box-shadow: inset 0 0 0 2px #78aeed;
      }

      :host([outline]) textarea {
        background-color: transparent;
        box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.15);
      }

      :host([outline]) textarea:hover:not(:disabled):not(:focus) {
        background-color: color-mix(in srgb, currentColor 5%, transparent);
        box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.25);
      }

      :host([outline]) textarea:focus {
        background-color: transparent;
        box-shadow: inset 0 0 0 2px #78aeed;
      }

      :host([error]) textarea {
        box-shadow: inset 0 0 0 2px #ff7b63;
      }

      :host([error]) textarea:focus {
        box-shadow: inset 0 0 0 2px #e01b24;
      }

      :host([warning]) textarea {
        box-shadow: inset 0 0 0 2px #f8e45c;
      }

      :host([warning]) textarea:focus {
        box-shadow: inset 0 0 0 2px #e5a50a;
      }

      :host([success]) textarea {
        box-shadow: inset 0 0 0 2px #8ff0a4;
      }

      :host([success]) textarea:focus {
        box-shadow: inset 0 0 0 2px #2ec27e;
      }
    }
  `;

  constructor() {
    super();
    this.value = '';
    this.placeholder = '';
    this.disabled = false;
    this.readonly = false;
    this.rows = 4;
    this.maxlength = undefined;
    this.monospace = false;
    this.error = false;
    this.warning = false;
    this.success = false;
    this.speakable = false;
    this.voice = 'af_heart';
  }

  render() {
    return html`
      <div class="textarea-wrapper">
        <div class="textarea-container">
          <textarea
            .value=${this.value}
            placeholder=${this.placeholder}
            ?disabled=${this.disabled}
            ?readonly=${this.readonly}
            rows=${this.rows}
            maxlength=${this.maxlength ?? ''}
            @input=${this._handleInput}
            @change=${this._handleChange}
            part="textarea"
          ></textarea>
          ${this.speakable
            ? html`
                <gtk-speaker
                  class="speaker-button"
                  .text=${this.value}
                  .voice=${this.voice}
                  ?disabled=${this.disabled || !this.value}
                ></gtk-speaker>
              `
            : ''}
        </div>
      </div>
    `;
  }

  _handleInput(e) {
    this.value = e.target.value;
    this.dispatchEvent(
      new CustomEvent('input', {
        detail: { value: this.value },
        bubbles: true,
        composed: true,
      })
    );
  }

  _handleChange(_e) {
    this.dispatchEvent(
      new CustomEvent('change', {
        detail: { value: this.value },
        bubbles: true,
        composed: true,
      })
    );
  }

  focus() {
    this.shadowRoot.querySelector('textarea')?.focus();
  }

  blur() {
    this.shadowRoot.querySelector('textarea')?.blur();
  }

  select() {
    this.shadowRoot.querySelector('textarea')?.select();
  }
}

customElements.define('gtk-textarea', GtkTextarea);
