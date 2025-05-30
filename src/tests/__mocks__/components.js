// Mock React components
const mockComponents = {
  // UI Components
  Badge: (props) => (
    <span data-testid="badge" data-variant={props.variant}>
      {props.children}
    </span>
  ),
  
  Button: (props) => (
    <button
      data-testid="button"
      data-variant={props.variant}
      data-size={props.size}
      disabled={props.disabled}
      onClick={props.onClick}
    >
      {props.children}
    </button>
  ),
  
  Input: (props) => (
    <input
      data-testid="input"
      type={props.type || 'text'}
      value={props.value}
      onChange={props.onChange}
      placeholder={props.placeholder}
      disabled={props.disabled}
    />
  ),
  
  Select: (props) => (
    <select
      data-testid="select"
      value={props.value}
      onChange={props.onChange}
      disabled={props.disabled}
    >
      {props.children}
    </select>
  ),
  
  // Common Components
  ErrorBoundary: (props) => (
    <div data-testid="error-boundary">
      {props.children}
    </div>
  ),
  
  ConfirmDialog: (props) => (
    <div data-testid="confirm-dialog">
      <div data-testid="confirm-dialog-title">{props.title}</div>
      <div data-testid="confirm-dialog-message">{props.message}</div>
      <button
        data-testid="confirm-dialog-confirm"
        onClick={props.onConfirm}
      >
        {props.confirmText}
      </button>
      <button
        data-testid="confirm-dialog-cancel"
        onClick={props.onCancel}
      >
        {props.cancelText}
      </button>
    </div>
  ),
  
  Spinner: (props) => (
    <div
      data-testid="spinner"
      data-size={props.size}
      data-variant={props.variant}
    />
  ),
  
  // Form Components
  Form: (props) => (
    <form
      data-testid="form"
      onSubmit={props.onSubmit}
    >
      {props.children}
    </form>
  ),
  
  FormField: (props) => (
    <div data-testid="form-field">
      <label data-testid="form-field-label">
        {props.label}
      </label>
      {props.children}
      {props.error && (
        <div data-testid="form-field-error">
          {props.error}
        </div>
      )}
    </div>
  ),
  
  // Layout Components
  Container: (props) => (
    <div
      data-testid="container"
      data-size={props.size}
    >
      {props.children}
    </div>
  ),
  
  Card: (props) => (
    <div
      data-testid="card"
      data-variant={props.variant}
    >
      {props.children}
    </div>
  ),
  
  // Navigation Components
  NavLink: (props) => (
    <a
      data-testid="nav-link"
      href={props.href}
      data-active={props.active}
    >
      {props.children}
    </a>
  ),
  
  // Feedback Components
  Toast: (props) => (
    <div
      data-testid="toast"
      data-variant={props.variant}
    >
      {props.message}
    </div>
  ),
  
  Alert: (props) => (
    <div
      data-testid="alert"
      data-variant={props.variant}
    >
      {props.children}
    </div>
  ),
};

// Export individual components
module.exports = mockComponents;

// Export default for convenience
module.exports.default = mockComponents; 