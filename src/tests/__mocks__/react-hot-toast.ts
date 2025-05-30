export const toast = {
  success: jest.fn(),
  error: jest.fn(),
  loading: jest.fn(),
  dismiss: jest.fn(),
  promise: jest.fn(),
  custom: jest.fn(),
};

export const Toaster = jest.fn(() => null); 