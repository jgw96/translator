import {
  LitElement,
  html,
  css,
  type TemplateResult,
  type PropertyValues,
} from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('gtk-drawer')
export class GtkDrawer extends LitElement {
  @property({ type: Boolean, reflect: true }) open = false;
  @property({ type: String }) side: 'left' | 'right' = 'left';
  @property({ type: Boolean }) modal = true;
  @property({ type: String }) width = '320px';

  private _boundHandleKeydown = this._handleKeydown.bind(this);

  static styles = css`
    :host {
      display: block;
    }

    .backdrop {
      position: fixed;
      inset: 0;
      background-color: rgba(0, 0, 0, 0);
      z-index: 999;
      pointer-events: none;
      transition: background-color 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }

    :host([open]) .backdrop {
      background-color: rgba(0, 0, 0, 0.32);
      pointer-events: auto;
    }

    .drawer {
      position: fixed;
      top: 0;
      bottom: 0;
      width: var(--drawer-width, 320px);
      max-width: 85vw;
      z-index: 1000;
      display: flex;
      flex-direction: column;
      overflow: hidden;

      /* GTK4 Adwaita styling */
      background-color: #fafafa;
      color: rgba(0, 0, 0, 0.8);

      /* Adwaita shadow */
      box-shadow:
        0 0 0 1px rgba(0, 0, 0, 0.03),
        0 1px 3px rgba(0, 0, 0, 0.12),
        0 2px 8px rgba(0, 0, 0, 0.1),
        0 8px 32px rgba(0, 0, 0, 0.12);

      transition: transform 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }

    /* Left side positioning */
    :host(:not([side='right'])) .drawer {
      left: 0;
      border-top-right-radius: 12px;
      border-bottom-right-radius: 12px;
      transform: translateX(-100%);
    }

    :host([open]:not([side='right'])) .drawer {
      transform: translateX(0);
    }

    /* Right side positioning */
    :host([side='right']) .drawer {
      right: 0;
      border-top-left-radius: 12px;
      border-bottom-left-radius: 12px;
      transform: translateX(100%);
    }

    :host([open][side='right']) .drawer {
      transform: translateX(0);
    }

    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      .drawer {
        background-color: #242424;
        color: rgba(255, 255, 255, 0.9);
        box-shadow:
          0 0 0 1px rgba(255, 255, 255, 0.06),
          0 1px 3px rgba(0, 0, 0, 0.24),
          0 2px 8px rgba(0, 0, 0, 0.2),
          0 8px 32px rgba(0, 0, 0, 0.24);
      }
    }

    /* Header section */
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      min-height: 47px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.08);
    }

    @media (prefers-color-scheme: dark) {
      .header {
        border-bottom-color: rgba(255, 255, 255, 0.08);
      }
    }

    .header-title {
      font-size: 16px;
      font-weight: 600;
      margin: 0;
    }

    .close-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      padding: 0;
      border: none;
      border-radius: 6px;
      background-color: transparent;
      color: rgba(0, 0, 0, 0.7);
      cursor: pointer;
      transition: background-color 150ms ease;
    }

    .close-button:hover {
      background-color: rgba(0, 0, 0, 0.08);
    }

    .close-button:active {
      background-color: rgba(0, 0, 0, 0.16);
    }

    .close-button:focus-visible {
      outline: 2px solid #3584e4;
      outline-offset: 2px;
    }

    @media (prefers-color-scheme: dark) {
      .close-button {
        color: rgba(255, 255, 255, 0.8);
      }

      .close-button:hover {
        background-color: rgba(255, 255, 255, 0.08);
      }

      .close-button:active {
        background-color: rgba(255, 255, 255, 0.16);
      }
    }

    .close-icon {
      width: 16px;
      height: 16px;
    }

    /* Content section */
    .content {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 16px;
    }

    /* Footer section */
    .footer {
      padding: 12px 16px;
      border-top: 1px solid rgba(0, 0, 0, 0.08);
    }

    @media (prefers-color-scheme: dark) {
      .footer {
        border-top-color: rgba(255, 255, 255, 0.08);
      }
    }

    /* Reduced motion */
    @media (prefers-reduced-motion: reduce) {
      .backdrop,
      .drawer {
        transition: none;
      }
    }
  `;

  connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener('keydown', this._boundHandleKeydown);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener('keydown', this._boundHandleKeydown);
  }

  updated(changedProperties: PropertyValues): void {
    if (changedProperties.has('width')) {
      this.style.setProperty('--drawer-width', this.width);
    }
    if (changedProperties.has('open')) {
      if (this.open) {
        this._dispatchEvent('open');
        // Prevent body scroll when drawer is open
        document.body.style.overflow = 'hidden';
      } else {
        this._dispatchEvent('close');
        document.body.style.overflow = '';
      }
    }
  }

  private _handleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape' && this.open) {
      this.close();
    }
  }

  private _handleBackdropClick(): void {
    if (this.modal) {
      this.close();
    }
  }

  show(): void {
    this.open = true;
  }

  close(): void {
    this.open = false;
  }

  toggle(): void {
    this.open = !this.open;
  }

  private _dispatchEvent(name: string): void {
    this.dispatchEvent(
      new CustomEvent(`drawer-${name}`, {
        bubbles: true,
        composed: true,
      })
    );
  }

  private _hasSlot(name: string): boolean {
    return this.querySelector(`[slot="${name}"]`) !== null;
  }

  render(): TemplateResult {
    return html`
      <div class="backdrop" @click=${this._handleBackdropClick}></div>
      <aside class="drawer" role="dialog" aria-modal="true" part="drawer">
        ${this._hasSlot('header') || this._hasSlot('title')
          ? html`
              <header class="header" part="header">
                <slot name="title">
                  <span class="header-title"><slot name="header"></slot></span>
                </slot>
                <button
                  class="close-button"
                  @click=${this.close}
                  aria-label="Close drawer"
                  part="close-button"
                >
                  <svg
                    class="close-icon"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                  >
                    <path
                      d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"
                    />
                  </svg>
                </button>
              </header>
            `
          : ''}
        <div class="content" part="content">
          <slot></slot>
        </div>
        ${this._hasSlot('footer')
          ? html`
              <footer class="footer" part="footer">
                <slot name="footer"></slot>
              </footer>
            `
          : ''}
      </aside>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gtk-drawer': GtkDrawer;
  }
}
