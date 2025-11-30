import { LitElement, html, css } from 'lit';

export class GtkToast extends LitElement {
    static properties = {
        message: { type: String },
        timeout: { type: Number },
        dismissible: { type: Boolean },
        action: { type: String },
        visible: { type: Boolean, reflect: true },
        priority: { type: String }, // 'normal' | 'high'
    };

    static styles = css`
        :host {
            display: block;
            position: fixed;
            bottom: 24px;
            left: 50%;
            transform: translateX(-50%) translateY(100px);
            z-index: 9999;
            opacity: 0;
            pointer-events: none;
            transition: transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1),
                        opacity 200ms ease-out;
        }

        :host([visible]) {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
            pointer-events: auto;
        }

        .toast {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 16px;
            border-radius: 12px;
            min-width: 200px;
            max-width: 450px;
            font-family: inherit;
            font-size: 14px;
            line-height: 1.4;
            
            /* GTK4 Adwaita toast styling - elevated card */
            background-color: rgba(50, 50, 50, 0.95);
            color: rgba(255, 255, 255, 0.95);
            
            /* Adwaita shadow - more pronounced for floating elements */
            box-shadow: 
                0 1px 3px rgba(0, 0, 0, 0.15),
                0 3px 8px rgba(0, 0, 0, 0.2),
                0 8px 24px rgba(0, 0, 0, 0.25),
                inset 0 1px 0 rgba(255, 255, 255, 0.06);
        }

        /* Light mode support */
        @media (prefers-color-scheme: light) {
            .toast {
                background-color: rgba(36, 36, 36, 0.95);
                color: rgba(255, 255, 255, 0.95);
            }
        }

        .message {
            flex: 1;
            word-wrap: break-word;
        }

        .action-button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-family: inherit;
            font-size: 14px;
            font-weight: 600;
            padding: 6px 12px;
            border-radius: 6px;
            border: none;
            cursor: pointer;
            background-color: transparent;
            color: #78aeed;
            transition: background-color 150ms ease;
            white-space: nowrap;
        }

        .action-button:hover {
            background-color: rgba(120, 174, 237, 0.15);
        }

        .action-button:active {
            background-color: rgba(120, 174, 237, 0.25);
        }

        .action-button:focus-visible {
            outline: 2px solid #78aeed;
            outline-offset: 2px;
        }

        .close-button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            border: none;
            cursor: pointer;
            background-color: transparent;
            color: rgba(255, 255, 255, 0.7);
            transition: background-color 150ms ease,
                        color 150ms ease;
            flex-shrink: 0;
            padding: 0;
        }

        .close-button:hover {
            background-color: rgba(255, 255, 255, 0.1);
            color: rgba(255, 255, 255, 0.95);
        }

        .close-button:active {
            background-color: rgba(255, 255, 255, 0.15);
        }

        .close-button:focus-visible {
            outline: 2px solid #78aeed;
            outline-offset: 2px;
        }

        .close-button svg {
            width: 16px;
            height: 16px;
        }

        /* High priority toast - more prominent */
        :host([priority="high"]) .toast {
            background-color: #c01c28;
            box-shadow: 
                0 1px 3px rgba(0, 0, 0, 0.2),
                0 3px 8px rgba(192, 28, 40, 0.3),
                0 8px 24px rgba(192, 28, 40, 0.2),
                inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        :host([priority="high"]) .action-button {
            color: rgba(255, 255, 255, 0.95);
        }

        :host([priority="high"]) .action-button:hover {
            background-color: rgba(255, 255, 255, 0.15);
        }

        :host([priority="high"]) .action-button:active {
            background-color: rgba(255, 255, 255, 0.25);
        }
    `;

    constructor() {
        super();
        this.message = '';
        this.timeout = 5000;
        this.dismissible = true;
        this.action = '';
        this.visible = false;
        this.priority = 'normal';
        this._timeoutId = null;
    }

    connectedCallback() {
        super.connectedCallback();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this._clearTimeout();
    }

    show(message, options = {}) {
        this._clearTimeout();
        
        if (message) {
            this.message = message;
        }
        
        if (options.timeout !== undefined) {
            this.timeout = options.timeout;
        }
        if (options.action !== undefined) {
            this.action = options.action;
        }
        if (options.priority !== undefined) {
            this.priority = options.priority;
        }
        if (options.dismissible !== undefined) {
            this.dismissible = options.dismissible;
        }

        // Show the toast
        this.visible = true;
        
        // Auto-dismiss after timeout (if timeout > 0)
        if (this.timeout > 0) {
            this._timeoutId = setTimeout(() => {
                this.hide();
            }, this.timeout);
        }
    }

    hide() {
        this._clearTimeout();
        this.visible = false;
        
        this.dispatchEvent(new CustomEvent('dismissed', {
            bubbles: true,
            composed: true,
        }));
    }

    _clearTimeout() {
        if (this._timeoutId) {
            clearTimeout(this._timeoutId);
            this._timeoutId = null;
        }
    }

    _handleActionClick() {
        this.dispatchEvent(new CustomEvent('action-clicked', {
            bubbles: true,
            composed: true,
            detail: { action: this.action }
        }));
        this.hide();
    }

    _handleCloseClick() {
        this.hide();
    }

    render() {
        return html`
            <div class="toast" role="alert" aria-live="${this.priority === 'high' ? 'assertive' : 'polite'}">
                <span class="message">${this.message}</span>
                
                ${this.action ? html`
                    <button class="action-button" @click=${this._handleActionClick}>
                        ${this.action}
                    </button>
                ` : ''}
                
                ${this.dismissible ? html`
                    <button class="close-button" @click=${this._handleCloseClick} aria-label="Dismiss">
                        <svg viewBox="0 0 16 16" fill="currentColor">
                            <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
                        </svg>
                    </button>
                ` : ''}
            </div>
        `;
    }
}

customElements.define('gtk-toast', GtkToast);
