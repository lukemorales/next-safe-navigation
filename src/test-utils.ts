export function suppressConsoleErrors(fn: () => void | Promise<void>) {
  const { mockRestore } = vi
    .spyOn(console, 'error')
    .mockImplementation(() => null);

  const test = fn();

  if (typeof test === 'object' && 'then' in test) {
    return test.then(() => {
      mockRestore();
    });
  }

  mockRestore();
}
