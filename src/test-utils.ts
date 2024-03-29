export function suppressConsoleErrors(fn: () => void | Promise<void>): void {
  const { mockRestore } = vi
    .spyOn(console, 'error')
    .mockImplementation(() => null);

  const test = fn();

  if (typeof test === 'object' && 'then' in test) {
    return void test.then(() => {
      mockRestore();
    });
  }

  mockRestore();
}
