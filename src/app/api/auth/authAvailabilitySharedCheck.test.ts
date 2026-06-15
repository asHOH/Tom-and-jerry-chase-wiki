import fs from 'fs';
import path from 'path';

const readRoute = (routePath: string) =>
  fs.readFileSync(path.join(process.cwd(), 'src/app/api/auth', routePath), 'utf8');

describe('auth username availability checks', () => {
  it('uses the shared username availability helper in both preflight and registration routes', () => {
    const checkUsernameRoute = readRoute('check-username/route.ts');
    const registerRoute = readRoute('register/route.ts');

    expect(checkUsernameRoute).toContain('checkUsernameAvailability');
    expect(registerRoute).toContain('checkUsernameAvailability');
    expect(checkUsernameRoute).not.toContain('const hashUsername');
    expect(registerRoute).not.toContain('const hashUsername');
  });
});
